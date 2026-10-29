// @vitest-environment node
import { beforeEach, describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
const ports = vi.hoisted(() => ({
  db: vi.fn(),
  keyword: vi.fn(),
  semantic: vi.fn(),
}));
vi.mock("../database/connection", () => ({ databaseQuery: ports.db }));
vi.mock("./keyword", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./keyword")>()),
  retrieveKeywordPassages: ports.keyword,
}));
vi.mock("./semantic", () => ({ retrieveSemanticPassages: ports.semantic }));
import { retrieveHybridPassages, retrieveRoutedPassages } from "./hybrid";
import { embeddingProfiles, type EmbeddingProvider } from "./embeddings";
import { fixtureId, fixturePassage, clock } from "./fixture.test-data";
const provider: EmbeddingProvider = {
  profile: embeddingProfiles.e5,
  embed: vi.fn(),
};
beforeEach(() => {
  ports.keyword.mockReset().mockResolvedValue({ items: [fixturePassage()] });
  ports.semantic.mockReset().mockResolvedValue({
    items: [{ evidence: fixturePassage(), similarity: 0.9 }],
    coverage: { eligible: 1, embedded: 1, complete: true },
    profile_id: provider.profile.profileId,
  });
  ports.db.mockReset().mockImplementation(async (sql: string) =>
    sql.includes("routing_catalog")
      ? {
          rows: [
            {
              result: {
                items: [
                  {
                    service_id: fixtureId(50),
                    name: "Passport",
                    aliases: [],
                  },
                ],
                generation: "1",
              },
            },
          ],
        }
      : {
          rows: [
            {
              result: {
                items: [fixturePassage()],
                generation: "2",
                conflict_hold: false,
                evaluated_at: clock,
              },
            },
          ],
        },
  );
});
describe("P31-P33 retrieval orchestration", () => {
  it("carries conflict holds for ambiguous approved services", async () => {
    ports.db.mockImplementation(async (sql: string) =>
      sql.includes("routing_catalog")
        ? {
            rows: [
              {
                result: {
                  items: [
                    {
                      service_id: fixtureId(50),
                      name: "Passport",
                      aliases: [],
                    },
                    { service_id: fixtureId(51), name: "NID", aliases: [] },
                  ],
                  generation: "1",
                },
              },
            ],
          }
        : sql.includes("routing_conflict_hold")
          ? { rows: [{ hold: true }] }
          : {
              rows: [
                {
                  result: {
                    items: [fixturePassage()],
                    generation: "2",
                    conflict_hold: false,
                    evaluated_at: clock,
                  },
                },
              ],
            },
    );
    const r = await retrieveRoutedPassages(
      { query: "passport and NID" },
      provider,
    );
    expect(r.routing.decision).toBe("ambiguous");
    expect(r.conflict_hold).toBe(true);
    expect(r.status).toBe("conflict_hold");
  });
  it("appends only bounded reviewed service context and preserves original/redacted input", async () => {
    ports.db.mockImplementation(async (sql: string) =>
      sql.includes("routing_catalog")
        ? {
            rows: [
              {
                result: {
                  items: [
                    {
                      service_id: fixtureId(50),
                      name: "ই-পাসপোর্ট",
                      aliases: [{ text: "passport", language: "en" }],
                    },
                  ],
                  generation: "1",
                },
              },
            ],
          }
        : {
            rows: [
              {
                result: {
                  items: [fixturePassage()],
                  generation: "2",
                  conflict_hold: false,
                  evaluated_at: clock,
                },
              },
            ],
          },
    );
    const r = await retrieveRoutedPassages(
      { query: "passport A12345678" },
      provider,
    );
    expect(r.query.original).toBe("passport A12345678");
    expect(r.redacted).toBe(true);
    expect(ports.keyword.mock.calls[0][0].query).toBe("passport ই পাসপোর্ট");
    expect(r.routing.query_variants).toHaveLength(2);
  });
  it("reports incomplete semantic coverage as degraded rather than complete", async () => {
    ports.semantic.mockResolvedValue({
      items: [{ evidence: fixturePassage(), similarity: 0.9 }],
      coverage: { eligible: 2, embedded: 1, complete: false },
      profile_id: provider.profile.profileId,
    });
    const r = await retrieveHybridPassages({ query: "passport" }, provider);
    expect(r.status).toBe("degraded");
    expect(r.semantic_coverage?.complete).toBe(false);
  });
  it("rechecks current eligibility before returning fused evidence", async () => {
    const r = await retrieveHybridPassages({ query: "passport" }, provider);
    expect(r.status).toBe("complete");
    expect(r.items[0].methods).toEqual(["keyword", "semantic"]);
    expect(r.generation).toBe("2");
    expect(ports.db.mock.calls[0][1][0]).toEqual([fixtureId(1)]);
  });
  it("removes candidates revoked after branch retrieval", async () => {
    ports.db.mockResolvedValue({
      rows: [
        {
          result: {
            items: [],
            generation: "3",
            conflict_hold: false,
            evaluated_at: clock,
          },
        },
      ],
    });
    const r = await retrieveHybridPassages({ query: "passport" }, provider);
    expect(r.items).toEqual([]);
    expect(r.status).toBe("no_results");
  });
  it.each(["keyword", "semantic"] as const)(
    "keeps a healthy branch with explicit %s degradation",
    async (branch) => {
      ports[branch].mockRejectedValue(new Error("PRIVATE offline"));
      const r = await retrieveHybridPassages({ query: "passport" }, provider);
      expect(r.status).toBe("degraded");
      expect(r.branches[branch]).toBe("unavailable");
      expect(r.items).toHaveLength(1);
    },
  );
  it("does not disguise an empty lexical fallback as a complete semantic search", async () => {
    ports.keyword.mockResolvedValue({ items: [] });
    ports.semantic.mockRejectedValue(new Error());
    ports.db.mockResolvedValue({
      rows: [
        {
          result: {
            items: [],
            generation: "1",
            conflict_hold: false,
            evaluated_at: clock,
          },
        },
      ],
    });
    expect(
      (await retrieveHybridPassages({ query: "passport" }, provider)).status,
    ).toBe("degraded");
  });
  it("fails closed when both branches or the final policy check fail", async () => {
    ports.keyword.mockRejectedValue(new Error());
    ports.semantic.mockRejectedValue(new Error());
    await expect(
      retrieveHybridPassages({ query: "passport" }, provider),
    ).rejects.toThrow();
    expect(ports.db).not.toHaveBeenCalled();
  });
  it("never replays prior evidence during a final database outage", async () => {
    ports.db.mockRejectedValue(new Error("PRIVATE connection"));
    await expect(
      retrieveHybridPassages({ query: "passport" }, provider),
    ).rejects.toThrow("No evidence result was returned");
  });
  it("preserves explicit conflict holds rather than picking a controlling source", async () => {
    ports.db.mockResolvedValue({
      rows: [
        {
          result: {
            items: [],
            generation: "2",
            conflict_hold: true,
            evaluated_at: clock,
          },
        },
      ],
    });
    expect(
      (
        await retrieveHybridPassages(
          { query: "passport", service_id: fixtureId(50) },
          provider,
        )
      ).status,
    ).toBe("conflict_hold");
  });
  it("checks all bounded branch candidates before reranking/diversity, including candidate 100", async () => {
    const all = Array.from({ length: 100 }, (_, n) => fixturePassage(n + 1));
    ports.keyword.mockResolvedValue({ items: all.slice(0, 50) });
    ports.semantic.mockResolvedValue({
      items: all.slice(50).map((evidence) => ({ evidence, similarity: 0.9 })),
      coverage: { eligible: 1, embedded: 1, complete: true },
      profile_id: provider.profile.profileId,
    });
    ports.db.mockResolvedValue({
      rows: [
        {
          result: {
            items: all,
            generation: "2",
            conflict_hold: false,
            evaluated_at: clock,
          },
        },
      ],
    });
    const r = await retrieveHybridPassages(
      { query: "passport", limit: 20 },
      provider,
      { candidate_limit: 50 },
    );
    expect(ports.db.mock.calls[0][1][0]).toHaveLength(100);
    expect(r.items).toHaveLength(20);
  });
  it.each([
    { query: "" },
    { query: "passport", offset: 1 },
    { query: "passport", limit: 21 },
    { query: "1234567890" },
  ])("rejects malformed or unusable input %j", async (q) => {
    await expect(retrieveHybridPassages(q, provider)).rejects.toThrow();
    expect(ports.keyword).not.toHaveBeenCalled();
  });
  it("scopes unambiguous approved service aliases without hardcoding service IDs", async () => {
    const r = await retrieveRoutedPassages({ query: "passport" }, provider);
    expect(ports.keyword.mock.calls[0][0].service_id).toBe(fixtureId(50));
    expect(r.routing.decision).toBe("matched");
    expect(r.items[0].authority).toBe("reviewed_service_scope");
  });
  it("retains explicit caller filters even if another service alias matches", async () => {
    await retrieveRoutedPassages(
      { query: "passport", service_id: fixtureId(99) },
      provider,
    );
    expect(ports.keyword.mock.calls[0][0].service_id).toBe(fixtureId(99));
  });
});
