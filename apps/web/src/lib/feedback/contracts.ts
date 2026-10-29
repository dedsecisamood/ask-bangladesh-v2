import { z } from "zod";
export const feedbackSchema = z
  .object({
    category: z.enum([
      "incorrect",
      "outdated",
      "missing_source",
      "accessibility",
      "other",
    ]),
    locale: z.enum(["bn", "en"]),
    page: z.enum(["ask", "services", "sources", "accessibility"]).optional(),
    service_id: z.uuid().optional(),
    source_id: z.uuid().optional(),
    consent: z.literal(true),
  })
  .strict();
export type FeedbackInput = z.infer<typeof feedbackSchema>;
export const feedbackReceiptSchema = z
  .object({
    data: z.object({ feedback_id: z.uuid() }).strict(),
    request_id: z.uuid(),
  })
  .strict();
