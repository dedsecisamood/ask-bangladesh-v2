import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { categories, catalog } from "../../apps/web/src/lib/catalog";
import { publicPages } from "../../apps/web/src/lib/i18n/config";

test("home question travels through memory, with no private request or persistence, and refresh clears it", async ({
  page,
}) => {
  const secret = "synthetic-private-question-48372";
  const leaked: string[] = [];
  const external: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes(secret) || request.postData()?.includes(secret))
      leaked.push(request.method());
    if (new URL(request.url()).origin !== "http://127.0.0.1:3100")
      external.push(request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/en");
  await page
    .getByRole("button", {
      name: "Ask Question — Open demo conversation",
      exact: true,
    })
    .click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Enter a question first.",
  );
  await page.getByText("Try an example question", { exact: true }).click();
  await page
    .getByRole("button", { name: "NID correction kivabe korbo?", exact: true })
    .click();
  await expect(page.getByLabel("Your question")).toHaveValue(
    "NID correction kivabe korbo?",
  );
  await page.getByLabel("Your question").fill(secret);
  await page
    .getByRole("button", {
      name: "Ask Question — Open demo conversation",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/en\/ask$/);
  await expect(page.getByText(secret, { exact: true })).toBeVisible();
  await expect(
    page.getByText("Demonstration response ready.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Helpful", exact: true }).click();
  await expect(
    page.getByText(
      "Local demo selection only. Nothing was submitted or saved to a server.",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByLabel("Your question")
    .fill("পাসপোর্ট সম্পর্কে জানতে চাই\nNID correction kivabe?");
  await page.getByRole("button", { name: "Send in demo", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "You", exact: true }),
  ).toHaveCount(2);
  await expect(
    page.getByRole("heading", { name: "Demo assistant", exact: true }),
  ).toHaveCount(2);
  await expect(page.getByLabel("Your question")).toBeFocused();
  expect(
    await page.evaluate(() => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
      cookies: document.cookie,
    })),
  ).toEqual({ local: [], session: [], cookies: "" });
  await page.reload();
  await expect(page.getByText(secret, { exact: true })).toHaveCount(0);
  await expect(
    page.getByText("What would you like to understand?", { exact: true }),
  ).toBeVisible();
  expect(leaked).toEqual([]);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test("conversation clear removes answered and unsent text; locale navigation drops the session", async ({
  page,
}) => {
  await page.goto("/en/ask");
  await page.getByLabel("Your question").fill("Synthetic conversation");
  await page.getByRole("button", { name: "Send in demo", exact: true }).click();
  await expect(
    page.getByText("Demonstration response ready.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Your question").fill("Unsent synthetic draft");
  await page
    .getByRole("button", { name: "Clear conversation", exact: true })
    .click();
  await expect(
    page.getByText("Synthetic conversation", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Your question")).toHaveValue("");
  await page.getByLabel("Your question").fill("Synthetic language transition");
  await page.getByRole("button", { name: "Send in demo", exact: true }).click();
  await page.getByRole("button", { name: "Choose language" }).click();
  await page.getByRole("menuitem", { name: "বাংলা", exact: true }).click();
  await expect(page).toHaveURL(/\/bn\/ask$/);
  await expect(
    page.getByText("Synthetic language transition", { exact: true }),
  ).toHaveCount(0);
});

test("directory search, filters, category/detail/guide/source navigation and locale preservation work", async ({
  page,
}) => {
  await page.goto("/en/services");
  await page
    .getByLabel("Search service topics", { exact: true })
    .fill("jomir khajna");
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(page.getByRole("article")).toContainText(
    "Land and Land Development Tax",
  );
  await page.getByLabel("Category", { exact: true }).selectOption("identity");
  await expect(
    page.getByText("No matching preparation topics.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByRole("article")).toHaveCount(8);
  await page
    .getByRole("link", { name: "National Identity Card", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Verified instructions are not available yet.",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Choose language" }).click();
  await page.getByRole("menuitem", { name: "বাংলা", exact: true }).click();
  await expect(page).toHaveURL(/\/bn\/services\/nid$/);
  await page.getByRole("link", { name: "বিভাগ দেখুন", exact: true }).click();
  await expect(page).toHaveURL(/\/bn\/categories\/identity$/);
  await page.goBack();
  await page
    .getByRole("link", { name: "নির্দেশিকার প্রস্তুতি দেখুন", exact: true })
    .click();
  await expect(page).toHaveURL(/\/bn\/guides\/nid$/);
  await page
    .getByRole("complementary")
    .getByRole("link", { name: "সরকারি উৎস", exact: true })
    .click();
  await expect(page).toHaveURL(/\/bn\/sources$/);
  await expect(
    page.getByRole("main").getByRole("heading", {
      level: 2,
      name: "এখনো কোনো যাচাইকৃত সরকারি উৎসের রেকর্ড প্রকাশিত হয়নি।",
      exact: true,
    }),
  ).toBeVisible();
});

test("feedback validates without network submission and status/policies stay honest", async ({
  page,
}) => {
  const mutations: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") mutations.push(request.method());
  });
  await page.goto("/en/feedback");
  await page.getByRole("button", { name: "Check demo form" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Choose a category",
  );
  await page.getByLabel("Feedback category").selectOption("3");
  await page
    .getByLabel("Description", { exact: true })
    .fill("Synthetic accessibility issue for local testing");
  await page.getByRole("button", { name: "Check demo form" }).click();
  await expect(page.getByRole("status")).toContainText("NOT submitted");
  await page.getByRole("button", { name: "Clear form" }).click();
  await expect(page.getByLabel("Description", { exact: true })).toHaveValue("");
  for (const route of ["privacy", "terms"]) {
    await page.goto(`/en/${route}`);
    await expect(
      page.getByText("Draft · Review required before production", {
        exact: true,
      }),
    ).toBeVisible();
  }
  await page.goto("/en/status");
  await expect(
    page.getByRole("heading", {
      name: "Live monitoring is not connected",
      exact: true,
    }),
  ).toBeVisible();
  expect(mutations).toEqual([]);
});

for (const locale of ["bn", "en"]) {
  test(`${locale} static public routes and guide aliases resolve; absent records and unknown paths are actual 404s`, async ({
    request,
  }) => {
    expect(await (await request.get("/robots.txt")).text()).toContain(
      "Disallow: /",
    );
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).not.toContain("<loc>");
    const paths = [
      "",
      ...Object.values(publicPages).map((page) => page.path),
      ...categories.map(({ slug }) => `categories/${slug}`),
      ...catalog.services.flatMap(({ slug }) => [
        `services/${slug}`,
        `guides/${slug}`,
      ]),
    ];
    for (const path of paths) {
      const response = await request.get(`/${locale}${path ? `/${path}` : ""}`);
      expect(response.status(), `${locale}/${path}`).toBe(200);
      const html = await response.text();
      expect(html).toContain(`lang="${locale}"`);
      expect(html).toContain("noindex");
    }
    expect(
      (await request.get(`/${locale}/services/nid/guide`)).url(),
    ).toContain(`/${locale}/guides/nid`);
    for (const invalid of [
      "services/unknown",
      "categories/unknown",
      "agencies/unknown",
      "sources/unknown",
      "guides/unknown",
      "__proto__",
      "ask/unknown",
      "services/nid/guide/extra",
    ]) {
      expect(
        (await request.get(`/${locale}/${invalid}`)).status(),
        `${locale}/${invalid}`,
      ).toBe(404);
    }
  });
}

test("static information and preparation topics remain readable without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3100/en/services");
  await expect(
    page.getByText(
      "Conversation, filters and demo forms require JavaScript. Topic and information pages remain readable.",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "National Identity Card", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Verified instructions are not available yet.",
      exact: true,
    }),
  ).toBeVisible();
  await context.close();
});

for (const width of [320, 375, 390, 768, 1024, 1440]) {
  test(`complete frontend reflows at ${width}px in both locales`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const locale of ["bn", "en"]) {
      for (const route of [
        "services",
        "ask",
        "guides/nid",
        "categories",
        "feedback",
        "sources",
      ]) {
        await page.goto(`/${locale}/${route}`);
        await page.evaluate(() => document.fonts.ready);
        if (route === "ask") {
          await page
            .getByRole("textbox")
            .fill("Long mixed বাংলা English " + "longtoken".repeat(80));
          await page
            .getByRole("button", {
              name: locale === "bn" ? "ডেমোতে পাঠান" : "Send in demo",
              exact: true,
            })
            .click();
          await expect(
            page.getByRole("heading", {
              name: locale === "bn" ? "ডেমো সহকারী" : "Demo assistant",
              exact: true,
            }),
          ).toBeVisible();
        }
        expect(
          await page.evaluate(() =>
            Math.max(
              document.body.scrollWidth,
              document.documentElement.scrollWidth,
            ),
          ),
        ).toBeLessThanOrEqual(width);
        if (
          process.env.PHASE2_SCREENSHOTS === "1" &&
          [320, 390, 1440].includes(width)
        ) {
          const dir = resolve(".cache/phase2-review");
          mkdirSync(dir, { recursive: true });
          // Full-page captures should not include fixed elements positioned above
          // an auto-scrolled composer viewport. Keep visual evidence at page top.
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.screenshot({
            path: resolve(
              dir,
              `${locale}-${route.replaceAll("/", "-")}-${width}.png`,
            ),
            fullPage: true,
          });
        }
      }
    }
  });
}

