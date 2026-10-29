import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const locale of ["bn", "en"] as const) {
  test(`P42 ${locale} small-screen mixed text and keyboard locale preference`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 812 });
    await page.goto(`/${locale}/ask?question=synthetic-private-fragment`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    const question = page.getByLabel(
      locale === "bn" ? "আপনার প্রশ্ন" : "Your question",
      { exact: true },
    );
    const text =
      "সিনথেটিক পরীক্ষা: ক্ষ জ্ঞ শ্র যুক্তাক্ষর, NID ও e-Passport — বাংলাদেশ। ".repeat(
        5,
      );
    await question.fill(text);
    await expect(question).toHaveValue(text);
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    mkdirSync(".cache/p42", { recursive: true });
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: resolve(`.cache/p42/${locale}-mixed-mobile.png`),
      fullPage: true,
    });
    const menu = page.getByRole("button", {
      name: locale === "bn" ? "মেনু খুলুন" : "Open menu",
    });
    await menu.focus();
    await page.keyboard.press("Enter");
    const other = locale === "bn" ? "en" : "bn";
    const link = page.getByRole("dialog").getByRole("link", {
      name: other === "en" ? "English" : "বাংলা",
      exact: true,
    });
    await expect(link).toHaveAttribute("href", `/${other}/ask`);
    await link.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`/${other}/ask$`));
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", other);
    expect(
      await page.evaluate(() => ({
        local: Object.keys(localStorage),
        session: Object.keys(sessionStorage),
        cookies: document.cookie,
      })),
    ).toEqual({ local: [], session: [], cookies: "" });
    await expect(
      page.getByLabel(other === "bn" ? "আপনার প্রশ্ন" : "Your question", {
        exact: true,
      }),
    ).toHaveValue("");
  });
}
test("P42 Bangla controls remain usable when local font loading fails", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.route("**/*.woff2", (route) => route.abort());
  await page.goto("/bn/ask");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const input = page.getByLabel("আপনার প্রশ্ন", { exact: true });
  await input.fill("সিনথেটিক যুক্তাক্ষর পরীক্ষা: ক্ষ, জ্ঞ, শ্র — NID");
  const font = await input.evaluate(
    (node) => getComputedStyle(node).fontFamily,
  );
  expect(font).toMatch(/Nirmala UI|Vrinda/u);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  mkdirSync(".cache/p42", { recursive: true });
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: resolve(".cache/p42/bn-font-fallback.png"),
    fullPage: true,
  });
});
