import { z } from "zod";

export const questionSchema = z
  .object({
    question: z
      .string()
      .max(8000)
      .transform((s) => s.normalize("NFC").trim())
      .refine(
        (s) => s.length > 0 && [...s].length <= 2000 && /[\p{L}\p{N}]/u.test(s),
      )
      .refine(
        (s) =>
          !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069\ud800-\udfff]/u.test(
            s,
          ),
      ),
    answer_language: z.enum(["auto", "bn", "en", "banglish"]).default("auto"),
    conversation_id: z.uuid().optional(),
    history: z
      .array(
        z
          .object({
            role: z.enum(["user", "assistant"]),
            content: z
              .string()
              .min(1)
              .max(8000)
              .refine(
                (s) =>
                  s.isWellFormed() &&
                  [...s].length <= 2000 &&
                  !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(
                    s,
                  ),
              ),
          })
          .strict(),
      )
      .max(6)
      .optional(),
  })
  .strict()
  .refine(
    (q) =>
      [...q.question].length +
        (q.history ?? []).reduce((n, h) => n + [...h.content].length, 0) <=
      8000,
  );
export type QuestionInput = z.infer<typeof questionSchema>;
export { resolveAnswerLanguage } from "./language";
export const questionResponseSchema = z
  .object({
    request_id: z.uuid(),
    status: z.literal("unavailable"),
    language: z.enum(["bn", "en", "banglish"]),
    blocks: z.array(z.never()).length(0),
    citations: z.array(z.never()).length(0),
    reason_codes: z.array(
      z.enum(["provider_unavailable", "policy_unavailable"]),
    ),
    warnings: z.array(z.enum(["personal_information_removed"])),
    error: z.object({ code: z.string(), message: z.string() }).strict(),
  })
  .strict();
export type QuestionResponse = z.infer<typeof questionResponseSchema>;
