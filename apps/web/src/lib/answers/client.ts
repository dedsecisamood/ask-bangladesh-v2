import { publicAnswerSchema } from "./contracts";
import { prepareRetrievalQuery } from "../retrieval/query";
import { questionSchema } from "../questions/contracts";
import type { DemoAdapter } from "../chat";

// Same-origin only; no cookie identity, persistence, shared response cache or retry.
export function createApiAdapter(fetcher: typeof fetch = fetch): DemoAdapter {
  return async ({ question, history, answerLanguage, signal, locale }) => {
    if (!question) throw Error("Question required.");
    const minimized = prepareRetrievalQuery(question);
    const retained = (history ?? [])
      .slice(-6)
      .map((h) => ({
        role: "user" as const,
        content: prepareRetrievalQuery(h.content).minimized,
      }))
      .filter((h) => h.content);
    while (
      retained.length &&
      [...minimized.minimized].length +
        retained.reduce((n, h) => n + [...h.content].length, 0) >
        8000
    )
      retained.shift();
    const input = questionSchema.parse({
      question: minimized.minimized,
      answer_language: answerLanguage,
      history: retained,
    });
    const timeout = new AbortController();
    const abort = () => timeout.abort();
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    const timer = setTimeout(abort, 22000);
    try {
      const response = await fetcher("/api/v1/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        cache: "no-store",
        signal: timeout.signal,
        body: JSON.stringify(input),
      });
      const reader = response.body?.getReader();
      if (!reader) throw Error("Invalid answer response.");
      let bytes = 0,
        text = "";
      const decoder = new TextDecoder("utf-8", { fatal: true });
      try {
        while (true) {
          const c = await reader.read();
          if (c.done) break;
          bytes += c.value.byteLength;
          if (bytes > 256000) throw Error("Answer response too large.");
          text += decoder.decode(c.value, { stream: true });
        }
        text += decoder.decode();
      } finally {
        void reader.cancel().catch(() => undefined);
      }
      const result = publicAnswerSchema.parse(JSON.parse(text));
      if (
        !response.ok &&
        ![400, 403, 408, 413, 415, 429, 503].includes(response.status)
      )
        throw Error("Service unavailable.");
      if (!response.ok && result.status !== "unavailable")
        throw Error("Invalid error response.");
      return {
        kind: "service",
        language: result.language ?? locale,
        shortAnswer: "",
        result,
      };
    } finally {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
    }
  };
}
