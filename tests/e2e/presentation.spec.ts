import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const locale of ["bn", "en"]) {
  test(`${locale} reference presentation supports both themes and honest status`, async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.emulateMedia({ colorScheme: "light" });
    await page.setViewportSize({ width: 1920, height: 877 });
    await page.goto(`/${locale}`);
    const toggle = page.getByRole("button", {
      name: locale === "bn" ? "থিম পরিবর্তন করুন" : "Toggle color theme",
    });
    for (const theme of ["light", "dark"]) {
      if (theme === "dark") await toggle.click();
      expect(
        await page.evaluate(
          () => getComputedStyle(document.documentElement).colorScheme,
        ),
      ).toBe(theme);
      await expect(
        page
          .getByRole("navigation", {
            name: locale === "bn" ? "অন্বেষণ করুন" : "Explore Ask Bangladesh",
          })
          .getByRole("link"),
      ).toHaveCount(4);
      await page.evaluate(() => document.fonts.ready);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      if (process.env.FRONTEND_SCREENSHOTS === "1") {
        mkdirSync(".cache/frontend-refresh", { recursive: true });
        await page.screenshot({
          path: resolve(`.cache/frontend-refresh/${locale}-home-${theme}.png`),
        });
      }
    }
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([
      "askbd-theme",
    ]);
    await page.goto(`/${locale}/about`);
    await expect(
      page.getByText(
        locale === "bn"
          ? "উন্নয়নের অবস্থা · লাইভ মেট্রিক্স নয়"
          : "Development status · Not live telemetry",
      ),
    ).toBeVisible();
    await expect(
      page.getByLabel(
        locale === "bn" ? "তথ্য উপলব্ধ নয়" : "Data unavailable",
        { exact: true },
      ),
    ).toHaveCount(4);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await toggle.click();
    if (process.env.FRONTEND_SCREENSHOTS === "1")
      await page.screenshot({
        path: resolve(`.cache/frontend-refresh/${locale}-about-light.png`),
      });
    await page.setViewportSize({ width: 320, height: 844 });
    for (const path of ["", "/about", "/guides"]) {
      await page.goto(`/${locale}${path}`);
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(320);
      if (process.env.FRONTEND_SCREENSHOTS === "1")
        await page.screenshot({
          path: resolve(
            `.cache/frontend-refresh/${locale}-${path.slice(1) || "home"}-mobile.png`,
          ),
          fullPage: true,
        });
    }
    expect(errors).toEqual([]);
  });
}

test("system theme works without persistence, and a blocked storage API does not break toggling", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get: () => {
        throw new Error("Storage unavailable");
      },
    }),
  );
  await page.goto("/en");
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).colorScheme,
    ),
  ).toBe("dark");
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).colorScheme,
    ),
  ).toBe("light");
  await page
    .getByRole("link", { name: "About Us", exact: true })
    .first()
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
