import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { assertDisposableName } from "../../scripts/database-local.mjs";
import { registryProof } from "./registry.cases.mjs";
import { keywordResultSchema } from "../../apps/web/src/lib/retrieval/contracts.ts";
import {
  seedDirectoryFixture,
  directoryIds as i,
} from "./directory-fixture.mjs";

// Only used after seedDirectoryFixture confirms a generated disposable database.
async function document(c, texts, options = {}) {
  assertDisposableName(
    (await c.query("SELECT current_database() name")).rows[0].name,
  );
  const identity = options.identity;
  if (
    identity &&
    (identity.passages?.length !== texts.length ||
      [identity.document, identity.version, ...identity.passages].some(
        (value) =>
          typeof value !== "string" ||
          !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(
            value,
          ),
      ))
  )
    throw new Error("Invalid disposable fixture identity");
  const doc = identity?.document ?? randomUUID(),
    version = identity?.version ?? randomUUID(),
    ids = texts.map((_, n) => identity?.passages[n] ?? randomUUID());
  const type = options.type ?? "pdf",
    url = `https://p17.example.invalid/${doc}.${type}`;
  const hash = createHash("sha256").update(texts.join("\n")).digest("hex");
  await c.query(
    "INSERT INTO app_private.source_documents(id,source_id,canonical_url,document_title,document_type,approval_status) VALUES($1,$2,$3,$4,$5,'approved')",
    [doc, i.source, url, options.title ?? "Synthetic keyword archive", type],
  );
  await c.query(
    "INSERT INTO app_private.document_versions(id,source_document_id,version_number,content_hash,extraction_profile,retrieved_at,extraction_status,extraction_method,snapshot_backend,snapshot_key,review_state,metadata) VALUES($1,$2,1,$3,'keyword-fixture-v1',statement_timestamp(),'succeeded','manual','fixture','PRIVATE/keyword-snapshot','extracted',$4)",
    [version, doc, hash, options.metadata ?? {}],
  );
  for (const [n, text] of texts.entries())
    await c.query(
      "INSERT INTO app_private.passages(id,document_version_id,ordinal,passage_text,normalized_text,heading,section_path,page_number,page_label,character_start,character_end,language,extraction_quality_status,locator) VALUES($1,$2,$3,$4,$4,$5,ARRAY['Synthetic section'],$6,NULL,0,char_length($4),$7,$8,$9)",
      [
        ids[n],
        version,
        n,
        text,
        options.heading ?? null,
        type === "pdf" ? n + 1 : null,
        options.language ?? "en",
        options.quality ?? "accepted",
        { kind: type, private_note: "PRIVATE locator diagnostic" },
      ],
    );
  await c.query(
    "INSERT INTO app_private.source_verifications(source_id,document_version_id,verification_type,status,method,evidence_ref,evidence_excerpt,reviewer_id,verified_at,expires_at,notes) VALUES($1,$2,'document_review','approved','Synthetic test','fixture:private-review','PRIVATE proof',$3,statement_timestamp(),statement_timestamp()+interval '1 day','PRIVATE review notes')",
    [i.source, version, i.reviewer],
  );
  await c.query(
    "INSERT INTO app_private.source_checks(source_id,document_id,document_version_id,attempted_at,content_checked_at,outcome,http_status,content_hash,final_url,origin_validated,mime_validated) VALUES($1,$2,$3,statement_timestamp(),statement_timestamp(),'matched',200,$4,$5,true,true)",
    [i.source, doc, version, hash, url],
  );
  await c.query(
    "UPDATE app_private.document_versions SET review_state='approved',reviewed_by=$2,reviewed_at=statement_timestamp(),review_note='PRIVATE fixture review',released_at=statement_timestamp() WHERE id=$1",
    [version, i.reviewer],
  );
  await c.query(
    "UPDATE app_private.source_documents SET current_version_id=$2 WHERE id=$1",
    [doc, version],
  );
  if (options.quality !== "pending") {
    assert.equal(
      (await c.query("SELECT app_private.passage_is_eligible($1) ok", [ids[0]]))
        .rows[0].ok,
      true,
      "Fixture must pass the unchanged passage eligibility guard",
    );
    assert.equal(
      (
        await c.query(
          "SELECT count(*)::int n FROM app_private.public_source_metadata WHERE id=$1 AND locale='bn'",
          [i.source],
        )
      ).rows[0].n,
      1,
      "Fixture source must pass reviewed source projection",
    );
  }
  return { doc, version, ids, url, hash };
}
async function search(c, query, filters = {}) {
  await c.query("GRANT askbd_web TO postgres WITH INHERIT FALSE, SET TRUE");
  await c.query("SET LOCAL ROLE askbd_web");
  try {
    return keywordResultSchema.parse(
      (
        await c.query(
          "SELECT app_public.keyword_search($1,$2,$3,$4,$5,$6,$7,$8) result",
          [
            query,
            filters.locale ?? "bn",
            filters.limit ?? 10,
            filters.offset ?? 0,
            filters.service_id ?? null,
            filters.agency_id ?? null,
            filters.source_id ?? null,
            filters.language ?? null,
          ],
        )
      ).rows[0].result,
    );
  } finally {
    await c.query("RESET ROLE");
  }
}
export { document as seedRetrievalDocument };
export function registerKeywordTests({ test, transaction, rejects }) {
  const scenario = (name, work) =>
    test(name, () =>
      transaction(async (c) => {
        await seedDirectoryFixture(c);
        await c.query(
          "INSERT INTO app_private.service_sources(service_id,source_id) VALUES($1,$2)",
          [i.service, i.source],
        );
        await c.query(
          "INSERT INTO app_private.metadata_releases(service_id,locale,record_revision,translation_revision,created_by,reviewed_by,reviewer_revision,reviewed_at,expires_at) SELECT s.id,'bn',s.revision,t.revision,$2,$3,1,statement_timestamp(),statement_timestamp()+interval '1 day' FROM app_private.services s JOIN app_private.service_translations t ON t.service_id=s.id AND t.locale='bn' WHERE s.id=$1",
          [i.service, i.creator, i.reviewer],
        );
        await work(c);
      }),
    );
  scenario(
    "P29 passage eligibility binds the requested UUID when approved and pending records coexist",
    async (c) => {
      const approved = await document(c, ["Synthetic approvedprobe archive."]);
      const pending = await document(c, ["Synthetic forbiddenprobe archive."], {
        quality: "pending",
      });
      await c.query(
        "INSERT INTO app_private.passage_reviews(passage_id,reviewer_id,reviewer_revision,status,proof,reason,expires_at) VALUES($1,$2,1,'approved',$3,'Synthetic independent review',statement_timestamp()+interval '1 day')",
        [approved.ids[0], i.reviewer, registryProof().ownership],
      );
      for (const id of [pending.ids[0], randomUUID()])
        assert.equal(
          (await c.query("SELECT app_private.passage_is_eligible($1) ok", [id]))
            .rows[0].ok,
          false,
        );
      assert.equal((await search(c, "forbiddenprobe")).items.length, 0);
      assert.equal(
        (await search(c, "approvedprobe")).items[0].passage_id,
        approved.ids[0],
      );
    },
  );
  scenario(
    "P29 English, Bangla and mixed lexical queries preserve complete words/marks and punctuation",
    async (c) => {
      const f = await document(
        c,
        [
          "Synthetic passport renewal archive only.",
          "পরীক্ষামূলক পাসপোর্ট নবায়ন তথ্য সংগ্রহ।",
          "Synthetic পাসপোর্ট renewal archive only.",
        ],
        { language: "mixed" },
      );
      for (const [q, n] of [
        ["PASSPORT—renewal", 0],
        ["পাসপোর্ট নবায়ন।", 1],
        ["পাসপোর্ট renewal", 2],
      ]) {
        const r = await search(c, q);
        assert.equal(r.items[0].passage_id, f.ids[n]);
        assert.equal(r.rank_version, "p29-keyword-v1");
        assert.ok(r.items[0].score > 0 && r.items[0].score <= 1);
      }
      const r = await search(c, "পাসপোর্ট");
      assert.ok(r.tokens.includes("পাসপোর্ট"));
      assert.equal(r.items.length, 2);
    },
  );
  scenario(
    "P29 canonical Unicode forms match while Bengali digits and joiners are not rewritten",
    async (c) => {
      const f = await document(
        c,
        ["Synthetic কে় archive ১২৩ document.", "Synthetic café archive."],
        { language: "mixed" },
      );
      assert.equal(
        (await search(c, "cafe\u0301")).items[0].passage_id,
        f.ids[1],
      );
      assert.equal((await search(c, "১২৩")).items[0].passage_id, f.ids[0]);
      assert.equal((await search(c, "123")).items.length, 0);
    },
  );
  scenario(
    "P29 exact phrase, heading and title signals have documented deterministic ordering",
    async (c) => {
      const f = await document(
        c,
        [
          "Synthetic passport renewal archive.",
          "Synthetic passport archive renewal.",
          "Synthetic passport archive.",
        ],
        { title: "Synthetic passport renewal archive", heading: "passport" },
      );
      const r = await search(c, "passport renewal");
      assert.equal(r.items[0].passage_id, f.ids[0]);
      assert.equal(r.items[0].signals.exact_phrase, true);
      assert.equal(r.items[1].passage_id, f.ids[1]);
      assert.equal(r.items[0].signals.token_coverage, 1);
      assert.equal(r.items[0].signals.heading_coverage, 0.5);
      assert.equal(r.items[0].signals.title_coverage, 1);
      assert.equal(r.items[0].score, 0.95);
    },
  );
  scenario(
    "P29 Unicode-equivalent headings and titles use the same normalization as passage matches",
    async (c) => {
      await document(c, ["Synthetic cafe\u0301 archive."], {
        title: "cafe\u0301",
        heading: "cafe\u0301",
      });
      const p = (await search(c, "café")).items[0];
      assert.equal(p.signals.heading_coverage, 1);
      assert.equal(p.signals.title_coverage, 1);
      assert.equal(p.score, 1);
    },
  );
  scenario(
    "P29 exact tokens deliberately omit stemming, fuzzy spelling and implicit prefix expansion",
    async (c) => {
      await document(c, ["Synthetic passport archive."]);
      for (const q of ["pass", "passprt", "passports"])
        assert.deepEqual((await search(c, q)).items, []);
      assert.equal((await search(c, "passport")).items.length, 1);
    },
  );
  scenario(
    "P29 source, owning-agency, reviewed-service and language filters never broaden evidence",
    async (c) => {
      await document(c, ["Synthetic passport archive."], { language: "en" });
      for (const filters of [
        { source_id: i.source },
        { agency_id: i.agency },
        { service_id: i.service },
        { language: "en" },
      ])
        assert.equal((await search(c, "passport", filters)).items.length, 1);
      for (const filters of [
        { source_id: randomUUID() },
        { agency_id: randomUUID() },
        { service_id: randomUUID() },
        { language: "bn" },
      ])
        assert.equal((await search(c, "passport", filters)).items.length, 0);
      await c.query(
        "UPDATE app_private.services SET publication_status='withdrawn' WHERE id=$1",
        [i.service],
      );
      assert.equal(
        (await search(c, "passport", { service_id: i.service })).items.length,
        0,
      );
    },
  );
  scenario(
    "P29 stable UUID ties, bounded pages and honest no-match responses",
    async (c) => {
      const f = await document(c, Array(4).fill("Synthetic passport archive."));
      const sorted = [...f.ids].sort();
      const a = await search(c, "passport", { limit: 2 });
      const b = await search(c, "passport", { limit: 2, offset: 2 });
      assert.deepEqual(
        [...a.items, ...b.items].map((p) => p.passage_id),
        sorted,
      );
      assert.equal(a.has_more, true);
      assert.equal(a.next_offset, 2);
      assert.equal(b.has_more, false);
      assert.equal(b.next_offset, null);
      assert.deepEqual((await search(c, "zzznomatchzzz")).items, []);
      assert.deepEqual(
        (await search(c, "passport", { offset: 500 })).items,
        [],
      );
    },
  );
  scenario(
    "P29 exact PDF/HTML provenance and separate verification clocks contain no private fields",
    async (c) => {
      for (const type of ["pdf", "html"]) {
        const f = await document(c, ["Synthetic citationprobe archive."], {
          type,
        });
        const p = (await search(c, "citationprobe")).items.find(
          (p) => p.passage_id === f.ids[0],
        );
        assert.equal(p.document_id, f.doc);
        assert.equal(p.document_version_id, f.version);
        assert.equal(p.source_id, i.source);
        assert.equal(p.source_url, f.url);
        assert.equal(p.content_hash, f.hash);
        assert.equal(p.page_number, type === "pdf" ? 1 : null);
        assert.equal(p.page_label, null);
        assert.equal(p.character_start, 0);
        assert.equal(p.published_at, null);
        assert.ok(
          p.ownership_verified_at &&
            p.document_reviewed_at &&
            p.content_checked_at,
        );
        assert.equal(p.content_trust, "untrusted_data");
        assert.ok(!JSON.stringify(p).includes("PRIVATE"));
        assert.ok(!JSON.stringify(p).includes(i.reviewer));
      }
    },
  );
  scenario(
    "P29 SQL validates empty/oversized/invalid input independently of application validation",
    async (c) => {
      for (const q of ["", "   ", "!!!", "x".repeat(257)])
        await rejects(c, "SELECT app_public.keyword_search($1)", [q], "22023");
      for (const [limit, offset] of [
        [0, 0],
        [51, 0],
        [1, -1],
        [1, 501],
        [null, 0],
      ])
        await rejects(
          c,
          "SELECT app_public.keyword_search('passport','bn',$1,$2)",
          [limit, offset],
          "22023",
        );
      await rejects(
        c,
        "SELECT app_public.keyword_search('passport','banglish')",
        [],
        "22023",
      );
      await rejects(
        c,
        "SELECT app_public.keyword_search('passport','bn',1,0,NULL,NULL,NULL,'unsafe')",
        [],
        "22023",
      );
    },
  );
  scenario(
    "P29 citizen syntax and SQL injection strings are literal terms, never executable commands",
    async (c) => {
      await document(c, ["Synthetic passport archive."]);
      const r = await search(
        c,
        "passport'); DROP TABLE app_private.passages; --",
      );
      assert.ok(r.items.length <= 1);
      assert.equal(
        (
          await c.query(
            "SELECT to_regclass('app_private.passages') IS NOT NULL ok",
          )
        ).rows[0].ok,
        true,
      );
      await rejects(
        c,
        "SELECT app_public.keyword_search($1)",
        ["' | ! & :*"],
        "22023",
      );
    },
  );
  for (const [label, mutation] of [
    [
      "rejected document",
      "UPDATE app_private.source_documents SET approval_status='rejected',current_version_id=NULL WHERE id=$1",
    ],
    [
      "noncurrent version",
      "UPDATE app_private.source_documents SET current_version_id=NULL WHERE id=$1",
    ],
  ])
    scenario(
      `P29 ${label} is excluded at the database retrieval boundary`,
      async (c) => {
        const f = await document(c, ["Synthetic blockedprobe archive."]);
        assert.equal((await search(c, "blockedprobe")).items.length, 1);
        await c.query(mutation, [f.doc]);
        assert.equal((await search(c, "blockedprobe")).items.length, 0);
      },
    );
  scenario(
    "P29 pending extraction quality is excluded despite an approved parent version",
    async (c) => {
      await document(c, ["Synthetic pendingprobe archive."], {
        quality: "pending",
      });
      assert.equal((await search(c, "pendingprobe")).items.length, 0);
    },
  );
  for (const flag of [
    "possible_personal_data",
    "instruction_like_content",
    "corrupt_text",
    "low_ocr_confidence",
  ])
    scenario(
      `P29 unsafe ${flag} capture remains excluded after parent approval`,
      async (c) => {
        await document(c, ["Synthetic flaggedprobe archive."], {
          metadata: { quality_flags: [flag] },
        });
        assert.equal((await search(c, "flaggedprobe")).items.length, 0);
      },
    );
  scenario("P29 source suspension immediately removes results", async (c) => {
    await document(c, ["Synthetic trustprobe archive."]);
    assert.equal((await search(c, "trustprobe")).items.length, 1);
    await c.query(
      "UPDATE app_private.sources SET status='suspended' WHERE id=$1",
      [i.source],
    );
    assert.equal((await search(c, "trustprobe")).items.length, 0);
  });
  scenario(
    "P29 revoked document reviewer removes otherwise accepted legacy passages",
    async (c) => {
      await document(c, ["Synthetic reviewerprobe archive."]);
      await c.query(
        "UPDATE app_private.admin_memberships SET status='revoked' WHERE id=$1",
        [i.reviewer],
      );
      assert.equal((await search(c, "reviewerprobe")).items.length, 0);
    },
  );
  scenario(
    "P29 expired ownership proof and link-review holds cannot be bypassed by high scores",
    async (c) => {
      await document(c, ["Synthetic authorityprobe archive."]);
      assert.equal((await search(c, "authorityprobe")).items.length, 1);
      await c.query(
        "INSERT INTO app_private.source_verifications(source_id,verification_type,status,method,evidence_ref,reviewer_id,verified_at,expires_at) VALUES($1,'ownership','approved','Synthetic expired fixture','fixture:expired',$2,statement_timestamp()-interval '2 days',statement_timestamp()-interval '1 day')",
        [i.source, i.reviewer],
      );
      assert.equal((await search(c, "authorityprobe")).items.length, 0);
    },
  );
  scenario(
    "P29 source link-review hold withholds otherwise approved evidence",
    async (c) => {
      await document(c, ["Synthetic linkholdprobe archive."]);
      assert.equal((await search(c, "linkholdprobe")).items.length, 1);
      await c.query(
        "INSERT INTO app_private.source_link_checks(source_id,requested_by,outcome,failure_code) VALUES($1,$2,'manual_review_required','REVIEW_REQUIRED')",
        [i.source, i.reviewer],
      );
      assert.equal((await search(c, "linkholdprobe")).items.length, 0);
    },
  );
  scenario(
    "P29 revoked document versions and expired content checks are not delivered",
    async (c) => {
      const f = await document(c, ["Synthetic revokedprobe archive."]);
      assert.equal((await search(c, "revokedprobe")).items.length, 1);
      await c.query(
        "UPDATE app_private.document_versions SET review_state='revoked' WHERE id=$1",
        [f.version],
      );
      assert.equal((await search(c, "revokedprobe")).items.length, 0);
      const stale = await document(c, ["Synthetic staleprobe archive."]);
      await c.query(
        "INSERT INTO app_private.source_checks(source_id,document_id,document_version_id,attempted_at,content_checked_at,outcome,http_status,content_hash,final_url,origin_validated,mime_validated) VALUES($1,$2,$3,clock_timestamp(),statement_timestamp()-interval '8 days','matched',200,$4,$5,true,true)",
        [i.source, stale.doc, stale.version, stale.hash, stale.url],
      );
      assert.equal((await search(c, "staleprobe")).items.length, 0);
    },
  );
  scenario(
    "P29 failed or stale checks cannot refresh or deliver old guidance",
    async (c) => {
      const f = await document(c, ["Synthetic freshnessprobe archive."]);
      await c.query(
        "INSERT INTO app_private.source_checks(source_id,document_id,document_version_id,attempted_at,outcome,error_code) VALUES($1,$2,$3,clock_timestamp(),'unavailable','TIMEOUT')",
        [i.source, f.doc, f.version],
      );
      assert.equal((await search(c, "freshnessprobe")).items.length, 0);
    },
  );
  scenario(
    "P29 service-wide unresolved conflicts withhold matching evidence",
    async (c) => {
      await document(c, ["Synthetic conflictprobe archive."]);
      await c.query(
        "INSERT INTO app_private.source_conflicts(service_id,conflict_key,conflict_type) VALUES($1,'synthetic-p29-conflict','other')",
        [i.service],
      );
      assert.equal((await search(c, "conflictprobe")).items.length, 0);
    },
  );
  scenario(
    "P29 direct anonymous/worker/staff calls and raw passage reads remain denied",
    async (c) => {
      for (const role of [
        "anon",
        "authenticated",
        "askbd_staff",
        "askbd_worker",
      ]) {
        await c.query(`GRANT ${role} TO postgres WITH INHERIT FALSE, SET TRUE`);
        await c.query(`SET LOCAL ROLE ${role}`);
        await rejects(
          c,
          "SELECT app_public.keyword_search('passport')",
          [],
          "42501",
        );
        await c.query("RESET ROLE");
      }
      await c.query("SET LOCAL ROLE askbd_web");
      await rejects(c, "SELECT * FROM app_private.passages", [], "42501");
      await c.query("RESET ROLE");
    },
  );
  scenario(
    "P29 a selective synthetic corpus query uses the actual GIN expression index",
    async (c) => {
      const f = await document(
        c,
        Array.from(
          { length: 1600 },
          (_, n) => `Synthetic indexfixture${n} archive.`,
        ),
      );
      await c.query("ANALYZE app_private.passages");
      const plan = (
        await c.query(
          "EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) SELECT id FROM app_private.passages WHERE app_private.keyword_vector(normalized_text,heading) @@ plainto_tsquery('simple','indexfixture957')",
        )
      ).rows[0]["QUERY PLAN"][0];
      assert.ok(JSON.stringify(plan).includes("passages_keyword_gin"));
      const result = await search(c, "indexfixture957");
      assert.deepEqual(
        result.items.map((p) => p.passage_id),
        [f.ids[957]],
      );
      console.log(
        `P29 synthetic GIN probe: ${plan["Execution Time"]} ms; 1600 rows; not a production benchmark.`,
      );
    },
  );
}
