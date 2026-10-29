"use client";
import { useEffect, useId, useRef, useState } from "react";
import {
  feedbackSchema,
  feedbackReceiptSchema,
} from "@/lib/feedback/contracts";
import type { Locale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";

export function StructuredFeedback({
  locale,
  fetcher = fetch,
}: {
  locale: Locale;
  fetcher?: typeof fetch;
}) {
  const bn = locale === "bn",
    id = useId();
  const [category, setCategory] = useState("");
  const [page, setPage] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<
    "idle" | "invalid" | "pending" | "sent" | "failed"
  >("idle");
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  const reset = () => {
    active.current?.abort();
    active.current = null;
    setCategory("");
    setPage("");
    setConsent(false);
    setState("idle");
  };
  return (
    <form
      noValidate
      autoComplete="off"
      className="feedback-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (active.current) return;
        const input = feedbackSchema.safeParse({
          category,
          locale,
          ...(page ? { page } : {}),
          consent,
        });
        if (!input.success) {
          setState("invalid");
          return;
        }
        const controller = new AbortController();
        active.current = controller;
        setState("pending");
        const timer = setTimeout(() => controller.abort(), 8000);
        try {
          const r = await fetcher("/api/v1/feedback", {
            method: "POST",
            credentials: "omit",
            cache: "no-store",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input.data),
            signal: controller.signal,
          });
          if (r.status !== 202) throw Error();
          const reader = r.body?.getReader();
          if (!reader) throw Error();
          let text = "",
            bytes = 0;
          const decoder = new TextDecoder("utf-8", { fatal: true });
          try {
            for (;;) {
              const c = await reader.read();
              if (c.done) break;
              bytes += c.value.byteLength;
              if (bytes > 4096) throw Error();
              text += decoder.decode(c.value, { stream: true });
            }
            text += decoder.decode();
          } finally {
            void reader.cancel().catch(() => undefined);
          }
          feedbackReceiptSchema.parse(JSON.parse(text));
          if (active.current === controller && !controller.signal.aborted)
            setState("sent");
        } catch {
          if (active.current === controller) setState("failed");
        } finally {
          clearTimeout(timer);
          if (active.current === controller) active.current = null;
        }
      }}
    >
      <p>
        {bn
          ? "শুধু নির্বাচিত ধরন ও সংশ্লিষ্ট পৃষ্ঠার নাম পাঠানো হবে। ব্যক্তিগত তথ্য, প্রশ্ন বা যোগাযোগের ঠিকানা দেবেন না।"
          : "Only the selected category and related page are sent. Do not include personal information, questions or contact details."}
      </p>
      <label htmlFor={`${id}-category`}>
        {bn ? "মতামতের ধরন" : "Feedback category"}
      </label>
      <select
        id={`${id}-category`}
        className="native-select"
        value={category}
        disabled={state === "pending"}
        onChange={(e) => {
          setCategory(e.target.value);
          setState("idle");
        }}
      >
        <option value="">{bn ? "ধরন বেছে নিন" : "Choose a category"}</option>
        {feedbackSchema.shape.category.options.map((value, index) => (
          <option key={value} value={value}>
            {
              (bn
                ? [
                    "ভুল তথ্য",
                    "পুরোনো তথ্য",
                    "উৎস নেই",
                    "প্রবেশগম্যতা",
                    "অন্যান্য",
                  ]
                : [
                    "Incorrect",
                    "Outdated",
                    "Missing source",
                    "Accessibility",
                    "Other",
                  ])[index]
            }
          </option>
        ))}
      </select>
      <label htmlFor={`${id}-page`}>
        {bn ? "সংশ্লিষ্ট পৃষ্ঠা" : "Related page"}
      </label>
      <select
        id={`${id}-page`}
        className="native-select"
        value={page}
        disabled={state === "pending"}
        onChange={(e) => setPage(e.target.value)}
      >
        <option value="">—</option>
        {["ask", "services", "sources", "accessibility"].map((p) => (
          <option key={p} value={p}>
            /{locale}/{p}
          </option>
        ))}
      </select>
      <label>
        <input
          type="checkbox"
          checked={consent}
          disabled={state === "pending"}
          onChange={(e) => setConsent(e.target.checked)}
        />
        {bn
          ? "শুধু নির্বাচিত তথ্য পাঠাতে সম্মত।"
          : "I agree to send only the selected information."}
      </label>
      {state === "invalid" && (
        <p role="alert">
          {bn
            ? "ধরন ও সম্মতি নির্বাচন করুন।"
            : "Select a category and consent."}
        </p>
      )}
      {state === "failed" && (
        <p role="alert">
          {bn
            ? "মতামত গ্রহণ করা যায়নি। পরে চেষ্টা করুন।"
            : "Feedback could not be accepted. Please try later."}
        </p>
      )}
      {state === "sent" && (
        <p role="status">
          {bn
            ? "পর্যালোচনার জন্য মতামত জমা হয়েছে।"
            : "Your report was saved for review."}
        </p>
      )}
      <Button type="submit" disabled={state === "pending"}>
        {state === "pending"
          ? bn
            ? "পাঠানো হচ্ছে…"
            : "Sending…"
          : bn
            ? "মতামত পাঠান"
            : "Send feedback"}
      </Button>
      <Button type="button" variant="outline" onClick={reset}>
        {bn ? "পরিষ্কার করুন" : "Clear"}
      </Button>
    </form>
  );
}
