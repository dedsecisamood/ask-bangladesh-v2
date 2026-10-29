import Link from "next/link";
import { BookOpen, ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { catalog } from "@/lib/catalog";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export function GuideDirectory({ locale }: { locale: Locale }) {
  const copy = getDictionary(locale).pages.guides;
  return (
    <Container className="page-content">
      <h1 className="page-heading">{copy.title}</h1>
      <p className="page-intro">{copy.description}</p>
      <div className="directory-grid">
        {catalog.services.map((service) => (
          <Link
            key={service.slug}
            href={`/${locale}/guides/${service.slug}`}
            prefetch={false}
            className="home-shortcut"
          >
            <BookOpen aria-hidden="true" />
            <h2>{service.name[locale]}</h2>
            <p>
              {locale === "bn"
                ? "নির্দেশিকার প্রস্তুতি দেখুন"
                : "View guide preparation"}
              <ArrowUpRight aria-hidden="true" className="inline size-4" />
            </p>
          </Link>
        ))}
      </div>
    </Container>
  );
}
