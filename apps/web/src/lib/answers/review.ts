import "server-only";
import { z } from "zod";
import { databaseQuery } from "../database/connection";
import { claimSchema } from "./contracts";
import { keywordPassageSchema } from "../retrieval/contracts";
import { supportKey, type SupportReview } from "./citations";

const candidateSchema = z
  .object({
    key: z.string().regex(/^[a-f0-9]{64}$/u),
    claim: claimSchema,
    language: z.enum(["bn", "en", "banglish"]),
    passages: z.array(keywordPassageSchema).max(20),
  })
  .strict();
const decisionsSchema = z
  .array(
    z
      .object({
        key: z.string().regex(/^[a-f0-9]{64}$/u),
        supported: z.boolean(),
        critical: z.boolean(),
      })
      .strict(),
  )
  .max(12);

/** Exact curated text reuse only: this is NOT an automatic entailment judge.
 * Independent human review is in existing service_claims/claim_evidence records.
 * No raw questions or review notes enter this read-only projection.
 */
export const reviewPublishedClaims: SupportReview = async (
  keys,
  signal,
  candidates,
) => {
  if (
    signal.aborted ||
    keys.length > 12 ||
    new Set(keys).size !== keys.length ||
    candidates.length !== keys.length
  )
    throw Error("Support review unavailable.");
  if (!keys.length) return new Map();
  const entries = candidates.map((value, index) => {
    const candidate = candidateSchema.parse(value);
    if (
      candidate.key !== keys[index] ||
      candidate.claim.evidence.some(
        (e) =>
          !candidate.passages.some(
            (p) => p.passage_id === e.evidence_id && p.text.includes(e.quote),
          ),
      ) ||
      supportKey(candidate.claim, candidate.language, candidate.passages) !==
        candidate.key
    )
      throw Error("Support review unavailable.");
    return {
      key: candidate.key,
      text: candidate.claim.text,
      type: candidate.claim.type,
      language: candidate.language,
      evidence: candidate.claim.evidence.map((e) => {
        const p = candidate.passages.find(
          (p) => p.passage_id === e.evidence_id,
        )!;
        return {
          passage_id: p.passage_id,
          version_id: p.document_version_id,
          passage_hash: p.passage_hash,
          content_hash: p.content_hash,
          quote: e.quote,
        };
      }),
    };
  });
  const payload = JSON.stringify(entries);
  if (Buffer.byteLength(payload, "utf8") > 400000)
    throw Error("Support review unavailable.");
  const result = await databaseQuery<{ result: unknown }>(
    "SELECT app_public.answer_support($1::jsonb) result",
    [payload],
  );
  if (signal.aborted) throw Error("Support review unavailable.");
  const decisions = decisionsSchema.parse(result.rows[0]?.result);
  if (
    decisions.length !== keys.length ||
    new Set(decisions.map((d) => d.key)).size !== keys.length ||
    decisions.some((d) => !keys.includes(d.key) || (d.critical && !d.supported))
  )
    throw Error("Support review unavailable.");
  return new Map(
    decisions.map((d) => [
      d.key,
      { supported: d.supported, critical: d.critical },
    ]),
  );
};
