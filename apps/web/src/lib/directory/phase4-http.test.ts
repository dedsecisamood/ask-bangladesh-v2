// @vitest-environment node
import { beforeEach, afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mock = vi.hoisted(() => ({
  read: vi.fn(),
  staff: vi.fn(),
  auth: vi.fn(),
  query: vi.fn(),
}));
vi.mock("./repository", () => ({ readDirectory: mock.read }));
vi.mock("../database/staff-connection", () => ({ staffQuery: mock.query }));
vi.mock("../auth/server", async (original) => ({
  ...(await original<typeof import("../auth/server")>()),
  authContext: mock.auth,
  requireStaff: mock.staff,
}));
import { NextRequest } from "next/server";
import { directorySearch } from "./http";
import { managementHttp, identityInput, serviceInput } from "./manage";
import { AccessError } from "../auth/server";
const id = "19000000-0000-4000-8000-000000000001";
beforeEach(() => {
  vi.stubEnv("APP_ORIGIN", "https://ask.example");
  mock.read
    .mockReset()
    .mockResolvedValue({ items: [], after_id: null, generation: "1" });
  mock.query
    .mockReset()
    .mockResolvedValue({ rows: [{ result: { id, revision: "1" } }] });
  mock.auth.mockReturnValue({
    config: { origin: "https://ask.example" },
    bindingHash: () => "a".repeat(64),
    finish: (r: unknown) => r,
  });
  mock.staff
    .mockReset()
    .mockResolvedValue({ identity: { sub: id, session_id: id } });
});
afterEach(() => vi.unstubAllEnvs());
const request = (input: unknown, headers: Record<string, string> = {}) =>
  new NextRequest("https://ask.example/api/v1/search", {
    method: "POST",
    headers: {
      origin: "https://ask.example",
      host: "ask.example",
      "content-type": "application/json",
      "idempotency-key": id,
      ...headers,
    },
    body: JSON.stringify(input),
  });
it("search normalizes Banglish without storing query text in a URL or cookie", async () => {
  const r = await directorySearch(request({ query: "  NID   SONGSHODHON  " }));
  expect(r.status).toBe(200);
  expect(mock.read).toHaveBeenCalledWith(
    "services",
    { query: "nid songshodhon", locale: "bn", limit: 20 },
    undefined,
  );
  expect(r.headers.get("set-cookie")).toBeNull();
  expect(JSON.stringify(await r.json())).not.toContain("songshodhon");
});
it("audit search rejects a stalled request body before touching the repository", async () => {
  vi.useFakeTimers();
  try {
    const request = new NextRequest("https://ask.example/api/v1/search", {
      method: "POST",
      headers: {
        origin: "https://ask.example",
        "content-type": "application/json",
      },
      body: new ReadableStream({}),
      duplex: "half",
    } as ConstructorParameters<typeof NextRequest>[1]);
    const response = directorySearch(request);
    await vi.advanceTimersByTimeAsync(2001);
    expect((await response).status).toBe(408);
    expect(mock.read).not.toHaveBeenCalled();
  } finally {
    vi.useRealTimers();
  }
});
it.each([
  { query: "a".repeat(121) },
  { query: "a\u0000b" },
  { query: "x", sort: "private" },
  { limit: 51 },
  { agency_id: "bad" },
  { category: "bad'slug" },
])("rejects invalid search %j", async (value) => {
  expect((await directorySearch(request(value))).status).toBe(400);
  expect(mock.read).not.toHaveBeenCalled();
});
it("rejects bad origin/type/oversize body and distinguishes unavailable from empty", async () => {
  expect(
    (await directorySearch(request({}, { origin: "https://attacker.example" })))
      .status,
  ).toBe(403);
  expect(
    (await directorySearch(request({}, { "content-type": "text/plain" })))
      .status,
  ).toBe(415);
  expect(
    (await directorySearch(request({ query: "x".repeat(5000) }))).status,
  ).toBe(413);
  mock.read.mockRejectedValue(Error("PRIVATE SQL password"));
  const r = await directorySearch(request({ query: "passport" }));
  expect(r.status).toBe(503);
  expect(await r.text()).not.toContain("PRIVATE");
});
it("metadata inputs preserve Bangla but disallow trust-field injection", () => {
  const input = {
    slug: "test",
    translations: [{ locale: "bn", name: "পরীক্ষা" }],
    reason: "Test",
  };
  expect(identityInput.parse(input).translations[0].name).toBe("পরীক্ষা");
  expect(
    identityInput.safeParse({ ...input, publication_status: "published" })
      .success,
  ).toBe(false);
  expect(
    serviceInput.safeParse({
      ...input,
      primary_category_id: id,
      category_ids: [],
      agencies: [],
    }).success,
  ).toBe(false);
});
it("staff publication uses authenticated subjects and strict parameterized SQL", async () => {
  const r = await managementHttp(
    request({
      slug: "test",
      translations: [{ locale: "en", name: "Synthetic" }],
      reason: "Test",
    }),
    { kind: "agencies" },
  );
  expect(r.status).toBe(201);
  expect(mock.query.mock.calls[0][0]).toContain("directory_command($1");
  expect(mock.query.mock.calls[0][1][0]).toBe(id);
});
it("anonymous/auditor and cross-origin requests cannot write", async () => {
  mock.staff.mockRejectedValue(new AccessError(403, "FORBIDDEN"));
  expect((await managementHttp(request({}), { kind: "services" })).status).toBe(
    403,
  );
  expect(mock.query).not.toHaveBeenCalled();
  mock.staff.mockResolvedValue({ identity: { sub: id, session_id: id } });
  expect(
    (
      await managementHttp(
        request({}, { origin: "https://attacker.example" }),
        { kind: "services" },
      )
    ).status,
  ).toBe(403);
  expect(mock.query).not.toHaveBeenCalled();
});
it("forged link-health results and trust fields are rejected before SQL", async () => {
  expect(
    (
      await managementHttp(
        request({ revision: "1", reason: "Fake", outcome: "healthy" }),
        { id, action: "link-check" },
        true,
      )
    ).status,
  ).toBe(400);
  expect(
    (
      await managementHttp(
        request({
          slug: "x",
          translations: [{ locale: "en", name: "Fake" }],
          reason: "Fake",
          directory_created_by: id,
        }),
        { kind: "agencies" },
      )
    ).status,
  ).toBe(400);
  expect(mock.query).not.toHaveBeenCalled();
});
