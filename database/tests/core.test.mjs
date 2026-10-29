import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";
import { registerEvidenceTests } from "./evidence.cases.mjs";
import { registerStaffTests } from "./staff.cases.mjs";
import { registerDirectoryTests } from "./directory.cases.mjs";
import { registerRegistryTests } from "./registry.cases.mjs";
import { registerPhase4Tests } from "./phase4.cases.mjs";
import { registerCrawlerTests } from "./crawler.cases.mjs";
import { registerKeywordTests } from "./keyword.cases.mjs";
import { registerRetrievalTests } from "./retrieval.cases.mjs";
import { registerAnswerTests } from "./answers.cases.mjs";
import { registerFeedbackTests } from "./feedback.cases.mjs";
import {
  root,
  localDatabaseUrl,
  assertDisposableConnection,
  assertDisposableName,
} from "../../scripts/database-local.mjs";

let admin;
let pool;
const created = [];
const names = () => "askbd_p14_test_" + randomUUID().replaceAll("-", "");
const migrationDir = resolve(root, "database/supabase/migrations");
const migrations = readdirSync(migrationDir)
  .filter((name) => /^\d{14}_.+\.sql$/u.test(name))
  .sort();
const fixtures = readFileSync(
  resolve(root, "database/seeds/p14.synthetic.sql"),
  "utf8",
);
const agency = "14000000-0000-4000-8000-000000000001";
const category = "14000000-0000-4000-8000-000000000002";
const service = "14000000-0000-4000-8000-000000000003";
const missing = "14000000-0000-4000-8000-000000000099";
let base;
async function createDisposable() {
  const name = names();
  assertDisposableName(name);
  // Identifiers are generated locally from UUID hex, never supplied by a caller.
  await admin.query(
    `CREATE DATABASE "${name}" TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C'`,
  );
  created.push(name);
  const url = new URL(base);
  url.pathname = "/" + name;
  const client = new pg.Client({
    connectionString: url.toString(),
    connectionTimeoutMillis: 2000,
  });
  await client.connect();
  try {
    for (const file of migrations) {
      await client.query("BEGIN");
      try {
        await client.query(readFileSync(resolve(migrationDir, file), "utf8"));
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client.end();
  }
  return url.toString();
}
before(async () => {
  base = localDatabaseUrl();
  assertDisposableConnection(base);
  admin = new pg.Client({
    connectionString: base,
    connectionTimeoutMillis: 2000,
  });
  await admin.connect();
  const history = await admin.query(
    "SELECT version FROM supabase_migrations.schema_migrations WHERE version = $1",
    ["20261019000100"],
  );
  assert.equal(
    history.rowCount,
    1,
    "Supabase CLI must have actually applied the migration before isolated replay tests",
  );
  const url = await createDisposable();
  pool = new pg.Pool({
    connectionString: url,
    max: 3,
    connectionTimeoutMillis: 2000,
  });
});
after(async () => {
  if (pool) await pool.end();
  if (admin) {
    try {
      for (const name of created) {
        assertDisposableName(name);
        assertDisposableConnection(base);
        await admin.query(`DROP DATABASE "${name}"`);
      }
    } finally {
      await admin.end();
    }
  }
});
async function transaction(work) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(fixtures);
    await work(client);
  } finally {
    await client.query("ROLLBACK");
    client.release();
  }
}
async function rejects(client, sql, values, code) {
  await client.query("SAVEPOINT expected_rejection");
  await assert.rejects(
    client.query(sql, values),
    (error) => error.code === code,
  );
  await client.query("ROLLBACK TO SAVEPOINT expected_rejection");
}
test("all ten private core tables are migrated with RLS and no public API grants", async () => {
  const result = await pool.query(
    "SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='app_private' AND c.relkind='r' AND c.relname IN ('agencies','agency_translations','categories','category_translations','services','service_translations','service_categories','service_agencies','service_aliases','official_domains')",
  );
  assert.equal(result.rowCount, 10);
  assert.ok(
    result.rows.every((row) => row.relrowsecurity && row.relforcerowsecurity),
  );
});
test("migration replay is reproducible on a second independently created empty database", async () => {
  const url = await createDisposable();
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  const sql =
    "SELECT table_name, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema='app_private' ORDER BY table_name, ordinal_position";
  try {
    assert.deepEqual(
      (await client.query(sql)).rows,
      (await pool.query(sql)).rows,
    );
  } finally {
    await client.end();
  }
});
test("required fields, unique slugs and invalid statuses are enforced", async () =>
  transaction(async (client) => {
    await rejects(
      client,
      "INSERT INTO app_private.services DEFAULT VALUES",
      [],
      "23502",
    );
    await rejects(
      client,
      "INSERT INTO app_private.services (slug) VALUES ($1)",
      ["synthetic-test-service"],
      "23505",
    );
    await rejects(
      client,
      "INSERT INTO app_private.categories (slug) VALUES ($1)",
      ["synthetic-test-category"],
      "23505",
    );
    await rejects(
      client,
      "INSERT INTO app_private.agencies (slug) VALUES ($1)",
      ["synthetic-test-agency"],
      "23505",
    );
    await rejects(
      client,
      "UPDATE app_private.services SET publication_status=$1 WHERE id=$2",
      ["verified", service],
      "23514",
    );
    await rejects(
      client,
      "INSERT INTO app_private.services (slug) VALUES ($1)",
      ["Bad Slug"],
      "23514",
    );
  }));
