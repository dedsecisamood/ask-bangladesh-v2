import "server-only";
import type { Metadata } from "next";
import { serverEnvironment } from "@/lib/env/server";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export function siteMetadata(locale: Locale): Metadata {
  const dictionary = getDictionary(locale);
  return {
    metadataBase: serverEnvironment.APP_ORIGIN
      ? new URL(serverEnvironment.APP_ORIGIN)
      : undefined,
    applicationName: "Ask Bangladesh",
    icons: { icon: "/icon.svg" },
    title: {
      default: `Ask Bangladesh — ${dictionary.home.statusLabel}`,
      template: "%s | Ask Bangladesh",
    },
    description: dictionary.home.description,
    robots: { index: false, follow: false },
    referrer: "strict-origin-when-cross-origin",
  };
}
