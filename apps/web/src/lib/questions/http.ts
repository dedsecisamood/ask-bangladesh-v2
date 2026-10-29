import "server-only";
import { randomUUID } from "node:crypto";
import {
  questionSchema,
  questionResponseSchema,
  resolveAnswerLanguage,
} from "./contracts";
import { prepareRetrievalQuery } from "../retrieval/query";
import type { retrieveRoutedPassages } from "../retrieval/hybrid";
import type { QuestionInput } from "./contracts";
import {
  answerPayloadSchema,
  validatedAnswerSchema,
  type AnswerPayload,
} from "../answers/contracts";

// Narrow future capability: callers cannot select models, filters or trust states.
export type QuestionRetriever = (
  input: {
    query: string;
    locale: "bn" | "en";
  },
  signal: AbortSignal,
) => ReturnType<typeof retrieveRoutedPassages>;

export function createQuestionHandler(options: {
  development: boolean;
  maxRequests?: number;
  windowMs?: number;
  deadlineMs?: number;
  now?: () => number;
  retrieve?: QuestionRetriever;
  answer?: (
    input: QuestionInput,
    signal: AbortSignal,
  ) => Promise<AnswerPayload>;
}) {
  const now = options.now ?? Date.now;
  const limit = options.maxRequests ?? 30;
  const windowMs = options.windowMs ?? 60_000;
  const deadlineMs = options.deadlineMs ?? 20000;
  if (
    ![limit, windowMs, deadlineMs].every(
      (n) => Number.isSafeInteger(n) && n > 0,
    )
  )
    throw new Error("Invalid question admission policy.");
  let reset = 0,
    count = 0,
    active = 0;
  return async function POST(request: Request) {
    const request_id = randomUUID();
    const controller = new AbortController();
    let language: "bn" | "en" | "banglish" = "bn";
    let redacted = false;
    let validated = false;
    let pending: Promise<Response> | undefined;
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    const reply = (code: string, status: number) =>
      Response.json(
        questionResponseSchema.parse({
          request_id,
          status: "unavailable",
          language,
          blocks: [],
          citations: [],
          reason_codes: [
            options.development ? "provider_unavailable" : "policy_unavailable",
          ],
          warnings: redacted ? ["personal_information_removed"] : [],
          error: {
            code,
            message:
              status === 503
                ? "Question assistance is temporarily unavailable."
                : "The question request could not be accepted.",
          },
        }),
        {
          status,
          headers: {
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
            "X-Request-ID": request_id,
            ...(status === 429 || status === 503
              ? { "Retry-After": "60" }
              : {}),
          },
        },
      );
    // No forwarded header, cookie or attacker-supplied identifier is an identity.
    if (!options.development) return reply("POLICY_UNAVAILABLE", 503);
    if (now() >= reset) {
      reset = now() + windowMs;
      count = 0;
    }
    if (++count > limit || active >= 2) return reply("RATE_LIMITED", 429);
    active++;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let bodyTimer: ReturnType<typeof setTimeout> | undefined;
    const abort = () => controller.abort();
    request.signal.addEventListener("abort", abort, { once: true });
    try {
      if (request.signal.aborted) return reply("REQUEST_CANCELLED", 408);
      const work = async () => {
        const url = new URL(request.url);
        if (url.search || request.url.length > 2048)
          return reply("INVALID_REQUEST", 400);
        const origin = request.headers.get("origin");
        if (
          (origin && origin !== url.origin) ||
          request.headers.get("sec-fetch-site") === "cross-site"
        )
          return reply("ORIGIN_DENIED", 403);
        if (
          !/^application\/json(?:\s*;\s*charset=utf-8)?$/iu.test(
            request.headers.get("content-type") ?? "",
          ) ||
          request.headers.has("content-encoding")
        )
          return reply("UNSUPPORTED_MEDIA_TYPE", 415);
        const length = request.headers.get("content-length");
        if (length && (!/^\d+$/u.test(length) || Number(length) > 40960))
          return reply("PAYLOAD_TOO_LARGE", 413);
        reader = request.body?.getReader();
        if (!reader) return reply("INVALID_REQUEST", 400);
        bodyTimer = setTimeout(() => controller.abort(), 2000);
        const decoder = new TextDecoder("utf-8", { fatal: true });
        let bytes = 0,
          body = "";
        while (true) {
          const chunk = await reader.read();
          if (controller.signal.aborted) return reply("REQUEST_TIMEOUT", 408);
          if (chunk.done) break;
          bytes += chunk.value.byteLength;
          if (bytes > 40960) return reply("PAYLOAD_TOO_LARGE", 413);
          body += decoder.decode(chunk.value, { stream: true });
        }
        body += decoder.decode();
        const parsed = questionSchema.safeParse(JSON.parse(body));
        clearTimeout(bodyTimer);
        body = "";
        if (!parsed.success) return reply("INVALID_REQUEST", 400);
        validated = true;
        const input = parsed.data;
        language = resolveAnswerLanguage(
          input.question,
          input.answer_language,
          input.history,
        );
        const minimized = prepareRetrievalQuery(input.question);
        redacted = minimized.redacted;
        if (options.answer) {
          const payload = answerPayloadSchema.parse(
            await options.answer(input, controller.signal),
          );
          if (controller.signal.aborted) return reply("REQUEST_TIMEOUT", 408);
          return Response.json(
            validatedAnswerSchema.parse({ ...payload, request_id }),
            {
              status: payload.status === "unavailable" ? 503 : 200,
              headers: {
                "Cache-Control": "no-store",
                "X-Content-Type-Options": "nosniff",
                "X-Request-ID": request_id,
                ...(payload.status === "unavailable"
                  ? { "Retry-After": "60" }
                  : {}),
              },
            },
          );
        }
        // No storage, logging, history lookup or generation. Optional injected
        // adapter is for internal integration tests; never taken from HTTP input.
        if (options.retrieve && minimized.normalized)
          await options.retrieve(
            {
              query: minimized.normalized,
              locale: language === "bn" ? "bn" : "en",
            },
            controller.signal,
          );
        return reply("PROVIDER_UNAVAILABLE", 503);
      };
      const interrupted = new Promise<Response>((resolve) => {
        const onAbort = () =>
          resolve(
            reply(
              request.signal.aborted ? "REQUEST_CANCELLED" : "REQUEST_TIMEOUT",
              408,
            ),
          );
        controller.signal.addEventListener("abort", onAbort, { once: true });
        timer = setTimeout(() => controller.abort(), deadlineMs);
      });
      pending = work();
      return await Promise.race([pending, interrupted]);
    } catch {
      return reply(
        validated ? "BACKEND_UNAVAILABLE" : "INVALID_REQUEST",
        validated ? 503 : 400,
      );
    } finally {
      if (timer) clearTimeout(timer);
      if (bodyTimer) clearTimeout(bodyTimer);
      controller.abort();
      request.signal.removeEventListener("abort", abort);
      void reader?.cancel().catch(() => undefined);
      if (pending)
        void pending.then(
          () => {
            active--;
          },
          () => {
            active--;
          },
        );
      else active--;
    }
  };
}
