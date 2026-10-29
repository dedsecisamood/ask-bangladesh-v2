import { notFound } from "next/navigation";
import { Homepage } from "@/features/home/homepage";
import { isLocale } from "@/lib/i18n/config";
import { publishedDirectoryEnabled } from "@/lib/directory/mode";
export const dynamic = "force-dynamic";

export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <Homepage locale={locale} published={publishedDirectoryEnabled()} />;
}
