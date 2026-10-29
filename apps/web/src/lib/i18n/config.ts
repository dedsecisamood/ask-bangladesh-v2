import { catalog, categories } from "../catalog";

export const locales = ["bn", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "bn";

export function isLocale(value: unknown): value is Locale {
  return value === "bn" || value === "en";
}

// Public frontend routes. Content availability is explicit on each page.
export const publicPages = {
  guides: { path: "guides", titleKey: "guides", workPackage: "P12" },
  help: { path: "help", titleKey: "help", workPackage: "P12" },
  categories: {
    path: "categories",
    titleKey: "categories",
    workPackage: "P11",
  },
  agencies: { path: "agencies", titleKey: "agencies", workPackage: "P11" },
  search: { path: "search", titleKey: "search", workPackage: "P11" },
  status: { path: "status", titleKey: "status", workPackage: "P12" },
  services: { path: "services", titleKey: "services", workPackage: "P11" },
  ask: { path: "ask", titleKey: "ask", workPackage: "P10" },
  howItWorks: {
    path: "how-it-works",
    titleKey: "howItWorks",
    workPackage: "P12",
  },
  about: { path: "about", titleKey: "about", workPackage: "P12" },
  sources: { path: "sources", titleKey: "sources", workPackage: "P12" },
  trust: { path: "trust", titleKey: "trust", workPackage: "P12" },
  privacy: { path: "privacy", titleKey: "privacy", workPackage: "P12" },
  terms: { path: "terms", titleKey: "terms", workPackage: "P12" },
  accessibility: {
    path: "accessibility",
    titleKey: "accessibility",
    workPackage: "P12",
  },
  feedback: { path: "feedback", titleKey: "feedback", workPackage: "P12" },
  sourcePolicy: {
    path: "source-policy",
    titleKey: "sourcePolicy",
    workPackage: "P12",
  },
} as const;

export type PublicPageKey = keyof typeof publicPages;

export function pageForSection(section: string): PublicPageKey | undefined {
  return (Object.keys(publicPages) as PublicPageKey[]).find(
    (key) => publicPages[key].path === section,
  );
}

export function localePath(locale: Locale, page?: PublicPageKey): string {
  if (!isLocale(locale)) {
    throw new Error("Unsupported interface locale");
  }

  if (page === undefined) {
    return `/${locale}`;
  }

  if (!Object.hasOwn(publicPages, page)) {
    throw new Error("Unsupported public page");
  }

  return `/${locale}/${publicPages[page].path}`;
}

export function switchLocalePath(
  pathname: string,
  targetLocale: Locale,
): string {
  const fallback = localePath(targetLocale);
  // Never carry question/search text or fragments into a language link.
  const path = pathname.split(/[?#]/u, 1)[0];

  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    /[\\\u0000-\u001f\u007f]/u.test(path)
  ) {
    return fallback;
  }

  const segments = path.replace(/\/$/u, "").split("/");
  if (!isLocale(segments[1])) {
    return fallback;
  }

  const section = segments.slice(2).join("/");
  if (!section) {
    return fallback;
  }

  const [group, slug, ...rest] = section.split("/");
  if (
    !rest.length &&
    slug &&
    ["services", "categories", "agencies", "sources", "guides"].includes(
      group,
    ) &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug) &&
    ((["services", "guides"].includes(group) &&
      catalog.services.some((item) => item.slug === slug)) ||
      (group === "categories" &&
        categories.some((item) => item.slug === slug)) ||
      (group === "agencies" &&
        catalog.agencies.some((item) => item.slug === slug)) ||
      (group === "sources" && catalog.sources.some((item) => item.id === slug)))
  ) {
    return `/${targetLocale}/${group}/${slug}`;
  }
  const page = pageForSection(section);
  return page ? localePath(targetLocale, page) : fallback;
}
