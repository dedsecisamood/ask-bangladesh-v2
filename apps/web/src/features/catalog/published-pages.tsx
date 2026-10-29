import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import {
  readDirectory,
  readDirectoryDetail,
  readServiceRelations,
} from "@/lib/directory/repository";
import {
  directoryKind,
  slugSchema,
  type DirectoryItem,
  type DirectoryKind,
} from "@/lib/directory/contracts";
import {
  cursorBinding,
  decodeCursor,
  encodeCursor,
} from "@/lib/directory/cursor";
import { z } from "zod";
import type { Locale } from "@/lib/i18n/config";
import { PublishedSearch } from "./published-search";
import { normalizeRegistryUrl } from "@/lib/registry/url";
const words = {
  bn: {
    services: "সরকারি সেবা",
    categories: "সেবার বিভাগ",
    agencies: "সরকারি সংস্থা",
    sources: "সরকারি উৎস",
  },
  en: {
    services: "Government services",
    categories: "Service categories",
    agencies: "Government agencies",
    sources: "Official sources",
  },
};
function Empty({ locale, error = false }: { locale: Locale; error?: boolean }) {
  return (
    <div className="empty-panel" role={error ? "alert" : undefined}>
      <h2 className="text-xl font-semibold">
        {locale === "bn"
          ? error
            ? "তথ্য সাময়িকভাবে আনা যাচ্ছে না।"
            : "এখনো কোনো পর্যালোচিত রেকর্ড প্রকাশিত হয়নি।"
          : error
            ? "Directory information is temporarily unavailable."
            : "No reviewed records have been published yet."}
      </h2>
      <p>
        {locale === "bn"
          ? "অনুমান করা তথ্য বা অযাচাইকৃত বিকল্প লিংক দেখানো হচ্ছে না।"
          : "Only reviewed information can appear here. No unverified alternative links are supplied."}
      </p>
      <Link className="text-link" href={`/${locale}/services`}>
        {locale === "bn" ? "সেবার তালিকা" : "Service directory"}
      </Link>
    </div>
  );
}
function Intro({ locale }: { locale: Locale }) {
  return (
    <p className="page-intro">
      {locale === "bn"
        ? "পর্যালোচিত পরিচিতিমূলক তথ্য। এটি সরকারি ওয়েবসাইট নয়। ফি, সময়সীমা বা আবেদনপদ্ধতির নির্দেশিকা এখনো প্রকাশিত নয়।"
        : "Reviewed identity metadata from an independent project. Fees, deadlines and application instructions are not published here."}
    </p>
  );
}
export function OfficialLink({
  item,
  locale,
}: {
  item: DirectoryItem;
  locale: Locale;
}) {
  if (!("url" in item)) return null;
  try {
    if (normalizeRegistryUrl(item.url) !== item.url) return null;
  } catch {
    return null;
  }
  return (
    <div className="mt-4">
      <a
        className="text-link"
        href={item.url}
        target="_blank"
        rel="noopener noreferrer external"
        referrerPolicy="no-referrer"
      >
        {locale === "bn"
          ? "পর্যালোচিত সরকারি উৎসে যান"
          : "Visit reviewed official source"}{" "}
        — {item.name} ({locale === "bn" ? "নতুন ট্যাব" : "new tab"})
      </a>
      <p className="type-helper mt-2">
        {locale === "bn" ? "মালিকানা যাচাইয়ের সময়" : "Ownership checked at"}:{" "}
        <time dateTime={item.ownership_verified_at}>
          {item.ownership_verified_at}
        </time>
      </p>
      <p className="type-helper">
        {locale === "bn"
          ? "মালিকানা যাচাই প্রতিটি তথ্যের অনুমোদন বা সংগ্রহের অনুমতি নয়।"
          : "Ownership review does not approve every claim or grant crawling permission."}
      </p>
    </div>
  );
}
function Cards({
  items,
  kind,
  locale,
}: {
  items: DirectoryItem[];
  kind: DirectoryKind;
  locale: Locale;
}) {
  return (
    <div className="directory-grid">
      {items.map((item) => (
        <article className="service-card" key={item.id}>
          <h2 className="text-xl font-semibold">
            <Link
              prefetch={false}
              href={`/${locale}/${kind}/${"slug" in item ? item.slug : item.id}`}
            >
              {item.name}
            </Link>
          </h2>
          {kind === "categories" && (
            <p className="type-helper mt-3">
              {locale === "bn"
                ? "বিভাগ থাকা মানেই সেবার পূর্ণ তথ্য থাকা নয়।"
                : "A category does not imply complete service coverage."}
            </p>
          )}
          {kind === "sources" && <OfficialLink item={item} locale={locale} />}
        </article>
      ))}
    </div>
  );
}
type ListingQuery = Record<string, string | string[] | undefined>;
async function loadListing(
  locale: Locale,
  actual: DirectoryKind,
  query: ListingQuery,
) {
  try {
    if (
      Object.keys(query).some(
        (k) =>
          !["category", "agency_id", "cursor"].includes(k) ||
          Array.isArray(query[k]),
      )
    )
      return null;
    const filters = {
      locale,
      limit: 20,
      ...(query.category ? { category: slugSchema.parse(query.category) } : {}),
      ...(query.agency_id
        ? { agency_id: z.uuid().parse(query.agency_id) }
        : {}),
    };
    if (actual !== "services" && (filters.category || filters.agency_id))
      return null;
    const binding = cursorBinding({ kind: actual, ...filters });
    const after = decodeCursor(
      typeof query.cursor === "string" ? query.cursor : undefined,
      binding,
    );
    const result = await readDirectory(actual, filters, after?.after);
    if (after && after.generation !== result.generation) return null;
    const options =
      actual === "services"
        ? await Promise.all([
            readDirectory("categories", { locale, limit: 50 }),
            readDirectory("agencies", { locale, limit: 50 }),
          ])
        : null;
    const searchBinding = cursorBinding({
      kind: "services",
      locale,
      query: "",
      limit: 20,
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.agency_id ? { agency_id: filters.agency_id } : {}),
    });
    return {
      result,
      categories: options?.[0].items ?? [],
      agencies: options?.[1].items ?? [],
      filters,
      nextCursor: result.after_id
        ? encodeCursor(
            result.after_id,
            result.generation,
            actual === "services" ? searchBinding : binding,
          )
        : null,
    };
  } catch {
    return null;
  }
}
export async function PublishedDirectoryPage({
  locale,
  kind,
  query = {},
  embedded = false,
}: {
  locale: Locale;
  kind: DirectoryKind | "search";
  query?: ListingQuery;
  embedded?: boolean;
}) {
  const actual = kind === "search" ? "services" : kind,
    Heading = embedded ? "h2" : "h1";
  const loaded = await loadListing(locale, actual, query);
  return (
    <Container className="page-content">
      <Heading className="page-heading">{words[locale][actual]}</Heading>
      <Intro locale={locale} />
      {!loaded ? (
        <Empty locale={locale} error />
      ) : actual === "services" ? (
        <PublishedSearch
          key={
            locale +
            ":" +
            loaded.filters.category +
            ":" +
            loaded.filters.agency_id
          }
          locale={locale}
          initial={loaded.result.items}
          categories={loaded.categories}
          agencies={loaded.agencies}
          category={loaded.filters.category}
          agency={loaded.filters.agency_id}
          nextCursor={loaded.nextCursor}
        />
      ) : (
        <>
          {loaded.result.items.length ? (
            <Cards items={loaded.result.items} kind={actual} locale={locale} />
          ) : (
            <Empty locale={locale} />
          )}
          {loaded.nextCursor && (
            <Link
              className="text-link mt-6 inline-block"
              href={`/${locale}/${actual}?cursor=${loaded.nextCursor}`}
            >
              {locale === "bn" ? "পরের পাতা" : "Next page"}
            </Link>
          )}
        </>
      )}
    </Container>
  );
}
async function loadRelated(locale: Locale, id: string) {
  try {
    return await readServiceRelations(id, locale);
  } catch {
    return null;
  }
}
async function RelatedMetadata({
  locale,
  item,
}: {
  locale: Locale;
  item: DirectoryItem;
}) {
  const loaded = await loadRelated(locale, item.id);
  if (!loaded) return <Empty locale={locale} error />;
  if (!("category_ids" in item)) return null;
  const { categories, agencies, sources } = loaded;
  return (
    <>
      <h2 className="section-title mt-8">{words[locale].categories}</h2>
      <ul>
        {categories
          .filter((c) => item.category_ids.includes(c.id))
          .map(
            (c) =>
              "slug" in c && (
                <li key={c.id}>
                  <Link
                    className="text-link"
                    href={`/${locale}/categories/${c.slug}`}
                  >
                    {c.name}
                  </Link>
                </li>
              ),
          )}
      </ul>
      <h2 className="section-title mt-8">{words[locale].agencies}</h2>
      <ul>
        {agencies
          .filter((a) => item.agency_ids.includes(a.id))
          .map(
            (a) =>
              "slug" in a && (
                <li key={a.id}>
                  <Link
                    className="text-link"
                    href={`/${locale}/agencies/${a.slug}`}
                  >
                    {a.name}
                  </Link>
                </li>
              ),
          )}
      </ul>
      <h2 className="section-title mt-8">{words[locale].sources}</h2>
      {sources.length ? (
        sources.map((s) => (
          <article key={s.id}>
            <Link className="text-link" href={`/${locale}/sources/${s.id}`}>
              {s.name}
            </Link>
            <OfficialLink item={s} locale={locale} />
          </article>
        ))
      ) : (
        <p>
          {locale === "bn"
            ? "প্রকাশের যোগ্য সরকারি উৎসের লিংক এখনো নেই।"
            : "No official source links currently meet publication requirements."}
        </p>
      )}
    </>
  );
}
export async function PublishedDetail({
  locale,
  section,
  slug,
}: {
  locale: Locale;
  section: string;
  slug: string;
}) {
  const kind = directoryKind.safeParse(section);
  if (!kind.success) notFound();
  if (
    !(kind.data === "sources" ? z.uuid() : slugSchema).safeParse(slug).success
  )
    notFound();
  const loaded = await readDirectoryDetail(kind.data, locale, slug).catch(
    () => null,
  );
  if (!loaded)
    return (
      <Container className="page-content">
        <h1 className="page-heading">{words[locale][kind.data]}</h1>
        <Empty locale={locale} error />
      </Container>
    );
  const item = loaded.items[0];
  if (!item) notFound();
  return (
    <Container className="page-content">
      <Link className="text-link" href={`/${locale}/${kind.data}`}>
        {words[locale][kind.data]}
      </Link>
      <h1 className="page-heading mt-5">{item.name}</h1>
      <Intro locale={locale} />
      <OfficialLink item={item} locale={locale} />
      {kind.data === "categories" && (
        <PublishedDirectoryPage
          locale={locale}
          kind="services"
          query={{ category: slug }}
          embedded
        />
      )}
      {kind.data === "agencies" && (
        <PublishedDirectoryPage
          locale={locale}
          kind="services"
          query={{ agency_id: item.id }}
          embedded
        />
      )}
      {kind.data === "services" && (
        <RelatedMetadata locale={locale} item={item} />
      )}
    </Container>
  );
}
