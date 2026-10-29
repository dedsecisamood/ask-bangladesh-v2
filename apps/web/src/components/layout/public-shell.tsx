import type { ReactNode } from "react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import type { Locale } from "@/lib/i18n/config";
import type { ShellDictionary } from "@/lib/i18n/dictionaries";

export function PublicShell({
  children,
  locale,
  dictionary,
}: {
  children: ReactNode;
  locale: Locale;
  dictionary: ShellDictionary;
}) {
  return (
    <div className="public-shell">
      <a className="skip-link" href="#main-content">
        {dictionary.skipLink}
      </a>
      <SiteHeader locale={locale} dictionary={dictionary} />
      <main id="main-content" className="site-main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter locale={locale} dictionary={dictionary} />
    </div>
  );
}
