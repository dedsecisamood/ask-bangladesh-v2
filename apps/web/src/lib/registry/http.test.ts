// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mock = vi.hoisted(() => {
  class AccessError extends Error {
    constructor(
      public status: number,
      public code: string,
    ) {
      super(code);
    }
  }
  return {
    AccessError,
    authorize: vi.fn(),
    command: vi.fn(),
    read: vi.fn(),
    ctx: { config: { origin: "https://ask.example" }, finish: <T>(r: T) => r },
  };
});
vi.mock("../auth/server", () => ({
  AccessError: mock.AccessError,
  authContext: () => mock.ctx,
  requireStaff: mock.authorize,
}));
vi.mock("./repository", () => ({
  sourceCommand: mock.command,
  readSource: mock.read,
}));
import { NextRequest } from "next/server";
import { registryHttp } from "./http";
const id = "18000000-0000-4000-8000-000000000001",
  key = "18000000-0000-4000-8000-000000000002";
const input = {
  agency_id: id,
  url: "https://registry.example.com/#section",
  source_name: "Synthetic fixture",
  reason: "Candidate",
};
const request = (
  value: unknown = input,
  headers: Record<string, string> = {},
) =>
  new NextRequest("https://ask.example/api/v1/admin/sources", {
    method: "POST",
    headers: {
      host: "ask.example",
      origin: "https://ask.example",
      "content-type": "application/json",
      "idempotency-key": key,
      ...headers,
    },
    body: JSON.stringify(value),
  });
beforeEach(() => {
  mock.authorize.mockReset().mockResolvedValue({ id, role: "source_reviewer" });
  mock.command.mockReset().mockResolvedValue({
    id,
    revision: "1",
    registry_status: "draft",
    status: "candidate",
  });
  mock.read.mockReset().mockResolvedValue({ id, registry_status: "draft" });
});
describe("protected source registry HTTP", () => {
  it("normalizes the candidate and delegates no caller-supplied trust or actor", async () => {
    const r = await registryHttp(request());
    expect(r.status).toBe(201);
    expect(mock.command).toHaveBeenCalledWith(
      mock.ctx,
      "create",
      null,
      expect.objectContaining({
        canonical_url: "https://registry.example.com/",
        submitted_url: input.url,
      }),
      null,
      key,
    );
    expect(r.headers.get("cache-control")).toContain("no-store");
  });
  it.each([
    { status: "active" },
    { reviewer_id: id },
    { publication_status: "published" },
  ])("rejects trust-field injection %j", async (fields) => {
    expect((await registryHttp(request({ ...input, ...fields }))).status).toBe(
      400,
    );
    expect(mock.command).not.toHaveBeenCalled();
  });
  it.each<Record<string, string>>([
    { origin: "https://attacker.example" },
    { host: "attacker.example" },
    { "sec-fetch-site": "cross-site" },
  ])("rejects CSRF origin/host %j", async (headers) =>
    expect((await registryHttp(request(input, headers))).status).toBe(403),
  );
  it("requires JSON, valid idempotency keys and bounded requests", async () => {
    expect(
      (await registryHttp(request(input, { "content-type": "text/plain" })))
        .status,
    ).toBe(415);
    expect(
      (await registryHttp(request(input, { "idempotency-key": "" }))).status,
    ).toBe(400);
    expect(
      (
        await registryHttp(
          request({ ...input, description: "x".repeat(17000) }),
        )
      ).status,
    ).toBe(413);
    expect(mock.command).not.toHaveBeenCalled();
  });
  it("rejects anonymous/auditor mutation before reaching the repository", async () => {
    mock.authorize.mockRejectedValue(new mock.AccessError(403, "FORBIDDEN"));
    expect((await registryHttp(request())).status).toBe(403);
    expect(mock.command).not.toHaveBeenCalled();
  });
  it("reports conflicts, failed transitions and outages without exposing SQL or credentials", async () => {
    mock.command.mockResolvedValue({ error_code: "REVISION_CONFLICT" });
    expect((await registryHttp(request())).status).toBe(409);
    mock.command.mockRejectedValue(new Error("PRIVATE SQL credential"));
    const r = await registryHttp(request());
    expect(r.status).toBe(503);
    expect(await r.text()).not.toContain("PRIVATE");
  });
  it("supports authenticated status inspection and hides absent records", async () => {
    const r = () =>
      registryHttp(
        new NextRequest(`https://ask.example/api/v1/admin/sources/${id}`),
        { id },
      );
    expect((await r()).status).toBe(200);
    mock.read.mockResolvedValue({ error_code: "RESOURCE_NOT_FOUND" });
    expect((await r()).status).toBe(404);
  });
});
