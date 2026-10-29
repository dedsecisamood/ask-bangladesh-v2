import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { CategoryIcon, ServiceCard } from "@/components/catalog/service-card";
import { SourceCard } from "@/components/evidence/source-card";
import { ServiceDirectory } from "./service-directory";
import {
  categories,
  catalog,
  type Category,
  type Agency,
  type Service,
  type SourceSummary,
} from "@/lib/catalog";
import type { Locale } from "@/lib/i18n/config";
import { evidenceLanguageTag } from "@/lib/i18n/evidence";
import { copyFor } from "@/lib/product-copy";

export function DirectoryPage({
  locale,
  kind,
}: {
  locale: Locale;
  kind: "services" | "categories" | "agencies" | "sources" | "search";
}) {
  const copy = copyFor(locale);
  const title =
    kind === "services" || kind === "search" ? copy.directory : copy[kind];
  return (
    <Container className="page-content">
      <p className="eyebrow">{copy.development}</p>
      <h1 className="page-heading">{title}</h1>
      <p className="page-intro">{copy.topicNotice}</p>
      {(kind === "services" || kind === "search") && (
        <ServiceDirectory locale={locale} />
      )}
      {kind === "categories" && (
        <div className="directory-grid">
          {categories.map((category) => (
            <article key={category.slug} className="service-card">
              <span className="topic-icon">
                <CategoryIcon kind={category.icon} />
              </span>
              <h2 className="mt-4 text-xl font-semibold">
                <Link
                  href={`/${locale}/categories/${category.slug}`}
                  prefetch={false}
                >
                  {category.name[locale]}
                </Link>
              </h2>
              <p className="type-helper mt-2">
                {
                  catalog.services.filter(
                    (service) => service.category === category.slug,
                  ).length
                }{" "}
                {copy.count}
              </p>
            </article>
          ))}
        </div>
      )}
      {kind === "agencies" && (
        <div className="empty-panel">
          <h2 className="text-xl font-semibold">{copy.agencyEmpty}</h2>
          <Link className="text-link" href={`/${locale}/services`}>
            {copy.allServices}
          </Link>
        </div>
      )}
      {kind === "sources" && (
        <div className="empty-panel">
          <h2 className="text-xl font-semibold">{copy.sourceEmpty}</h2>
          <p>{copy.demoSources}</p>
          <Link className="text-link" href={`/${locale}/source-policy`}>
            {locale === "bn" ? "উৎসের নীতি পড়ুন" : "Read the source policy"}
          </Link>
        </div>
      )}
    </Container>
  );
}
export function CategoryPage({
  locale,
  category,
}: {
  locale: Locale;
  category: Category;
}) {
  const copy = copyFor(locale);
  return (
    <Container className="page-content">
      <Link className="text-link" href={`/${locale}/categories`}>
        {copy.backCategories}
      </Link>
      <h1 className="page-heading mt-5">{category.name[locale]}</h1>
      <p className="page-intro">{copy.topicNotice}</p>
      <ServiceDirectory
        key={category.slug}
        locale={locale}
        categorySlug={category.slug}
      />
      <h2 className="section-title mt-12">{copy.related}</h2>
      <ul className="mt-4 flex flex-wrap gap-4">
        {categories
          .filter((item) => item.slug !== category.slug)
          .slice(0, 3)
          .map((item) => (
            <li key={item.slug}>
              <Link
                className="text-link"
                href={`/${locale}/categories/${item.slug}`}
              >
                {item.name[locale]}
              </Link>
            </li>
          ))}
      </ul>
    </Container>
  );
}
export function ServiceDetail({
  locale,
  service,
  guide = false,
}: {
  locale: Locale;
  service: Service;
  guide?: boolean;
}) {
  const copy = copyFor(locale);
  return (
    <Container className="page-content">
      <Link className="text-link" href={`/${locale}/services`}>
        {copy.backServices}
      </Link>
      <div className="detail-grid mt-6">
        <div>
          <Badge>{copy.preparation}</Badge>
          <h1 className="page-heading mt-4">
            {service.name[locale]}
            {guide ? ` — ${copy.guide}` : ""}
          </h1>
          <p className="page-intro">{copy.topicNotice}</p>
          <Alert>
            <h2 className="font-semibold">{copy.unavailable}</h2>
            <p>{copy.notPublished}</p>
          </Alert>
          <div className="detail-sections">
            {[
              copy.overview,
              copy.eligibility,
              copy.guidance,
              copy.requirements,
              copy.nextSteps,
              copy.fees,
              copy.deadlines,
            ].map((heading) => (
              <section key={heading}>
                <h2 className="text-xl font-semibold">{heading}</h2>
                <p className="mt-2 text-muted-foreground">
                  {copy.notPublished}
                </p>
              </section>
            ))}
          </div>
          <h2 className="section-title mt-8">{copy.related}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {catalog.services
              .filter((item) => item.slug !== service.slug)
              .slice(0, 2)
              .map((item) => (
                <ServiceCard key={item.slug} service={item} locale={locale} />
              ))}
          </div>
        </div>
        <aside className="detail-aside">
          <section>
            <h2 className="font-semibold">{copy.agency}</h2>
            <p className="type-small mt-2">{copy.unknownAgency}</p>
          </section>
          <section>
            <h2 className="font-semibold">{copy.sources}</h2>
            <p className="type-small mt-2">{copy.sourceEmpty}</p>
          </section>
          <nav className="grid gap-3" aria-label={copy.guidance}>
            <Link
              className="text-link"
              href={`/${locale}/categories/${service.category}`}
            >
              {copy.viewCategory}
            </Link>
            <Link className="text-link" href={`/${locale}/sources`}>
              {copy.backSources}
            </Link>
            {!guide && (
              <Link
                className="text-link"
                href={`/${locale}/guides/${service.slug}`}
              >
                {copy.viewGuide}
              </Link>
            )}
            <Link className="text-link" href={`/${locale}/feedback`}>
              {copy.report}
            </Link>
          </nav>
        </aside>
      </div>
    </Container>
  );
}
export function AgencyDetail({
  locale,
  agency,
}: {
  locale: Locale;
  agency: Agency;
}) {
  const copy = copyFor(locale);
  const services = catalog.services.filter(
    (service) => service.agencyId === agency.slug,
  );
  return (
    <Container className="page-content">
      <h1 className="page-heading">{agency.name[locale]}</h1>
      <p className="page-intro">
        {agency.description?.[locale] ?? copy.unknownAgency}
      </p>
      <p>
        {copy.sourceStatus}: {copy.verificationStatuses[agency.status]}
      </p>
      <h2 className="section-title mt-8">{copy.related}</h2>
      {services.length ? (
        services.map((service) => (
          <ServiceCard key={service.slug} service={service} locale={locale} />
        ))
      ) : (
        <p>{copy.noResults}</p>
      )}
    </Container>
  );
}
export function SourceDetail({
  locale,
  source,
}: {
  locale: Locale;
  source: SourceSummary;
}) {
  const copy = copyFor(locale);
  return (
    <Container className="page-content">
      <Link className="text-link" href={`/${locale}/sources`}>
        {copy.backSources}
      </Link>
      <h1
        className="page-heading my-6"
        lang={evidenceLanguageTag(source.language)}
      >
        {source.title}
      </h1>
      <SourceCard source={source} locale={locale} />
      <h2 className="section-title mt-8">{copy.related}</h2>
      {source.serviceSlug &&
      catalog.services.some(
        (service) => service.slug === source.serviceSlug,
      ) ? (
        <Link
          className="text-link"
          href={`/${locale}/guides/${source.serviceSlug}`}
        >
          {copy.viewGuide}
        </Link>
      ) : (
        <p className="mt-3">{copy.notPublished}</p>
      )}
    </Container>
  );
}