test("service-category and multiple service-agency relationships have foreign keys and unique pairs", async () =>
  transaction(async (client) => {
    await rejects(
      client,
      "INSERT INTO app_private.service_categories VALUES ($1,$2,DEFAULT)",
      [service, missing],
      "23503",
    );
    await rejects(
      client,
      "INSERT INTO app_private.service_categories VALUES ($1,$2,DEFAULT)",
      [service, category],
      "23505",
    );
    await rejects(
      client,
      "INSERT INTO app_private.service_agencies (service_id,agency_id) VALUES ($1,$2)",
      [service, missing],
      "23503",
    );
    await client.query(
      "INSERT INTO app_private.agencies (id,slug,is_synthetic) VALUES ($1,$2,true)",
      [missing, "second-synthetic-agency"],
    );
    await client.query(
      "INSERT INTO app_private.service_agencies (service_id,agency_id,relationship) VALUES ($1,$2,'supporting')",
      [service, missing],
    );
    assert.equal(
      (
        await client.query(
          "SELECT 1 FROM app_private.service_agencies WHERE service_id=$1",
          [service],
        )
      ).rowCount,
      2,
    );
    await rejects(
      client,
      "DELETE FROM app_private.categories WHERE id=$1",
      [category],
      "23503",
    );
    await rejects(
      client,
      "DELETE FROM app_private.agencies WHERE id=$1",
      [agency],
      "23503",
    );
  }));
test("bilingual translations retain missing locales as unknown and enforce valid parents/locales", async () =>
  transaction(async (client) => {
    assert.equal(
      (
        await client.query(
          "SELECT name FROM app_private.agency_translations WHERE agency_id=$1 AND locale='bn'",
          [agency],
        )
      ).rowCount,
      1,
    );
    assert.equal(
      (
        await client.query(
          "SELECT 1 FROM app_private.service_translations WHERE service_id=$1 AND locale='bn'",
          [service],
        )
      ).rowCount,
      0,
    );
    await rejects(
      client,
      "INSERT INTO app_private.service_translations(service_id,locale,title) VALUES ($1,'bn','Synthetic')",
      [missing],
      "23503",
    );
    await rejects(
      client,
      "INSERT INTO app_private.service_translations(service_id,locale,title) VALUES ($1,'banglish','Synthetic')",
      [service],
      "23514",
    );
    await rejects(
      client,
      "INSERT INTO app_private.service_translations(service_id,locale,title) VALUES ($1,'bn','   ')",
      [service],
      "23514",
    );
  }));
