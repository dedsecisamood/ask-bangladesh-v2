// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("../database/connection", () => ({ databaseQuery: vi.fn() }));
import { databaseQuery } from "../database/connection";
import { fixturePassage } from "../retrieval/fixture.test-data";
import { supportKey, type SupportCandidate } from "./citations";
import { reviewPublishedClaims } from "./review";
const p = fixturePassage(41);
const claim = {
  id: "c1",
  type: "general" as const,
  text: "Synthetic curated statement.",
  evidence: [{ evidence_id: p.passage_id, quote: p.text }],
};
const candidate: SupportCandidate = {
  key: supportKey(claim, "en", [p]),
  claim,
  language: "en",
  passages: [p],
};
const signal = () => new AbortController().signal;
const decisions = [{ key: candidate.key, supported: true, critical: false }];
beforeEach(() => vi.mocked(databaseQuery).mockReset());
describe("reviewed database claim adapter", () => {
  it("uses one parameterized batch with immutable evidence identity, no raw question", async () => {
    vi.mocked(databaseQuery).mockResolvedValue({
      rows: [{ result: decisions }],
    } as never);
    const result = await reviewPublishedClaims([candidate.key], signal(), [
      candidate,
    ]);
    expect(result.get(candidate.key)).toEqual({
      supported: true,
      critical: false,
    });
    expect(databaseQuery).toHaveBeenCalledOnce();
    const [sql, values] = vi.mocked(databaseQuery).mock.calls[0];
    expect(sql).toBe("SELECT app_public.answer_support($1::jsonb) result");
    expect(JSON.parse(String(values?.[0]))[0]).toMatchObject({
      text: claim.text,
      language: "en",
      evidence: [
        {
          passage_id: p.passage_id,
          version_id: p.document_version_id,
          passage_hash: p.passage_hash,
          content_hash: p.content_hash,
        },
      ],
    });
  });
  it("does not query for empty or pre-cancelled batches", async () => {
    expect((await reviewPublishedClaims([], signal(), [])).size).toBe(0);
    const abort = new AbortController();
    abort.abort();
    await expect(
      reviewPublishedClaims([candidate.key], abort.signal, [candidate]),
    ).rejects.toThrow();
    expect(databaseQuery).not.toHaveBeenCalled();
  });
  it("rejects mismatched fingerprints and unknown evidence", async () => {
    await expect(
      reviewPublishedClaims([candidate.key], signal(), [
        { ...candidate, claim: { ...claim, text: "Tampered" } },
      ]),
    ).rejects.toThrow();
    await expect(
      reviewPublishedClaims([candidate.key], signal(), [
        { ...candidate, passages: [] },
      ]),
    ).rejects.toThrow();
    expect(databaseQuery).not.toHaveBeenCalled();
  });
  it.each(
    [
      [],
      [...decisions, ...decisions],
      [{ ...decisions[0], key: "b".repeat(64) }],
      [{ ...decisions[0], supported: false, critical: true }],
      [{ ...decisions[0], private_note: "private" }],
    ].map((result) => ({ result })),
  )(
    "rejects incomplete or substituted database responses %#",
    async ({ result }) => {
      vi.mocked(databaseQuery).mockResolvedValue({
        rows: [{ result }],
      } as never);
      await expect(
        reviewPublishedClaims([candidate.key], signal(), [candidate]),
      ).rejects.toThrow();
    },
  );
  it("rejects a cancellation while the database call completes", async () => {
    const abort = new AbortController();
    vi.mocked(databaseQuery).mockImplementation(async () => {
      abort.abort();
      return { rows: [{ result: decisions }] } as never;
    });
    await expect(
      reviewPublishedClaims([candidate.key], abort.signal, [candidate]),
    ).rejects.toThrow();
  });
});
