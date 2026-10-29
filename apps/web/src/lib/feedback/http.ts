import "server-only";
import { randomUUID } from "node:crypto";
import { BodyError, readBodyText } from "../http/body";
import {
  feedbackSchema,
  feedbackReceiptSchema,
  type FeedbackInput,
} from "./contracts";
import { submitFeedback } from "./repository";

export function createFeedbackHandler(options: {
  development: boolean;
  submit?: (input: FeedbackInput) => Promise<string>;
  now?: () => number;
  maxRequests?: number;
}) {
  const submit = options.submit ?? submitFeedback;
  const now = options.now ?? Date.now;
  const limit = options.maxRequests ?? 20;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100)
    throw Error("Invalid feedback admission policy.");
  let count = 0,
    reset = 0,
    active = 0;
  return async (request: Request) => {
    const request_id = randomUUID();
    const headers = {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Request-ID": request_id,
    };
    const fail = (code: string, status: number) =>
      Response.json(
        {
          error: { code, message: "Feedback could not be accepted." },
          request_id,
        },
        {
          status,
          headers: {
            ...headers,
            ...([429, 503].includes(status) ? { "Retry-After": "60" } : {}),
          },
        },
      );
    // Environment configuration cannot enable production collection.
    if (!options.development) return fail("POLICY_UNAVAILABLE", 503);
    if (now() >= reset) {
      reset = now() + 60000;
      count = 0;
    }
    if (++count > limit || active >= 2) return fail("RATE_LIMITED", 429);
    active++;
    try {
      const url = new URL(request.url);
      if (url.search || request.url.length > 2048)
        return fail("INVALID_REQUEST", 400);
      if (
        request.headers.get("origin") !== url.origin ||
        request.headers.get("sec-fetch-site") === "cross-site"
      )
        return fail("ORIGIN_DENIED", 403);
      if (
        !/^application\/json(?:\s*;\s*charset=utf-8)?$/iu.test(
          request.headers.get("content-type") ?? "",
        ) ||
        request.headers.has("content-encoding")
      )
        return fail("UNSUPPORTED_MEDIA_TYPE", 415);
      const text = await readBodyText(request);
      let raw: unknown;
      try {
        raw = JSON.parse(text);
      } catch {
        return fail("INVALID_REQUEST", 400);
      }
      const parsed = feedbackSchema.safeParse(raw);
      if (!parsed.success) return fail("INVALID_REQUEST", 400);
      const feedback_id = await submit(parsed.data);
      return Response.json(
        feedbackReceiptSchema.parse({ data: { feedback_id }, request_id }),
        { status: 202, headers },
      );
    } catch (error) {
      if (error instanceof BodyError) return fail(error.code, error.status);
      return fail("UNAVAILABLE", 503);
    } finally {
      active--;
    }
  };
}
