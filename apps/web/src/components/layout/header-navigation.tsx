"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Check,
  Menu,
  MessageSquare,
  Compass,
  ShieldCheck,
  FileText,
  Info,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  localePath,
  locales,
  switchLocalePath,
  type Locale,
  type PublicPageKey,
} from "@/lib/i18n/config";
import type { ShellDictionary } from "@/lib/i18n/dictionaries";

type NavigationCopy = Pick<
  ShellDictionary,
  "navigation" | "mobileMenu" | "language"
>;

export function HeaderNavigation({
  locale,
  copy,
}: {
  locale: Locale;
  copy: NavigationCopy;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items: {
    key: "services" | "ask" | "sources" | "guides" | "about";
    page?: PublicPageKey;
    icon: typeof MessageSquare;
  }[] = [
    { key: "ask", page: "ask", icon: MessageSquare },
    { key: "services", page: "services", icon: Compass },
    { key: "sources", page: "sources", icon: ShieldCheck },
    { key: "guides", page: "guides", icon: FileText },
    { key: "about", page: "about", icon: Info },
  ];
  const navigationLinks = items.map(({ key, page, icon: Icon }) => {
    const href = localePath(locale, page);
    const active = pathname === href;
    return (
      <li key={key}>
        <Link
          href={href}
          prefetch={false}
          className="navigation-link"
          data-active={active}
          aria-current={active ? "page" : undefined}
          onClick={() => setOpen(false)}
        >
          <Icon aria-hidden="true" />
          {copy.navigation[key]}
        </Link>
      </li>
    );
  });
  return (
    <div className="header-navigation">
      <nav className="desktop-navigation" aria-label={copy.navigation.label}>
        <ul className="navigation-list">{navigationLinks}</ul>
      </nav>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="language-button"
            aria-label={`${copy.language.label}: ${locale === "bn" ? "EN / বাংলা" : "বাংলা / Eng"}`}
          >
            <span
              className="language-accent"
              lang={locale === "bn" ? "en" : "bn"}
            >
              {locale === "bn" ? "EN" : "বাংলা"}
            </span>
            <span aria-hidden="true">/</span>
            <span lang={locale}>{locale === "bn" ? "বাংলা" : "Eng"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {locales.map((targetLocale) => (
            <DropdownMenuItem key={targetLocale} asChild>
              <a
                href={switchLocalePath(pathname, targetLocale)}
                hrefLang={targetLocale}
                lang={targetLocale}
                aria-current={locale === targetLocale ? "true" : undefined}
              >
                <span className="flex-1">{copy.language[targetLocale]}</span>
                {locale === targetLocale && (
                  <>
                    <Check className="size-4" aria-hidden="true" />
                    <span className="sr-only">{copy.language.current}</span>
                  </>
                )}
              </a>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <ThemeToggle locale={locale} />
      <Button asChild className="header-ask">
        <Link href={localePath(locale, "ask")} prefetch={false}>
          {locale === "bn" ? "জিজ্ঞাসা করুন" : "Ask Question"}
        </Link>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="mobile-menu-trigger"
            aria-label={copy.mobileMenu.open}
          >
            <Menu aria-hidden="true" />
          </Button>
        </DialogTrigger>
        <DialogContent
          closeLabel={copy.mobileMenu.close}
          className="mobile-nav-panel translate-x-0 translate-y-0"
        >
          <DialogHeader>
            <DialogTitle>{copy.mobileMenu.title}</DialogTitle>
            <DialogDescription>{copy.mobileMenu.description}</DialogDescription>
          </DialogHeader>
          <nav aria-label={copy.navigation.label}>
            <ul className="mobile-navigation-list">{navigationLinks}</ul>
          </nav>
          <nav
            aria-label={copy.language.label}
            className="mobile-language-links"
          >
            {locales.map((targetLocale) => (
              <Button
                key={targetLocale}
                variant={targetLocale === locale ? "secondary" : "outline"}
                asChild
              >
                <a
                  href={switchLocalePath(pathname, targetLocale)}
                  hrefLang={targetLocale}
                  lang={targetLocale}
                >
                  {copy.language[targetLocale]}
                </a>
              </Button>
            ))}
          </nav>
        </DialogContent>
      </Dialog>
    </div>
  );
}
