import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/layout/public-shell";
import { locales, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { siteMetadata } from "@/lib/site-metadata";
import { banglaFont, latinFont } from "@/styles/fonts";
import { ConversationProvider } from "@/features/questions/conversation-provider";
import { themeInitialization } from "@/lib/theme";
import { serverEnvironment } from "@/lib/env/server";
import "@/styles/globals.css";

export const dynamicParams = false;
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return siteMetadata(locale);
}
export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html
      lang={locale}
      dir="ltr"
      className={`${banglaFont.variable} ${latinFont.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitialization }} />
      </head>
      <body>
        <noscript>
          <p className="p-4 text-center">
            {locale === "bn"
              ? "কথোপকথন, ফিল্টার ও ডেমো ফর্মের জন্য জাভাস্ক্রিপ্ট প্রয়োজন। বিষয়ের পৃষ্ঠা ও তথ্য পড়া যাবে।"
              : "Conversation, filters and demo forms require JavaScript. Topic and information pages remain readable."}
          </p>
        </noscript>
        <ConversationProvider mode={serverEnvironment.CHAT_MODE ?? "demo"}>
          <PublicShell locale={locale} dictionary={getDictionary(locale)}>
            {children}
          </PublicShell>
        </ConversationProvider>
      </body>
    </html>
  );
}