test("synthetic records cannot be published or asserted officially verified", async () =>
  transaction(async (client) => {
    for (const table of ["services", "categories", "agencies"])
      await rejects(
        client,
        `UPDATE app_private.${table} SET publication_status='published'`,
        [],
        "23514",
      );
    await rejects(
      client,
      "UPDATE app_private.official_domains SET authenticity_status='verified'",
      [],
      "23514",
    );
    await rejects(
      client,
      "UPDATE app_private.official_domains SET content_authority_status='approved'",
      [],
      "23514",
    );
    await rejects(
      client,
      "UPDATE app_private.official_domains SET crawl_permission_status='allowed'",
      [],
      "23514",
    );
    await rejects(
      client,
      "UPDATE app_private.services SET is_synthetic=false",
      [],
      "23514",
    );
  }));
test("domain identity is unique and distinct from permission, authority and unknown verification time", async () =>
  transaction(async (client) => {
    const result = await client.query(
      "SELECT * FROM app_private.official_domains",
    );
    assert.equal(result.rows[0].verified_at, null);
    assert.equal(result.rows[0].crawl_permission_status, "unknown");
    assert.equal(result.rows[0].content_authority_status, "unknown");
    await rejects(
      client,
      "INSERT INTO app_private.official_domains(agency_id,hostname) VALUES ($1,$2)",
      [agency, "synthetic.example.invalid"],
      "23505",
    );
    for (const hostname of [
      "https://example.invalid",
      "EXAMPLE.invalid",
      "127.0.0.1",
      "example.invalid/path",
    ])
      await rejects(
        client,
        "INSERT INTO app_private.official_domains(agency_id,hostname) VALUES ($1,$2)",
        [agency, hostname],
        "23514",
      );
    await rejects(
      client,
      "INSERT INTO app_private.official_domains(agency_id,hostname) VALUES ($1,'other.example.invalid')",
      [missing],
      "23503",
    );
  }));
test("Bangla/Banglish/English aliases use NFC/lowercase normalization with duplicate protection", async () =>
  transaction(async (client) => {
    await rejects(
      client,
      "INSERT INTO app_private.service_aliases(service_id,alias,language) VALUES ($1,' SYNTHETIC ALIAS ','en')",
      [service],
      "23505",
    );
    for (const [alias, language] of [
      ["পরীক্ষার বিষয়", "bn"],
      ["porikkhar bishoy", "banglish"],
    ])
      await client.query(
        "INSERT INTO app_private.service_aliases(service_id,alias,language) VALUES ($1,$2,$3)",
        [service, alias, language],
      );
    await rejects(
      client,
      "INSERT INTO app_private.service_aliases(service_id,alias,language) VALUES ($1,'synthetic','fr')",
      [service],
      "23514",
    );
    await client.query(
      "INSERT INTO app_private.service_aliases(service_id,alias,language) VALUES ($1,$2,'en')",
      [service, "e\u0301"],
    );
    await rejects(
      client,
      "INSERT INTO app_private.service_aliases(service_id,alias,language) VALUES ($1,$2,'en')",
      [service, "é"],
      "23505",
    );
  }));
test("agency/category hierarchies reject self-parent and multi-level cycles", async () =>
  transaction(async (client) => {
    for (const [table, parent, id] of [
      ["agencies", "parent_agency_id", agency],
      ["categories", "parent_category_id", category],
    ]) {
      await rejects(
        client,
        `UPDATE app_private.${table} SET ${parent}=$1 WHERE id=$1`,
        [id],
        "23514",
      );
      await client.query(
        `INSERT INTO app_private.${table}(id,slug,${parent},is_synthetic) VALUES ($1,$2,$3,true)`,
        [missing, "synthetic-child", id],
      );
      await rejects(
        client,
        `UPDATE app_private.${table} SET ${parent}=$1 WHERE id=$2`,
        [missing, id],
        "23514",
      );
    }
  }));
test("editorial revisions advance, identities remain stable and creation time cannot be rewritten", async () =>
  transaction(async (client) => {
    const before = (
      await client.query(
        "SELECT revision,created_at FROM app_private.services WHERE id=$1",
        [service],
      )
    ).rows[0];
    await client.query(
      "UPDATE app_private.services SET slug=$1,revision=99,created_at='2000-01-01' WHERE id=$2",
      ["synthetic-renamed-service", service],
    );
    const after = (
      await client.query(
        "SELECT revision,created_at FROM app_private.services WHERE id=$1",
        [service],
      )
    ).rows[0];
    assert.equal(after.revision, String(BigInt(before.revision) + 1n));
    assert.equal(
      after.created_at.toISOString(),
      before.created_at.toISOString(),
    );
    await rejects(
      client,
      "UPDATE app_private.services SET id=$1 WHERE id=$2",
      [missing, service],
      "23514",
    );
  }));
