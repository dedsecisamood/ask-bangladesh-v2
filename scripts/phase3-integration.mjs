// Real loopback-only Supabase Auth + disposable PostgreSQL + HTTP BFF verification.
import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHmac } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { request } from "@playwright/test";
import pg from "pg";
import { runRegistryIntegration } from "./registry-integration.mjs";
import { runPhase4Integration } from "./phase4-integration.mjs";
import {
  seedDirectoryFixture,
  directoryIds,
} from "../database/tests/directory-fixture.mjs";
import {
  startAuth,
  gateway,
  localAuthEnvironment,
  localAuthAdmin,
} from "./auth-local.mjs";
import {
  localDatabaseUrl,
  assertDisposableName,
  root,
} from "./database-local.mjs";
function totp(secret) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const letter of secret.toUpperCase().replace(/=+$/u, ""))
    bits += alphabet.indexOf(letter).toString(2).padStart(5, "0");
  const bytes = Buffer.from(
    (bits.match(/.{8}/g) ?? []).map((b) => parseInt(b, 2)),
  );
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const hash = createHmac("sha1", bytes).update(counter).digest();
  const offset = hash[19] & 15;
  return String((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(
    6,
    "0",
  );
}
const dbName = "askbd_p14_test_" + randomUUID().replaceAll("-", "");
assertDisposableName(dbName);
let server, child, admin, db, identity, authAdmin;
const contexts = [];
const registryIdentities = [];
let passed = 0;
const check = (name) => {
  passed++;
  console.log("PASS " + name);
};
try {
  await startAuth();
  server = await gateway();
  admin = new pg.Client({ connectionString: localDatabaseUrl() });
  await admin.connect();
  await admin.query(
    `CREATE DATABASE "${dbName}" TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C'`,
  );
  const url = new URL(localDatabaseUrl());
  url.pathname = "/" + dbName;
  db = new pg.Client({ connectionString: url.toString() });
  await db.connect();
  for (const file of readdirSync(resolve(root, "database/supabase/migrations"))
    .filter((n) => n.endsWith(".sql"))
    .sort())
    await db.query(
      readFileSync(resolve(root, "database/supabase/migrations", file), "utf8"),
    );
  const env = localAuthEnvironment(3200);
  env.DIRECTORY_MODE = "published";
  for (const key of ["DATABASE_URL", "ADMIN_DATABASE_URL"]) {
    const next = new URL(env[key]);
    next.pathname = "/" + dbName;
    env[key] = next.toString();
  }
  child = spawn(
    process.execPath,
    [
      resolve(root, "node_modules/next/dist/bin/next"),
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3200",
    ],
    {
      cwd: resolve(root, "apps/web"),
      env: { ...process.env, ...env, NEXT_TELEMETRY_DISABLED: "1" },
      stdio: "ignore",
      windowsHide: true,
    },
  );
  let ready = false;
  for (let n = 0; n < 100; n++) {
    try {
      if ((await fetch(env.APP_ORIGIN + "/bn")).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  assert.ok(ready, "Test app must start");
  const browser = await request.newContext({ baseURL: env.APP_ORIGIN });
  contexts.push(browser);
  assert.equal((await browser.get("/bn")).status(), 200);
  check("public page needs no login");
  assert.equal((await browser.get("/admin")).status(), 401);
  assert.equal((await browser.get("/api/v1/admin/session")).status(), 401);
  check("anonymous admin page and direct API denied");
  for (const kind of ["services", "categories", "agencies", "sources"]) {
    const r = await browser.get(`/api/v1/${kind}`);
    assert.equal(r.status(), 200);
    assert.deepEqual((await r.json()).data, []);
  }
  check("unseeded directory APIs return honest empty results");
  await seedDirectoryFixture(db);
  for (const kind of ["services", "categories", "agencies", "sources"]) {
    const r = await browser.get(`/api/v1/${kind}`);
    assert.equal(r.status(), 200);
    const text = await r.text();
    assert.equal(JSON.parse(text).data.length, 1, kind);
    assert.ok(!text.includes("PRIVATE"));
    assert.ok(!text.includes("reviewed_by"));
    assert.ok(!text.includes("snapshot"));
  }
  for (const path of [
    "services/fixture-service",
    "categories/fixture-category",
    "agencies/fixture-agency",
    `sources/${directoryIds.source}`,
  ])
    assert.equal((await browser.get(`/api/v1/${path}`)).status(), 200);
  assert.equal(
    (await browser.get("/api/v1/services?category=fixture-category")).status(),
    200,
  );
  assert.equal((await browser.get("/api/v1/agencies/unknown")).status(), 404);
  assert.equal(
    (await browser.get(`/api/v1/sources/${randomUUID()}`)).status(),
    404,
  );
  assert.equal((await browser.get("/api/v1/services?locale=en")).status(), 200);
  check(
    "real read APIs provide reviewed collections, details and safe missing resources",
  );
  for (const query of [
    "limit=51",
    "limit=-1",
    "sort=private",
    "agency_id=invalid",
    "locale=bn&locale=en",
    "category=x%27%20OR%201%3D1",
    "q=private",
    "cursor=forged",
  ])
    assert.equal(
      (await browser.get(`/api/v1/services?${query}`)).status(),
      400,
      query,
    );
  check(
    "real APIs reject unsupported sort, malformed filters, pagination and injection input",
  );
  const extraService = "17000000-0000-4000-8000-000000000011";
  await db.query(
    "INSERT INTO app_private.services(id,slug,publication_status) VALUES($1,'fixture-service-two','published')",
    [extraService],
  );
  await db.query(
    "INSERT INTO app_private.service_translations(service_id,locale,title,review_state) VALUES($1,'bn','Synthetic pagination fixture','reviewed')",
    [extraService],
  );
  await db.query(
    "INSERT INTO app_private.metadata_releases(service_id,locale,record_revision,translation_revision,created_by,reviewed_by,reviewer_revision,reviewed_at,expires_at) VALUES($1,'bn',1,1,$2,$3,1,statement_timestamp(),statement_timestamp()+interval '1 day')",
    [extraService, directoryIds.creator, directoryIds.reviewer],
  );
  const first = await (await browser.get("/api/v1/services?limit=1")).json();
  assert.equal(first.data.length, 1);
  assert.ok(first.meta.next_cursor);
  const next = await (
    await browser.get(
      "/api/v1/services?limit=1&cursor=" +
        encodeURIComponent(first.meta.next_cursor),
    )
  ).json();
  assert.equal(next.data.length, 1);
  assert.notEqual(next.data[0].id, first.data[0].id);
  assert.equal(next.meta.next_cursor, null);
  assert.equal(
    (
      await browser.get(
        "/api/v1/services?locale=en&limit=1&cursor=" +
          encodeURIComponent(first.meta.next_cursor),
      )
    ).status(),
    400,
  );
  await db.query(
    "UPDATE app_private.metadata_releases SET withdrawn_at=statement_timestamp() WHERE service_id=$1",
    [extraService],
  );
  assert.equal(
    (
      await browser.get(
        "/api/v1/services?limit=1&cursor=" +
          encodeURIComponent(first.meta.next_cursor),
      )
    ).status(),
    400,
  );
  check(
    "real cursor pagination binds filters and invalidates on publication changes",
  );
  await db.query(
    "REVOKE EXECUTE ON FUNCTION app_public.directory_search(text,text,uuid,integer,text,uuid,text,text,uuid) FROM askbd_web",
  );
  const unavailable = await browser.get("/api/v1/services");
  assert.equal(unavailable.status(), 503);
  const unavailableBody = await unavailable.text();
  assert.ok(!unavailableBody.includes('"data"'));
  assert.ok(!unavailableBody.includes("postgres"));
  await db.query(
    "GRANT EXECUTE ON FUNCTION app_public.directory_search(text,text,uuid,integer,text,uuid,text,text,uuid) TO askbd_web",
  );
  assert.equal(
    (
      await browser.post("/api/v1/services", {
        data: { publication_status: "published" },
      })
    ).status(),
    405,
  );
  check(
    "real DB permission failure is sanitized as 503 and public mutations are disabled",
  );
  const email = `p16-${randomUUID()}@example.invalid`,
    password = randomBytes(32).toString("hex");
  authAdmin = localAuthAdmin();
  const created = await authAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error)
    throw new Error("Synthetic local provider identity creation failed");
  identity = created.data.user.id;
  const post = (path, form, origin = env.APP_ORIGIN) =>
    browser.post(path, { form, headers: { origin }, maxRedirects: 0 });
  assert.equal(
    (await post("/admin/sign-in", { email, password })).status(),
    403,
  );
  check("nonmember login cannot acquire staff access");
  await db.query(
    "INSERT INTO app_private.admin_memberships(auth_user_id,role,status) VALUES($1,'owner','active')",
    [identity],
  );
  assert.equal(
    (
      await post(
        "/admin/sign-in",
        { email, password },
        "https://attacker.invalid",
      )
    ).status(),
    403,
  );
  check("cross-origin login rejected");
  const invalidLogin = await post("/admin/sign-in", {
    email,
    password: "incorrect",
  });
  assert.equal(
    invalidLogin.status(),
    401,
    JSON.stringify(await invalidLogin.json()),
  );
  check("invalid password rejected");
  const login = await post("/admin/sign-in", { email, password });
  assert.equal(login.status(), 303);
  const cookieHeaders = login
    .headersArray()
    .filter((h) => h.name.toLowerCase() === "set-cookie")
    .map((h) => h.value);
  assert.ok(
    cookieHeaders.length &&
      cookieHeaders.every(
        (c) => /httponly/i.test(c) && /samesite=strict/i.test(c),
      ),
  );
  check("login writes HttpOnly SameSite cookies");
  assert.equal((await browser.get("/admin")).status(), 403);
  check("password-only session cannot enter admin");
  const enrolled = await post("/admin/enroll", {});
  assert.equal(enrolled.status(), 200);
  const html = await enrolled.text();
  const secret = /<code>([A-Z2-7]+)<\/code>/.exec(html)?.[1];
  const factor = /name="factor_id" value="([a-f0-9-]+)"/.exec(html)?.[1];
  assert.ok(secret && factor);
  assert.equal(
    (await post("/admin/mfa", { factor_id: factor, code: "abc" })).status(),
    400,
  );
  const verified = await post("/admin/mfa", {
    factor_id: factor,
    code: totp(secret),
  });
  assert.equal(verified.status(), 303);
  check("real Supabase TOTP enrollment and verification");
  assert.equal((await browser.get("/admin")).status(), 200);
  const sessionResponse = await browser.get("/api/v1/admin/session");
  assert.deepEqual(await sessionResponse.json(), { data: { role: "owner" } });
  assert.match(sessionResponse.headers()["cache-control"], /no-store/);
  check(
    "MFA session authorizes protected HTML and API without private identity leakage",
  );
  const forged = await request.newContext({
    // Malformed provider cookie cannot be combined with an invented role.
    baseURL: env.APP_ORIGIN,
    extraHTTPHeaders: { cookie: "askbd-auth=forged-owner" },
  });
  contexts.push(forged);
  assert.equal((await forged.get("/api/v1/admin/session")).status(), 401);
  check("forged session cookie rejected");
  const inspected = await browser.get(
    `/api/v1/admin/records/domains/${directoryIds.domain}`,
  );
  assert.equal(inspected.status(), 200);
  assert.ok(!(await inspected.text()).includes("PRIVATE"));
  check("authorized staff inspection works without notes or snapshot leakage");
  const registryState = await runRegistryIntegration({
    db,
    browser,
    baseURL: env.APP_ORIGIN,
    authAdmin,
    totp,
    contexts,
    identities: registryIdentities,
    check,
  });
  await runPhase4Integration({
    db,
    browser,
    baseURL: env.APP_ORIGIN,
    ...registryState,
    check,
  });
  const cookieState = await browser.storageState();
  const noBinding = await request.newContext({
    baseURL: env.APP_ORIGIN,
    extraHTTPHeaders: {
      cookie: cookieState.cookies
        .filter((c) => c.name !== "askbd-staff")
        .map((c) => `${c.name}=${c.value}`)
        .join("; "),
    },
  });
  contexts.push(noBinding);
  assert.equal((await noBinding.get("/admin")).status(), 403);
  check("provider cookies alone cannot bypass the BFF session binding");
  const memberId = (
    await db.query(
      "SELECT id FROM app_private.admin_memberships WHERE auth_user_id=$1",
      [identity],
    )
  ).rows[0].id;
  await db.query(
    "UPDATE app_private.staff_sessions SET last_seen_at=statement_timestamp()-interval '31 minutes' WHERE membership_id=$1",
    [memberId],
  );
  assert.equal((await browser.get("/admin")).status(), 403);
  await db.query(
    "UPDATE app_private.staff_sessions SET last_seen_at=statement_timestamp() WHERE membership_id=$1",
    [memberId],
  );
  await db.query(
    "UPDATE app_private.admin_memberships SET status='revoked' WHERE id=$1",
    [memberId],
  );
  assert.equal((await browser.get("/admin")).status(), 403);
  assert.equal(
    (
      await browser.get(`/api/v1/admin/records/domains/${directoryIds.domain}`)
    ).status(),
    403,
  );
  check("real HTTP requests deny idle expiry and revoked membership");
  await new Promise((r) => server.close(r));
  server = undefined;
  assert.equal((await post("/admin/logout", {})).status(), 303);
  assert.ok(
    (
      await db.query(
        "SELECT revoked_at FROM app_private.staff_sessions WHERE membership_id=$1",
        [memberId],
      )
    ).rows[0].revoked_at,
  );
  server = await gateway();
  assert.equal((await browser.get("/admin")).status(), 401);
  check("logout revokes BFF session and provider cookies");
  // Real DB capability/expiry/revocation coverage is in staff.cases.mjs.
  console.log(
    `Phase 3 integration: ${passed} checks passed; no real user or remote identity used.`,
  );
} catch (error) {
  console.error(
    "Phase 3 integration failed: " +
      (error instanceof assert.AssertionError
        ? error.message
        : "runtime/provider failure (raw diagnostics withheld)"),
  );
  process.exitCode = 1;
} finally {
  for (const ctx of contexts) await ctx.dispose();
  if (child) {
    if (process.platform === "win32")
      spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
    else child.kill("SIGTERM");
    await new Promise((r) => {
      if (child.exitCode !== null || child.signalCode !== null) r();
      else {
        child.once("exit", r);
        setTimeout(r, 3000);
      }
    });
  }
  if (identity && authAdmin) await authAdmin.auth.admin.deleteUser(identity);
  if (authAdmin)
    for (const id of registryIdentities)
      await authAdmin.auth.admin.deleteUser(id);
  if (db) await db.end();
  if (admin) {
    assertDisposableName(dbName);
    await admin.query(`DROP DATABASE IF EXISTS "${dbName}"`);
    await admin.end();
  }
  if (server) await new Promise((r) => server.close(r));
}
