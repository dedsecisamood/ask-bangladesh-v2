"use client";
import { useState } from "react";
import { GroundedAnswer } from "./grounded-answer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SourceCard } from "@/components/evidence/source-card";
import type { DemoAnswer } from "@/lib/chat";
import type { Locale } from "@/lib/i18n/config";
import { copyFor } from "@/lib/product-copy";

// A rendering contract, never a replacement for server-side evidence validation.
// Only local non-actionable demo answers enter this component in Phase 2.
export function StructuredAnswer({
  answer,
  locale,
}: {
  answer: DemoAnswer;
  locale: Locale;
}) {
  const copy = copyFor(locale);
  const [selection, setSelection] = useState<number | null>(null);
  if (answer.kind === "service" && answer.result)
    return <GroundedAnswer answer={answer.result} locale={locale} />;
  return (
    <div className="space-y-4">
      <Badge>{copy.demo}</Badge>
      <p
        lang={answer.language === "banglish" ? "bn-Latn" : answer.language}
        className="whitespace-pre-wrap"
      >
        {answer.shortAnswer}
      </p>
      {answer.requirements?.length ? (
        <section>
          <h3 className="font-semibold">{copy.requirements}</h3>
          <ul className="list-disc pl-6">
            {answer.requirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {answer.steps?.length ? (
        <section>
          <h3 className="font-semibold">{copy.nextSteps}</h3>
          <ol className="list-decimal pl-6">
            {answer.steps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>
      ) : null}
      <section>
        <h3 className="font-semibold">{copy.sources}</h3>
        {answer.sources?.length ? (
          <div className="mt-3 grid gap-3">
            {answer.sources.map((source) => (
              <SourceCard key={source.id} source={source} locale={locale} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{copy.demoSources}</p>
        )}
      </section>
      {answer.warnings?.length ? (
        <section>
          <h3 className="font-semibold">{copy.warnings}</h3>
          <ul>
            {answer.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {answer.followups?.length ? (
        <section>
          <h3 className="font-semibold">{copy.followups}</h3>
          <ul>
            {answer.followups.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </section>
      ) : null}
      <Link className="text-link" href={`/${locale}/services`}>
        {copy.allServices}
      </Link>
      <fieldset className="border-t border-border pt-4">
        <legend className="type-label">{copy.feedback}</legend>
        <div className="flex flex-wrap gap-2">
          {copy.feedbackChoices.map((choice, index) => (
            <Button
              key={choice}
              variant={selection === index ? "secondary" : "outline"}
              aria-pressed={selection === index}
              size="sm"
              onClick={() => setSelection(index)}
            >
              {choice}
            </Button>
          ))}
        </div>
        <p
          className="type-helper mt-2"
          role={selection !== null ? "status" : undefined}
        >
          {copy.feedbackNote}
        </p>
      </fieldset>
    </div>
  );
}
