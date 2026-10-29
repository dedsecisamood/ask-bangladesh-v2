import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { FeedbackForm } from "./feedback-form";
import { StructuredFeedback } from "./structured-feedback";
import { ProjectStatus } from "./project-status";
import { information, type InformationKey } from "@/lib/information";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { copyFor } from "@/lib/product-copy";

export function InformationPage({
  locale,
  page,
  feedbackMode = "demo",
}: {
  locale: Locale;
  page: InformationKey | "feedback";
  feedbackMode?: "demo" | "api";
}) {
  const copy = copyFor(locale);
  const dictionary = getDictionary(locale);
  const title = page === "status" ? copy.status : dictionary.pages[page].title;
  return (
    <Container
      className={page === "about" ? "page-content about-page" : "page-content"}
    >
      {page === "about" && <ProjectStatus locale={locale} />}
      <div className="reading-page">
        <p className="eyebrow">{copy.development}</p>
        {page === "about" ? (
          <h2 className="page-heading">{title}</h2>
        ) : (
          <h1 className="page-heading">{title}</h1>
        )}
        {(page === "privacy" || page === "terms") && (
          <Badge className="mt-5">{copy.draft}</Badge>
        )}
        {page === "feedback" ? (
          <div className="mt-8">
            {feedbackMode === "api" ? (
              <StructuredFeedback locale={locale} />
            ) : (
              <FeedbackForm locale={locale} />
            )}
          </div>
        ) : (
          <div className="information-sections">
            {information[page].map((section) => (
              <section key={section.heading.en}>
                <h2 className="text-xl font-semibold">
                  {section.heading[locale]}
                </h2>
                <p className="mt-3 text-muted-foreground">
                  {section.text[locale]}
                </p>
              </section>
            ))}
          </div>
        )}
        {page === "status" && (
          <dl className="status-list">
            {(locale === "bn"
              ? ["ওয়েবসাইট", "এআই উত্তর", "সরকারি উৎসের হালনাগাদ", "মতামত জমা"]
              : [
                  "Website frontend",
                  "AI answer service",
                  "Government-source updates",
                  "Feedback service",
                ]
            ).map((label, index) => (
              <div key={label}>
                <dt className="font-semibold">{label}</dt>
                <dd>{index === 0 ? copy.implemented : copy.notConnected}</dd>
              </div>
            ))}
          </dl>
        )}
        <nav
          className="mt-10 flex flex-wrap gap-5"
          aria-label={
            locale === "bn" ? "সম্পর্কিত তথ্য" : "Related information"
          }
        >
          <Link className="text-link" href={`/${locale}/sources`}>
            {copy.sources}
          </Link>
          <Link className="text-link" href={`/${locale}/feedback`}>
            {copy.report}
          </Link>
          <Link className="text-link" href={`/${locale}/status`}>
            {copy.status}
          </Link>
        </nav>
      </div>
    </Container>
  );
}
