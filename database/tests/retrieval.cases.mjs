import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  seedDirectoryFixture,
  directoryIds as i,
} from "./directory-fixture.mjs";
import { seedRetrievalDocument } from "./keyword.cases.mjs";

export const profile = "30000000-0000-4000-8000-000000000001";
export const revision = "761b726dd34fb83930e26aab4e9ac3899aa1fa78";
export const owner = "30000000-0000-4000-8000-000000000099";
export async function seedRetrievalScenario(c) {
  await seedDirectoryFixture(c);
  await c.query(
    "INSERT INTO app_private.service_sources(service_id,source_id) VALUES($1,$2)",
    [i.service, i.source],
  );
  await c.query(
    "INSERT INTO app_private.metadata_releases(service_id,locale,record_revision,translation_revision,created_by,reviewed_by,reviewer_revision,reviewed_at,expires_at) SELECT s.id,'bn',s.revision,t.revision,$2,$3,1,statement_timestamp(),statement_timestamp()+interval '1 day' FROM app_private.services s JOIN app_private.service_translations t ON t.service_id=s.id AND t.locale='bn' WHERE s.id=$1",
    [i.service, i.creator, i.reviewer],
  );
  await c.query(
    "INSERT INTO app_private.admin_memberships(id,auth_user_id,role,status) VALUES($1,$1,'owner','active')",
    [owner],
  );
  await c.query(
    "INSERT INTO app_private.embedding_profile_approvals(profile_id,enabled,approved_by,note) VALUES($1,true,$2,'Synthetic disposable local evaluation only')",
    [profile, owner],
  );
}
export async function asRetrievalRole(c, role, sql, values = []) {
  assert.ok(
    ["askbd_web", "askbd_embedder", "anon", "authenticated"].includes(role),
  );
  await c.query(`GRANT ${role} TO postgres WITH INHERIT FALSE, SET TRUE`);
  await c.query(`SET LOCAL ROLE ${role}`);
  try {
    return await c.query(sql, values);
  } finally {
    await c.query("RESET ROLE");
  }
}
const vector = (n = 0) =>
  Array.from({ length: 384 }, (_, i) => (i === n ? 1 : 0));
