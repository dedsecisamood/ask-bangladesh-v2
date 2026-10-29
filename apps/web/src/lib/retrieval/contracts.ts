import { z } from "zod";

const querySchema = z
  .string()
  .min(1)
  .max(512)
  .refine(
    (q) =>
      q.isWellFormed() &&
      Array.from(q).length <= 256 &&
      !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/u.test(q) &&
      (q.match(/[\p{L}\p{N}][\p{L}\p{M}\p{N}\u200c\u200d]*/gu)?.length ?? 0) >=
        1 &&
      (q.match(/[\p{L}\p{N}][\p{L}\p{M}\p{N}\u200c\u200d]*/gu)?.length ?? 0) <=
        32,
  );
export const keywordInputSchema = z
  .object({
    query: querySchema,
    locale: z.enum(["bn", "en"]).default("bn"),
    limit: z.number().int().min(1).max(50).default(10),
    offset: z.number().int().min(0).max(500).default(0),
    service_id: z.uuid().optional(),
    agency_id: z.uuid().optional(),
    source_id: z.uuid().optional(),
    language: z.enum(["bn", "en", "banglish", "mixed", "unknown"]).optional(),
  })
  .strict();
export type KeywordSearchInput = z.input<typeof keywordInputSchema>;
const timestamp = z.iso.datetime({ offset: true });
const fraction = z.number().finite().min(0).max(1);
const sourceUrl = z
  .url()
  .max(2048)
  .refine((value) => {
    const url = new URL(value);
    return (
      url.protocol === "https:" && !url.username && !url.password && !url.hash
    );
  });
export const keywordPassageSchema = z
  .object({
    passage_id: z.uuid(),
    document_id: z.uuid(),
    document_version_id: z.uuid(),
    source_id: z.uuid(),
    agency_id: z.uuid(),
    source_url: sourceUrl,
    document_title: z.string().min(1).max(500),
    document_type: z.enum(["html", "pdf", "text", "other"]),
    text: z.string().min(1).max(16000),
    language: z.enum(["bn", "en", "banglish", "mixed", "unknown"]),
    heading: z.string().max(500).nullable(),
    section_path: z.array(z.string()).max(16),
    page_number: z.number().int().positive().nullable(),
    page_label: z.string().max(80).nullable(),
    character_start: z.number().int().nonnegative().nullable(),
    character_end: z.number().int().positive().nullable(),
    content_hash: z.string().regex(/^[a-f0-9]{64}$/),
    passage_hash: z.string().regex(/^[a-f0-9]{64}$/),
    extraction_profile: z.string().min(1).max(200),
    published_at: timestamp.nullable(),
    effective_from: timestamp.nullable(),
    effective_to: timestamp.nullable(),
    ownership_verified_at: timestamp,
    document_reviewed_at: timestamp,
    content_checked_at: timestamp,
    score: fraction,
    signals: z
      .object({
        token_coverage: fraction,
        exact_phrase: z.boolean(),
        heading_coverage: fraction,
        title_coverage: fraction,
      })
      .strict(),
    content_trust: z.literal("untrusted_data"),
  })
  .strict()
  .refine(
    (p) =>
      (p.document_type === "pdf"
        ? p.page_number !== null
        : p.character_start !== null) &&
      ((p.character_start === null && p.character_end === null) ||
        (p.character_start !== null &&
          p.character_end !== null &&
          p.character_end - p.character_start === Array.from(p.text).length)),
  );
export type KeywordPassage = z.infer<typeof keywordPassageSchema>;
export const keywordResultSchema = z
  .object({
    items: z.array(keywordPassageSchema).max(50),
    normalized_query: z.string().min(1).max(512),
    tokens: z.array(z.string().min(1)).min(1).max(64),
    limit: z.number().int().min(1).max(50),
    offset: z.number().int().min(0).max(500),
    has_more: z.boolean(),
    next_offset: z.number().int().min(1).max(500).nullable(),
    pagination_capped: z.boolean(),
    generation: z.string().regex(/^\d+$/),
    rank_version: z.literal("p29-keyword-v1"),
    policy_revision: z.literal("p29-eligible-v1"),
    evaluated_at: timestamp,
  })
  .strict();
