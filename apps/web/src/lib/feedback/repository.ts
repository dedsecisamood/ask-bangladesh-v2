import "server-only";
import { z } from "zod";
import { feedbackQuery } from "./connection";
import { feedbackSchema, type FeedbackInput } from "./contracts";

export async function submitFeedback(input: FeedbackInput): Promise<string> {
  const parsed = feedbackSchema.parse(input);
  const result = await feedbackQuery<{ id: string }>(
    "SELECT app_public.submit_feedback($1::jsonb) id",
    [JSON.stringify(parsed)],
  );
  return z.uuid().parse(result.rows[0]?.id);
}
