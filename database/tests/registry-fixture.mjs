import { randomUUID } from "node:crypto";
import { assertDisposableName } from "../../scripts/database-local.mjs";
// Simulates existing reviewed document evidence in a disposable DB; never fetches.
export async function attachRegistryEvidence(c, sourceId, reviewerId) {
  assertDisposableName(
    (await c.query("SELECT current_database() name")).rows[0].name,
  );
  const source = (
    await c.query("SELECT canonical_url FROM app_private.sources WHERE id=$1", [
      sourceId,
    ])
  ).rows[0];
  const document = randomUUID(),
    version = randomUUID();
  const url = source.canonical_url + "synthetic-evidence.pdf";
  await c.query(
    "INSERT INTO app_private.source_documents(id,source_id,canonical_url,document_title,document_type,approval_status) VALUES($1,$2,$3,'Synthetic registry evidence fixture','pdf','approved')",
    [document, sourceId, url],
  );
  await c.query(
    "INSERT INTO app_private.document_versions(id,source_document_id,version_number,content_hash,extraction_profile,retrieved_at,extraction_status,extraction_method,snapshot_backend,snapshot_key,review_state) VALUES($1,$2,1,repeat('b',64),'registry-fixture-v1',statement_timestamp(),'succeeded','pdf_text','fixture','PRIVATE/registry-snapshot.pdf','extracted')",
    [version, document],
  );
  await c.query(
    "INSERT INTO app_private.source_verifications(source_id,document_version_id,verification_type,status,method,evidence_ref,reviewer_id,verified_at,expires_at,notes) VALUES($1,$2,'document_review','approved','Synthetic offline fixture','fixture:private-document-proof',$3,statement_timestamp(),statement_timestamp()+interval '1 day','PRIVATE review notes')",
    [sourceId, version, reviewerId],
  );
  await c.query(
    "INSERT INTO app_private.source_checks(source_id,document_id,document_version_id,attempted_at,content_checked_at,outcome,http_status,content_hash,final_url,origin_validated,mime_validated) VALUES($1,$2,$3,statement_timestamp(),statement_timestamp(),'matched',200,repeat('b',64),$4,true,true)",
    [sourceId, document, version, url],
  );
  await c.query(
    "UPDATE app_private.document_versions SET review_state='approved',reviewed_by=$1,reviewed_at=statement_timestamp(),review_note='PRIVATE synthetic fixture review',released_at=statement_timestamp() WHERE id=$2",
    [reviewerId, version],
  );
  await c.query(
    "UPDATE app_private.source_documents SET current_version_id=$1 WHERE id=$2",
    [version, document],
  );
  return { document, version };
}
