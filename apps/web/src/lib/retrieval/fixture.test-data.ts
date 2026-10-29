import type { KeywordPassage } from "./contracts";
export const clock = "2026-10-22T00:00:00Z";
export const fixtureId = (n: number) =>
  `31000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export function fixturePassage(
  n = 1,
  changes: Partial<KeywordPassage> = {},
): KeywordPassage {
  return {
    passage_id: fixtureId(n),
    document_id: fixtureId(n),
    document_version_id: fixtureId(n),
    source_id: fixtureId(n),
    agency_id: fixtureId(n),
    source_url: `https://synthetic.example.invalid/${n}.pdf`,
    document_title: "Synthetic archive",
    document_type: "pdf",
    text: "Synthetic passport renewal archive.",
    language: "en",
    heading: null,
    section_path: [],
    page_number: 1,
    page_label: null,
    character_start: null,
    character_end: null,
    content_hash: "a".repeat(64),
    passage_hash: "b".repeat(64),
    extraction_profile: "synthetic-v1",
    published_at: null,
    effective_from: null,
    effective_to: null,
    ownership_verified_at: clock,
    document_reviewed_at: clock,
    content_checked_at: clock,
    score: 0.85,
    signals: {
      token_coverage: 1,
      exact_phrase: true,
      heading_coverage: 0,
      title_coverage: 0,
    },
    content_trust: "untrusted_data",
    ...changes,
  };
}
