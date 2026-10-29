import { createFeedbackHandler } from "@/lib/feedback/http";
export const runtime = "nodejs";
export const POST = createFeedbackHandler({
  development: process.env.NODE_ENV === "development",
});
