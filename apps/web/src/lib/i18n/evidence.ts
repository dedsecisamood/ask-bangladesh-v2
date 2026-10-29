import type { Locale } from "./config";

const labels = {
  bn: {
    unknown: "অজানা",
    bn: "বাংলা",
    en: "ইংরেজি",
    banglish: "বাংলিশ (রোমান হরফে বাংলা)",
    mixed: "মিশ্র ভাষা",
    html: "ওয়েব পৃষ্ঠা (HTML)",
    pdf: "PDF নথি",
  },
  en: {
    unknown: "Unknown",
    bn: "Bangla",
    en: "English",
    banglish: "Banglish (Romanized Bangla)",
    mixed: "Mixed languages",
    html: "Web page (HTML)",
    pdf: "PDF document",
  },
} as const;

export function evidenceLanguageLabel(value: unknown, locale: Locale): string {
  return value === "bn" ||
    value === "en" ||
    value === "banglish" ||
    value === "mixed"
    ? labels[locale][value]
    : labels[locale].unknown;
}
export function evidenceLanguageTag(value: unknown): string {
  return value === "bn" || value === "en"
    ? value
    : value === "banglish"
      ? "bn-Latn"
      : "";
}
export function evidenceTypeLabel(value: unknown, locale: Locale): string {
  return value === "html" || value === "pdf"
    ? labels[locale][value]
    : labels[locale].unknown;
}
export function evidenceNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-GB", {
    useGrouping: false,
  }).format(value);
}
/** Preserve original date precision; unknown/malformed dates are never inferred.
 * Operational timestamps are displayed in explicit UTC, independent of host TZ.
 */
export function evidenceDate(
  value: string | null | undefined,
  locale: Locale,
): string {
  if (
    !value ||
    !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2}))?$/u.test(
      value,
    )
  )
    return labels[locale].unknown;
  const date = new Date(value);
  const calendar = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (
    !Number.isFinite(date.valueOf()) ||
    !Number.isFinite(calendar.valueOf()) ||
    calendar.toISOString().slice(0, 10) !== value.slice(0, 10)
  )
    return labels[locale].unknown;
  const timestamp = value.length > 10;
  if (timestamp && Number(value.slice(11, 13)) > 23)
    return labels[locale].unknown;
  try {
    const text = new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
      dateStyle: "medium",
      ...(timestamp ? { timeStyle: "short" as const } : {}),
      timeZone: "UTC",
    }).format(date);
    return timestamp ? `${text} UTC` : text;
  } catch {
    // Keep an already validated original date if locale formatting is unavailable.
    return value;
  }
}
