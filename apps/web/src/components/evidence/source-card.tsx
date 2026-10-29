import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { safeSourceHref, type SourceSummary } from "@/lib/catalog";
import type { Locale } from "@/lib/i18n/config";
import { copyFor } from "@/lib/product-copy";
import {
  evidenceDate,
  evidenceLanguageLabel,
  evidenceLanguageTag,
  evidenceNumber,
  evidenceTypeLabel,
} from "@/lib/i18n/evidence";

export function SourceCard({
  source,
  locale,
}: {
  source: SourceSummary;
  locale: Locale;
}) {
  const copy = copyFor(locale);
  const href = safeSourceHref(source);
  const fields = [
    [copy.agency, source.agency],
    [copy.published, evidenceDate(source.publishedAt, locale)],
    [copy.effective, evidenceDate(source.effectiveAt, locale)],
    [copy.checked, evidenceDate(source.checkedAt, locale)],
    [copy.version, source.version],
    [
      copy.page,
      source.documentType === "pdf" &&
      source.page &&
      Number.isInteger(source.page) &&
      source.page > 0
        ? evidenceNumber(source.page, locale)
        : undefined,
    ],
    [
      locale === "bn" ? "ভাষা" : "Language",
      evidenceLanguageLabel(source.language, locale),
    ],
    [
      locale === "bn" ? "নথির ধরন" : "Document type",
      evidenceTypeLabel(source.documentType, locale),
    ],
    [copy.filter, source.category],
  ];
  return (
    <article className="rounded-xl border border-border bg-card p-5">
      <Badge>
        {source.kind === "synthetic"
          ? copy.synthetic
          : `${copy.sourceStatus}: ${locale === "bn" ? "ব্যাকএন্ড পর্যালোচনার তথ্য" : "backend review metadata"}`}
      </Badge>
      <h3
        className="mt-3 text-lg font-semibold"
        lang={evidenceLanguageTag(source.language)}
      >
        {source.title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {copy.sourceStatus}:{" "}
        {source.ownership === "verified"
          ? locale === "bn"
            ? "মালিকানা যাচাইকৃত; বর্তমান প্রমাণের যোগ্যতা আলাদা"
            : "Ownership verified; current evidence eligibility is separate"
          : locale === "bn"
            ? "বর্তমান যাচাইকৃত প্রমাণ নেই"
            : "No current verified evidence"}
      </p>
      <dl className="metadata-grid mt-4">
        {fields
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
      </dl>
      {source.passage && (
        <blockquote className="mt-4 border-l-2 border-primary pl-4">
          <p className="type-label">{copy.passage}</p>
          <p
            className="whitespace-pre-wrap"
            lang={evidenceLanguageTag(source.language)}
            dir="auto"
          >
            {source.passage}
          </p>
        </blockquote>
      )}
      {href ? (
        <a
          className="text-link mt-4 break-all"
          href={href}
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
        >
          {copy.original}
        </a>
      ) : (
        <Alert className="mt-4">{copy.missingSource}</Alert>
      )}
    </article>
  );
}
