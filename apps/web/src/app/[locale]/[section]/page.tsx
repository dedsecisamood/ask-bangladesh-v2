import { notFound } from "next/navigation";
import { ChatPage } from "@/features/chat/chat-page";
import { DirectoryPage } from "@/features/catalog/catalog-pages";
import { InformationPage } from "@/features/information/information-page";
import { GuideDirectory } from "@/features/catalog/guide-directory";
import { isLocale, pageForSection, publicPages } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { publishedDirectoryEnabled } from "@/lib/directory/mode";
import { PublishedDirectoryPage } from "@/features/catalog/published-pages";
import { serverEnvironment } from "@/lib/env/server";

export const dynamicParams = false;
export const dynamic = "force-dynamic";
export function generateStaticParams() {
  return Object.values(publicPages).map(({ path }) => ({ section: path }));
}
type RouteProps = {
  params: Promise<{ locale: string; section: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
export async function generateMetadata({ params }: RouteProps) {
  const { locale, section } = await params;
  const page = pageForSection(section);
  if (!isLocale(locale) || !page) notFound();
  const copy = getDictionary(locale).pages[page];
  return { title: copy.title, description: copy.description };
}
export default async function SectionPage({
  params,
  searchParams,
}: RouteProps) {
  const { locale, section } = await params;
  const page = pageForSection(section);
  if (!isLocale(locale) || !page) notFound();
  if (page === "ask") return <ChatPage locale={locale} />;
  if (page === "guides") return <GuideDirectory locale={locale} />;
  if (
    page === "services" ||
    page === "categories" ||
    page === "agencies" ||
    page === "sources" ||
    page === "search"
  ) {
    if (publishedDirectoryEnabled())
      return (
        <PublishedDirectoryPage
          locale={locale}
          kind={page}
          query={await searchParams}
        />
      );
    return <DirectoryPage locale={locale} kind={page} />;
  }
  return (
    <InformationPage
      locale={locale}
      page={page}
      feedbackMode={serverEnvironment.CHAT_MODE ?? "demo"}
    />
  );
}
