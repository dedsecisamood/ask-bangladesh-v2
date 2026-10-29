import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { directoryIds as i } from "../database/tests/directory-fixture.mjs";
import { registryProof } from "../database/tests/registry.cases.mjs";
import { root } from "./database-local.mjs";
export async function runPhase4Integration({
  db,
  browser,
  baseURL,
  reviewers,
  source,
  check,
}) {
  const post = (client, path, data, key = randomUUID()) =>
    client.post(path, {
      data,
      headers: { origin: baseURL, "idempotency-key": key },
      maxRedirects: 0,
    });
  for (const [client, action, extra] of [
    [browser, "submit", {}],
    [reviewers[0].client, "approve", registryProof()],
    [reviewers[1].client, "activate", {}],
  ]) {
    const r = await post(
      client,
      `/api/v1/admin/sources/${source.id}/${action}`,
      {
        revision: source.revision,
        reason: "Synthetic Phase 4 fixture",
        ...extra,
      },
    );
    assert.equal(r.status(), 200, action);
    source = (await r.json()).data;
  }
  const identity = (slug) => ({
    slug,
    translations: [
      { locale: "bn", name: `কৃত্রিম ${slug}` },
      { locale: "en", name: `Synthetic ${slug}` },
    ],
    reason: "Synthetic local fixture only",
  });
  const create = async (kind, input) => {
    const r = await post(browser, `/api/v1/admin/directory/${kind}`, input);
    assert.equal(r.status(), 201, await r.text());
    return (await r.json()).data;
  };
  const publish = async (kind, s) => {
    const r = await post(
      reviewers[0].client,
      `/api/v1/admin/directory/${kind}/${s.id}/publish`,
      {
        revision: s.revision,
        reason: "Independent synthetic metadata review",
        proof: registryProof().ownership,
      },
    );
    assert.equal(r.status(), 200, await r.text());
    return (await r.json()).data;
  };
  // Adopt the guarded legacy fixture agency with both reviewed UI locales.
  const legacyRevision = (
    await db.query("SELECT revision FROM app_private.agencies WHERE id=$1", [
      i.agency,
    ])
  ).rows[0].revision;
  const adopted = await browser.patch(
    `/api/v1/admin/directory/agencies/${i.agency}`,
    {
      data: { ...identity("fixture-agency"), revision: legacyRevision },
      headers: { origin: baseURL, "idempotency-key": randomUUID() },
    },
  );
  assert.equal(adopted.status(), 200, await adopted.text());
  await publish("agencies", (await adopted.json()).data);
  const agency = await publish(
    "agencies",
    await create("agencies", identity("p19-agency")),
  );
  const category = await publish(
    "categories",
    await create("categories", identity("p19-category")),
  );
  const input = {
    ...identity("p19-service"),
    primary_category_id: category.id,
    category_ids: [category.id],
    agencies: [
      { id: i.agency, relationship: "responsible" },
      { id: i.agency, relationship: "supporting" },
      { id: agency.id, relationship: "responsible" },
    ],
    source_ids: [source.id],
    aliases: [
      { alias: "NID songshodhon", language: "banglish" },
      { alias: "এনআইডি সংশোধন", language: "bn" },
      { alias: "Passport renew", language: "en" },
      { alias: "Jomir khajna", language: "banglish" },
    ],
  };
  let service = await create("services", input);
  assert.equal(
    (
      await post(
        browser,
        `/api/v1/admin/directory/services/${service.id}/publish`,
        {
          revision: service.revision,
          reason: "Self",
          proof: registryProof().ownership,
        },
      )
    ).status(),
    403,
  );
  service = await publish("services", service);
  assert.equal(
    (await browser.get(`/api/v1/services/p19-service?locale=en`)).status(),
    200,
  );
  const detail = await browser.get(`/api/v1/services/p19-service?locale=bn`);
  assert.ok(
    !/PRIVATE|directory_created_by|evidence_ref/u.test(await detail.text()),
  );
  check(
    "P19 real MFA HTTP manages bilingual identities, relationships and independent publication without private metadata leakage",
  );
  const search = async (query, extra = {}) => {
    const r = await post(browser, "/api/v1/search", {
      locale: "bn",
      query,
      ...extra,
    });
    assert.equal(r.status(), 200, await r.text());
    return (await r.json()).data;
  };
  for (const q of [
    "nid songshodhon",
    "NID   SONGSHODHON",
    "এনআইডি সংশোধন",
    "Passport renew",
    "Jomir khajna",
    "p19-category",
    "p19-agency",
  ])
    assert.ok(
      (await search(q)).some((s) => s.id === service.id),
      q,
    );
  assert.equal((await search("unknown service")).length, 0);
  const firstSearch = await post(browser, "/api/v1/search", {
    locale: "bn",
    query: "",
    limit: 1,
  });
  assert.equal(firstSearch.status(), 200);
  const firstPage = await firstSearch.json();
  assert.equal(firstPage.data.length, 1);
  assert.ok(firstPage.meta.next_cursor);
  const nextSearch = await post(browser, "/api/v1/search", {
    locale: "bn",
    query: "",
    limit: 1,
    cursor: firstPage.meta.next_cursor,
  });
  assert.equal(nextSearch.status(), 200);
  const secondPage = await nextSearch.json();
  assert.equal(secondPage.data.length, 1);
  assert.notEqual(secondPage.data[0].id, firstPage.data[0].id);
  assert.equal(
    (
      await post(browser, "/api/v1/search", {
        locale: "bn",
        query: "different",
        limit: 1,
        cursor: firstPage.meta.next_cursor,
      })
    ).status(),
    400,
  );
  assert.equal((await search("' OR 1=1 --")).length, 0);
  assert.equal(
    (
      await search("passport renew", {
        category: "p19-category",
        agency_id: agency.id,
      })
    ).length,
    1,
  );
  assert.equal(
    (
      await post(browser, "/api/v1/search", { query: "x".repeat(121) })
    ).status(),
    400,
  );
  const related = await browser.get(
    `/api/v1/sources?locale=en&service_id=${service.id}`,
  );
  assert.equal(related.status(), 200);
  assert.equal(
    (await related.json()).data[0].url,
    "https://registry.example.com/http-fixture/",
  );
  check(
    "P20 real DB keyword/alias/category/agency search and service-source APIs return only eligible metadata",
  );
  process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve(
    root,
    ".cache/ms-playwright",
  );
  // Playwright may already be imported by the HTTP harness. Resolve the same
  // pinned binary beneath this repository's installed cache explicitly.
  const parts = chromium.executablePath().split(/[\\/]/u);
  const marker = parts.findIndex((part) => /^chromium-\d+$/u.test(part));
  const executablePath = resolve(
    root,
    ".cache/ms-playwright",
    ...parts.slice(marker),
  );
  assert.ok(
    marker >= 0 && existsSync(executablePath),
    "Install the pinned local Chromium with npm run test:e2e:install",
  );
  const engine = await chromium.launch({ headless: true, executablePath });
  try {
    const context = await engine.newContext({
      baseURL,
      viewport: { width: 375, height: 812 },
    });
    await context.route("**/*", (route) =>
      new URL(route.request().url()).origin === baseURL
        ? route.continue()
        : route.abort(),
    );
    const page = await context.newPage();
    await page.goto("/en");
    await page
      .getByRole("link", { name: "Browse published services", exact: true })
      .click();
    await page.waitForURL("**/en/services");
    for (const locale of ["bn", "en"]) {
      await page.goto(`/${locale}/services`);
      await page
        .getByRole("link", {
          name:
            locale === "bn" ? "কৃত্রিম p19-service" : "Synthetic p19-service",
          exact: true,
        })
        .click();
      await page.waitForURL(`**/${locale}/services/p19-service`);
      assert.equal(
        await page.getByRole("heading", { level: 1 }).textContent(),
        locale === "bn" ? "কৃত্রিম p19-service" : "Synthetic p19-service",
      );
      const external = page.getByRole("link", {
        name: /registry\.example\.com.*(new tab|নতুন ট্যাব)/,
      });
      assert.equal(
        await external.getAttribute("href"),
        "https://registry.example.com/http-fixture/",
      );
      assert.equal(
        await external.getAttribute("rel"),
        "noopener noreferrer external",
      );
      assert.equal(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze()
        ).violations.length,
        0,
      );
    }
    await page.goto("/en/categories/p19-category");
    assert.ok(
      await page
        .getByRole("link", { name: "Synthetic p19-service", exact: true })
        .isVisible(),
    );
    await page.goto("/en/agencies/p19-agency");
    assert.ok(
      await page
        .getByRole("link", { name: "Synthetic p19-service", exact: true })
        .isVisible(),
    );
    await page.goto("/en/services");
    await page
      .getByRole("textbox", { name: "Service name or familiar term" })
      .fill("NID songshodhon");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await page
      .getByRole("status")
      .filter({ hasText: "1 services on this page" })
      .waitFor();
    assert.ok(!page.url().includes("songshodhon"));
    await page.keyboard.press("Tab");
    assert.ok(
      await page
        .getByRole("link", { name: "Synthetic p19-service", exact: true })
        .isVisible(),
    );
    assert.equal(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations.length,
      0,
    );
    await page.screenshot({
      path: resolve(root, ".cache/phase4-published-search.png"),
      fullPage: true,
    });
    await page.goto("/en/services/unknown-service");
    await page.screenshot({
      path: resolve(root, ".cache/phase4-not-found.png"),
      fullPage: true,
    });
    await page
      .getByRole("main")
      .getByRole("heading", { level: 1 })
      .waitFor({ state: "visible" });
    await context.close();
  } finally {
    await engine.close();
  }
  check(
    "P20 actual Chromium verifies published mobile bn/en details, safe links, category/agency journeys, POST search and axe accessibility",
  );
  const revoked = await post(
    reviewers[1].client,
    `/api/v1/admin/sources/${source.id}/link-check`,
    {
      revision: source.revision,
      reason: "Request permitted check; network disabled",
    },
  );
  assert.equal(revoked.status(), 200);
  const status = await browser.get(`/api/v1/admin/sources/${source.id}`);
  assert.equal(status.status(), 200);
  const data = (await status.json()).data;
  assert.equal(data.link_health.state, "verification_blocked");
  assert.equal(data.link_checks[0].checked_at, null);
  assert.equal(
    (await browser.get(`/api/v1/sources/${source.id}`)).status(),
    404,
  );
  const integrity = await browser.get("/api/v1/admin/directory/integrity");
  assert.equal(integrity.status(), 200);
  assert.ok((await integrity.json()).data.sources_requiring_link_review >= 1);
  assert.equal(
    (
      await post(browser, `/api/v1/admin/sources/${source.id}/link-check`, {
        revision: source.revision,
        reason: "Fake",
        outcome: "healthy",
      })
    ).status(),
    400,
  );
  check(
    "P21 real HTTP records blocked checks without fetching, hides flagged source links and exposes protected integrity diagnostics",
  );
  const changed = await browser.patch(
    `/api/v1/admin/directory/services/${service.id}`,
    {
      data: { ...input, revision: service.revision, aliases: [] },
      headers: { origin: baseURL, "idempotency-key": randomUUID() },
    },
  );
  assert.equal(changed.status(), 200, await changed.text());
  assert.equal(
    (await browser.get("/api/v1/services/p19-service")).status(),
    404,
  );
  assert.equal((await search("songshodhon")).length, 0);
  assert.equal(
    (
      await db.query(
        "SELECT count(*)::int n FROM app_private.staff_audit_events WHERE record_id=$1 AND action IN ('directory_create','directory_update','directory_publish')",
        [service.id],
      )
    ).rows[0].n,
    3,
  );
  check(
    "P19/P20 real metadata edits withdraw old public rows and aliases with preserved private audit",
  );
}
