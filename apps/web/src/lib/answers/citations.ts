import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { databaseQuery } from "../database/connection";
import {
  keywordPassageSchema,
  type KeywordPassage,
} from "../retrieval/contracts";
import { citationSchema, type CandidateClaim } from "./contracts";

export const deliverySchema = z
  .object({
    items: z.array(keywordPassageSchema).max(100),
    generation: z.string().regex(/^\d+$/u),
    conflict_hold: z.boolean(),
    evaluated_at: z.iso.datetime({ offset: true }),
  })
  .strict();
export type Delivery = z.infer<typeof deliverySchema>;
export async function recheckEvidence(
  ids: string[],
  locale: "bn" | "en",
  signal: AbortSignal,
): Promise<Delivery> {
  if (
    signal.aborted ||
    ids.length > 20 ||
    !ids.every((id) => z.uuid().safeParse(id).success)
  )
    throw Error("Delivery unavailable.");
  const result = await databaseQuery<{ result: unknown }>(
    "SELECT app_public.recheck_retrieval($1::uuid[],$2::text) result",
    [ids, locale],
  );
  if (signal.aborted) throw Error("Delivery cancelled.");
  return deliverySchema.parse(result.rows[0]?.result);
}
export function evidenceIdentity(p: KeywordPassage) {
  return JSON.stringify([
    p.passage_id,
    p.document_id,
    p.document_version_id,
    p.source_id,
    p.agency_id,
    p.source_url,
    p.content_hash,
    p.passage_hash,
    p.text,
    p.page_number,
    p.character_start,
    p.character_end,
    p.section_path,
  ]);
}
export function supportKey(
  claim: CandidateClaim,
  language: string,
  passages: readonly KeywordPassage[],
) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        language,
        type: claim.type,
        text: claim.text,
        evidence: claim.evidence.map((e) => ({
          id: e.evidence_id,
          quote: e.quote,
          identity: evidenceIdentity(
            passages.find((p) => p.passage_id === e.evidence_id)!,
          ),
        })),
      }),
    )
    .digest("hex");
}
export type SupportDecision = { supported: boolean; critical: boolean };
export interface SupportCandidate {
  key: string;
  claim: CandidateClaim;
  language: "bn" | "en" | "banglish";
  passages: readonly KeywordPassage[];
}
// This is an independent trusted review capability, NOT model output or an HTTP
// field. No default approvals; no exact-match/embedding similarity entails a claim.
export type SupportReview = (
  keys: readonly string[],
  signal: AbortSignal,
  candidates: readonly SupportCandidate[],
) => Promise<ReadonlyMap<string, SupportDecision>>;
export const denyUnreviewed: SupportReview = async () => new Map();
export function bindCitation(p: KeywordPassage) {
  const h = createHash("sha256").update(evidenceIdentity(p)).digest("hex");
  const id = `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
  return citationSchema.parse({
    id,
    source_id: p.source_id,
    document_id: p.document_id,
    document_version_id: p.document_version_id,
    passage_id: p.passage_id,
    agency_id: p.agency_id,
    agency_name: null,
    title: p.document_title,
    url: p.source_url,
    passage: p.text,
    content_hash: p.content_hash,
    passage_hash: p.passage_hash,
    locator: {
      type: p.document_type,
      page: p.page_number,
      start: p.character_start,
      end: p.character_end,
      heading_path: p.section_path,
    },
    published_at: p.published_at,
    checked_at: p.content_checked_at,
    reviewed_at: p.document_reviewed_at,
    ownership_verified_at: p.ownership_verified_at,
    effective_from: p.effective_from,
    effective_to: p.effective_to,
  });
}
export function isCritical(claim: CandidateClaim) {
  return (
    claim.type !== "general" ||
    /fee|deadline|duration|eligible|required|must|documents?|টাকা|ফি|সময়|সময়সীমা|যোগ্য|কাগজ|লাগবে|কত|taka|koto|lagbe/iu.test(
      claim.text,
    ) ||
    /\p{N}/u.test(claim.text)
  );
}
export function numericSupport(claim: CandidateClaim) {
  const quoted = claim.evidence.map((e) => e.quote).join(" ");
  return (claim.text.match(/[\p{N}]+(?:[.,:/-][\p{N}]+)*/gu) ?? []).every((n) =>
    quoted.includes(n),
  );
}
