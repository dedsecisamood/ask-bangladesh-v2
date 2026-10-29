import { createQuestionHandler } from "@/lib/questions/http";
export const runtime = "nodejs";
export const POST = createQuestionHandler({
  development: process.env.NODE_ENV === "development",
});
