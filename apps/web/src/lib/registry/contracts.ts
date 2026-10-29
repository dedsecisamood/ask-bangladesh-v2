import { z } from "zod";
import { normalizeRegistryUrl } from "./url";
const text = (max: number) => z.string().trim().min(1).max(max);
export const reasonSchema = text(2000);
export const revisionSchema = z.string().regex(/^[1-9]\d{0,17}$/u);
export const registryAction = z.enum([
  "submit",
  "approve",
  "activate",
  "reject",
  "suspend",
]);
const metadata = {
  source_name: text(240),
  description: z.string().max(2000).nullable().default(null),
  language: z.enum(["bn", "en", "mixed", "unknown"]).default("unknown"),
  source_type: z
    .enum(["portal", "html", "pdf", "text", "other"])
    .default("portal"),
  risk_class: z.enum(["critical", "general"]).default("critical"),
  reason: reasonSchema,
};
export const createSourceSchema = z
  .object({
    ...metadata,
    agency_id: z.uuid(),
    url: text(2048).refine((value) => {
      try {
        normalizeRegistryUrl(value);
        return true;
      } catch {
        return false;
      }
    }, "Use an unambiguous public HTTPS URL without credentials."),
  })
  .strict()
  .transform(({ url, ...rest }) => ({
    ...rest,
    canonical_url: normalizeRegistryUrl(url),
    submitted_url: url,
  }));
export const updateSourceSchema = z
  .object({ ...metadata, revision: revisionSchema })
  .strict();
export const reviewProof = z
  .object({
    method: text(200),
    evidence_ref: text(2048),
    excerpt: text(3000),
    checked_at: z.iso.datetime({ offset: true }),
    expires_at: z.iso.datetime({ offset: true }),
  })
  .strict()
  .refine((value) => {
    const checked = Date.parse(value.checked_at),
      expires = Date.parse(value.expires_at),
      now = Date.now();
    return (
      checked <= now &&
      expires > now &&
      expires > checked &&
      expires - checked <= 90 * 86400000
    );
  }, "Verification evidence must be current and expire within 90 days of its check.");
export const approveSourceSchema = z
  .object({
    revision: revisionSchema,
    reason: reasonSchema,
    ownership: reviewProof,
    authority: reviewProof,
    content_use_evidence_ref: text(2048),
    availability_status: z.enum([
      "unknown",
      "accessible",
      "unavailable",
      "restricted",
    ]),
    availability_checked_at: z.iso.datetime({ offset: true }).optional(),
    availability_evidence_ref: text(2048).optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.availability_status === "unknown" ||
      (!!value.availability_checked_at &&
        Date.parse(value.availability_checked_at) <= Date.now() &&
        !!value.availability_evidence_ref),
    "Availability assertions need a check time and evidence.",
  );
export const sourceActionSchema = z
  .object({ revision: revisionSchema, reason: reasonSchema })
  .strict();
export const registryResultSchema = z.union([
  z
    .object({
      id: z.uuid(),
      revision: revisionSchema,
      registry_status: z.enum([
        "draft",
        "pending_review",
        "approved",
        "rejected",
        "suspended",
      ]),
      status: z.enum([
        "candidate",
        "verified",
        "active",
        "suspended",
        "retired",
      ]),
    })
    .strict(),
  z
    .object({
      error_code: z.enum([
        "FORBIDDEN",
        "REVISION_CONFLICT",
        "INVALID_TRANSITION",
        "INVALID_REQUEST",
        "INDEPENDENT_REVIEW_REQUIRED",
        "REAUTHENTICATION_REQUIRED",
        "IDEMPOTENCY_CONFLICT",
        "RESOURCE_NOT_FOUND",
        "DUPLICATE_SOURCE",
        "RATE_LIMITED",
      ]),
    })
    .strict(),
]);
export type RegistryCommand =
  "create" | "update" | z.infer<typeof registryAction>;
