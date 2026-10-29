"use client";
import { useState } from "react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { SourceCard } from "@/components/evidence/source-card";
import { useConversation } from "@/features/questions/conversation-provider";
import { QuestionComposer } from "@/features/questions/question-composer";
import { StructuredAnswer } from "./structured-answer";
import type { Locale } from "@/lib/i18n/config";
import { copyFor } from "@/lib/product-copy";

export function ChatPage({ locale }: { locale: Locale }) {
  const copy = copyFor(locale);
  const [composerKey, setComposerKey] = useState(0);
  const { turns, status, send, clear, stop, retry, mode } = useConversation();
  const notice =
    status === "loading"
      ? copy.loading
      : status === "ready"
        ? copy.ready
        : status === "cleared"
          ? copy.cleared
          : status === "cancelled"
            ? copy.cancelled
            : status === "failed"
              ? copy.failed
              : "";
  return (
    <Container className="chat-page">
      <div className="section-heading-row">
        <div>
          <Badge>
            {mode === "demo"
              ? copy.demo
              : locale === "bn"
                ? "স্বাধীন তথ্য সহায়তা"
                : "Independent information assistance"}
          </Badge>
          <h1 className="page-heading mt-3">{copy.chatTitle}</h1>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            clear();
            setComposerKey((key) => key + 1);
          }}
        >
          {copy.clear}
        </Button>
      </div>
      <Alert>
        {mode === "demo"
          ? copy.demoAnswer
          : locale === "bn"
            ? "যাচাইকৃত প্রমাণের অভাবে উত্তর নাও পাওয়া যেতে পারে। ব্যক্তিগত পরিচয় নম্বর দেবেন না।"
            : "Answers may be unavailable without verified evidence. Do not enter personal identity numbers."}
      </Alert>
      <p className="type-helper mt-3">{copy.session}</p>
      <section
        aria-label={locale === "bn" ? "কথোপকথন" : "Conversation"}
        className="conversation-area"
      >
        {!turns.length && (
          <div className="chat-empty">
            <h2 className="section-title">{copy.emptyChat}</h2>
            <p className="mt-3 text-muted-foreground">{copy.demoSources}</p>
          </div>
        )}
        {turns.map((turn) => (
          <article key={turn.id} className="chat-turn">
            <div className="user-message">
              <h2 className="type-label">{copy.user}</h2>
              <p className="mt-2 whitespace-pre-wrap" dir="auto">
                {turn.question}
              </p>
            </div>
            {turn.answer && (
              <div className="assistant-message">
                <h2 className="type-label mb-3">{copy.assistant}</h2>
                <StructuredAnswer answer={turn.answer} locale={locale} />
              </div>
            )}
          </article>
        ))}
      </section>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="min-h-8 text-sm text-muted-foreground"
      >
        {notice}
      </div>
      {status === "loading" && (
        <Button variant="outline" className="mb-4" onClick={stop}>
          {copy.stop}
        </Button>
      )}
      {(status === "cancelled" || status === "failed") && (
        <Button variant="outline" className="mb-4" onClick={retry}>
          {copy.retry}
        </Button>
      )}
      <div className="composer-panel">
        <QuestionComposer
          key={composerKey}
          locale={locale}
          chat
          service={mode === "api"}
          busy={status === "loading"}
          onSend={(question, language) => send(question, locale, language)}
        />
      </div>
      <details className="mt-8">
        <summary className="min-h-11 cursor-pointer py-2 text-sm text-primary">
          {copy.previewSource}
        </summary>
        <SourceCard
          locale={locale}
          source={{
            id: "synthetic-card",
            title:
              locale === "bn"
                ? "শুধু কার্ডের কাঠামোর নমুনা"
                : "Evidence layout example only",
            kind: "synthetic",
            ownership: "unavailable",
            evidenceEligible: false,
          }}
        />
      </details>
    </Container>
  );
}