async function store(c, id, v = vector(), hash) {
  const fingerprint =
    hash ??
    (
      await c.query(
        "SELECT content_hash FROM app_private.passages WHERE id=$1",
        [id],
      )
    ).rows[0].content_hash;
  return (
    await asRetrievalRole(
      c,
      "askbd_embedder",
      "SELECT app_public.store_embeddings($1,$2,'bn',$3::jsonb) n",
      [
        profile,
        revision,
        JSON.stringify([
          { passage_id: id, passage_hash: fingerprint, vector: v },
        ]),
      ],
    )
  ).rows[0].n;
}
async function semantic(c, v = vector(), filters = {}) {
  return (
    await asRetrievalRole(
      c,
      "askbd_web",
      "SELECT app_public.semantic_search($1,$2,$3,$4,$5,$6,$7,$8,$9) result",
      [
        filters.profile ?? profile,
        filters.revision ?? revision,
        JSON.stringify(v),
        filters.locale ?? "bn",
        filters.limit ?? 20,
        filters.service ?? null,
        filters.agency ?? null,
        filters.source ?? null,
        filters.language ?? null,
      ],
    )
  ).rows[0].result;
}
export function registerRetrievalTests({ test, transaction, rejects }) {
  const scenario = (name, work) =>
    test(name, () =>
      transaction(async (c) => {
        await seedRetrievalScenario(c);
        await work(c);
      }),
    );
  scenario(
    "P30 unsafe pre-existing embedder privileges fail the forward role guard",
    async (c) => {
      await c.query("ALTER ROLE askbd_embedder INHERIT");
      await rejects(
        c,
        readFileSync(
          new URL(
            "../supabase/migrations/20261022000700_embedding_role_guard.sql",
            import.meta.url,
          ),
          "utf8",
        ),
        [],
        "23514",
      );
    },
  );
  scenario(
    "P31 semantic coverage stays explicitly incomplete until eligible passages are embedded",
    async (c) => {
      const f = await seedRetrievalDocument(c, ["Synthetic coverage archive."]);
      expectCoverage(await semantic(c), 2, 0, false);
      await store(c, f.ids[0]);
      expectCoverage(await semantic(c), 2, 1, false);
      await store(c, i.passage);
      expectCoverage(await semantic(c), 2, 2, true);
      function expectCoverage(r, total, embedded, complete) {
        assert.deepEqual(r.coverage, { eligible: total, embedded, complete });
      }
    },
  );
  scenario(
    "P32 ambiguous service scope preserves conflict holds without private records",
    async (c) => {
      await c.query(
        "INSERT INTO app_private.source_conflicts(service_id,conflict_key,conflict_type,state) VALUES($1,'synthetic-routing-conflict','procedure','open')",
        [i.service],
      );
      const check = (ids) =>
        asRetrievalRole(
          c,
          "askbd_web",
          "SELECT app_public.routing_conflict_hold($1,'bn') hold",
          [ids],
        );
      assert.equal((await check([i.service, randomUUID()])).rows[0].hold, true);
      assert.equal((await check([randomUUID()])).rows[0].hold, false);
      await c.query(
        "UPDATE app_private.services SET publication_status='draft' WHERE id=$1",
        [i.service],
      );
      assert.equal((await check([i.service])).rows[0].hold, false);
    },
  );
  scenario(
    "P30 exact semantic vectors preserve immutable passage/page provenance and stable ties",
    async (c) => {
      const f = await seedRetrievalDocument(c, [
        "Synthetic passport archive.",
        "Synthetic land archive.",
      ]);
      assert.equal(await store(c, f.ids[0]), 1);
      assert.equal(await store(c, f.ids[1], vector(1)), 1);
      const r = await semantic(c);
      assert.equal(r.items[0].evidence.passage_id, f.ids[0]);
      assert.equal(r.items[0].similarity, 1);
      assert.equal(r.items[0].evidence.source_url, f.url);
      assert.equal(r.items[0].evidence.page_number, 1);
      assert.equal(r.items[0].evidence.document_version_id, f.version);
      assert.equal(r.profile_id, profile);
      assert.ok(!JSON.stringify(r).includes("PRIVATE"));
      assert.equal(r.items[0].evidence.content_trust, "untrusted_data");
    },
  );
  scenario(
    "P30 embedding batches skip committed vectors and retries never overwrite immutable content",
    async (c) => {
      const f = await seedRetrievalDocument(c, [
        "Synthetic embedding archive.",
      ]);
      const read = () =>
        asRetrievalRole(
          c,
          "askbd_embedder",
          "SELECT app_public.embedding_batch($1,'bn',8) result",
          [profile],
        );
      assert.ok(
        (await read()).rows[0].result.items.some(
          (p) => p.passage_id === f.ids[0],
        ),
      );
      assert.equal(await store(c, f.ids[0]), 1);
      assert.equal(await store(c, f.ids[0], vector(2)), 0);
      assert.ok(
        !(await read()).rows[0].result.items.some(
          (p) => p.passage_id === f.ids[0],
        ),
      );
      assert.equal((await semantic(c)).items[0].similarity, 1);
    },
  );
  scenario(
    "P30 mismatched model, dimensions, nonunit vectors and empty vectors fail",
    async (c) => {
      await seedRetrievalDocument(c, ["Synthetic archive."]);
      for (const [v, rev] of [
        [vector(), "a".repeat(40)],
        [[1, 0], revision],
        [Array(384).fill(0), revision],
        [Array(384).fill(2), revision],
      ])
        await rejects(
          c,
          "SELECT app_public.semantic_search($1,$2,$3)",
          [profile, rev, JSON.stringify(v)],
          "22023",
        );
    },
  );
  scenario(
    "P30 content fingerprints and nonexistent passage IDs cannot be committed",
    async (c) => {
      const f = await seedRetrievalDocument(c, ["Synthetic archive."]);
      for (const id of [f.ids[0], randomUUID()])
        await rejects(
          c,
          "SELECT app_public.store_embeddings($1,$2,'bn',$3::jsonb)",
          [
            profile,
            revision,
            JSON.stringify([
              {
                passage_id: id,
                passage_hash: "0".repeat(64),
                vector: vector(),
              },
            ]),
          ],
          "23514",
        );
      assert.equal(
        (
          await c.query(
            "SELECT count(*)::int n FROM app_private.passage_embeddings",
          )
        ).rows[0].n,
        0,
      );
    },
  );
  scenario(
    "P30 owner approval is explicit, append-only and revoked by membership revision",
    async (c) => {
      await c.query(
        "INSERT INTO app_private.embedding_profile_approvals(profile_id,enabled,approved_by,note) VALUES($1,false,$2,'Synthetic pause')",
        [profile, owner],
      );
      assert.equal(
        (
          await c.query(
            "SELECT app_public.embedding_profile_authorized($1,$2) ok",
            [profile, revision],
          )
        ).rows[0].ok,
        false,
      );
      await rejects(
        c,
        "SELECT app_public.semantic_search($1,$2,$3)",
        [profile, revision, JSON.stringify(vector())],
        "55000",
      );
      await c.query(
        "INSERT INTO app_private.embedding_profile_approvals(profile_id,enabled,approved_by,note) VALUES($1,true,$2,'Synthetic resume')",
        [profile, owner],
      );
      await c.query(
        "UPDATE app_private.admin_memberships SET status='revoked' WHERE id=$1",
        [owner],
      );
      assert.equal(
        (
          await c.query(
            "SELECT app_public.embedding_profile_authorized($1,$2) ok",
            [profile, revision],
          )
        ).rows[0].ok,
        false,
      );
      await rejects(
        c,
        "UPDATE app_private.embedding_profile_approvals SET enabled=true",
        [],
        "23514",
      );
      await rejects(
        c,
        "INSERT INTO app_private.embedding_profile_approvals(profile_id,enabled,approved_by,note) VALUES($1,true,$2,'Not an operator')",
        [profile, i.reviewer],
        "23514",
      );
    },
  );
  scenario(
    "P30 model migration keeps same-dimensional spaces isolated",
    async (c) => {
      const f = await seedRetrievalDocument(c, ["Synthetic archive."]);
      await store(c, f.ids[0]);
      const second = "30000000-0000-4000-8000-000000000002",
        rev = "2c4055b12046f11709e9df2c122e59ffbdc2f900";
      await c.query(
        "INSERT INTO app_private.embedding_profile_approvals(profile_id,enabled,approved_by,note) VALUES($1,true,$2,'Synthetic second candidate')",
        [second, owner],
      );
      assert.deepEqual(
        (await semantic(c, vector(), { profile: second, revision: rev })).items,
        [],
      );
      assert.equal((await semantic(c)).items.length, 1);
    },
  );
  for (const [name, change] of [
    [
      "pending document",
      "UPDATE app_private.source_documents SET approval_status='pending_review' WHERE id=$1",
    ],
    [
      "outdated document",
      "UPDATE app_private.source_documents SET approval_status='outdated' WHERE id=$1",
    ],
    [
      "superseded version",
      "UPDATE app_private.source_documents SET current_version_id=NULL WHERE id=$1",
    ],
  ])
    scenario(`P31 semantic and final recheck exclude ${name}`, async (c) => {
      const f = await seedRetrievalDocument(c, ["Synthetic archive."]);
      await store(c, f.ids[0]);
      await c.query(change, [f.doc]);
      assert.deepEqual((await semantic(c)).items, []);
      const r = (
        await asRetrievalRole(
          c,
          "askbd_web",
          "SELECT app_public.recheck_retrieval($1,'bn') result",
          [f.ids],
        )
      ).rows[0].result;
      assert.deepEqual(r.items, []);
    });
  scenario(
    "P31 source, agency, service, locale and language filters apply before vector candidates",
    async (c) => {
      const f = await seedRetrievalDocument(c, ["Synthetic archive."]);
      await store(c, f.ids[0]);
      for (const filters of [
        { source: randomUUID() },
        { agency: randomUUID() },
        { service: randomUUID() },
        { locale: "en" },
        { language: "bn" },
      ])
        assert.deepEqual((await semantic(c, vector(), filters)).items, []);
      assert.equal(
        (
          await semantic(c, vector(), {
            service: i.service,
            agency: i.agency,
            source: i.source,
            language: "en",
          })
        ).items.length,
        1,
      );
    },
  );
  scenario(
    "P31 stale source checks revoke already embedded evidence",
    async (c) => {
      const f = await seedRetrievalDocument(c, ["Synthetic archive."]);
      await store(c, f.ids[0]);
      await c.query(
        "INSERT INTO app_private.source_checks(source_id,document_id,document_version_id,attempted_at,outcome) VALUES($1,$2,$3,statement_timestamp()+interval '1 second','unavailable')",
        [i.source, f.doc, f.version],
      );
      assert.deepEqual((await semantic(c)).items, []);
    },
  );
  scenario(
    "P32 unresolved conflicts are held with explicit metadata, never legally ranked away",
    async (c) => {
      const f = await seedRetrievalDocument(c, ["Synthetic archive."]);
      await store(c, f.ids[0]);
      await c.query(
        "INSERT INTO app_private.source_conflicts(service_id,conflict_key,conflict_type,state) VALUES($1,'synthetic-fee-conflict','fee','open')",
        [i.service],
      );
      assert.deepEqual((await semantic(c)).items, []);
      const r = (
        await asRetrievalRole(
          c,
          "askbd_web",
          "SELECT app_public.recheck_retrieval($1,'bn',$2) result",
          [f.ids, i.service],
        )
      ).rows[0].result;
      assert.deepEqual(r.items, []);
      assert.equal(r.conflict_hold, true);
    },
  );
  scenario(
    "P30 unapproved passage quality and untrusted extraction flags cannot enter embeddings",
    async (c) => {
      const f = await seedRetrievalDocument(
        c,
        ["Synthetic unreviewed archive."],
        { quality: "pending" },
      );
      await rejects(
        c,
        "SELECT app_public.store_embeddings($1,$2,'bn',$3::jsonb)",
        [
          profile,
          revision,
          JSON.stringify([
            {
              passage_id: f.ids[0],
              passage_hash: "a".repeat(64),
              vector: vector(),
            },
          ]),
        ],
        "23514",
      );
      const g = await seedRetrievalDocument(c, ["Synthetic flagged archive."], {
        metadata: { quality_flags: ["instruction_like_content"] },
      });
      await c.query(
        "INSERT INTO app_private.passage_embeddings(passage_id,profile_id,embedding_dimension,vector_data,indexing_status) VALUES($1,$2,384,$3,'indexed')",
        [g.ids[0], profile, JSON.stringify(vector())],
      );
      assert.deepEqual((await semantic(c)).items, []);
    },
  );
  scenario(
    "P30 public and embedding roles cannot read raw evidence or assign model approval",
    async (c) => {
      for (const role of [
        "askbd_web",
        "askbd_embedder",
        "anon",
        "authenticated",
      ]) {
        await c.query(`GRANT ${role} TO postgres WITH INHERIT FALSE, SET TRUE`);
        await c.query(`SET LOCAL ROLE ${role}`);
        try {
          await rejects(
            c,
            "SELECT * FROM app_private.passage_embeddings",
            [],
            "42501",
          );
          await rejects(
            c,
            "SELECT * FROM app_private.embedding_profile_approvals",
            [],
            "42501",
          );
          if (role !== "askbd_embedder")
            await rejects(
              c,
              "SELECT app_public.embedding_batch($1,'bn',1)",
              [profile],
              "42501",
            );
          if (role !== "askbd_web")
            await rejects(
              c,
              "SELECT app_public.semantic_search($1,$2,$3)",
              [profile, revision, JSON.stringify(vector())],
              "42501",
            );
        } finally {
          await c.query("RESET ROLE");
        }
      }
    },
  );
  scenario(
    "P33 routing reads only reviewed published aliases and never draft service records",
    async (c) => {
      const r = (
        await asRetrievalRole(
          c,
          "askbd_web",
          "SELECT app_public.routing_catalog('bn') result",
        )
      ).rows[0].result;
      assert.equal(r.items.length, 1);
      assert.equal(r.items[0].service_id, i.service);
      assert.ok(!JSON.stringify(r).includes("PRIVATE"));
      await c.query(
        "UPDATE app_private.services SET publication_status='draft' WHERE id=$1",
        [i.service],
      );
      assert.deepEqual(
        (
          await asRetrievalRole(
            c,
            "askbd_web",
            "SELECT app_public.routing_catalog('bn') result",
          )
        ).rows[0].result.items,
        [],
      );
    },
  );
  for (const [limit, locale] of [
    [0, "bn"],
    [51, "bn"],
    [20, "fr"],
    [null, "bn"],
  ])
    scenario(
      `P30 invalid vector bounds ${limit}/${locale} are rejected`,
      async (c) => {
        await rejects(
          c,
          "SELECT app_public.semantic_search($1,$2,$3,$4,$5)",
          [profile, revision, JSON.stringify(vector()), locale, limit],
          "22023",
        );
      },
    );
}
