import { z } from "zod";
import { questionResponseSchema } from "../questions/contracts";

export const warningSchema = z.enum([
  "insufficient_evidence",
  "validation_failed",
  "source_conflict",
  "stale_evidence",
  "policy_unavailable",
  "provider_unavailable",
  "budget_exhausted",
  "ambiguous_request",
  "partial_support",
  "personal_information_removed",
  "publication_date_unknown",
  "retrieval_degraded",
  "context_limit",
  "out_of_scope",
]);
const safeText = z
  .string()
  .min(1)
  .max(2000)
  .refine((s) => !/[<>]|https?:|www\.|javascript:|data:/iu.test(s));
export const claimSchema = z
  .object({
    id: z.string().regex(/^c[1-9][0-9]?$/u),
    type: z.enum([
      "general",
      "procedure",
      "fee",
      "deadline",
      "eligibility",
      "documents",
    ]),
    text: safeText,
    evidence: z
      .array(
        z
          .object({
            evidence_id: z.uuid(),
            quote: z.string().min(1).max(16000),
          })
          .strict(),
      )
      .min(1)
      .max(4),
  })
  .strict();
export type CandidateClaim = z.infer<typeof claimSchema>;
export const draftSchema = z
  .object({
    status: z.enum(["answered", "partial", "insufficient_evidence"]),
    claims: z.array(claimSchema).max(12),
  })
  .strict()
  .refine(
    (d) =>
      new Set(d.claims.map((c) => c.id)).size === d.claims.length &&
      (d.status !== "insufficient_evidence" || d.claims.length === 0),
  );
export const citationSchema = z
  .object({
    id: z.uuid(),
    source_id: z.uuid(),
    document_id: z.uuid(),
    document_version_id: z.uuid(),
    passage_id: z.uuid(),
    agency_id: z.uuid(),
    agency_name: z.string().max(500).nullable(),
    title: z.string().min(1).max(500),
    url: z
      .url()
      .max(2048)
      .refine((s) => {
        const u = new URL(s);
        return u.protocol === "https:" && !u.username && !u.password && !u.hash;
      }),
    passage: z.string().min(1).max(16000),
    content_hash: z.string().regex(/^[a-f0-9]{64}$/u),
    passage_hash: z.string().regex(/^[a-f0-9]{64}$/u),
    locator: z
      .object({
        type: z.enum(["html", "pdf", "text", "other"]),
        page: z.number().int().positive().nullable(),
        start: z.number().int().nonnegative().nullable(),
        end: z.number().int().positive().nullable(),
        heading_path: z.array(z.string().max(500)).max(16),
      })
      .strict(),
    published_at: z.iso.datetime({ offset: true }).nullable(),
    checked_at: z.iso.datetime({ offset: true }),
    reviewed_at: z.iso.datetime({ offset: true }),
    ownership_verified_at: z.iso.datetime({ offset: true }),
    effective_from: z.iso.datetime({ offset: true }).nullable(),
    effective_to: z.iso.datetime({ offset: true }).nullable(),
  })
  .strict();
export const answerPayloadSchema = z
  .object({
    status: z.enum(["answered", "partial", "abstained", "unavailable"]),
    language: z.enum(["bn", "en", "banglish"]),
    blocks: z
      .array(
        z
          .object({
            id: z.string().max(80),
            kind: z.enum(["explanation", "step"]),
            text: safeText,
            citation_ids: z.array(z.uuid()).min(1).max(4),
          })
          .strict(),
      )
      .max(12),
    citations: z.array(citationSchema).max(48),
    reason_codes: z.array(warningSchema).max(16),
    warnings: z.array(warningSchema).max(16),
  })
  .strict()
  .superRefine((a, c) => {
    const ids = new Set(a.citations.map((x) => x.id));
    if (
      ids.size !== a.citations.length ||
      a.blocks.some((b) => b.citation_ids.some((id) => !ids.has(id))) ||
      ((a.status === "abstained" || a.status === "unavailable") &&
        (a.blocks.length || a.citations.length)) ||
      ((a.status === "answered" || a.status === "partial") && !a.blocks.length)
    )
      c.addIssue({
        code: "custom",
        message: "Invalid answer evidence binding.",
      });
  });
export const validatedAnswerSchema = answerPayloadSchema.safeExtend({
  request_id: z.uuid(),
});
export const publicAnswerSchema = z.union([
  questionResponseSchema,
  validatedAnswerSchema,
]);
export type AnswerPayload = z.infer<typeof answerPayloadSchema>;
export type PublicAnswer = z.infer<typeof publicAnswerSchema>;
