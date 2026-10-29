"use client";

import { useId, useRef, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { questionError, type AnswerLanguage } from "@/lib/chat";
import type { Locale } from "@/lib/i18n/config";
import { copyFor, exampleQuestions } from "@/lib/product-copy";

export function QuestionComposer({
  locale,
  onSend,
  busy = false,
  chat = false,
  service = false,
  compact = false,
}: {
  locale: Locale;
  onSend: (question: string, language: AnswerLanguage) => boolean;
  busy?: boolean;
  chat?: boolean;
  service?: boolean;
  compact?: boolean;
}) {
  const copy = copyFor(locale);
  const id = useId();
  const input = useRef<HTMLTextAreaElement>(null);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<"required" | "tooLong" | undefined>();
  const [language, setLanguage] = useState<AnswerLanguage>("auto");
  return (
    <div
      className={
        compact ? "question-entry question-entry-compact" : "question-entry"
      }
    >
      <form
        noValidate
        autoComplete="off"
        onSubmit={(event) => {
          event.preventDefault();
          const invalid = questionError(question);
          setError(invalid);
          if (invalid) {
            input.current?.focus();
            return;
          }
          if (onSend(question, language)) {
            setQuestion("");
            input.current?.focus();
          }
        }}
      >
        <div className={compact ? "question-bar" : undefined}>
          {compact && (
            <Search className="question-search-icon" aria-hidden="true" />
          )}
          <label className={compact ? "sr-only" : "type-label"} htmlFor={id}>
            {copy.question}
          </label>
          <Textarea
            ref={input}
            id={id}
            value={question}
            placeholder={
              compact
                ? locale === "bn"
                  ? "যেমন: ই-পাসপোর্ট রিইস্যু ফি কত? বা NID সংশোধন নিয়ম…"
                  : "e.g., How much is the e-passport reissue fee? or NID correction rules…"
                : copy.placeholder
            }
            rows={compact ? 1 : 3}
            maxLength={4000}
            aria-invalid={Boolean(error)}
            aria-describedby={`${id}-privacy${error ? ` ${id}-error` : ""}`}
            spellCheck={false}
            required
            autoComplete="off"
            className={compact ? "question-bar-input" : "mt-2 min-h-28 bg-card"}
            onChange={(event) => {
              setQuestion(event.target.value);
              setError(undefined);
            }}
            onKeyDown={(event) => {
              if (
                (chat || compact) &&
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing &&
                event.nativeEvent.keyCode !== 229 &&
                window.matchMedia("(pointer: fine)").matches
              ) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          {compact && (
            <Button
              type="submit"
              disabled={busy}
              aria-label={`${locale === "bn" ? "জিজ্ঞাসা করুন" : "Ask Question"} — ${copy.send}`}
              className="question-bar-submit"
            >
              {locale === "bn" ? "জিজ্ঞাসা করুন" : "Ask Question"}
            </Button>
          )}
        </div>
        <p
          id={`${id}-privacy`}
          className={compact ? "home-question-note" : "type-helper mt-2"}
        >
          {copy.privacy}
        </p>
        {error && (
          <p
            id={`${id}-error`}
            role="alert"
            className="mt-2 text-sm text-destructive"
          >
            {copy[error]}
          </p>
        )}
        {!compact && (
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            {chat && (
              <div className="min-w-0 max-w-full">
                <label htmlFor={`${id}-language`} className="type-label block">
                  {copy.answerLanguage}
                </label>
                <select
                  id={`${id}-language`}
                  className="native-select w-full"
                  value={language}
                  onChange={(event) =>
                    setLanguage(event.target.value as AnswerLanguage)
                  }
                >
                  {(["auto", "bn", "banglish", "en"] as const).map(
                    (value, index) => (
                      <option value={value} key={value}>
                        {copy.languageOptions[index]}
                      </option>
                    ),
                  )}
                </select>
              </div>
            )}
            <Button type="submit" disabled={busy}>
              {service
                ? locale === "bn"
                  ? "প্রশ্ন পাঠান"
                  : "Send question"
                : chat
                  ? copy.chatSend
                  : copy.send}
              <ArrowUpRight aria-hidden="true" />
            </Button>
          </div>
        )}
      </form>
      <details className={compact ? "home-question-examples" : "mt-5"}>
        <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-primary">
          {copy.examples}
        </summary>
        <ul className="mt-2 grid gap-2">
          {exampleQuestions.map((question) => (
            <li key={question}>
              <button
                type="button"
                className="example-question"
                onClick={() => {
                  setQuestion(question);
                  setError(undefined);
                  input.current?.focus();
                }}
              >
                {question}
              </button>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
