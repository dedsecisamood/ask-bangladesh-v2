import { describe, expect, it } from "vitest";
import {
  defaultLocale,
  isLocale,
  localePath,
  locales,
  pageForSection,
  publicPages,
  switchLocalePath,
  type Locale,
  type PublicPageKey,
} from "./config";
import { getDictionary } from "./dictionaries";

describe("public locale and route contracts", () => {
  it("defaults to Bangla and has exactly two interface locales", () => {
    expect(defaultLocale).toBe("bn");
    expect(locales).toEqual(["bn", "en"]);
    expect(isLocale("bn")).toBe(true);
    expect(isLocale("en")).toBe(true);
  });

  it.each([
    "banglish",
    "BN",
    "fr",
    "constructor",
    "__proto__",
    "toString",
    "",
    undefined,
    null,
    1,
    {},
  ])("rejects unsupported locale value %j", (value) => {
    expect(isLocale(value)).toBe(false);
  });

  it("builds only internal paths from known page keys", () => {
    expect(localePath("bn")).toBe("/bn");
    expect(localePath("en", "services")).toBe("/en/services");
    expect(localePath("bn", "howItWorks")).toBe("/bn/how-it-works");
    expect(localePath("en", "sourcePolicy")).toBe("/en/source-policy");
  });

  it("does not accept inherited keys or arbitrary URLs as public pages", () => {
    expect(() => localePath("bn", "constructor" as PublicPageKey)).toThrow(
      "Unsupported public page",
    );
    expect(() =>
      localePath("en", "https://example.test" as PublicPageKey),
    ).toThrow("Unsupported public page");
    expect(() => localePath("constructor" as Locale)).toThrow(
      "Unsupported interface locale",
    );
  });

  it("resolves section paths without accepting prototype names or future details", () => {
    expect(pageForSection("how-it-works")).toBe("howItWorks");
    expect(pageForSection("source-policy")).toBe("sourcePolicy");
    expect(pageForSection("constructor")).toBeUndefined();
    expect(pageForSection("__proto__")).toBeUndefined();
    expect(pageForSection("services/synthetic-detail")).toBeUndefined();
  });
});

describe("privacy-preserving language links", () => {
  it.each([
    { path: "/bn", expected: "/en" },
    { path: "/bn/", expected: "/en" },
    { path: "/bn/services", expected: "/en/services" },
    { path: "/bn/services/", expected: "/en/services" },
    {
      path: "/bn/services/nid?question=private#fragment",
      expected: "/en/services/nid",
    },
    { path: "/bn/categories/identity", expected: "/en/categories/identity" },
    { path: "/bn/guides/nid", expected: "/en/guides/nid" },
    { path: "/en/how-it-works", expected: "/en/how-it-works" },
    { path: "/bn/source-policy", expected: "/en/source-policy" },
    {
      path: "/bn/ask?question=synthetic-private-question#synthetic-private-fragment",
      expected: "/en/ask",
    },
    {
      path: "/bn/services?filter=synthetic#section",
      expected: "/en/services",
    },
  ])(
    "preserves the supported resource in $path without query/hash",
    ({ path, expected }) => {
      const result = switchLocalePath(path, "en");
      expect(result).toBe(expected);
      expect(result).not.toMatch(/[?#]/u);
      expect(result).not.toContain("synthetic-private");
    },
  );

  it.each([
    "/",
    "",
    "/fr/services",
    "/constructor/services",
    "/bn/unknown",
    "/bn/services/synthetic-detail",
    "/bn/agencies/unknown",
    "/bn/sources/unknown",
    "/bn//services",
    "/bn/../services",
    "/bn/%2e%2e/services",
    "/bn/services%2Fsynthetic-detail",
    "//example.test/bn/services",
    "https://example.test/bn/services",
    "javascript:alert(1)",
    "/bn\\services",
    "/bn/services\n",
  ])("falls back safely for unsupported or unsafe path %j", (path) => {
    expect(switchLocalePath(path, "bn")).toBe("/bn");
  });
});

describe("bilingual shell content", () => {
  it("provides a localized title and honest preparation message for every route", () => {
    for (const locale of locales) {
      const dictionary = getDictionary(locale);
      for (const key of Object.keys(publicPages) as PublicPageKey[]) {
        expect(dictionary.pages[key].title.trim().length).toBeGreaterThan(0);
        expect(dictionary.pages[key].description.trim().length).toBeGreaterThan(
          0,
        );
      }
      expect(dictionary.language.bn).toBe("বাংলা");
      expect(dictionary.language.en).toBe("English");
      expect(dictionary.skipLink).not.toBe("");
    }
  });

  it("states independent status in both languages and does not promise live AI", () => {
    expect(getDictionary("en").footer.independentDisclosure).toBe(
      "Ask Bangladesh is an independent project and is not an official Government of Bangladesh website.",
    );
    expect(getDictionary("bn").footer.independentDisclosure).toContain(
      "এটি বাংলাদেশ সরকারের কোনো সরকারি ওয়েবসাইট নয়",
    );
    expect(getDictionary("en").pages.ask.description).toContain(
      "not operational yet",
    );
    expect(getDictionary("bn").pages.ask.description).toContain(
      "এখনো চালু হয়নি",
    );
  });

  it("rejects unsupported dictionary lookups instead of reading a prototype", () => {
    expect(() => getDictionary("constructor" as Locale)).toThrow(
      "Unsupported interface locale",
    );
  });
});
