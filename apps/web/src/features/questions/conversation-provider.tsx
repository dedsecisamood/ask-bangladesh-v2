"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Locale } from "@/lib/i18n/config";
import {
  localDemoAdapter,
  questionError,
  retainTurns,
  type AnswerLanguage,
  type ChatTurn,
  type DemoAdapter,
} from "@/lib/chat";
import { createApiAdapter } from "@/lib/answers/client";

type ChatStatus =
  "idle" | "loading" | "ready" | "cancelled" | "failed" | "cleared";
interface Conversation {
  mode: "demo" | "api";
  turns: readonly ChatTurn[];
  status: ChatStatus;
  send: (
    question: string,
    locale: Locale,
    language?: AnswerLanguage,
  ) => boolean;
  clear: () => void;
  stop: () => void;
  retry: () => void;
}
const Context = createContext<Conversation | null>(null);
export function ConversationProvider({
  children,
  adapter,
  mode = "demo",
}: {
  children: ReactNode;
  adapter?: DemoAdapter;
  mode?: "demo" | "api";
}) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const active = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const api = useRef<DemoAdapter | null>(null);
  const last = useRef<{
    id: string;
    locale: Locale;
    answerLanguage: AnswerLanguage;
    question: string;
    history: { role: "user"; content: string }[];
  } | null>(null);
  useEffect(
    () => () => {
      active.current?.abort();
      if (idle.current) clearTimeout(idle.current);
    },
    [],
  );
  function run(request: NonNullable<typeof last.current>) {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    busy.current = true;
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(clear, 30 * 60 * 1000);
    setStatus("loading");
    void Promise.resolve()
      .then(() => {
        api.current ??= createApiAdapter();
        return (adapter ?? (mode === "api" ? api.current : localDemoAdapter))({
          ...(mode === "api"
            ? request
            : {
                id: request.id,
                locale: request.locale,
                answerLanguage: request.answerLanguage,
              }),
          signal: controller.signal,
        });
      })
      .then((answer) => {
        if (controller.signal.aborted) return;
        setTurns((previous) =>
          retainTurns(
            previous.map((turn) =>
              turn.id === request.id ? { ...turn, answer } : turn,
            ),
          ),
        );
        setStatus("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("failed");
      })
      .finally(() => {
        if (active.current === controller) busy.current = false;
      });
  }
  function send(
    question: string,
    locale: Locale,
    answerLanguage: AnswerLanguage = "auto",
  ) {
    if (questionError(question) || busy.current) return false;
    const id = crypto.randomUUID();
    setTurns((previous) =>
      retainTurns([...previous, { id, question: question.trim() }]),
    );
    const request = {
      id,
      locale,
      answerLanguage,
      question,
      history: turns
        .slice(-6)
        .map((t) => ({ role: "user" as const, content: t.question })),
    };
    last.current = request;
    run(request);
    return true;
  }
  function clear() {
    active.current?.abort();
    active.current = null;
    last.current = null;
    busy.current = false;
    if (idle.current) clearTimeout(idle.current);
    setTurns([]);
    setStatus("cleared");
  }
  function stop() {
    active.current?.abort();
    busy.current = false;
    setStatus("cancelled");
  }
  function retry() {
    if (last.current && !busy.current) run(last.current);
  }
  return (
    <Context.Provider value={{ turns, status, send, clear, stop, retry, mode }}>
      {children}
    </Context.Provider>
  );
}
export function useConversation(): Conversation {
  const value = useContext(Context);
  if (!value) throw new Error("Conversation UI requires its memory provider");
  return value;
}
