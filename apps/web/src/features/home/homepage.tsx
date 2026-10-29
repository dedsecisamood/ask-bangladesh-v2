import Link from "next/link";
import { ArrowRight, BookOpen, ShieldCheck, Compass, Info } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/catalog/service-card";
import { HomeQuestion } from "@/features/questions/home-question";
import { catalog } from "@/lib/catalog";
import type { Locale } from "@/lib/i18n/config";
import { copyFor } from "@/lib/product-copy";

export function Homepage({
  locale,
  published = false,
}: {
  locale: Locale;
  published?: boolean;
}) {
  const copy = copyFor(locale);
  return (
    <>
      <section className="reference-hero">
        <Container>
          <h1 className="reference-heading">{copy.hero}</h1>
          <p className="reference-description">{copy.intro}</p>
          <div className="reference-question">
            <HomeQuestion locale={locale} />
          </div>
          <nav
            className="home-shortcuts"
            aria-label={
              locale === "bn" ? "অন্বেষণ করুন" : "Explore Ask Bangladesh"
            }
          >
            {[
              {
                href: "services",
                icon: Compass,
                title: locale === "bn" ? "সেবা ডিরেক্টরি" : "Service Directory",
                detail:
                  locale === "bn"
                    ? "সেবার বিষয়সমূহ দেখুন"
                    : "Explore public service topics",
              },
              {
                href: "sources",
                icon: ShieldCheck,
                title: locale === "bn" ? "যাচাইকৃত উৎস" : "Verified Sources",
                detail:
                  locale === "bn"
                    ? "উৎস যাচাইয়ের অবস্থা"
                    : "Official-source review status",
              },
              {
                href: "guides",
                icon: BookOpen,
                title: locale === "bn" ? "গাইডসমূহ" : "Step-by-Step Guides",
                detail:
                  locale === "bn"
                    ? "নির্দেশিকার প্রস্তুতি"
                    : "Guidance in preparation",
              },
              {
                href: "about",
                icon: Info,
                title: locale === "bn" ? "আমাদের সম্পর্কে" : "About Us",
                detail:
                  locale === "bn"
                    ? "স্বচ্ছতা ও প্রাইভেসি"
                    : "Trust & privacy commitments",
              },
            ].map(({ href, icon: Icon, title, detail }) => (
              <Link
                key={href}
                href={`/${locale}/${href}`}
                prefetch={false}
                className="home-shortcut"
              >
                <Icon aria-hidden="true" />
                <h2>{title}</h2>
                <p>{detail}</p>
              </Link>
            ))}
          </nav>
          <p className="home-development-note">
            {copy.development}
            <span aria-hidden="true"> · </span>
            {locale === "bn"
              ? "স্বাধীন উদ্যোগ। সরকারি ওয়েবসাইট নয়।"
              : "Independent project. Not an official government website."}
          </p>
        </Container>
      </section>
      <section className="content-section" aria-labelledby="popular-heading">
        <Container>
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">{copy.directory}</p>
              <h2 id="popular-heading" className="section-title">
                {published
                  ? locale === "bn"
                    ? "প্রকাশিত সেবার তালিকা দেখুন"
                    : "Browse the published directory"
                  : copy.popular}
              </h2>
            </div>
            <Link className="text-link" href={`/${locale}/services`}>
              {copy.allServices}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <p className="mb-6 max-w-3xl text-muted-foreground">
            {published
              ? locale === "bn"
                ? "পর্যালোচিত রেকর্ড প্রকাশিত হলে এখানে পাওয়া যাবে। কোনো সেবার পূর্ণ তথ্য থাকার দাবি করা হচ্ছে না।"
                : "Reviewed records appear after publication. Directory availability does not imply complete service coverage."
              : copy.topicNotice}
          </p>
          {published ? (
            <div className="directory-grid">
              {(["services", "categories", "agencies"] as const).map((kind) => (
                <article key={kind} className="service-card">
                  <h3>
                    <Link className="text-link" href={`/${locale}/${kind}`}>
                      {locale === "bn"
                        ? {
                            services: "প্রকাশিত সেবা দেখুন",
                            categories: "প্রকাশিত বিভাগ",
                            agencies: "প্রকাশিত সংস্থা",
                          }[kind]
                        : {
                            services: "Browse published services",
                            categories: "Published categories",
                            agencies: "Published agencies",
                          }[kind]}
                    </Link>
                  </h3>
                </article>
              ))}
            </div>
          ) : (
            <>
              <div className="priority-grid">
                {catalog.services.slice(0, 3).map((service) => (
                  <ServiceCard
                    key={service.slug}
                    service={service}
                    locale={locale}
                    prominent
                  />
                ))}
              </div>
              <div className="topic-grid mt-4">
                {catalog.services.slice(3).map((service) => (
                  <ServiceCard
                    key={service.slug}
                    service={service}
                    locale={locale}
                  />
                ))}
              </div>
            </>
          )}
        </Container>
      </section>
      <section
        className="content-section border-y border-border bg-secondary"
        aria-labelledby="how-heading"
      >
        <Container>
          <h2 id="how-heading" className="section-title">
            {copy.how}
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {copy.howIntro}
          </p>
          <ol className="steps-grid">
            {copy.steps.map((step, index) => (
              <li key={step}>
                <span className="step-number" aria-hidden="true">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-xl font-semibold">{step}</h3>
              </li>
            ))}
          </ol>
          <Link className="text-link mt-8" href={`/${locale}/how-it-works`}>
            {locale === "bn" ? "যেভাবে কাজ করবে" : "How it will work"}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Container>
      </section>
      <section className="content-section">
        <Container>
          <div className="trust-grid">
            <div>
              <ShieldCheck
                aria-hidden="true"
                className="mb-5 size-9 text-primary"
              />
              <h2 className="section-title">{copy.trust}</h2>
              <p className="mt-4 text-muted-foreground">{copy.trustText}</p>
              <Link className="text-link mt-5" href={`/${locale}/trust`}>
                {copy.trustLink}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
            <div className="browse-panel">
              <BookOpen
                aria-hidden="true"
                className="mb-5 size-9 text-primary"
              />
              <h2 className="section-title">{copy.browseTitle}</h2>
              <p className="mt-4 text-muted-foreground">{copy.browseText}</p>
              <Button asChild className="mt-6">
                <Link href={`/${locale}/services`}>{copy.allServices}</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
      <section className="pb-16">
        <Container>
          <div className="final-callout">
            <h2 className="section-title">{copy.finalTitle}</h2>
            <p className="mt-3 text-muted-foreground">{copy.finalText}</p>
            <Button asChild className="mt-5">
              <Link href={`/${locale}/ask`}>
                {copy.send}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
