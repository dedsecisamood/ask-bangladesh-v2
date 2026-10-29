import assert from "node:assert/strict";
import { createHash } from "node:crypto";

// Synthetic private fixtures only: no approved domain, verified claim or real source.
const id = (n) => `15000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const source = id(1),
  doc = id(2),
  version = id(3),
  passage = id(4),
  profile = id(5),
  claim = id(6),
  reviewer = id(90),
  missing = id(99);
const service = "14000000-0000-4000-8000-000000000003";
const hash = createHash("sha256")
  .update("Synthetic snapshot bytes")
  .digest("hex");
async function fixture(c) {
  const domain = (
    await c.query(
      "SELECT id,agency_id FROM app_private.official_domains WHERE hostname='synthetic.example.invalid'",
    )
  ).rows[0];
  await c.query(
    "INSERT INTO app_private.sources(id,agency_id,official_domain_id,canonical_url,is_synthetic) VALUES ($1,$2,$3,'https://synthetic.example.invalid/',true)",
    [source, domain.agency_id, domain.id],
  );
  await c.query(
    "INSERT INTO app_private.source_documents(id,source_id,canonical_url,document_title,document_type,is_synthetic) VALUES ($1,$2,'https://synthetic.example.invalid/fixture.pdf','Synthetic fixture document','pdf',true)",
    [doc, source],
  );
  await c.query(
    "INSERT INTO app_private.document_versions(id,source_document_id,version_number,content_hash,extraction_profile,retrieved_at,extraction_status,extraction_method,snapshot_backend,snapshot_key) VALUES ($1,$2,1,$3,'synthetic-text-v1',statement_timestamp(),'succeeded','pdf_text','fixture','synthetic/snapshot.pdf')",
    [version, doc, hash],
  );
  await c.query(
    "INSERT INTO app_private.passages(id,document_version_id,ordinal,passage_text,normalized_text,page_number,language,extraction_quality_status) VALUES ($1,$2,0,'Synthetic evidence excerpt','Synthetic evidence excerpt',2,'en','accepted')",
    [passage, version],
  );
  await c.query(
    "INSERT INTO app_private.service_claims(id,service_id,claim_type,language,claim_text,is_synthetic) VALUES ($1,$2,'other','en','Synthetic reusable test statement',true)",
    [claim, service],
  );
}
export function registerEvidenceTests({ test, transaction, rejects, query }) {
  const scenario = (name, work) =>
    test(name, () =>
      transaction(async (c) => {
        await fixture(c);
        await work(c);
      }),
    );
  test("P15 applies all private tables with forced RLS and the real pgvector extension", async () => {
    const r = await query(
      "SELECT relrowsecurity,relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='app_private' AND c.relkind='r'",
    );
    assert.equal(r.rowCount, 44);
    assert.ok(r.rows.every((x) => x.relrowsecurity && x.relforcerowsecurity));
    assert.equal(
      (
        await query(
          "SELECT extversion FROM pg_extension WHERE extname='vector'",
        )
      ).rows[0].extversion,
      "0.8.2",
    );
  });
  scenario(
    "documents preserve exact registry lineage and cannot switch to arbitrary hosts",
    async (c) => {
      await rejects(
        c,
        "UPDATE app_private.source_documents SET canonical_url='https://other.invalid/fixture.pdf' WHERE id=$1",
        [doc],
        "23514",
      );
      await rejects(
        c,
        "UPDATE app_private.sources SET canonical_url='https://other.invalid/' WHERE id=$1",
        [source],
        "23514",
      );
      await rejects(
        c,
        "INSERT INTO app_private.source_documents(source_id,canonical_url,document_title,document_type) VALUES ($1,'https://synthetic.example.invalid/a','Synthetic','html')",
        [missing],
        "23503",
      );
      await rejects(
        c,
        "INSERT INTO app_private.source_documents(source_id,canonical_url,document_title,document_type,is_synthetic) VALUES ($1,'https://synthetic.example.invalid/a','Synthetic','html',false)",
        [source],
        "23514",
      );
    },
  );
  scenario(
    "version hashes and extraction profiles distinguish derived snapshots while preserving unknown dates",
    async (c) => {
      const row = (
        await c.query(
          "SELECT published_at,effective_from FROM app_private.document_versions WHERE id=$1",
          [version],
        )
      ).rows[0];
      assert.equal(row.published_at, null);
      assert.equal(row.effective_from, null);
      await rejects(
        c,
        "INSERT INTO app_private.document_versions(source_document_id,version_number,content_hash,extraction_profile,retrieved_at,extraction_method,snapshot_backend,snapshot_key) VALUES ($1,2,$2,'synthetic-text-v1',statement_timestamp(),'pdf_text','fixture','duplicate')",
        [doc, hash],
        "23505",
      );
      await c.query(
        "INSERT INTO app_private.document_versions(id,source_document_id,version_number,content_hash,extraction_profile,retrieved_at,extraction_method,snapshot_backend,snapshot_key,supersedes_id) VALUES ($1,$2,2,$3,'synthetic-ocr-v2',statement_timestamp(),'ocr_bn','fixture','new-derivative',$4)",
        [id(7), doc, hash, version],
      );
      assert.equal(
        (
          await c.query(
            "SELECT 1 FROM app_private.document_versions WHERE source_document_id=$1",
            [doc],
          )
        ).rowCount,
        2,
      );
      await rejects(
        c,
        "INSERT INTO app_private.document_versions(source_document_id,version_number,content_hash,extraction_profile,retrieved_at,extraction_method,snapshot_backend,snapshot_key) VALUES ($1,3,'not-a-sha256','synthetic',statement_timestamp(),'manual','fixture','bad')",
        [doc],
        "23514",
      );
    },
  );
  scenario(
    "historical snapshots, dates, passages and exact hashes cannot be overwritten or deleted",
    async (c) => {
      for (const sql of [
        "UPDATE app_private.document_versions SET content_hash=repeat('a',64) WHERE id=$1",
        "UPDATE app_private.document_versions SET published_at=statement_timestamp() WHERE id=$1",
        "DELETE FROM app_private.document_versions WHERE id=$1",
      ])
        await rejects(c, sql, [version], "23514");
      await rejects(
        c,
        "UPDATE app_private.passages SET passage_text='Replacement' WHERE id=$1",
        [passage],
        "23514",
      );
      await rejects(
        c,
        "DELETE FROM app_private.passages WHERE id=$1",
        [passage],
        "23514",
      );
      assert.equal(
        (
          await c.query(
            "SELECT content_hash FROM app_private.passages WHERE id=$1",
            [passage],
          )
        ).rows[0].content_hash,
        createHash("sha256").update("Synthetic evidence excerpt").digest("hex"),
      );
    },
  );
  scenario(
    "passages enforce parents and ordering while unknown PDF pages remain unknown",
    async (c) => {
      const sql =
        "INSERT INTO app_private.passages(document_version_id,ordinal,passage_text,normalized_text,language,page_number) VALUES ($1,$2,'Synthetic','Synthetic','bn',$3)";
      await rejects(c, sql, [missing, 0, null], "23503");
      await rejects(c, sql, [version, 0, 1], "23505");
      await rejects(c, sql, [version, 1, 0], "23514");
      await c.query(sql, [version, 1, null]);
      assert.equal(
        (
          await c.query(
            "SELECT page_number FROM app_private.passages WHERE document_version_id=$1 AND ordinal=1",
            [version],
          )
        ).rows[0].page_number,
        null,
      );
      await rejects(
        c,
        "INSERT INTO app_private.passages(document_version_id,ordinal,passage_text,normalized_text,language,character_start,character_end) VALUES ($1,2,'Synthetic','Synthetic','en',3,4)",
        [version],
        "23514",
      );
    },
  );
  scenario(
    "private snapshots use provider-neutral keys and reject signed URLs or traversal keys",
    async (c) => {
      for (const key of [
        "https://storage.invalid/private?token=fixture",
        "../outside",
        "a/../outside",
        "/absolute",
      ])
        await rejects(
          c,
          "INSERT INTO app_private.document_versions(source_document_id,version_number,content_hash,extraction_profile,retrieved_at,extraction_method,snapshot_backend,snapshot_key) VALUES ($1,2,$2,'bad-storage',statement_timestamp(),'manual','fixture',$3)",
          [doc, hash, key],
          "23514",
        );
    },
  );
  scenario(
    "human verification records preserve type/reviewer boundaries and reject fabricated synthetic approval",
    async (c) => {
      await c.query(
        "INSERT INTO app_private.source_verifications(source_id,verification_type,method,evidence_ref) VALUES ($1,'accessibility','synthetic-fixture','fixture:access')",
        [source],
      );
      await rejects(
        c,
        "INSERT INTO app_private.source_verifications(source_id,verification_type,status,method,evidence_ref,reviewer_id,verified_at,expires_at) VALUES ($1,'ownership','approved','synthetic-fixture','fixture:owner',$2,statement_timestamp(),statement_timestamp()+interval '1 day')",
        [source, reviewer],
        "23514",
      );
      await rejects(
        c,
        "INSERT INTO app_private.source_verifications(source_id,verification_type,method,evidence_ref) VALUES ($1,'document_review','synthetic-fixture','fixture:review')",
        [source],
        "23514",
      );
      await rejects(
        c,
        "UPDATE app_private.source_verifications SET method='rewritten' WHERE source_id=$1",
        [source],
        "23514",
      );
    },
  );
  scenario(
    "failed source checks cannot renew content freshness and matching checks bind the exact digest",
    async (c) => {
      await c.query(
        "INSERT INTO app_private.source_checks(source_id,document_id,attempted_at,outcome,http_status,error_code) VALUES ($1,$2,statement_timestamp(),'unavailable',503,'FIXTURE_UNAVAILABLE')",
        [source, doc],
      );
      await rejects(
        c,
        "INSERT INTO app_private.source_checks(source_id,document_id,attempted_at,content_checked_at,outcome) VALUES ($1,$2,statement_timestamp(),statement_timestamp(),'unavailable')",
        [source, doc],
        "23514",
      );
      const sql =
        "INSERT INTO app_private.source_checks(source_id,document_id,document_version_id,attempted_at,content_checked_at,outcome,http_status,content_hash,final_url,origin_validated,mime_validated) VALUES ($1,$2,$3,statement_timestamp(),statement_timestamp(),'matched',200,$4,'https://synthetic.example.invalid/fixture.pdf',true,true)";
      await rejects(c, sql, [source, doc, version, "a".repeat(64)], "23514");
      await c.query(sql, [source, doc, version, hash]);
      await rejects(
        c,
        "INSERT INTO app_private.source_checks(source_id,document_id,attempted_at,outcome,http_status) VALUES ($1,$2,statement_timestamp(),'invalid',304)",
        [source, doc],
        "23514",
      );
    },
  );
  scenario(
    "unapproved, synthetic and incomplete evidence never becomes eligible through a pointer or release timestamp",
    async (c) => {
      assert.equal(
        (
          await c.query("SELECT app_private.passage_is_eligible($1) AS ok", [
            passage,
          ])
        ).rows[0].ok,
        false,
      );
      assert.equal(
        (
          await c.query("SELECT app_private.claim_is_eligible($1) AS ok", [
            claim,
          ])
        ).rows[0].ok,
        false,
      );
      await rejects(
        c,
        "UPDATE app_private.source_documents SET current_version_id=$1 WHERE id=$2",
        [version, doc],
        "23514",
      );
      await rejects(
        c,
        "UPDATE app_private.document_versions SET released_at=statement_timestamp() WHERE id=$1",
        [version],
        "23514",
      );
      await rejects(
        c,
        "UPDATE app_private.document_versions SET review_state='approved',reviewed_by=$2,reviewed_at=statement_timestamp(),review_note='Synthetic review' WHERE id=$1",
        [version, reviewer],
        "23514",
      );
      await rejects(
        c,
        "UPDATE app_private.source_documents SET approval_status='approved' WHERE id=$1",
        [doc],
        "23514",
      );
      await rejects(
        c,
        "UPDATE app_private.sources SET status='active' WHERE id=$1",
        [source],
        "23514",
      );
    },
  );
  scenario(
    "review transitions are appended to a private immutable event trail",
    async (c) => {
      const before = (
        await c.query(
          "SELECT count(*)::int AS n FROM app_private.evidence_review_events WHERE version_id=$1",
          [version],
        )
      ).rows[0].n;
      await c.query(
        "UPDATE app_private.document_versions SET review_state='needs_review' WHERE id=$1",
        [version],
      );
      assert.equal(
        (
          await c.query(
            "SELECT count(*)::int AS n FROM app_private.evidence_review_events WHERE version_id=$1",
            [version],
          )
        ).rows[0].n,
        before + 1,
      );
      await rejects(
        c,
        "UPDATE app_private.evidence_review_events SET reviewer_id=$1",
        [reviewer],
        "23514",
      );
      await rejects(
        c,
        "INSERT INTO app_private.passages(document_version_id,ordinal,passage_text,normalized_text,language) VALUES ($1,8,'Late text','Late text','en')",
        [version],
        "23514",
      );
    },
  );
  scenario(
    "claim evidence uses valid exact passages and reviewed mappings, without changing claim truth",
    async (c) => {
      const sql =
        "INSERT INTO app_private.claim_evidence(claim_id,passage_id,support_type,reviewed_by,reviewed_at) VALUES ($1,$2,'supports',$3,statement_timestamp())";
      await rejects(c, sql, [claim, missing, reviewer], "23503");
      await c.query(sql, [claim, passage, reviewer]);
      assert.equal(
        (
          await c.query(
            "SELECT verification_status FROM app_private.service_claims WHERE id=$1",
            [claim],
          )
        ).rows[0].verification_status,
        "unreviewed",
      );
      await rejects(
        c,
        "UPDATE app_private.service_claims SET publication_status='published' WHERE id=$1",
        [claim],
        "23514",
      );
      await rejects(
        c,
        "UPDATE app_private.service_claims SET claim_text='Changed wording' WHERE id=$1",
        [claim],
        "23514",
      );
      await rejects(
        c,
        "UPDATE app_private.claim_evidence SET support_type='contradicts' WHERE claim_id=$1",
        [claim],
        "23514",
      );
    },
  );
  scenario(
    "source conflicts require competing passages and reviewed resolution rather than automatic newest-wins",
    async (c) => {
      await c.query(
        "INSERT INTO app_private.source_conflicts(id,service_id,claim_id,conflict_key,conflict_type) VALUES ($1,$2,$3,'synthetic-conflict','other')",
        [id(8), service, claim],
      );
      await c.query(
        "INSERT INTO app_private.conflict_evidence(conflict_id,passage_id,position) VALUES ($1,$2,'supports')",
        [id(8), passage],
      );
      const resolve =
        "UPDATE app_private.source_conflicts SET state='resolved',resolved_by=$2,resolved_at=statement_timestamp(),resolution='Synthetic resolution metadata' WHERE id=$1";
      await rejects(c, resolve, [id(8), reviewer], "23514");
      await c.query(
        "INSERT INTO app_private.passages(id,document_version_id,ordinal,passage_text,normalized_text,language) VALUES ($1,$2,1,'Competing synthetic excerpt','Competing synthetic excerpt','en')",
        [id(9), version],
      );
      await c.query(
        "INSERT INTO app_private.conflict_evidence(conflict_id,passage_id,position) VALUES ($1,$2,'contradicts')",
        [id(8), id(9)],
      );
      await c.query(resolve, [id(8), reviewer]);
      await rejects(
        c,
        "INSERT INTO app_private.conflict_evidence(conflict_id,passage_id,position) VALUES ($1,$2,'context')",
        [missing, passage],
        "23503",
      );
    },
  );
  scenario(
    "embedding metadata accepts different model dimensions and rejects mismatched/nonfinite vectors",
    async (c) => {
      await c.query(
        "INSERT INTO app_private.embedding_profiles(id,provider_key,model_id,model_revision,dimensions,tokenizer_revision) VALUES ($1,'synthetic','fixture-model','test-v1',3,'test-v1'),($2,'synthetic','fixture-model','test-v2',4,'test-v1')",
        [profile, id(10)],
      );
      await c.query(
        "INSERT INTO app_private.passage_embeddings(passage_id,profile_id,embedding_dimension,vector_data) VALUES ($1,$2,3,'[1,0,0]'),($1,$3,4,'[1,0,0,0]')",
        [passage, profile, id(10)],
      );
      await c.query(
        "INSERT INTO app_private.passages(id,document_version_id,ordinal,passage_text,normalized_text,language) VALUES ($1,$2,1,'Dimension test','Dimension test','en')",
        [id(11), version],
      );
      await rejects(
        c,
        "INSERT INTO app_private.passage_embeddings(passage_id,profile_id,embedding_dimension,vector_data) VALUES ($1,$2,4,'[1,0,0,0]')",
        [id(11), profile],
        "23503",
      );
      await rejects(
        c,
        "INSERT INTO app_private.passage_embeddings(passage_id,profile_id,embedding_dimension,vector_data) VALUES ($1,$2,4,'[1,0,0]')",
        [id(11), id(10)],
        "23514",
      );
      await rejects(
        c,
        "INSERT INTO app_private.embedding_profiles(provider_key,model_id,model_revision,dimensions,tokenizer_revision) VALUES ('synthetic','too-wide','test',16001,'test')",
        [],
        "23514",
      );
      await rejects(
        c,
        "UPDATE app_private.embedding_profiles SET dimensions=4 WHERE id=$1",
        [profile],
        "23514",
      );
      await rejects(c, "SELECT '[NaN,1,2]'::extensions.vector", [], "22000");
      await c.query(
        "UPDATE app_private.passage_embeddings SET indexing_status='indexed' WHERE passage_id=$1",
        [passage],
      );
      await rejects(
        c,
        "UPDATE app_private.passage_embeddings SET vector_data='[0,1,0]' WHERE profile_id=$1",
        [profile],
        "23514",
      );
    },
  );
  scenario(
    "API roles cannot read private evidence or execute eligibility functions",
    async (c) => {
      for (const role of [
        "askbd_web",
        "anon",
        "authenticated",
        "service_role",
      ]) {
        await c.query(`GRANT ${role} TO postgres WITH INHERIT FALSE, SET TRUE`);
        await c.query(`SET LOCAL ROLE ${role}`);
        await rejects(
          c,
          "SELECT * FROM app_private.source_verifications",
          [],
          "42501",
        );
        await rejects(
          c,
          "SELECT app_private.passage_is_eligible($1)",
          [passage],
          "42501",
        );
        await rejects(
          c,
          "UPDATE app_private.source_documents SET approval_status='approved'",
          [],
          "42501",
        );
        await c.query("RESET ROLE");
      }
    },
  );
  scenario(
    "RLS still denies anonymous evidence when temporary schema/table grants are supplied",
    async (c) => {
      await c.query("GRANT USAGE ON SCHEMA app_private TO anon");
      await c.query("GRANT SELECT ON ALL TABLES IN SCHEMA app_private TO anon");
      await c.query("GRANT INSERT ON app_private.passages TO anon");
      // The lineage trigger uses SELECT FOR SHARE, which requires UPDATE privilege
      // even when RLS makes the parent invisible. Isolate the row-policy denial.
      await c.query("GRANT UPDATE ON app_private.document_versions TO anon");
      await c.query("GRANT anon TO postgres WITH INHERIT FALSE, SET TRUE");
      await c.query("SET LOCAL ROLE anon");
      assert.equal(
        (await c.query("SELECT id FROM app_private.passages")).rowCount,
        0,
      );
      await c.query("SAVEPOINT rls_denial");
      await assert.rejects(
        c.query(
          "INSERT INTO app_private.passages(document_version_id,ordinal,passage_text,normalized_text,language) VALUES ($1,12,'Denied','Denied','en')",
          [version],
        ),
        (error) =>
          error.code === "42501" &&
          error.message.includes("row-level security"),
      );
      await c.query("ROLLBACK TO SAVEPOINT rls_denial");
      await c.query("RESET ROLE");
    },
  );
  scenario(
    "invalid version parents, statuses and evidence relationships are rejected",
    async (c) => {
      await rejects(
        c,
        "INSERT INTO app_private.document_versions(source_document_id,version_number,content_hash,extraction_profile,retrieved_at,extraction_method,snapshot_backend,snapshot_key) VALUES ($1,1,$2,'missing-parent',statement_timestamp(),'manual','fixture','missing')",
        [missing, hash],
        "23503",
      );
      await rejects(
        c,
        "UPDATE app_private.document_versions SET review_state='verified' WHERE id=$1",
        [version],
        "23514",
      );
      await rejects(
        c,
        "INSERT INTO app_private.claim_evidence(claim_id,passage_id,support_type,reviewed_by,reviewed_at) VALUES ($1,$2,'supports',$3,statement_timestamp())",
        [missing, passage, reviewer],
        "23503",
      );
      await rejects(
        c,
        "INSERT INTO app_private.claim_evidence(claim_id,passage_id,support_type,reviewed_by,reviewed_at) VALUES ($1,$2,'invented',$3,statement_timestamp())",
        [claim, passage, reviewer],
        "23514",
      );
    },
  );
}
