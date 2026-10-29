import type { SourceSummary } from "./catalog";
import type { Locale } from "./i18n/config";
import { copyFor } from "./product-copy";
import type { PublicAnswer } from "./answers/contracts";

export type AnswerLanguage = "auto" | "bn" | "banglish" | "en";
export interface DemoAnswer {
  kind: "demonstration" | "service";
  result?: PublicAnswer;
  language: "bn" | "en" | "banglish";
  shortAnswer: string;
  requirements?: readonly string[];
  steps?: readonly string[];
  warnings?: readonly string[];
  sources?: readonly SourceSummary[];
  followups?: readonly string[];
}
export interface ChatTurn {
  id: string;
  question: string;
  answer?: DemoAnswer;
}
export type DemoAdapter = (input: {
  locale: Locale;
  answerLanguage: AnswerLanguage;
  signal: AbortSignal;
  question?: string;
  history?: { role: "user"; content: string }[];
}) => Promise<DemoAnswer>;
export function questionError(
  question: string,
): "required" | "tooLong" | undefined {
  if (!question.trim()) return "required";
  if ([...question].length > 2_000) return "tooLong";
}
export function retainTurns(turns: readonly ChatTurn[]): ChatTurn[] {
  const retained = [...turns].slice(-6);
  while (
    retained.length > 1 &&
    retained.reduce(
      (sum, turn) =>
        sum +
        [
          ...[
            turn.question,
            turn.answer?.shortAnswer ?? "",
            ...(turn.answer?.warnings ?? []),
            ...(turn.answer?.requirements ?? []),
            ...(turn.answer?.steps ?? []),
            ...(turn.answer?.result?.blocks.map((b) => b.text) ?? []),
          ].join(""),
        ].length,
      0,
    ) > 8_000
  )
    retained.shift();
  return retained;
}
// Deliberate 200ms UI demonstration, not network latency or a simulated source fetch.
// The adapter receives no question text. A future API adapter requires separate review.
export const localDemoAdapter: DemoAdapter = ({
  locale,
  answerLanguage,
  signal,
}) =>
  new Promise((resolve, reject) => {
    const language = answerLanguage === "auto" ? locale : answerLanguage;
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException("Demo stopped", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve({
        kind: "demonstration",
        language,
        shortAnswer:
          language === "banglish"
            ? "Eti shudhu local interface demo. Live AI ba sorkari utsho jukto hoyni. Jachai kora niyom, fee ba shomoyshima ekhono deya jacche na."
            : copyFor(language).demoAnswer,
        sources: [],
        warnings: [copyFor(locale).demoSources],
      });
    }, 200);
    if (signal.aborted) abort();
    else signal.addEventListener("abort", abort, { once: true });
  });
