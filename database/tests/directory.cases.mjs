import assert from "node:assert/strict";
import {
  seedDirectoryFixture,
  directoryIds as i,
} from "./directory-fixture.mjs";
export function registerDirectoryTests({ test, transaction, rejects }) {
  const scenario = (name, work) =>
    test(name, () =>
      transaction(async (c) => {
        await seedDirectoryFixture(c);
        await work(c);
      }),
    );
  scenario(
    "P17 relationship changes need renewed review and source domains cannot be retargeted",
    async (c) => {
      await c.query(
        "DELETE FROM app_private.service_categories WHERE service_id=$1",
        [i.service],
      );
      assert.equal(
        (await c.query("SELECT app_public.directory('services','bn') result"))
          .rows[0].result.items.length,
        0,
      );
      await rejects(
        c,
        "UPDATE app_private.official_domains SET hostname='changed.example.invalid' WHERE id=$1",
        [i.domain],
        "23514",
      );
    },
  );
  const read = async (
    c,
    kind = "services",
    locale = "bn",
    category = null,
    agency = null,
  ) =>
    (
      await c.query(
        "SELECT app_public.directory($1,$2,NULL,20,$3,$4,NULL) result",
        [kind, locale, category, agency],
      )
    ).rows[0].result;
  scenario(
    "P17 public projections expose only allowlisted reviewed metadata",
    async (c) => {
      await c.query("GRANT askbd_web TO postgres WITH INHERIT FALSE, SET TRUE");
      await c.query("SET LOCAL ROLE askbd_web");
      for (const kind of ["agencies", "categories", "services", "sources"]) {
        const data = await read(c, kind);
        assert.equal(data.items.length, 1, kind);
        const serialized = JSON.stringify(data);
        assert.ok(!serialized.includes("PRIVATE"));
        assert.ok(!serialized.includes("reviewed_by"));
        assert.ok(!serialized.includes("snapshot"));
      }
      await rejects(
        c,
        "SELECT * FROM app_private.public_service_metadata",
        [],
        "42501",
      );
      await rejects(
        c,
        "INSERT INTO app_private.metadata_releases DEFAULT VALUES",
        [],
        "42501",
      );
      await c.query("RESET ROLE");
    },
  );
  scenario(
    "P17 draft, missing translation and metadata changes fail closed",
    async (c) => {
      assert.equal((await read(c, "services", "en")).items.length, 0);
      await c.query(
        "UPDATE app_private.services SET publication_status='draft' WHERE id=$1",
        [i.service],
      );
      assert.equal((await read(c)).items.length, 0);
      await c.query(
        "UPDATE app_private.services SET publication_status='published' WHERE id=$1",
        [i.service],
      );
      assert.equal(
        (await read(c)).items.length,
        0,
        "old release cannot approve changed revisions",
      );
    },
  );
  scenario(
    "P17 withdrawal, review expiry and reviewer revocation remove public rows",
    async (c) => {
      const before = (await read(c)).generation;
      await c.query(
        "UPDATE app_private.metadata_releases SET withdrawn_at=statement_timestamp() WHERE service_id=$1",
        [i.service],
      );
      const after = await read(c);
      assert.equal(after.items.length, 0);
      assert.notEqual(before, after.generation);
      await c.query(
        "UPDATE app_private.metadata_releases SET reviewed_at=statement_timestamp()-interval '2 days',expires_at=statement_timestamp()-interval '1 day' WHERE category_id=$1",
        [i.category],
      );
      assert.equal((await read(c, "categories")).items.length, 0);
      await c.query(
        "UPDATE app_private.admin_memberships SET status='revoked' WHERE id=$1",
        [i.reviewer],
      );
      assert.equal((await read(c, "agencies")).items.length, 0);
      assert.equal((await read(c, "sources")).items.length, 0);
    },
  );
  scenario(
    "P17 source suspension and adverse checks override previous approval",
    async (c) => {
      assert.equal((await read(c, "sources")).items.length, 1);
      await c.query(
        "INSERT INTO app_private.source_checks(source_id,document_id,attempted_at,outcome,error_code) VALUES($1,$2,statement_timestamp(),'unavailable','FIXTURE_UNAVAILABLE')",
        [i.source, i.document],
      );
      assert.equal((await read(c, "sources")).items.length, 0);
    },
  );
  scenario(
    "P17 category/agency filtering and limits use bounded reviewed relationships",
    async (c) => {
      assert.equal(
        (await read(c, "services", "bn", "fixture-category", i.agency)).items
          .length,
        1,
      );
      assert.equal(
        (await read(c, "services", "bn", "unknown")).items.length,
        0,
      );
      await rejects(
        c,
        "SELECT app_public.directory('services','bn',NULL,51)",
        [],
        "22023",
      );
    },
  );
  scenario(
    "P17 staff inspection requires both trusted session and opaque binding",
    async (c) => {
      const sid = "17000000-0000-4000-8000-999999999999",
        hash = "b".repeat(64);
      await c.query("SELECT app_staff.open_bound_session($1,$2,$3)", [
        i.reviewer,
        sid,
        hash,
      ]);
      await c.query(
        "GRANT askbd_staff TO postgres WITH INHERIT FALSE, SET TRUE",
      );
      await c.query("SET LOCAL ROLE askbd_staff");
      await rejects(
        c,
        "SELECT app_staff.inspect_record($1,$2,$3,'domains',$4)",
        [i.reviewer, sid, "x", i.domain],
        "42501",
      );
      const r = await c.query(
        "SELECT app_staff.inspect_record($1,$2,$3,'domains',$4) data",
        [i.reviewer, sid, hash, i.domain],
      );
      assert.equal(r.rows[0].data.hostname, "p17.example.invalid");
      assert.ok(!JSON.stringify(r.rows[0]).includes("PRIVATE"));
      await c.query("RESET ROLE");
    },
  );
}
