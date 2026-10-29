// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mock = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock("./repository", () => ({ readDirectory: mock.read }));
import { NextRequest } from "next/server";
import { directoryGet } from "./http";
beforeEach(() => {
  mock.read
    .mockReset()
    .mockResolvedValue({ items: [], after_id: null, generation: "1" });
});
describe("read-only directory HTTP contracts", () => {
  const get = (query = "", kind = "services", lookup?: string) =>
    directoryGet(
      new NextRequest("https://ask.example/api/v1/" + kind + query),
      { kind, lookup },
    );
  it("returns an honest empty response with a request ID and no cache", async () => {
    const r = await get();
    expect(r.status).toBe(200);
    expect(r.headers.get("Cache-Control")).toBe("no-store");
    expect(await r.json()).toMatchObject({
      data: [],
      meta: {
        limit: 20,
        next_cursor: null,
        policy_revision: "p20-metadata-v1",
      },
      request_id: expect.any(String),
    });
  });
  it.each([
    "?limit=0",
    "?limit=51",
    "?limit=-1",
    "?limit=01",
    "?offset=4",
    "?sort=secret",
    "?q=question",
    "?agency_id=bad",
    "?category=bad%27",
    "?locale=banglish",
    "?locale=bn&locale=en",
    "?cursor=bad",
    "?filter=admin",
  ])("rejects %s without querying", async (query) => {
    expect((await get(query)).status).toBe(400);
    expect(mock.read).not.toHaveBeenCalled();
  });
  it("rejects service-only filters on sources and malformed lookups", async () => {
    expect((await get("?category=passport", "sources")).status).toBe(400);
    expect((await get("", "sources", "invalid-id")).status).toBe(400);
    expect((await get("", "services", "x' OR 1=1")).status).toBe(400);
  });
  it("returns indistinguishable 404s for absent and private records", async () => {
    expect((await get("", "services", "private-service")).status).toBe(404);
    expect((await get("", "unknown")).status).toBe(404);
  });
  it("outages are 503 without SQL or credentials, rather than empty data", async () => {
    mock.read.mockRejectedValue(new Error("postgresql://PRIVATE SQL stack"));
    const r = await get();
    expect(r.status).toBe(503);
    const body = await r.text();
    expect(body).toContain("UNAVAILABLE");
    expect(body).not.toContain("PRIVATE");
    expect(body).not.toContain('"data"');
  });
});
