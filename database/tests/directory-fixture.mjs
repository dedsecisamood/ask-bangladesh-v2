import { assertDisposableName } from "../../scripts/database-local.mjs";
// Synthetic fixture that simulates all publication states ONLY in a guarded,
// disposable database. Nothing here is an official verification or a live fetch.
export const directoryIds = Object.fromEntries(
  [
    "creator",
    "reviewer",
    "agency",
    "category",
    "service",
    "domain",
    "source",
    "document",
    "version",
    "passage",
  ].map((key, n) => [
    key,
    `17000000-0000-4000-8000-${String(n + 1).padStart(12, "0")}`,
  ]),
);
export async function seedDirectoryFixture(c) {
  assertDisposableName(
    (await c.query("SELECT current_database() name")).rows[0].name,
  );
  const i = directoryIds;
  for (const key of ["creator", "reviewer"])
    await c.query(
      "INSERT INTO app_private.admin_memberships(id,auth_user_id,role,status) VALUES($1,$1,'source_reviewer','active')",
      [i[key]],
    );
  await c.query(
    "INSERT INTO app_private.agencies(id,slug,status,publication_status,verification_method,verification_evidence_ref,verified_at) VALUES($1,'fixture-agency','verified','published','isolated fixture','fixture:agency',statement_timestamp())",
    [i.agency],
  );
  await c.query(
    "INSERT INTO app_private.agency_translations(agency_id,locale,name,review_state) VALUES($1,'bn','Synthetic test agency','reviewed')",
    [i.agency],
  );
  await c.query(
    "INSERT INTO app_private.categories(id,slug,publication_status) VALUES($1,'fixture-category','published')",
    [i.category],
  );
  await c.query(
    "INSERT INTO app_private.category_translations(category_id,locale,name,review_state) VALUES($1,'bn','Synthetic test category','reviewed')",
    [i.category],
  );
  await c.query(
    "INSERT INTO app_private.services(id,slug,publication_status) VALUES($1,'fixture-service','published')",
    [i.service],
  );
  await c.query(
    "INSERT INTO app_private.service_translations(service_id,locale,title,summary,review_state) VALUES($1,'bn','Synthetic test service','PRIVATE: do not expose arbitrary summary','reviewed')",
    [i.service],
  );
  await c.query(
    "INSERT INTO app_private.service_categories(service_id,category_id) VALUES($1,$2)",
    [i.service, i.category],
  );
  await c.query(
    "INSERT INTO app_private.service_agencies(service_id,agency_id,review_state) VALUES($1,$2,'reviewed')",
    [i.service, i.agency],
  );
  await c.query(
    "INSERT INTO app_private.official_domains(id,agency_id,hostname,authenticity_status,content_authority_status,verification_method,verification_evidence_ref,verified_at,notes) VALUES($1,$2,'p17.example.invalid','verified','approved','isolated fixture','fixture:domain',statement_timestamp(),'PRIVATE: review notes')",
    [i.domain, i.agency],
  );
  await c.query(
    "INSERT INTO app_private.sources(id,agency_id,official_domain_id,canonical_url,status,content_use_status) VALUES($1,$2,$3,'https://p17.example.invalid/','active','allowed')",
    [i.source, i.agency, i.domain],
  );
  await c.query(
    "INSERT INTO app_private.source_documents(id,source_id,canonical_url,document_title,document_type,approval_status) VALUES($1,$2,'https://p17.example.invalid/fixture.pdf','Synthetic fixture document','pdf','approved')",
    [i.document, i.source],
  );
  await c.query(
    "INSERT INTO app_private.document_versions(id,source_document_id,version_number,content_hash,extraction_profile,retrieved_at,extraction_status,extraction_method,snapshot_backend,snapshot_key,review_state) VALUES($1,$2,1,repeat('a',64),'fixture-v1',statement_timestamp(),'succeeded','pdf_text','fixture','PRIVATE/snapshot.pdf','extracted')",
    [i.version, i.document],
  );
  await c.query(
    "INSERT INTO app_private.passages(id,document_version_id,ordinal,passage_text,normalized_text,page_number,language,extraction_quality_status) VALUES($1,$2,0,'Synthetic fixture text','Synthetic fixture text',2,'en','accepted')",
    [i.passage, i.version],
  );
  for (const type of ["ownership", "document_review"])
    await c.query(
      "INSERT INTO app_private.source_verifications(source_id,document_version_id,verification_type,status,method,evidence_ref,reviewer_id,verified_at,expires_at,notes) VALUES($1,$2,$3,'approved','isolated fixture','fixture:verification',$4,statement_timestamp(),statement_timestamp()+interval '1 day','PRIVATE: review notes')",
      [i.source, type === "ownership" ? null : i.version, type, i.reviewer],
    );
  await c.query(
    "INSERT INTO app_private.source_checks(source_id,document_id,document_version_id,attempted_at,content_checked_at,outcome,http_status,content_hash,final_url,origin_validated,mime_validated) VALUES($1,$2,$3,statement_timestamp(),statement_timestamp(),'matched',200,repeat('a',64),'https://p17.example.invalid/fixture.pdf',true,true)",
    [i.source, i.document, i.version],
  );
  await c.query(
    "UPDATE app_private.document_versions SET review_state='approved',reviewed_by=$1,reviewed_at=statement_timestamp(),review_note='PRIVATE: fixture review',released_at=statement_timestamp() WHERE id=$2",
    [i.reviewer, i.version],
  );
  await c.query(
    "UPDATE app_private.source_documents SET current_version_id=$1 WHERE id=$2",
    [i.version, i.document],
  );
  for (const [column, id, table] of [
    ["agency_id", i.agency, "agencies"],
    ["category_id", i.category, "categories"],
    ["service_id", i.service, "services"],
    ["source_id", i.source, "sources"],
  ])
    await c.query(
      `INSERT INTO app_private.metadata_releases(${column},locale,record_revision,translation_revision,created_by,reviewed_by,reviewer_revision,reviewed_at,expires_at) SELECT $1,'bn',revision,$2,$3,$4,1,statement_timestamp(),statement_timestamp()+interval '1 day' FROM app_private.${table} WHERE id=$1`,
      [id, column === "source_id" ? null : 1, i.creator, i.reviewer],
    );
  return i;
}
