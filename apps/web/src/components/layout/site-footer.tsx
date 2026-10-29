import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Brand } from "./brand";
import { Container } from "@/components/ui/container";
import { localePath, type Locale, type PublicPageKey } from "@/lib/i18n/config";
import { getDictionary, type ShellDictionary } from "@/lib/i18n/dictionaries";

export function SiteFooter({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: ShellDictionary;
}) {
  const otherLocale = locale === "bn" ? "en" : "bn";
  const groups: { title: string; pages: PublicPageKey[] }[] = [
    {
      title: dictionary.footer.projectTitle,
      pages: ["about", "howItWorks", "trust", "feedback", "help"],
    },
    {
      title: dictionary.footer.informationTitle,
      pages: ["sources", "privacy", "terms", "accessibility", "status"],
    },
  ];
  return (
    <footer className="site-footer">
      <Container>
        <div className="footer-grid">
          <div className="footer-brand">
            <Brand
              locale={locale}
              brand={dictionary.brand}
              homeLabel={dictionary.navigation.home}
            />
            <p className="footer-disclosure" lang={locale}>
              {dictionary.footer.independentDisclosure}
            </p>
            <p
              className="footer-disclosure footer-disclosure-translation"
              lang={otherLocale}
            >
              {getDictionary(otherLocale).footer.independentDisclosure}
            </p>
          </div>
          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="footer-links-heading">{group.title}</h2>
              <ul className="footer-links">
                {group.pages.map((page) => (
                  <li key={page}>
                    <Link href={localePath(locale, page)} prefetch={false}>
                      {dictionary.pages[page].title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="footer-bottom">
          <span lang="en">Ask Bangladesh</span>
          <Link
            href={localePath(locale, "sourcePolicy")}
            prefetch={false}
            className="inline-flex min-h-11 items-center gap-1.5"
          >
            {dictionary.pages.sourcePolicy.title}
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </Container>
    </footer>
  );
}