for (const locale of ["bn", "en"]) {
  test(`automated accessibility scan covers complete ${locale} journeys and mobile dialog`, async ({
    page,
  }) => {
    test.setTimeout(60_000);
    for (const route of [
      "",
      "ask",
      "services",
      "categories",
      "services/nid",
      "guides/nid",
      "sources",
      "feedback",
      "privacy",
      "status",
    ]) {
      await page.goto(`/${locale}${route ? `/${route}` : ""}`);
      if (route === "ask") {
        await page.getByRole("textbox").fill("Synthetic demo question");
        await page
          .getByRole("button", {
            name: locale === "bn" ? "ডেমোতে পাঠান" : "Send in demo",
            exact: true,
          })
          .click();
        await expect(
          page.getByRole("heading", {
            name: locale === "bn" ? "ডেমো সহকারী" : "Demo assistant",
            exact: true,
          }),
        ).toBeVisible();
      }
      if (route === "feedback")
        await page
          .getByRole("button", {
            name:
              locale === "bn" ? "ডেমো ফর্ম পরীক্ষা করুন" : "Check demo form",
          })
          .click();
      const result = await new AxeBuilder({ page }).analyze();
      expect(
        result.violations,
        `${locale}/${route}: ${JSON.stringify(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) })))}`,
      ).toEqual([]);
    }
    await page.setViewportSize({ width: 320, height: 900 });
    await page
      .getByRole("button", {
        name: locale === "bn" ? "মেনু খুলুন" : "Open menu",
      })
      .click();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

test("200% text resize and 400%-equivalent reflow preserve content and controls", async ({
  page,
}) => {
  for (const locale of ["bn", "en"]) {
    for (const route of ["", "ask", "services", "feedback"]) {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(`/${locale}${route ? `/${route}` : ""}`);
      await page.addStyleTag({
        content: "html { font-size: 200% !important; }",
      });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(1280);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await page.setViewportSize({ width: 320, height: 900 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(320);
    }
  }
});

test("cold constrained-network frontend transfer is measured without external assets", async ({
  page,
}) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: 200_000,
    uploadThroughput: 93_750,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.setViewportSize({ width: 390, height: 844 });
  const urls: string[] = [];
  page.on("request", (request) => urls.push(request.url()));
  await page.goto("/bn");
  await page.evaluate(() => document.fonts.ready);
  // goto waits for the initial document/scripts/styles load; fonts are ready.
  // Background navigation prefetch is not a page-readiness signal under throttling.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const metrics = await page.evaluate(() => {
    const entries = performance.getEntriesByType(
      "resource",
    ) as PerformanceResourceTiming[];
    const nav = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;
    return {
      htmlCssJsEncodedBytes:
        nav.encodedBodySize +
        entries
          .filter((entry) => /\.(?:css|js)(?:\?|$)/.test(entry.name))
          .reduce((sum, entry) => sum + entry.encodedBodySize, 0),
      fontEncodedBytes: entries
        .filter((entry) => /\.woff2(?:\?|$)/.test(entry.name))
        .reduce((sum, entry) => sum + entry.encodedBodySize, 0),
      domContentLoadedMs: nav.domContentLoadedEventEnd,
      loadMs: nav.loadEventEnd,
      fontRequests: entries.filter((entry) =>
        /\.woff2(?:\?|$)/.test(entry.name),
      ).length,
    };
  });
  expect(
    urls.every((url) => new URL(url).origin === "http://127.0.0.1:3100"),
  ).toBe(true);
  expect(metrics.fontRequests).toBe(2);
  expect(metrics.htmlCssJsEncodedBytes).toBeLessThanOrEqual(300 * 1024);
  const dir = resolve(".cache/phase2-review");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    resolve(dir, "performance.json"),
    JSON.stringify(
      {
        profile:
          "Chromium 390x844; cold cache; 150ms latency; 1.6Mbps download; 750Kbps upload; 4x CPU slowdown; local server",
        ...metrics,
      },
      null,
      2,
    ),
  );
});