test("web, anonymous, authenticated and service API roles cannot read or modify private records", async () =>
  transaction(async (client) => {
    for (const role of ["askbd_web", "anon", "authenticated", "service_role"]) {
      // Role names are a fixed test allowlist, not user input.
      // Supabase's postgres role is not a superuser. Grant SET only for this
      // rolled-back transaction so the test actually exercises the target role.
      await client.query(
        `GRANT ${role} TO postgres WITH INHERIT FALSE, SET TRUE`,
      );
      await client.query(`SET LOCAL ROLE ${role}`);
      await rejects(client, "SELECT * FROM app_private.services", [], "42501");
      await rejects(
        client,
        "INSERT INTO app_private.agencies(slug) VALUES ('private-write-attempt')",
        [],
        "42501",
      );
      await client.query("RESET ROLE");
    }
  }));

test("concurrent opposite-parent writes cannot commit an agency cycle", async () => {
  const ids = [randomUUID(), randomUUID()];
  await pool.query(
    "INSERT INTO app_private.agencies(id,slug,is_synthetic) VALUES ($1,$2,true),($3,$4,true)",
    [ids[0], "synthetic-a-" + ids[0], ids[1], "synthetic-b-" + ids[1]],
  );
  const first = await pool.connect();
  const second = await pool.connect();
  try {
    await first.query("BEGIN");
    await second.query("BEGIN");
    const secondPid = (await second.query("SELECT pg_backend_pid() AS pid"))
      .rows[0].pid;
    await first.query(
      "UPDATE app_private.agencies SET parent_agency_id=$1 WHERE id=$2",
      [ids[1], ids[0]],
    );
    const pending = second
      .query(
        "UPDATE app_private.agencies SET parent_agency_id=$1 WHERE id=$2",
        [ids[0], ids[1]],
      )
      .then(
        () => ({ succeeded: true }),
        (error) => ({ succeeded: false, code: error.code }),
      );
    const deadline = Date.now() + 3000;
    let blocked = false;
    while (Date.now() < deadline) {
      blocked = (
        await first.query(
          "SELECT cardinality(pg_blocking_pids($1)) > 0 AS blocked",
          [secondPid],
        )
      ).rows[0].blocked;
      if (blocked) break;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    assert.equal(
      blocked,
      true,
      "Second writer must actually contend, not just run sequentially",
    );
    await first.query("COMMIT");
    const outcome = await pending;
    assert.equal(outcome.succeeded, false);
    assert.equal(outcome.code, "23514");
    await second.query("ROLLBACK");
  } finally {
    await first.query("ROLLBACK");
    await second.query("ROLLBACK");
    first.release();
    second.release();
    await pool.query(
      "UPDATE app_private.agencies SET parent_agency_id=NULL WHERE id=ANY($1::uuid[])",
      [ids],
    );
    await pool.query(
      "DELETE FROM app_private.agencies WHERE id=ANY($1::uuid[])",
      [ids],
    );
  }
});

registerEvidenceTests({
  test,
  transaction,
  rejects,
  query: (...args) => pool.query(...args),
});
registerStaffTests({ test, transaction, rejects });
registerDirectoryTests({ test, transaction, rejects });
registerRegistryTests({ test, transaction, rejects });
registerPhase4Tests({ test, transaction, rejects });
registerKeywordTests({ test, transaction, rejects });
registerRetrievalTests({ test, transaction, rejects });
registerAnswerTests({ test, transaction, rejects });
registerFeedbackTests({ test, transaction, rejects });
registerCrawlerTests({
  test,
  transaction,
  rejects,
  testDatabaseUrl: () => pool.options.connectionString,
  committed: async (work) => {
    const client = await pool.connect();
    try {
      await work(client);
    } finally {
      client.release();
    }
  },
});
