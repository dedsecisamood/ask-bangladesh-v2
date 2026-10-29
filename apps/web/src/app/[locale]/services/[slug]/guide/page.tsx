import { notFound, redirect } from "next/navigation";
import { catalog, findService } from "@/lib/catalog";
import { isLocale } from "@/lib/i18n/config";

export const dynamicParams = false;
export function generateStaticParams() {
  return catalog.services.map(({ slug }) => ({ slug }));
}
export default async function LegacyGuide({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !findService(slug)) notFound();
  redirect(`/${locale}/guides/${slug}`);
}
