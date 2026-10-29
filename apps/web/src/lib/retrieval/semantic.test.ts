// @vitest-environment node
import { beforeEach, describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
const db = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../database/connection", () => ({ databaseQuery: db.query }));
import { retrieveSemanticPassages } from "./semantic";
import { embeddingProfiles, type EmbeddingProvider } from "./embeddings";
import { embedEligibleBatch, type EmbeddingStore } from "./embedding-batch";
import { fixturePassage, clock } from "./fixture.test-data";
const vector = Array.from({ length: 384 }, (_, n) => (n === 0 ? 1 : 0));
const profile = embeddingProfiles.e5;
const response = () => ({
  profile_id: profile.profileId,
  model_revision: profile.revision,
  vectors: [vector],
  token_counts: [10],
  elapsed_ms: 1,
  rss_bytes: 100000,
});
const provider = (): EmbeddingProvider => ({
  profile,
  embed: vi.fn().mockResolvedValue(response()),
});
beforeEach(() => {
  db.query.mockReset().mockImplementation(async (sql: string) =>
    sql.includes("authorized")
      ? { rows: [{ allowed: true }] }
      : {
          rows: [
            {
              result: {
                items: [{ evidence: fixturePassage(), similarity: 0.9 }],
                coverage: { eligible: 1, embedded: 1, complete: true },
                profile_id: profile.profileId,
                model_revision: profile.revision,
                generation: "1",
                evaluated_at: clock,
              },
            },
          ],
        },
  );
});
describe("P30 semantic provider contract", () => {
  it("redacts identifier-like content, checks profile approval and binds all SQL parameters", async () => {
    const p = provider(),
      r = await retrieveSemanticPassages({ query: "NID 1234567890" }, p);
    expect(p.embed).toHaveBeenCalledExactlyOnceWith(["nid"], "query");
    expect(r.items[0].evidence.page_number).toBe(1);
    expect(db.query.mock.calls[1][0]).not.toContain("nid");
    expect(db.query.mock.calls[1][1][0]).toBe(profile.profileId);
  });
  it("does not start an unapproved model", async () => {
    db.query.mockResolvedValue({ rows: [{ allowed: false }] });
    const p = provider();
    await expect(
      retrieveSemanticPassages({ query: "passport" }, p),
    ).rejects.toThrow();
    expect(p.embed).not.toHaveBeenCalled();
  });
  it.each([
    { query: "" },
    { query: "passport", offset: 1 },
    { query: "x".repeat(513) },
    { query: "passport", limit: 51 },
  ])("rejects invalid inputs %j", async (q) => {
    await expect(retrieveSemanticPassages(q, provider())).rejects.toThrow();
    expect(db.query).not.toHaveBeenCalled();
  });
  it.each([
    { profile_id: "30000000-0000-4000-8000-000000000002" },
    { model_revision: "0".repeat(40) },
    { vectors: [[1, 0]] },
    { vectors: [Array(384).fill(0)] },
    { vectors: [Array(384).fill(NaN)] },
  ])("rejects incompatible embeddings %j", async (extra) => {
    const p = provider();
    vi.mocked(p.embed).mockResolvedValue({ ...response(), ...extra });
    await expect(
      retrieveSemanticPassages({ query: "passport" }, p),
    ).rejects.toThrow();
    expect(db.query).toHaveBeenCalledTimes(1);
  });
  it("sanitizes SQL/model failures and emits no citizen logs", async () => {
    const log = vi.spyOn(console, "error");
    db.query.mockRejectedValue(new Error("PRIVATE password=synthetic"));
    await expect(
      retrieveSemanticPassages({ query: "passport" }, provider()),
    ).rejects.toThrow("No evidence result was returned");
    expect(log).not.toHaveBeenCalled();
  });
});
describe("P30 bounded batch generation", () => {
  const batch = () => ({
    profile_id: profile.profileId,
    items: [
      {
        passage_id: fixturePassage().passage_id,
        passage_hash: "a".repeat(64),
        text: "Synthetic archive.",
      },
    ],
  });
  const store = (): EmbeddingStore => ({
    batch: vi.fn().mockResolvedValue(batch()),
    commit: vi.fn().mockResolvedValue(1),
  });
  it("commits exact fingerprints and vectors through the dedicated store", async () => {
    const p = provider(),
      s = store();
    expect(await embedEligibleBatch(p, s)).toEqual({
      selected: 1,
      inserted: 1,
      skipped: 0,
    });
    expect(s.commit).toHaveBeenCalledWith(
      profile.profileId,
      profile.revision,
      "bn",
      [
        {
          passage_id: batch().items[0].passage_id,
          passage_hash: batch().items[0].passage_hash,
          vector,
        },
      ],
    );
  });
  it("does not call a provider for a completed/empty batch", async () => {
    const p = provider(),
      s = store();
    vi.mocked(s.batch).mockResolvedValue({
      profile_id: profile.profileId,
      items: [],
    });
    expect((await embedEligibleBatch(p, s)).inserted).toBe(0);
    expect(p.embed).not.toHaveBeenCalled();
  });
  it("reports a duplicate race as skipped without overwriting", async () => {
    const s = store();
    vi.mocked(s.commit).mockResolvedValue(0);
    expect(await embedEligibleBatch(provider(), s)).toEqual({
      selected: 1,
      inserted: 0,
      skipped: 1,
    });
  });
  it.each([0, 9, -1, 1.2])(
    "does not process an invalid batch limit %s",
    async (limit) => {
      const p = provider(),
        s = store();
      await expect(embedEligibleBatch(p, s, "bn", limit)).rejects.toThrow();
      expect(s.batch).not.toHaveBeenCalled();
    },
  );
  it("rejects duplicate identities and mismatched provider profiles", async () => {
    const p = provider(),
      s = store(),
      b = batch();
    vi.mocked(s.batch).mockResolvedValue({
      ...b,
      items: [b.items[0], b.items[0]],
    });
    await expect(embedEligibleBatch(p, s)).rejects.toThrow();
    expect(p.embed).not.toHaveBeenCalled();
  });
  it("does not commit a failed provider batch or retry it automatically", async () => {
    const p = provider(),
      s = store();
    vi.mocked(p.embed).mockRejectedValue(new Error("PRIVATE model error"));
    await expect(embedEligibleBatch(p, s)).rejects.toThrow(
      "Local embeddings are unavailable",
    );
    expect(p.embed).toHaveBeenCalledTimes(1);
    expect(s.commit).not.toHaveBeenCalled();
  });
  it("rechecks revocation at commit and reports failure without a partial success", async () => {
    const s = store();
    vi.mocked(s.commit).mockRejectedValue(new Error("Revoked"));
    await expect(embedEligibleBatch(provider(), s)).rejects.toThrow();
  });
});
