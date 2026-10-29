import { z } from "zod";
export const directoryKind = z.enum([
  "services",
  "categories",
  "agencies",
  "sources",
]);
export type DirectoryKind = z.infer<typeof directoryKind>;
export const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
export const directoryQuerySchema = z
  .object({
    locale: z.enum(["bn", "en"]).default("bn"),
    limit: z
      .string()
      .regex(/^[1-9]\d?$/)
      .transform(Number)
      .refine((n) => n <= 50)
      .default(20),
    category: slugSchema.optional(),
    agency_id: z.uuid().optional(),
    service_id: z.uuid().optional(),
    cursor: z.string().min(1).max(2048).optional(),
  })
  .strict();
const common = {
  id: z.uuid(),
  name: z.string().min(1).max(500),
  locale: z.enum(["bn", "en"]),
  coverage: z.literal("metadata_only"),
};
export const directoryItemSchema = z.union([
  z.object({ ...common, slug: slugSchema }).strict(),
  z
    .object({
      ...common,
      slug: slugSchema,
      category_ids: z.array(z.uuid()),
      agency_ids: z.array(z.uuid()),
      source_ids: z.array(z.uuid()).optional(),
    })
    .strict(),
  z
    .object({
      ...common,
      agency_id: z.uuid(),
      url: z.url().refine((u) => new URL(u).protocol === "https:"),
      evidence_eligible: z.literal(false),
      ownership_verified_at: z.iso.datetime({ offset: true }),
    })
    .strict(),
]);
export type DirectoryItem = z.infer<typeof directoryItemSchema>;
export const directoryResponseSchema = z
  .object({
    data: z.array(directoryItemSchema),
    meta: z.object({
      limit: z.number().int(),
      next_cursor: z.string().nullable(),
      policy_revision: z.string(),
    }),
    request_id: z.uuid(),
  })
  .strict();
export type DirectoryResponse = z.infer<typeof directoryResponseSchema>;
