"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  directoryResponseSchema,
  type DirectoryItem,
} from "@/lib/directory/contracts";
import type { Locale } from "@/lib/i18n/config";
interface Filters {
  query: string;
  category: string;
  agency_id: string;
}
export function PublishedSearch({
  locale,
  initial,
  categories,
  agencies,
  nextCursor = null,
  category = "",
  agency = "",
}: {
  locale: Locale;
  initial: DirectoryItem[];
  categories: DirectoryItem[];
  agencies: DirectoryItem[];
  nextCursor?: string | null;
  category?: string;
  agency?: string;
}) {
  const bn = locale === "bn",
    id = useId();
  const [draft, setDraft] = useState<Filters>({
    query: "",
    category,
    agency_id: agency,
  });
  const [applied, setApplied] = useState(draft),
    [items, setItems] = useState(initial),
    [cursor, setCursor] = useState(nextCursor),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  async function run(filters: Filters, next?: string | null) {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setError(false);
    try {
      const r = await fetch("/api/v1/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        cache: "no-store",
        signal: controller.signal,
        body: JSON.stringify({
          locale,
          query: filters.query,
          ...(filters.category ? { category: filters.category } : {}),
          ...(filters.agency_id ? { agency_id: filters.agency_id } : {}),
          ...(next ? { cursor: next } : {}),
        }),
      });
      if (!r.ok) throw new Error("Unavailable");
      const data = directoryResponseSchema.parse(await r.json());
      if (active.current !== controller) return;
      setItems(data.data);
      setCursor(data.meta.next_cursor);
      setApplied(filters);
    } catch {
      if (!controller.signal.aborted) {
        setError(true);
        setItems([]);
        setCursor(null);
      }
    } finally {
      if (active.current === controller) setBusy(false);
    }
  }
  return (
    <section
      aria-label={bn ? "প্রকাশিত সেবা খুঁজুন" : "Find published services"}
    >
      <form
        className="directory-filters"
        onSubmit={(e) => {
          e.preventDefault();
          void run(draft);
        }}
      >
        <div className="min-w-0 flex-1">
          <label htmlFor={`${id}-q`}>
            {bn ? "সেবার নাম বা পরিচিত শব্দ" : "Service name or familiar term"}
          </label>
          <Input
            id={`${id}-q`}
            className="mt-2"
            value={draft.query}
            maxLength={120}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setDraft({ ...draft, query: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor={`${id}-category`}>{bn ? "বিভাগ" : "Category"}</label>
          <select
            id={`${id}-category`}
            className="native-select mt-2 block w-full"
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          >
            <option value="">{bn ? "সব বিভাগ" : "All categories"}</option>
            {categories.map(
              (c) =>
                "slug" in c && (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ),
            )}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-agency`}>{bn ? "সংস্থা" : "Agency"}</label>
          <select
            id={`${id}-agency`}
            className="native-select mt-2 block w-full"
            value={draft.agency_id}
            onChange={(e) => setDraft({ ...draft, agency_id: e.target.value })}
          >
            <option value="">{bn ? "সব সংস্থা" : "All agencies"}</option>
            {agencies.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={busy}>
          {busy
            ? bn
              ? "খোঁজা হচ্ছে…"
              : "Searching…"
            : bn
              ? "খুঁজুন"
              : "Search"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => {
            const empty = { query: "", category: "", agency_id: "" };
            setDraft(empty);
            void run(empty);
          }}
        >
          {bn ? "মুছুন" : "Reset"}
        </Button>
      </form>
      <p className="type-helper my-3">
        {bn
          ? "ব্যক্তিগত নম্বর লিখবেন না। অনুসন্ধানের লেখা URL-এ রাখা হয় না।"
          : "Do not enter personal identifiers. Search text is kept out of URLs."}
      </p>
      <div role="status" aria-live="polite" className="my-4">
        {busy
          ? bn
            ? "অপেক্ষা করুন…"
            : "Please wait…"
          : error
            ? bn
              ? "তথ্য আনা যায়নি। আবার চেষ্টা করুন।"
              : "Information could not be loaded. Please try again."
            : `${items.length} ${bn ? "সেবা এই পাতায়" : "services on this page"}`}
      </div>
      {!error && !busy && !items.length && (
        <p className="empty-panel">
          {bn
            ? "কোনো প্রকাশিত সেবা পাওয়া যায়নি। যাচাইকৃত সেবার তথ্য এখনো যোগ করা না-ও হতে পারে।"
            : "No published services found. Reviewed service coverage may not yet be available."}
        </p>
      )}
      <div className="directory-grid" aria-busy={busy}>
        {items.map(
          (item) =>
            "slug" in item && (
              <article key={item.id} className="service-card">
                <h2 className="text-xl font-semibold">
                  <Link
                    prefetch={false}
                    href={`/${locale}/services/${item.slug}`}
                  >
                    {item.name}
                  </Link>
                </h2>
                <p className="type-helper mt-3">
                  {bn
                    ? "শুধু পর্যালোচিত পরিচিতিমূলক তথ্য; বিস্তারিত নির্দেশিকা নেই।"
                    : "Reviewed identity metadata only; detailed guidance is unavailable."}
                </p>
              </article>
            ),
        )}
      </div>
      {cursor && (
        <Button
          className="mt-6"
          variant="outline"
          disabled={busy}
          onClick={() => void run(applied, cursor)}
        >
          {bn ? "পরের পাতা" : "Next page"}
        </Button>
      )}
    </section>
  );
}
