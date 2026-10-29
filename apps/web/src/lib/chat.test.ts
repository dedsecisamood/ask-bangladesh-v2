import { afterEach, describe, expect, it, vi } from "vitest";
import {
  localDemoAdapter,
  questionError,
  retainTurns,
  type AnswerLanguage,
} from "./chat";
afterEach(() => vi.useRealTimers());
describe("bounded transient questions", () => {
  it("validates whitespace and Unicode code points without splitting characters", () => {
    expect(questionError(" \n\t")).toBe("required");
    expect(questionError("প্রশ্ন")).toBeUndefined();
    expect(questionError("😀".repeat(2000))).toBeUndefined();
    expect(questionError("😀".repeat(2001))).toBe("tooLong");
  });
  it("retains at most six recent questions and an 8,000-character content budget", () => {
    expect(
      retainTurns(
        Array.from({ length: 9 }, (_, id) => ({
          id: String(id),
          question: "q",
        })),
      ).map((turn) => turn.id),
    ).toEqual(["3", "4", "5", "6", "7", "8"]);
    expect(
      retainTurns(
        Array.from({ length: 6 }, (_, id) => ({
          id: String(id),
          question: "q".repeat(2000),
        })),
      ),
    ).toHaveLength(4);
    expect(
      retainTurns([
        {
          id: "1",
          question: "q",
          answer: {
            kind: "demonstration",
            language: "en",
            shortAnswer: "a".repeat(7999),
            warnings: ["w"],
            requirements: ["r"],
            steps: ["s"],
          },
        },
        { id: "2", question: "next" },
      ]),
    ).toEqual([{ id: "2", question: "next" }]);
  });
});
describe("local demo adapter", () => {
  it.each(["auto", "bn", "en", "banglish"] as AnswerLanguage[])(
    "returns only a non-actionable local demonstration in %s mode",
    async (answerLanguage) => {
      vi.useFakeTimers();
      const pending = localDemoAdapter({
        locale: "bn",
        answerLanguage,
        signal: new AbortController().signal,
      });
      await vi.advanceTimersByTimeAsync(200);
      const answer = await pending;
      expect(answer.kind).toBe("demonstration");
      expect(answer.sources).toEqual([]);
      expect(answer.language).toBe(
        answerLanguage === "auto" ? "bn" : answerLanguage,
      );
      expect(answer.shortAnswer.length).toBeGreaterThan(50);
    },
  );
  it.each([true, false])(
    "honors cancellation, including already-aborted signals: %s",
    async (before) => {
      const controller = new AbortController();
      if (before) controller.abort();
      const pending = localDemoAdapter({
        locale: "en",
        answerLanguage: "auto",
        signal: controller.signal,
      });
      if (!before) controller.abort();
      await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    },
  );
});
