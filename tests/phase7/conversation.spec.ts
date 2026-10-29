import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { performance } from "node:perf_hooks";
import { mkdirSync, writeFileSync } from "node:fs";

test("audit structured feedback stays honest when production intake is closed", async ({
  page,
  request,
}) => {
  await page.goto("/en/feedback");
  await page
    .getByLabel("Feedback category", { exact: true })
    .selectOption("incorrect");
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Send feedback", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "could not be accepted" }),
  ).toBeVisible();
  await expect(page.getByText("Your report was saved for review.")).toHaveCount(
    0,
  );
  const result = await request.post("/api/v1/feedback", {
    data: { category: "incorrect", locale: "bn", consent: true },
  });
  expect(result.status()).toBe(503);
  expect((await result.json()).error.code).toBe("POLICY_UNAVAILABLE");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("P44 language-change turns keep bounded user history and reset clears it", async ({
  page,
}) => {
  const captured: {
    question: string;
    history: { role: string; content: string }[];
  }[] = [];
  await page.route("**/api/v1/answers", async (route) => {
    captured.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      json: {
        request_id: "44000000-0000-4000-8000-000000000001",
        status: "abstained",
        language:
          captured.length === 1
            ? "en"
            : captured.length === 2
              ? "bn"
              : "banglish",
        blocks: [],
        citations: [],
        reason_codes: ["insufficient_evidence"],
        warnings: [],
      },
    });
  });
  await page.goto("/en/ask");
  const send = async (text: string) => {
    await page.getByLabel("Your question", { exact: true }).fill(text);
    await page
      .getByRole("button", { name: "Send question", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Send question", exact: true }),
    ).toBeEnabled();
  };
  await send("Passport renewal 123456789012");
  await expect(
    page.getByText("There is not enough verified evidence."),
  ).toBeVisible();
  await send("বাংলায় বলুন।");
  await expect(page.getByText("যথেষ্ট যাচাইকৃত প্রমাণ নেই।")).toBeVisible();
  await send("Banglish e bolun");
  await expect(
    page.getByText("Jothesto jachaikrito proman nei."),
  ).toHaveAttribute("lang", "bn-Latn");
  expect(captured[2].history.map((h) => h.content)).toEqual([
    "Passport renewal",
    "বাংলায় বলুন।".normalize("NFC"),
  ]);
  expect(captured[2].history.every((h) => h.role === "user")).toBe(true);
  expect(JSON.stringify(captured)).not.toContain("123456789012");
  await page
    .getByRole("button", { name: "Clear conversation", exact: true })
    .click();
  await send("What documents?");
  expect(captured[3].history).toEqual([]);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("Bangla API warnings and keyboard submission work without accounts", async ({
  page,
}) => {
  await page.goto("/bn/ask");
  await page
    .getByLabel("আপনার প্রশ্ন", { exact: true })
    .fill("পাসপোর্টের তথ্য কীভাবে পাব?");
  await page.getByRole("button", { name: "প্রশ্ন পাঠান", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "উত্তর দেওয়ার সেবা এখন চালু নেই।" }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("P41 bounded local unavailable HTTP timing probe", async ({ request }) => {
  const samples: number[] = [];
  for (let i = 0; i < 30; i++) {
    const start = performance.now();
    const r = await request.post("/api/v1/answers", {
      data: { question: "Synthetic passport question" },
    });
    expect(r.status()).toBe(503);
    await r.body();
    samples.push(performance.now() - start);
  }
  const start = performance.now();
  const results = await Promise.all(
    Array.from({ length: 8 }, () =>
      request.post("/api/v1/answers", {
        data: { question: "Synthetic concurrent question" },
      }),
    ),
  );
  expect(results.every((r) => r.status() === 503)).toBe(true);
  const sorted = [...samples].sort((a, b) => a - b);
  mkdirSync(".cache/phase7", { recursive: true });
  writeFileSync(
    ".cache/phase7/http-timing.json",
    JSON.stringify(
      {
        scope:
          "loopback production-policy-unavailable path, NOT retrieval/generation or production capacity",
        sequential_count: 30,
        p50_ms: sorted[14],
        p95_ms: sorted[28],
        concurrent_count: 8,
        concurrent_total_ms: performance.now() - start,
        samples_ms: samples,
      },
      null,
      2,
    ),
  );
});

test("real API mode keeps warnings visible, minimizes questions and clears memory", async ({
  page,
}) => {
  await page.goto("/en/ask");
  await expect(
    page.getByText(
      "Answers may be unavailable without verified evidence. Do not enter personal identity numbers.",
    ),
  ).toBeVisible();
  const captured: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith("/api/v1/answers")) captured.push(r.postData() ?? "");
  });
  await page
    .getByLabel("Your question", { exact: true })
    .fill("Passport 123456789012 renewal");
  const response = page.waitForResponse((r) =>
    r.url().endsWith("/api/v1/answers"),
  );
  await page
    .getByRole("button", { name: "Send question", exact: true })
    .click();
  expect((await response).status()).toBe(503);
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Answer assistance is currently unavailable." }),
  ).toBeVisible();
  expect(captured).toHaveLength(1);
  expect(captured[0]).not.toContain("123456789012");
  expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual([]);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page
    .getByRole("button", { name: "Clear conversation", exact: true })
    .click();
  await expect(
    page.getByText("Passport 123456789012 renewal", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByLabel("Your question", { exact: true })
    .fill("What documents?");
  const next = page.waitForResponse((r) => r.url().endsWith("/api/v1/answers"));
  await page
    .getByRole("button", { name: "Send question", exact: true })
    .click();
  await next;
  expect(JSON.parse(captured[1]).history).toEqual([]);
});

for (const locale of ["en", "bn"] as const) {
  test(`P42 ${locale} mocked validated answer renders localized metadata safely`, async ({
    page,
  }) => {
    const id = "35000000-0000-4000-8000-000000000001";
    await page.route("**/api/v1/answers", async (route) =>
      route.fulfill({
        status: 200,
        json: {
          request_id: id,
          status: "partial",
          language: "en",
          reason_codes: ["partial_support"],
          warnings: ["partial_support", "publication_date_unknown"],
          blocks: [
            {
              id: "c1",
              kind: "step",
              text: "Synthetic step for testing only.",
              citation_ids: [id],
            },
          ],
          citations: [
            {
              id,
              source_id: id,
              document_id: id,
              document_version_id: id,
              passage_id: id,
              agency_id: id,
              agency_name: null,
              title: "Synthetic document",
              url: "https://synthetic.example.invalid/document.pdf",
              passage: "Synthetic step for testing only.",
              content_hash: "a".repeat(64),
              passage_hash: "b".repeat(64),
              locator: {
                type: "pdf",
                page: 2,
                start: null,
                end: null,
                heading_path: [],
              },
              published_at: null,
              checked_at: "2026-10-23T00:00:00Z",
              reviewed_at: "2026-10-23T00:00:00Z",
              ownership_verified_at: "2026-10-23T00:00:00Z",
              effective_from: null,
              effective_to: null,
            },
          ],
        },
      }),
    );
    await page.goto(`/${locale}/ask`);
    await page
      .getByLabel(locale === "bn" ? "আপনার প্রশ্ন" : "Your question", {
        exact: true,
      })
      .fill("synthetic question");
    await page
      .getByRole("button", {
        name: locale === "bn" ? "প্রশ্ন পাঠান" : "Send question",
        exact: true,
      })
      .click();
    await expect(
      page.getByText(
        locale === "bn"
          ? "উত্তরের শুধু সমর্থিত অংশ দেখানো হচ্ছে।"
          : "Only the supported part of the answer is shown.",
      ),
    ).toBeVisible();
    await expect(
      page.getByText("Synthetic step for testing only.").first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: locale === "bn" ? "মূল সরকারি উৎস" : "Original official source",
      }),
    ).toHaveAttribute("href", "https://synthetic.example.invalid/document.pdf");
    await expect(
      page.getByText(locale === "bn" ? "পৃষ্ঠা: ২" : "Page: 2"),
    ).toBeVisible();
    await expect(page.locator("blockquote")).toHaveAttribute("lang", "");
    await expect(
      page.locator('time[datetime="2026-10-23T00:00:00Z"]'),
    ).toContainText("UTC");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}
