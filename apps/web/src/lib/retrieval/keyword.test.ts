// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const db = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../database/connection", () => ({ databaseQuery: db.query }));
import {
  keywordInputSchema,
  keywordPassageSchema,
  type KeywordSearchInput,
} from "./contracts";
import {
  retrieveKeywordPassages,
  InvalidRetrievalInputError,
  RetrievalUnavailableError,
} from "./keyword";
const id = "29000000-0000-4000-8000-000000000001";
const time = "2026-10-22T00:00:00+00:00";
const passage = {
  passage_id: id,
  document_id: id,
  document_version_id: id,
  source_id: id,
  agency_id: id,
  source_url: "https://fixture.example.invalid/synthetic.pdf",
  document_title: "Synthetic PDF",
  document_type: "pdf",
  text: "Synthetic test",
  language: "en",
  heading: null,
  section_path: [],
  page_number: 1,
  page_label: null,
  character_start: null,
  character_end: null,
  content_hash: "a".repeat(64),
  passage_hash: "b".repeat(64),
  extraction_profile: "fixture-v1",
  published_at: null,
  effective_from: null,
  effective_to: null,
  ownership_verified_at: time,
  document_reviewed_at: time,
  content_checked_at: time,
  score: 0.85,
  signals: {
    token_coverage: 1,
    exact_phrase: true,
    heading_coverage: 0,
    title_coverage: 0,
  },
  content_trust: "untrusted_data",
};
const empty = () => ({
  items: [],
  normalized_query: "passport",
  tokens: ["passport"],
  limit: 10,
  offset: 0,
  has_more: false,
  next_offset: null,
  pagination_capped: false,
  generation: "1",
  rank_version: "p29-keyword-v1",
  policy_revision: "p29-eligible-v1",
  evaluated_at: time,
});
beforeEach(() => {
  db.query.mockReset().mockResolvedValue({ rows: [{ result: empty() }] });
});
describe("P29 validated internal keyword retrieval", () => {
  it.each([
    "English passport question",
    "পাসপোর্ট নবায়ন তথ্য",
    "পাসপোর্ট renewal?",
    "  PASSPORT\nrenewal  ",
    "cafe\u0301",
    "ক্\u200dষ ১২৩",
  ])("accepts bounded original Unicode query: %s", (q) => {
    expect(keywordInputSchema.parse({ query: q }).query).toBe(q);
  });
  it.each([
    { query: "" },
    { query: "  " },
    { query: "? !" },
    { query: "a".repeat(257) },
    { query: "\u0000passport" },
    { query: "passport\u0085" },
    { query: "\ud800" },
    { query: Array(33).fill("word").join(" ") },
    { query: "passport", limit: 0 },
    { query: "passport", limit: 51 },
    { query: "passport", limit: 1.5 },
    { query: "passport", offset: -1 },
    { query: "passport", offset: 501 },
    { query: "passport", source_id: "bad" },
    { query: "passport", service_id: "bad" },
    { query: "passport", agency_id: "bad" },
    { query: "passport", locale: "banglish" },
    { query: "passport", include_unapproved: true },
    { query: "passport", sort: "private_note" },
  ])(
    "rejects malformed/unsupported inputs before database access: %j",
    async (input) => {
      await expect(
        retrieveKeywordPassages(input as KeywordSearchInput),
      ).rejects.toBeInstanceOf(InvalidRetrievalInputError);
      expect(db.query).not.toHaveBeenCalled();
    },
  );
  it("uses fixed parameterized SQL and preserves original query only as ephemeral request context", async () => {
    const original = "passport'); DROP TABLE evidence; --";
    const result = await retrieveKeywordPassages({
      query: original,
      service_id: id,
      agency_id: id,
      source_id: id,
      language: "en",
      locale: "en",
    });
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining("$1::text"), [
      original,
      "en",
      10,
      0,
      id,
      id,
      id,
      "en",
    ]);
    expect(db.query.mock.calls[0][0]).not.toContain(original);
    expect(result.query).toEqual({ original, normalized: "passport" });
  });
  it("returns a real empty projection without calling it a database failure", async () => {
    const result = await retrieveKeywordPassages({ query: "passport" });
    expect(result.items).toEqual([]);
    expect(result.has_more).toBe(false);
  });
  it("preserves selected source/passage identity, unknown official dates and untrusted-data label", async () => {
    db.query.mockResolvedValue({
      rows: [{ result: { ...empty(), items: [passage] } }],
    });
    const result = await retrieveKeywordPassages({ query: "passport" });
    expect(result.items[0]).toEqual(passage);
    expect(result.items[0].published_at).toBeNull();
  });
  it.each([
    { ...passage, source_url: "javascript:alert(1)" },
    { ...passage, source_url: "https://user:secret@fixture.invalid/" },
    { ...passage, private_note: "hidden" },
    { ...passage, score: NaN },
    { ...passage, score: 1.1 },
    { ...passage, page_number: null },
    { ...passage, ownership_verified_at: null },
    { ...passage, document_reviewed_at: "yesterday" },
    { ...passage, content_hash: "invented" },
    { ...passage, content_trust: "trusted_instruction" },
    { ...passage, character_start: 0, character_end: 2 },
  ])(
    "fails closed on malformed/private/invented evidence projection",
    async (item) => {
      db.query.mockResolvedValue({
        rows: [{ result: { ...empty(), items: [item] } }],
      });
      await expect(
        retrieveKeywordPassages({ query: "passport" }),
      ).rejects.toBeInstanceOf(RetrievalUnavailableError);
    },
  );
  it.each([
    { limit: 11 },
    { offset: 1 },
    { has_more: true, next_offset: null },
    { has_more: true, next_offset: 25 },
    { items: Array(11).fill(passage) },
    { rank_version: "other" },
    { review_note: "private" },
  ])(
    "rejects inconsistent bounds/contracts rather than returning partial evidence",
    async (extra) => {
      db.query.mockResolvedValue({
        rows: [{ result: { ...empty(), ...extra } }],
      });
      await expect(
        retrieveKeywordPassages({ query: "passport" }),
      ).rejects.toBeInstanceOf(RetrievalUnavailableError);
    },
  );
  it("uses Unicode codepoint offsets for supplementary characters without altering passage text", () => {
    const p = {
      ...passage,
      document_type: "html",
      page_number: null,
      text: "Test 😀",
      character_start: 0,
      character_end: 6,
    };
    expect(keywordPassageSchema.parse(p).text).toBe("Test 😀");
  });
  it.each([
    new Error("PRIVATE SQL password=synthetic"),
    new Error("permission denied"),
    new Error("connection timeout"),
  ])(
    "sanitizes DB failures without logging or inventing empty results",
    async (error) => {
      const logger = vi.spyOn(console, "error");
      db.query.mockRejectedValue(error);
      await expect(
        retrieveKeywordPassages({ query: "passport" }),
      ).rejects.toThrow(
        "Keyword retrieval is unavailable. No evidence result was returned.",
      );
      expect(logger).not.toHaveBeenCalled();
      logger.mockRestore();
    },
  );
});
