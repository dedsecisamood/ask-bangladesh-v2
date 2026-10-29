import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  seedDirectoryFixture,
  directoryIds as i,
} from "./directory-fixture.mjs";
import { registryProof } from "./registry.cases.mjs";
export function registerPhase4Tests({ test, transaction, rejects }) {
  const scenario = (name, work) =>
    test(name, () =>
      transaction(async (c) => {
        await seedDirectoryFixture(c);
        const sessions = [randomUUID(), randomUUID()];
        const hashes = ["1".repeat(64), "2".repeat(64)];
        for (const [n, user] of [i.creator, i.reviewer].entries())
          await c.query("SELECT app_staff.open_bound_session($1,$2,$3)", [
            user,
            sessions[n],
            hashes[n],
          ]);
        await c.query(
          "GRANT askbd_staff,askbd_web TO postgres WITH INHERIT FALSE, SET TRUE",
        );
        const command = async (
          n,
          kind,
          action,
          id,
          payload,
          revision = null,
          key = randomUUID(),
        ) => {
          await c.query("SET LOCAL ROLE askbd_staff");
          try {
            return (
              await c.query(
                "SELECT app_staff.directory_command($1,$2,$3,$4,$5,$6,$7,$8,$9) r",
                [
                  [i.creator, i.reviewer][n],
                  sessions[n],
                  hashes[n],
                  kind,
                  action,
                  id,
                  payload,
                  revision,
                  key,
                ],
              )
            ).rows[0].r;
          } finally {
            await c.query("RESET ROLE");
          }
        };
        const metadata = {
          slug: "p19-test",
          translations: [
            { locale: "bn", name: "কৃত্রিম পরীক্ষামূলক সেবা" },
            { locale: "en", name: "Synthetic test service" },
          ],
          reason: "Synthetic fixture only",
        };
        const service = {
          ...metadata,
          primary_category_id: i.category,
          category_ids: [i.category],
          agencies: [{ id: i.agency, relationship: "responsible" }],
          source_ids: [i.source],
          aliases: [
            { alias: "NID   songshodhon", language: "banglish" },
            { alias: "এনআইডি সংশোধন", language: "bn" },
            { alias: "Passport renew", language: "en" },
            { alias: "Jomir khajna", language: "banglish" },
          ],
        };
        const create = (kind = "services", input = service) =>
          command(0, kind, "create", null, input);
        const publish = (s) =>
          command(
            1,
            "services",
            "publish",
            s.id,
            { reason: "Synthetic review", proof: registryProof().ownership },
            s.revision,
          );
        const query = async (q = "", category = null, agency = null) =>
          (
            await c.query(
              "SELECT app_public.directory_search('services','bn',NULL,20,$1,$2,NULL,$3) r",
              [category, agency, q],
            )
          ).rows[0].r.items;
        await work({
          c,
          command,
          metadata,
          service,
          create,
          publish,
          query,
          sessions,
          hashes,
        });
      }),
    );
  scenario(
    "P19 manages bilingual agencies/categories with independent evidenced publication",
    async ({ c, command, metadata }) => {
      for (const kind of ["agencies", "categories"]) {
        const draft = await command(0, kind, "create", null, metadata);
        assert.ok(draft.id, JSON.stringify(draft));
        assert.equal(
          (
            await command(
              0,
              kind,
              "publish",
              draft.id,
              { reason: "Self review", proof: registryProof().ownership },
              draft.revision,
            )
          ).error_code,
          "INDEPENDENT_REVIEW_REQUIRED",
        );
        const approved = await command(
          1,
          kind,
          "publish",
          draft.id,
          {
            reason: "Reviewed synthetic identity",
            proof: registryProof().ownership,
          },
          draft.revision,
        );
        assert.ok(approved.id, JSON.stringify(approved));
        assert.equal(
          (await c.query("SELECT app_public.directory($1,'bn') r", [kind]))
            .rows[0].r.items.length,
          2,
        );
        assert.equal(
          (await c.query("SELECT app_public.directory($1,'en') r", [kind]))
            .rows[0].r.items.length,
          1,
        );
        assert.ok(
          (
            await command(
              0,
              kind,
              "withdraw",
              draft.id,
              { reason: "Withdraw" },
              approved.revision,
            )
          ).id,
        );
        assert.equal(
          (await c.query("SELECT app_public.directory($1,'en') r", [kind]))
            .rows[0].r.items.length,
          0,
        );
      }
    },
  );
  scenario(
    "P19 service relationships and reviewed aliases publish only after independent review",
    async ({ c, create, publish, query }) => {
      const draft = await create();
      assert.ok(draft.id, JSON.stringify(draft));
      assert.equal((await query("songshodhon")).length, 0);
      const approved = await publish(draft);
      assert.ok(approved.id, JSON.stringify(approved));
      for (const q of [
        "NID songshodhon",
        "  nid   SONGSHODHON  ",
        "এনআইডি সংশোধন",
        "passport renew",
        "Jomir khajna",
        "Synthetic test category",
        "Synthetic test agency",
      ])
        assert.ok(
          (await query(q)).some((s) => s.id === draft.id),
          q,
        );
      assert.equal(
        (
          await c.query(
            "SELECT alias,normalized_alias,review_state FROM app_private.service_aliases WHERE service_id=$1 AND language='banglish' ORDER BY alias",
            [draft.id],
          )
        ).rows.some(
          (a) =>
            a.normalized_alias === "nid songshodhon" &&
            a.review_state === "reviewed",
        ),
        true,
      );
      assert.ok(
        (await query("", "fixture-category", i.agency)).some(
          (s) => s.id === draft.id,
        ),
      );
      assert.equal((await query("", "unknown-category", i.agency)).length, 0);
    },
  );
  scenario(
    "P19 duplicate identities, invalid relations, self review and missing evidence fail atomically",
    async ({ c, command, create, service, publish }) => {
      const key = randomUUID(),
        draft = await command(
          0,
          "services",
          "create",
          null,
          service,
          null,
          key,
        );
      assert.ok(draft.id, JSON.stringify(draft));
      assert.deepEqual(
        await command(0, "services", "create", null, service, null, key),
        draft,
      );
      assert.equal((await create()).error_code, "DUPLICATE_RECORD");
      assert.equal(
        (
          await command(
            1,
            "services",
            "publish",
            draft.id,
            { reason: "No proof" },
            draft.revision,
          )
        ).error_code,
        "INVALID_REQUEST",
      );
      assert.equal(
        (
          await command(
            0,
            "services",
            "publish",
            draft.id,
            { reason: "Self", proof: registryProof().ownership },
            draft.revision,
          )
        ).error_code,
        "INDEPENDENT_REVIEW_REQUIRED",
      );
      assert.equal(
        (await command(0, "services", "update", draft.id, service, "999"))
          .error_code,
        "REVISION_CONFLICT",
      );
      assert.equal(
        (
          await create("services", {
            ...service,
            slug: "bad-parent",
            category_ids: [randomUUID()],
            primary_category_id: randomUUID(),
          })
        ).error_code,
        "INVALID_REQUEST",
      );
      assert.equal(
        (
          await create("services", {
            ...service,
            slug: "missing-agency",
            agencies: [{ id: randomUUID(), relationship: "responsible" }],
          })
        ).error_code,
        "INVALID_RELATIONSHIP",
      );
      await c.query(
        "UPDATE app_private.sources SET status='suspended' WHERE id=$1",
        [i.source],
      );
      assert.equal((await publish(draft)).error_code, "INVALID_REQUEST");
      assert.equal(
        (
          await c.query(
            "SELECT count(*)::int n FROM app_private.services WHERE slug IN ('bad-parent','missing-agency')",
          )
        ).rows[0].n,
        0,
      );
    },
  );
  scenario(
    "P19 edits and alias changes invalidate previous releases and preserve immutable review audit",
    async ({ c, command, service, create, publish, query }) => {
      let s = await publish(await create());
      assert.ok(s.id, JSON.stringify(s));
      const changed = await command(
        0,
        "services",
        "update",
        s.id,
        {
          ...service,
          aliases: [{ alias: "New private alias", language: "en" }],
        },
        s.revision,
      );
      assert.ok(changed.id, JSON.stringify(changed));
      assert.equal((await query("songshodhon")).length, 0);
      assert.equal((await query("new private alias")).length, 0);
      s = await publish(changed);
      assert.ok(s.id, JSON.stringify(s));
      assert.equal((await query("new private alias")).length, 1);
      await c.query(
        "INSERT INTO app_private.service_aliases(service_id,alias,language) VALUES($1,'Private addition','en')",
        [s.id],
      );
      assert.equal((await query("new private alias")).length, 0);
      assert.equal(
        (
          await c.query(
            "SELECT count(*)::int n FROM app_private.staff_audit_events WHERE record_id=$1 AND evidence IS NOT NULL",
            [s.id],
          )
        ).rows[0].n,
        2,
      );
      await rejects(
        c,
        "DELETE FROM app_private.staff_audit_events WHERE record_id=$1",
        [s.id],
        "23514",
      );
    },
  );
  scenario(
    "P20 keyword search is bounded, parameterized and excludes unreviewed aliases",
    async ({ c, create, publish, query }) => {
      const s = await publish(await create());
      assert.ok(s.id, JSON.stringify(s));
      for (const q of [
        "unknown service",
        "' OR 1=1 --",
        "<script>alert(1)</script>",
        "%_unmatched",
      ])
        assert.equal((await query(q)).length, 0);
      for (const limit of [0, 51])
        await rejects(
          c,
          "SELECT app_public.directory_search('services','bn',NULL,$1)",
          [limit],
          "22023",
        );
      await rejects(
        c,
        "SELECT app_public.directory_search('services','bn',NULL,20,NULL,NULL,NULL,$1)",
        ["x".repeat(121)],
        "22023",
      );
      await c.query(
        "UPDATE app_private.service_aliases SET review_state='draft' WHERE service_id=$1",
        [s.id],
      );
      assert.equal((await query("songshodhon")).length, 0);
    },
  );
  scenario(
    "P20 related-source selection withholds suspended sources without leaking notes",
    async ({ c, create, publish }) => {
      const s = await publish(await create());
      assert.ok(s.id, JSON.stringify(s));
      const get = async () =>
        (
          await c.query(
            "SELECT app_public.directory_search('sources','bn',NULL,20,NULL,NULL,NULL,'',$1) r",
            [s.id],
          )
        ).rows[0].r.items;
      assert.equal((await get()).length, 1);
      assert.ok(!JSON.stringify(await get()).includes("PRIVATE"));
      await c.query(
        "UPDATE app_private.sources SET status='suspended' WHERE id=$1",
        [i.source],
      );
      assert.equal((await get()).length, 0);
    },
  );
  scenario(
    "P19 auditors and public roles cannot call directory write operations",
    async ({ c, command, sessions, metadata, hashes }) => {
      await c.query(
        "UPDATE app_private.admin_memberships SET role='auditor' WHERE id=$1",
        [i.creator],
      );
      sessions[0] = randomUUID();
      hashes[0] = "3".repeat(64);
      await c.query("SELECT app_staff.open_bound_session($1,$2,$3)", [
        i.creator,
        sessions[0],
        hashes[0],
      ]);
      assert.equal(
        (await command(0, "agencies", "create", null, metadata)).error_code,
        "FORBIDDEN",
      );
      await c.query("SET LOCAL ROLE askbd_web");
      await rejects(
        c,
        "SELECT app_staff.directory_command($1,$2,$3,'agencies','create',NULL,$4,NULL,$5)",
        [i.creator, sessions[0], hashes[0], metadata, randomUUID()],
        "42501",
      );
      await c.query("RESET ROLE");
    },
  );
  scenario(
    "P20 exact service relations remain reviewed and disappear for drafts or suspended sources",
    async ({ c, create, publish, command, service }) => {
      const s = await publish(await create());
      assert.ok(s.id, JSON.stringify(s));
      let r = (
        await c.query("SELECT app_public.service_relations($1,'bn') r", [s.id])
      ).rows[0].r;
      assert.equal(r.categories.length, 1);
      assert.equal(r.agencies.length, 1);
      assert.equal(r.sources.length, 1);
      assert.ok(!JSON.stringify(r).includes("PRIVATE"));
      await c.query(
        "UPDATE app_private.sources SET status='suspended' WHERE id=$1",
        [i.source],
      );
      r = (
        await c.query("SELECT app_public.service_relations($1,'bn') r", [s.id])
      ).rows[0].r;
      assert.equal(r.sources.length, 0);
      await command(
        0,
        "services",
        "update",
        s.id,
        { ...service, source_ids: [] },
        s.revision,
      );
      assert.equal(
        (
          await c.query("SELECT app_public.service_relations($1,'bn') r", [
            s.id,
          ])
        ).rows[0].r,
        null,
      );
    },
  );
  scenario(
    "P21 link-check requests fail closed without forging a network observation or content freshness",
    async ({ c, sessions }) => {
      const revision = (
        await c.query("SELECT revision FROM app_private.sources WHERE id=$1", [
          i.source,
        ])
      ).rows[0].revision;
      const key = randomUUID();
      const call = async (payload, rev = revision, k = key) =>
        (
          await c.query(
            "SELECT app_staff.request_link_check($1,$2,$3,$4,$5,$6,$7) r",
            [i.creator, sessions[0], "1".repeat(64), i.source, payload, rev, k],
          )
        ).rows[0].r;
      const result = await call({ reason: "Check source safely" });
      assert.ok(result.id, JSON.stringify(result));
      assert.deepEqual(await call({ reason: "Check source safely" }), result);
      assert.equal(
        (
          await call(
            { reason: "Forged", outcome: "healthy" },
            revision,
            randomUUID(),
          )
        ).error_code,
        "INVALID_REQUEST",
      );
      const health = (
        await c.query("SELECT app_private.source_link_health($1) r", [i.source])
      ).rows[0].r;
      assert.deepEqual(health, {
        state: "verification_blocked",
        checked_at: null,
        review_required: true,
      });
      assert.equal(
        (await c.query("SELECT app_public.directory('sources','bn') r")).rows[0]
          .r.items.length,
        0,
      );
      assert.equal(
        (
          await c.query(
            "SELECT count(*)::int n FROM app_private.source_checks WHERE source_id=$1",
            [i.source],
          )
        ).rows[0].n,
        1,
      );
      await rejects(
        c,
        "DELETE FROM app_private.source_link_checks WHERE source_id=$1",
        [i.source],
        "23514",
      );
    },
  );
  scenario(
    "P21 repeated failures flag review without changing source approval or ownership",
    async ({ c, sessions }) => {
      for (let n = 0; n < 3; n++)
        await c.query(
          "INSERT INTO app_private.source_link_checks(source_id,requested_by,requested_at,outcome,failure_code) VALUES($1,$2,statement_timestamp()-($3::integer * interval '1 minute'),'temporarily_unavailable','TIMEOUT')",
          [i.source, i.creator, n],
        );
      assert.equal(
        (
          await c.query("SELECT app_private.source_link_health($1) r", [
            i.source,
          ])
        ).rows[0].r.state,
        "suspected_broken",
      );
      assert.equal(
        (
          await c.query("SELECT status FROM app_private.sources WHERE id=$1", [
            i.source,
          ])
        ).rows[0].status,
        "active",
      );
      const integrity = (
        await c.query("SELECT app_staff.directory_integrity($1,$2,$3) r", [
          i.creator,
          sessions[0],
          "1".repeat(64),
        ])
      ).rows[0].r;
      assert.equal(integrity.sources_requiring_link_review, 1);
      assert.equal(integrity.orphaned_aliases, 0);
      await c.query("SET LOCAL ROLE askbd_staff");
      await rejects(
        c,
        "SELECT * FROM app_private.source_link_checks",
        [],
        "42501",
      );
      await c.query("RESET ROLE");
    },
  );
}
