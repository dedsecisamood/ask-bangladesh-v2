"use client";
import { useRouter } from "next/navigation";
import { QuestionComposer } from "./question-composer";
import { useConversation } from "./conversation-provider";
import type { Locale } from "@/lib/i18n/config";

export function HomeQuestion({ locale }: { locale: Locale }) {
  const router = useRouter();
  const conversation = useConversation();
  return (
    <QuestionComposer
      locale={locale}
      compact
      service={conversation.mode === "api"}
      busy={conversation.status === "loading"}
      onSend={(question, language) => {
        if (!conversation.send(question, locale, language)) return false;
        router.push(`/${locale}/ask`);
        return true;
      }}
    />
  );
}
