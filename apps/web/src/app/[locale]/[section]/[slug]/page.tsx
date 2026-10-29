import { notFound } from "next/navigation";
import {
  CategoryPage,
  ServiceDetail,
  AgencyDetail,
  SourceDetail,
} from "@/features/catalog/catalog-pages";
import { catalog, categories, findService, findCategory } from "@/lib/catalog";
import { isLocale } from "@/lib/i18n/config";
import { copyFor } from "@/lib/product-copy";
import { publishedDirectoryEnabled } from "@/lib/directory/mode";
import { PublishedDetail } from "@/features/catalog/published-pages";
import { directoryKind, slugSchema } from "@/lib/directory/contracts";
import { readDirectoryDetail } from "@/lib/directory/repository";
import { z } from "zod";

export const dynamicParams = true;
export const dynamic = "force-dynamic";
export function generateStaticParams() {
  return [
    ...catalog.services.flatMap(({ slug }) => [
      { section: "services", slug },
      { section: "guides", slug },
    ]),
    ...categories.map(({ slug }) => ({ section: "categories", slug })),
    ...catalog.agencies.map(({ slug }) => ({ section: "agencies", slug })),
    ...catalog.sources.map(({ id }) => ({ section: "sources", slug: id })),
  ];
}
type Props = {
  params: Promise<{ locale: string; section: string; slug: string }>;
};
export async function generateMetadata({ params }: Props) {
  const { locale, section, slug } = await params;
  if (!isLocale(locale)) notFound();
  if (
    publishedDirectoryEnabled() &&
    ["services", "categories", "agencies", "sources"].includes(section)
  ) {
    const kind = directoryKind.parse(section);
    if (!(kind === "sources" ? z.uuid() : slugSchema).safeParse(slug).success)
      notFound();
    const data = await readDirectoryDetail(kind, locale, slug).catch(
      () => null,
    );
    if (data && !data.items.length) notFound();
    return {
      title: data?.items[0]?.name ?? getDirectoryTitle(locale),
      description: copyFor(locale).unavailable,
    };
  }
  const title =
    section === "services" || section === "guides"
      ? findService(slug)?.name[locale]
      : section === "categories"
        ? findCategory(slug)?.name[locale]
        : section === "agencies"
          ? catalog.agencies.find((item) => item.slug === slug)?.name[locale]
          : section === "sources"
            ? catalog.sources.find((item) => item.id === slug)?.title
            : undefined;
  if (!title) notFound();
  return { title, description: copyFor(locale).unavailable };
}
export default async function DetailPage({ params }: Props) {
  const { locale, section, slug } = await params;
  if (!isLocale(locale)) notFound();
  if (
    publishedDirectoryEnabled() &&
    ["services", "categories", "agencies", "sources"].includes(section)
  )
    return <PublishedDetail locale={locale} section={section} slug={slug} />;
  if (section === "services" || section === "guides") {
    const service = findService(slug);
    if (service)
      return (
        <ServiceDetail
          locale={locale}
          service={service}
          guide={section === "guides"}
        />
      );
  }
  if (section === "categories") {
    const category = findCategory(slug);
    if (category) return <CategoryPage locale={locale} category={category} />;
  }
  if (section === "agencies") {
    const agency = catalog.agencies.find((item) => item.slug === slug);
    if (agency) return <AgencyDetail locale={locale} agency={agency} />;
  }
  if (section === "sources") {
    const source = catalog.sources.find((item) => item.id === slug);
    if (source) return <SourceDetail locale={locale} source={source} />;
  }
  notFound();
}
function getDirectoryTitle(locale: string) {
  return locale === "bn"
    ? "পর্যালোচিত সেবার তথ্য"
    : "Reviewed service directory";
}
