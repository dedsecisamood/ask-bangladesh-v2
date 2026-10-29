import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

test("root selects Bangla with bilingual independence and a working skip link", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveURL(/\/bn$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "bn");
  await expect(page).toHaveTitle(/Ask Bangladesh/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "সরকারি সেবা নিয়ে",
  );
  const footer = page.getByRole("contentinfo");
  await expect(
    footer.getByText(/Ask Bangladesh একটি স্বাধীন প্রকল্প/),
  ).toBeVisible();
  await expect(
    footer.getByText(
      "Ask Bangladesh is an independent project and is not an official Government of Bangladesh website.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByText("ফ্রন্টএন্ড প্রিভিউ · সরাসরি উত্তর এখনো চালু হয়নি"),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex.*nofollow/,
  );
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "মূল বিষয়বস্তুতে যান" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  expect(errors).toEqual([]);
});

test("language links preserve the section, translate the document and drop private query text", async ({
  page,
}) => {
  await page.goto(
    "/bn/services?question=synthetic-private-draft#synthetic-fragment",
  );
  const language = page.getByRole("button", { name: "ভাষা নির্বাচন" });
  await language.focus();
  await page.keyboard.press("ArrowDown");
  const english = page.getByRole("menuitem", { name: "English", exact: true });
  await expect(english).toHaveAttribute("href", "/en/services");
  await english.click();
  await expect(page).toHaveURL(/\/en\/services$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Service topics",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Service Directory", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.getByRole("button", { name: "Choose language" }).click();
  await page.getByRole("menuitem", { name: "বাংলা", exact: true }).click();
  await expect(page).toHaveURL(/\/bn\/services$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "bn");
  const storage = await page.evaluate(() => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
    cookies: document.cookie,
  }));
  expect(storage).toEqual({ local: [], session: [], cookies: "" });
});

test("mobile navigation traps focus, closes with Escape and navigates", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto("/bn");
  const trigger = page.getByRole("button", { name: "মেনু খুলুন" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "সাইটের মেনু" });
  await expect(dialog).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(760);
  if (process.env.P08_SCREENSHOTS === "1") {
    const folder = resolve(".cache/p08-review");
    mkdirSync(folder, { recursive: true });
    await page.screenshot({ path: resolve(folder, "mobile-menu.png") });
  }
  for (let index = 0; index < 9; index++) {
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((node) => node.contains(document.activeElement)),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog
    .getByRole("link", { name: "সেবা ডিরেক্টরি", exact: true })
    .click();
  await expect(page).toHaveURL(/\/bn\/services$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "সেবার বিষয়সমূহ",
  );
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

for (const width of [320, 375, 390, 768, 1024, 1440]) {
  test(`shell reflows in both languages at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const locale of ["bn", "en"]) {
      await page.goto(`/${locale}`);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const geometry = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        width: Math.max(
          document.body.scrollWidth,
          document.documentElement.scrollWidth,
        ),
        fontsLoaded: [...document.fonts].filter(
          (face) => face.status === "loaded",
        ).length,
      }));
      expect(geometry.viewport).toBe(width);
      expect(geometry.width).toBeLessThanOrEqual(width);
      expect(geometry.fontsLoaded).toBeGreaterThanOrEqual(1);
      if (width < 1280)
        await expect(
          page.getByRole("button", {
            name: locale === "bn" ? "মেনু খুলুন" : "Open menu",
          }),
        ).toBeVisible();
      else
        await expect(
          page.getByRole("navigation", {
            name: locale === "bn" ? "মূল নেভিগেশন" : "Main navigation",
          }),
        ).toBeVisible();
      if (
        process.env.P08_SCREENSHOTS === "1" ||
        process.env.PHASE2_SCREENSHOTS === "1"
      ) {
        const folder = resolve(
          process.env.PHASE2_SCREENSHOTS === "1"
            ? ".cache/phase2-review"
            : ".cache/p08-review",
        );
        mkdirSync(folder, { recursive: true });
        await page.screenshot({
          path: resolve(folder, `${locale}-home-${width}.png`),
          fullPage: true,
        });
      }
    }
  });
}

test("navigation destinations render and unknown routes return 404", async ({
  page,
  request,
}) => {
  await page.goto("/en");
  const hrefs = await page
    .locator("header a, footer a")
    .evaluateAll((links) =>
      [...new Set(links.map((link) => link.getAttribute("href")))].filter(
        (href): href is string => Boolean(href?.startsWith("/en/")),
      ),
    );
  expect(hrefs.length).toBeGreaterThanOrEqual(10);
  for (const href of hrefs) {
    const response = await request.get(href);
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain("noindex");
  }
  for (const invalid of [
    "/fr",
    "/en/not-a-real-page",
    "/bn/services/unknown/detail",
    "/not-a-locale/unknown",
  ]) {
    expect((await request.get(invalid)).status()).toBe(404);
  }
});

test("fonts and application assets stay local, with measured cold-page transfer", async ({
  page,
}) => {
  const origins: string[] = [];
  page.on("request", (request) => origins.push(new URL(request.url()).origin));
  await page.goto("/bn");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
  expect(origins.every((origin) => origin === "http://127.0.0.1:3100")).toBe(
    true,
  );
  const metrics = await page.evaluate(() => {
    const entries = performance.getEntriesByType(
      "resource",
    ) as PerformanceResourceTiming[];
    const navigation = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;
    return {
      htmlCssJsEncodedBytes:
        navigation.encodedBodySize +
        entries
          .filter((entry) => /\.(?:css|js)(?:\?|$)/.test(entry.name))
          .reduce((sum, entry) => sum + entry.encodedBodySize, 0),
      fontEncodedBytes: entries
        .filter((entry) => /\.woff2(?:\?|$)/.test(entry.name))
        .reduce((sum, entry) => sum + entry.encodedBodySize, 0),
      fontRequests: entries.filter((entry) =>
        /\.woff2(?:\?|$)/.test(entry.name),
      ).length,
    };
  });
  expect(metrics.fontRequests).toBe(2);
  test.info().annotations.push({
    type: "cold-page-transfer",
    description: JSON.stringify(metrics),
  });
  if (process.env.P08_SCREENSHOTS === "1")
    console.log(`P08 transfer: ${JSON.stringify(metrics)}`);
});

test("reduced-motion preference keeps navigation usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("dialog", { name: "Site menu" })).toBeVisible();
  await page.getByRole("button", { name: "Close menu" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
