import { z } from "zod";
import { slugSchema } from "./contracts";
export const searchInputSchema = z
  .object({
    locale: z.enum(["bn", "en"]).default("bn"),
    query: z
      .string()
      .max(120)
      .refine((q) => !/[\u0000-\u001f\u007f]/u.test(q))
      .transform((q) =>
        q.normalize("NFC").trim().replace(/\s+/gu, " ").toLowerCase(),
      )
      .default(""),
    limit: z.number().int().min(1).max(50).default(20),
    category: slugSchema.optional(),
    agency_id: z.uuid().optional(),
    cursor: z.string().min(1).max(2048).optional(),
  })
  .strict();
