-- P15: private evidence records. No ingestion, model calls, public grants or staff authentication.
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

ALTER TABLE app_private.official_domains ADD CONSTRAINT official_domains_agency_identity UNIQUE(id, agency_id);
CREATE TABLE app_private.sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES app_private.agencies(id) ON DELETE RESTRICT,
  official_domain_id uuid NOT NULL,
  canonical_url text NOT NULL UNIQUE CHECK (char_length(canonical_url) <= 2048 AND canonical_url ~ '^https://[a-z0-9.-]+/[^#[:space:]]*$' AND canonical_url !~ '@'),
  scope_path text NOT NULL DEFAULT '/' CHECK (scope_path ~ '^/' AND scope_path ~ '/$' AND scope_path !~ '[?#[:space:]]' AND char_length(scope_path) <= 1024),
  status text NOT NULL DEFAULT 'candidate' CHECK (status IN ('candidate','verified','active','suspended','retired')),
  risk_class text NOT NULL DEFAULT 'critical' CHECK (risk_class IN ('critical','general')),
  content_use_status text NOT NULL DEFAULT 'unknown' CHECK (content_use_status IN ('unknown','allowed','denied')),
  is_synthetic boolean NOT NULL DEFAULT false,
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(), updated_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  FOREIGN KEY(official_domain_id,agency_id) REFERENCES app_private.official_domains(id,agency_id) ON DELETE RESTRICT,
  CHECK (NOT is_synthetic OR status NOT IN ('verified','active'))
);
CREATE INDEX sources_domain_idx ON app_private.sources(official_domain_id);
CREATE TABLE app_private.service_sources (
  service_id uuid NOT NULL REFERENCES app_private.services(id) ON DELETE RESTRICT,
  source_id uuid NOT NULL REFERENCES app_private.sources(id) ON DELETE RESTRICT,
  relationship text NOT NULL DEFAULT 'reference' CHECK (relationship IN ('reference','responsible','supporting')),
  PRIMARY KEY(service_id,source_id)
);
CREATE INDEX service_sources_source_idx ON app_private.service_sources(source_id);
CREATE TABLE app_private.source_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES app_private.sources(id) ON DELETE RESTRICT,
  canonical_url text NOT NULL CHECK (char_length(canonical_url) <= 2048 AND canonical_url ~ '^https://[a-z0-9.-]+/[^#[:space:]]*$' AND canonical_url !~ '@'),
  document_title text NOT NULL CHECK (char_length(btrim(document_title)) BETWEEN 1 AND 500),
  document_type text NOT NULL CHECK (document_type IN ('html','pdf','text','other')),
  language text NOT NULL DEFAULT 'unknown' CHECK (language IN ('bn','en','banglish','mixed','unknown')),
  approval_status text NOT NULL DEFAULT 'discovered' CHECK (approval_status IN ('discovered','pending_review','approved','suspended','outdated','rejected')),
  current_version_id uuid,
  discovered_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  is_synthetic boolean NOT NULL DEFAULT false,
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(), updated_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  UNIQUE(source_id,canonical_url), UNIQUE(id,source_id),
  CHECK (NOT is_synthetic OR approval_status <> 'approved')
);
CREATE TABLE app_private.document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id uuid NOT NULL REFERENCES app_private.source_documents(id) ON DELETE RESTRICT,
  version_number integer NOT NULL CHECK (version_number > 0),
  content_hash text NOT NULL CHECK (content_hash ~ '^[a-f0-9]{64}$'),
  extraction_profile text NOT NULL CHECK (char_length(btrim(extraction_profile)) BETWEEN 1 AND 200),
  retrieved_at timestamptz NOT NULL,
  published_at timestamptz, effective_from timestamptz, effective_to timestamptz, expires_at timestamptz,
  extraction_status text NOT NULL DEFAULT 'pending' CHECK (extraction_status IN ('pending','succeeded','failed')),
  extraction_method text NOT NULL CHECK (extraction_method IN ('html','pdf_text','ocr_bn','manual','other')),
  snapshot_backend text NOT NULL CHECK (snapshot_backend ~ '^[a-z][a-z0-9_-]{0,39}$'),
  snapshot_key text NOT NULL CHECK (char_length(snapshot_key) BETWEEN 1 AND 1024 AND snapshot_key !~ '(^/|://|[?\\]|(^|/)\.\.(/|$))'),
  extracted_backend text, extracted_key text,
  metadata jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(metadata)='object' AND octet_length(metadata::text) <= 8192),
  supersedes_id uuid REFERENCES app_private.document_versions(id) ON DELETE RESTRICT,
  review_state text NOT NULL DEFAULT 'quarantined' CHECK (review_state IN ('quarantined','extracted','needs_review','approved','rejected','revoked')),
  reviewed_by uuid, reviewed_at timestamptz, review_note text CHECK (char_length(review_note) <= 4000),
  released_at timestamptz,
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(), updated_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  UNIQUE(source_document_id,version_number), UNIQUE(source_document_id,content_hash,extraction_profile), UNIQUE(id,source_document_id),
  CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to > effective_from),
  CHECK (expires_at IS NULL OR expires_at > retrieved_at), CHECK (supersedes_id IS DISTINCT FROM id),
  CHECK ((extracted_backend IS NULL) = (extracted_key IS NULL)),
  CHECK (extracted_backend IS NULL OR extracted_backend ~ '^[a-z][a-z0-9_-]{0,39}$'),
  CHECK (extracted_key IS NULL OR (char_length(extracted_key) BETWEEN 1 AND 1024 AND extracted_key !~ '(^/|://|[?\\]|(^|/)\.\.(/|$))')),
  CHECK (review_state <> 'approved' OR (extraction_status='succeeded' AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL AND review_note IS NOT NULL AND char_length(btrim(review_note)) > 0)),
  CHECK (released_at IS NULL OR review_state IN ('approved','revoked'))
);
ALTER TABLE app_private.source_documents ADD CONSTRAINT current_version_same_document
  FOREIGN KEY(current_version_id,id) REFERENCES app_private.document_versions(id,source_document_id) ON DELETE RESTRICT;
CREATE TABLE app_private.passages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_version_id uuid NOT NULL REFERENCES app_private.document_versions(id) ON DELETE RESTRICT,
  ordinal integer NOT NULL CHECK (ordinal >= 0),
  passage_text text NOT NULL CHECK (char_length(btrim(passage_text)) BETWEEN 1 AND 16000),
  normalized_text text NOT NULL CHECK (char_length(btrim(normalized_text)) BETWEEN 1 AND 16000),
  content_hash text GENERATED ALWAYS AS (encode(extensions.digest(passage_text,'sha256'),'hex')) STORED,
  heading text CHECK (char_length(heading) <= 500),
  section_path text[] NOT NULL DEFAULT '{}' CHECK (cardinality(section_path) <= 16 AND octet_length(section_path::text) <= 2048),
  page_number integer CHECK (page_number >= 1), page_label text CHECK (char_length(page_label) <= 80),
  character_start integer CHECK (character_start >= 0), character_end integer,
  locator jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(locator)='object' AND octet_length(locator::text) <= 4096),
  language text NOT NULL CHECK (language IN ('bn','en','banglish','mixed','unknown')),
  extraction_quality_status text NOT NULL DEFAULT 'pending' CHECK (extraction_quality_status IN ('pending','accepted','rejected')),
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  UNIQUE(document_version_id,ordinal),
  CHECK ((character_start IS NULL) = (character_end IS NULL)),
  CHECK (character_end IS NULL OR character_end-character_start=char_length(passage_text))
);
CREATE TABLE app_private.source_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), source_id uuid NOT NULL REFERENCES app_private.sources(id) ON DELETE RESTRICT,
  document_version_id uuid REFERENCES app_private.document_versions(id) ON DELETE RESTRICT,
  verification_type text NOT NULL CHECK (verification_type IN ('ownership','relevance','document_review','accessibility','freshness')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  method text NOT NULL CHECK (char_length(btrim(method)) BETWEEN 1 AND 200),
  evidence_ref text NOT NULL CHECK (char_length(btrim(evidence_ref)) BETWEEN 1 AND 2048),
  reviewer_id uuid, verified_at timestamptz, expires_at timestamptz,
  notes text CHECK (char_length(notes) <= 4000), created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  CHECK (status='pending' OR (reviewer_id IS NOT NULL AND verified_at IS NOT NULL)),
  CHECK (status<>'approved' OR (expires_at IS NOT NULL AND expires_at > verified_at)),
  CHECK (verification_type<>'ownership' OR (document_version_id IS NULL AND (expires_at IS NULL OR expires_at <= verified_at + interval '90 days'))),
  CHECK (verification_type<>'document_review' OR document_version_id IS NOT NULL)
);
CREATE INDEX source_verifications_source_idx ON app_private.source_verifications(source_id,verified_at DESC);
CREATE TABLE app_private.source_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), source_id uuid NOT NULL,
  document_id uuid NOT NULL, document_version_id uuid,
  attempted_at timestamptz NOT NULL, content_checked_at timestamptz,
  outcome text NOT NULL CHECK (outcome IN ('matched','changed','unavailable','withdrawn','invalid')),
  http_status integer CHECK (http_status BETWEEN 100 AND 599),
  content_hash text CHECK (content_hash ~ '^[a-f0-9]{64}$'), final_url text CHECK (char_length(final_url) <= 2048),
  redirect_manifest jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(redirect_manifest)='array' AND octet_length(redirect_manifest::text) <= 8192),
  origin_validated boolean NOT NULL DEFAULT false, mime_validated boolean NOT NULL DEFAULT false,
  prior_check_id uuid REFERENCES app_private.source_checks(id) ON DELETE RESTRICT,
  error_code text CHECK (error_code ~ '^[A-Z0-9_]{1,80}$'), created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  FOREIGN KEY(document_id,source_id) REFERENCES app_private.source_documents(id,source_id) ON DELETE RESTRICT,
  FOREIGN KEY(document_version_id,document_id) REFERENCES app_private.document_versions(id,source_document_id) ON DELETE RESTRICT,
  CHECK (content_checked_at IS NULL OR content_checked_at <= attempted_at),
  CHECK ((outcome='matched') = (content_checked_at IS NOT NULL)),
  CHECK (outcome<>'matched' OR (document_version_id IS NOT NULL AND content_hash IS NOT NULL AND origin_validated AND mime_validated AND final_url IS NOT NULL AND http_status IN (200,304))),
  CHECK (http_status IS DISTINCT FROM 304 OR prior_check_id IS NOT NULL)
);
CREATE INDEX source_checks_document_time_idx ON app_private.source_checks(document_id,attempted_at DESC,id);
CREATE TABLE app_private.embedding_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), provider_key text NOT NULL CHECK (char_length(btrim(provider_key)) BETWEEN 1 AND 80),
  model_id text NOT NULL CHECK (char_length(btrim(model_id)) BETWEEN 1 AND 160),
  model_revision text NOT NULL CHECK (char_length(btrim(model_revision)) BETWEEN 1 AND 160),
  dimensions integer NOT NULL CHECK (dimensions BETWEEN 1 AND 16000),
  metric text NOT NULL DEFAULT 'cosine' CHECK (metric IN ('cosine','l2','inner_product')),
  normalization text NOT NULL DEFAULT 'none' CHECK (normalization IN ('none','l2_unit')),
  tokenizer_revision text NOT NULL CHECK (char_length(btrim(tokenizer_revision)) BETWEEN 1 AND 160),
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  UNIQUE(provider_key,model_id,model_revision,dimensions,metric,normalization,tokenizer_revision), UNIQUE(id,dimensions)
);
CREATE TABLE app_private.passage_embeddings (
  passage_id uuid NOT NULL REFERENCES app_private.passages(id) ON DELETE RESTRICT,
  profile_id uuid NOT NULL, embedding_dimension integer NOT NULL,
  vector_data extensions.vector NOT NULL,
  indexing_status text NOT NULL DEFAULT 'pending' CHECK (indexing_status IN ('pending','indexed','failed')),
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  PRIMARY KEY(passage_id,profile_id),
  FOREIGN KEY(profile_id,embedding_dimension) REFERENCES app_private.embedding_profiles(id,dimensions) ON DELETE RESTRICT,
  CHECK (vector_data IS NULL OR extensions.vector_dims(vector_data)=embedding_dimension),
  CHECK (indexing_status<>'indexed' OR vector_data IS NOT NULL)
);
CREATE INDEX passage_embeddings_profile_idx ON app_private.passage_embeddings(profile_id);
CREATE TABLE app_private.service_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), service_id uuid NOT NULL REFERENCES app_private.services(id) ON DELETE RESTRICT,
  claim_type text NOT NULL CHECK (claim_type IN ('fee','deadline','eligibility','required_documents','procedure','effective_date','other')),
  language text NOT NULL CHECK (language IN ('bn','en','banglish')),
  claim_text text NOT NULL CHECK (char_length(btrim(claim_text)) BETWEEN 1 AND 4000),
  applicability jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(applicability)='object' AND octet_length(applicability::text) <= 4096),
  effective_from timestamptz, effective_to timestamptz,
  verification_status text NOT NULL DEFAULT 'unreviewed' CHECK (verification_status IN ('unreviewed','reviewed','rejected')),
  publication_status text NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft','in_review','published','withdrawn')),
  created_by uuid, reviewed_by uuid, reviewed_at timestamptz, review_note text CHECK (char_length(review_note) <= 4000),
  is_synthetic boolean NOT NULL DEFAULT false, revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(), updated_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to > effective_from),
  CHECK (verification_status<>'reviewed' OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL AND review_note IS NOT NULL AND char_length(btrim(review_note)) > 0)),
  CHECK (NOT is_synthetic OR (publication_status<>'published' AND verification_status<>'reviewed')),
  CHECK (publication_status<>'published' OR (verification_status='reviewed' AND created_by IS NOT NULL AND reviewed_by <> created_by))
);
CREATE INDEX service_claims_service_idx ON app_private.service_claims(service_id);
CREATE TABLE app_private.claim_evidence (
  claim_id uuid NOT NULL REFERENCES app_private.service_claims(id) ON DELETE RESTRICT,
  passage_id uuid NOT NULL REFERENCES app_private.passages(id) ON DELETE RESTRICT,
  support_type text NOT NULL CHECK (support_type IN ('supports','contradicts','context')),
  reviewed_by uuid NOT NULL, reviewed_at timestamptz NOT NULL, note text CHECK (char_length(note) <= 4000),
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(), PRIMARY KEY(claim_id,passage_id,support_type),
  CHECK ((reviewed_by IS NULL) = (reviewed_at IS NULL))
);
CREATE INDEX claim_evidence_passage_idx ON app_private.claim_evidence(passage_id);
CREATE TABLE app_private.source_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), service_id uuid REFERENCES app_private.services(id) ON DELETE RESTRICT,
  claim_id uuid REFERENCES app_private.service_claims(id) ON DELETE RESTRICT,
  conflict_key text NOT NULL CHECK (char_length(btrim(conflict_key)) BETWEEN 1 AND 200),
  conflict_type text NOT NULL CHECK (conflict_type IN ('fee','deadline','eligibility','required_documents','procedure','effective_date','other')),
  applicability jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(applicability)='object' AND octet_length(applicability::text) <= 4096),
  state text NOT NULL DEFAULT 'open' CHECK (state IN ('open','under_review','resolved','dismissed')),
  detected_at timestamptz NOT NULL DEFAULT statement_timestamp(), resolved_by uuid, resolved_at timestamptz,
  resolution text CHECK (char_length(resolution) <= 4000), revision bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(), updated_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  CHECK (state NOT IN ('resolved','dismissed') OR (resolved_by IS NOT NULL AND resolved_at IS NOT NULL AND resolution IS NOT NULL AND char_length(btrim(resolution)) > 0))
);
CREATE INDEX source_conflicts_service_idx ON app_private.source_conflicts(service_id,state);
CREATE TABLE app_private.conflict_evidence (
  conflict_id uuid NOT NULL REFERENCES app_private.source_conflicts(id) ON DELETE RESTRICT,
  passage_id uuid NOT NULL REFERENCES app_private.passages(id) ON DELETE RESTRICT,
  position text NOT NULL CHECK (position IN ('supports','contradicts','context')),
  PRIMARY KEY(conflict_id,passage_id)
);
CREATE INDEX conflict_evidence_passage_idx ON app_private.conflict_evidence(passage_id);
CREATE TABLE app_private.evidence_review_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES app_private.sources(id) ON DELETE RESTRICT,
  document_id uuid REFERENCES app_private.source_documents(id) ON DELETE RESTRICT,
  version_id uuid REFERENCES app_private.document_versions(id) ON DELETE RESTRICT,
  claim_id uuid REFERENCES app_private.service_claims(id) ON DELETE RESTRICT,
  conflict_id uuid REFERENCES app_private.source_conflicts(id) ON DELETE RESTRICT,
  old_state jsonb, new_state jsonb NOT NULL,
  reviewer_id uuid, recorded_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  CHECK (num_nonnulls(source_id,document_id,version_id,claim_id,conflict_id)=1)
);

CREATE FUNCTION app_private.evidence_immutable() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $f$
BEGIN RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='Evidence identity/content is immutable; create a new version'; END $f$;
CREATE FUNCTION app_private.evidence_content_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $f$
BEGIN
  IF TG_OP='DELETE' THEN RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='Referenced evidence must be retained or explicitly purged under policy'; END IF;
  IF TG_TABLE_NAME='document_versions' AND
    (to_jsonb(NEW)-ARRAY['review_state','reviewed_by','reviewed_at','review_note','released_at','revision','updated_at']) IS DISTINCT FROM
    (to_jsonb(OLD)-ARRAY['review_state','reviewed_by','reviewed_at','review_note','released_at','revision','updated_at']) THEN
    RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='Snapshot content, dates and lineage are immutable';
  ELSIF TG_TABLE_NAME='service_claims' AND
    (to_jsonb(NEW)-ARRAY['verification_status','publication_status','reviewed_by','reviewed_at','review_note','revision','updated_at']) IS DISTINCT FROM
    (to_jsonb(OLD)-ARRAY['verification_status','publication_status','reviewed_by','reviewed_at','review_note','revision','updated_at']) THEN
    RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='Reusable claim content is immutable';
  END IF;
  RETURN NEW;
END $f$;
CREATE FUNCTION app_private.evidence_lineage_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $f$
DECLARE host_name text; source_row app_private.sources; doc app_private.source_documents; ver app_private.document_versions;
BEGIN
  IF TG_TABLE_NAME='sources' THEN
    IF TG_OP='UPDATE' AND (NEW.agency_id,NEW.official_domain_id,NEW.canonical_url,NEW.scope_path) IS DISTINCT FROM (OLD.agency_id,OLD.official_domain_id,OLD.canonical_url,OLD.scope_path) THEN
      RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Registry provenance identity is immutable'; END IF;
    SELECT hostname INTO host_name FROM app_private.official_domains WHERE id=NEW.official_domain_id;
    IF host_name IS NOT NULL AND split_part(split_part(NEW.canonical_url,'://',2),'/',1) <> host_name THEN
      RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Source URL must use its registered exact host'; END IF;
    IF EXISTS (SELECT 1 FROM app_private.official_domains WHERE id=NEW.official_domain_id AND is_synthetic) AND NOT NEW.is_synthetic THEN
      RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Synthetic lineage must remain synthetic'; END IF;
  ELSIF TG_TABLE_NAME='source_documents' THEN
    SELECT * INTO source_row FROM app_private.sources WHERE id=NEW.source_id;
    IF source_row.id IS NOT NULL AND (split_part(split_part(NEW.canonical_url,'://',2),'/',1) <> split_part(split_part(source_row.canonical_url,'://',2),'/',1)
      OR NOT starts_with(substring(NEW.canonical_url from '^https://[^/]+(/.*)$'),source_row.scope_path)
      OR (source_row.is_synthetic AND NOT NEW.is_synthetic)) THEN
      RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Document must preserve source host/scope/synthetic lineage'; END IF;
    IF TG_OP='UPDATE' AND (NEW.source_id,NEW.canonical_url,NEW.document_type,NEW.language,NEW.document_title) IS DISTINCT FROM (OLD.source_id,OLD.canonical_url,OLD.document_type,OLD.language,OLD.document_title) THEN
      RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Document provenance identity is immutable'; END IF;
    IF NEW.current_version_id IS NOT NULL AND NOT app_private.version_is_eligible(NEW.current_version_id) THEN
      RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Only independently eligible reviewed evidence may be selected'; END IF;
  ELSIF TG_TABLE_NAME='document_versions' THEN
    IF NEW.supersedes_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM app_private.document_versions WHERE id=NEW.supersedes_id AND source_document_id=NEW.source_document_id AND version_number < NEW.version_number) THEN
      RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Supersession must reference an earlier version of the same document'; END IF;
    SELECT * INTO doc FROM app_private.source_documents WHERE id=NEW.source_document_id;
    IF NEW.review_state='approved' AND (doc.is_synthetic OR NOT EXISTS (SELECT 1 FROM app_private.source_verifications sv WHERE sv.document_version_id=NEW.id AND sv.source_id=doc.source_id AND sv.verification_type='document_review' AND sv.status='approved' AND sv.reviewer_id=NEW.reviewed_by AND sv.verified_at<=statement_timestamp() AND sv.expires_at>statement_timestamp())) THEN
      RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Approval requires a current human review record for this version'; END IF;
  ELSIF TG_TABLE_NAME='passages' THEN
    SELECT * INTO ver FROM app_private.document_versions WHERE id=NEW.document_version_id FOR SHARE;
    SELECT * INTO doc FROM app_private.source_documents WHERE id=ver.source_document_id;
    IF ver.id IS NOT NULL AND (ver.review_state NOT IN ('quarantined','extracted') OR (doc.document_type<>'pdf' AND NEW.page_number IS NOT NULL)) THEN
      RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Passages must be built before review with format-correct locators'; END IF;
  ELSIF TG_TABLE_NAME='source_verifications' THEN
    IF NEW.document_version_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM app_private.document_versions v JOIN app_private.source_documents d ON d.id=v.source_document_id WHERE v.id=NEW.document_version_id AND d.source_id=NEW.source_id) THEN
      RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Verification must match source/version lineage'; END IF;
    IF NEW.status='approved' AND EXISTS (SELECT 1 FROM app_private.sources WHERE id=NEW.source_id AND is_synthetic) THEN
      RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Synthetic sources cannot be asserted verified'; END IF;
  ELSIF TG_TABLE_NAME='source_checks' THEN
    IF NEW.outcome='matched' AND NOT EXISTS (SELECT 1 FROM app_private.document_versions v JOIN app_private.source_documents d ON d.id=v.source_document_id WHERE v.id=NEW.document_version_id AND v.content_hash=NEW.content_hash AND d.canonical_url=NEW.final_url) THEN
      RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Content checks must bind the exact digest and approved URL identity'; END IF;
    IF NEW.http_status=304 AND NOT EXISTS (SELECT 1 FROM app_private.source_checks c WHERE c.id=NEW.prior_check_id AND c.document_id=NEW.document_id AND c.document_version_id=NEW.document_version_id AND c.outcome='matched' AND c.content_hash=NEW.content_hash AND c.final_url=NEW.final_url AND c.attempted_at<NEW.attempted_at) THEN
      RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='304 requires a prior matching validated response'; END IF;
  ELSIF TG_TABLE_NAME='service_claims' THEN
    IF EXISTS (SELECT 1 FROM app_private.services WHERE id=NEW.service_id AND is_synthetic) AND NOT NEW.is_synthetic THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Synthetic claim lineage must remain synthetic'; END IF;
    IF NEW.publication_status='published' AND (NOT EXISTS (SELECT 1 FROM app_private.claim_evidence ce WHERE ce.claim_id=NEW.id AND ce.support_type='supports' AND ce.reviewed_by IS NOT NULL AND ce.reviewed_at<=statement_timestamp() AND app_private.passage_is_eligible(ce.passage_id)) OR EXISTS (SELECT 1 FROM app_private.source_conflicts c WHERE (c.claim_id=NEW.id OR c.service_id=NEW.service_id) AND c.state IN ('open','under_review'))) THEN
      RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Published claims require reviewed eligible support and no unresolved conflict'; END IF;
  ELSIF TG_TABLE_NAME='source_conflicts' THEN
    IF NEW.claim_id IS NOT NULL AND NEW.service_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM app_private.service_claims WHERE id=NEW.claim_id AND service_id=NEW.service_id) THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Conflict service/claim scope must agree'; END IF;
    IF NEW.state IN ('resolved','dismissed') AND (SELECT count(*) FROM app_private.conflict_evidence WHERE conflict_id=NEW.id)<2 THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Conflict resolution requires at least two distinct evidence references'; END IF;
  END IF;
  RETURN NEW;
END $f$;
CREATE FUNCTION app_private.embedding_content_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $f$
BEGIN
  IF TG_OP='DELETE' OR (to_jsonb(NEW)-'indexing_status') IS DISTINCT FROM (to_jsonb(OLD)-'indexing_status') THEN
    RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Embedding content/profile binding is immutable'; END IF;
  RETURN NEW;
END $f$;

-- Fail-closed private predicates; no API role receives EXECUTE or table grants.
CREATE FUNCTION app_private.version_is_eligible(version_id uuid) RETURNS boolean LANGUAGE sql STABLE SET search_path=pg_catalog AS $f$
  SELECT EXISTS (
    SELECT 1 FROM app_private.document_versions v JOIN app_private.source_documents d ON d.id=v.source_document_id
    JOIN app_private.sources s ON s.id=d.source_id JOIN app_private.official_domains od ON od.id=s.official_domain_id
    JOIN app_private.agencies a ON a.id=s.agency_id
    JOIN LATERAL (SELECT * FROM app_private.source_checks sc WHERE sc.document_id=d.id ORDER BY attempted_at DESC,id DESC LIMIT 1) ck ON true
    WHERE v.id=version_id AND v.review_state='approved' AND v.released_at<=statement_timestamp() AND v.reviewed_at<=statement_timestamp()
      AND v.extraction_status='succeeded' AND d.approval_status='approved' AND NOT d.is_synthetic AND s.status='active' AND NOT s.is_synthetic
      AND s.content_use_status='allowed' AND od.authenticity_status='verified' AND od.content_authority_status='approved' AND NOT od.is_synthetic AND a.status='verified' AND NOT a.is_synthetic
      AND (v.effective_from IS NULL OR v.effective_from<=statement_timestamp()) AND (v.effective_to IS NULL OR v.effective_to>statement_timestamp()) AND (v.expires_at IS NULL OR v.expires_at>statement_timestamp())
      AND ck.outcome='matched' AND ck.document_version_id=v.id AND ck.content_hash=v.content_hash AND ck.content_checked_at<=statement_timestamp()
      AND ck.content_checked_at>statement_timestamp()-CASE s.risk_class WHEN 'critical' THEN interval '7 days' ELSE interval '30 days' END
      AND (SELECT sv.status='approved' AND sv.verified_at<=statement_timestamp() AND sv.expires_at>statement_timestamp() FROM app_private.source_verifications sv WHERE sv.source_id=s.id AND sv.verification_type='ownership' ORDER BY sv.created_at DESC,sv.id DESC LIMIT 1)
      AND NOT EXISTS (SELECT 1 FROM app_private.source_conflicts c JOIN app_private.conflict_evidence ce ON ce.conflict_id=c.id JOIN app_private.passages p ON p.id=ce.passage_id WHERE p.document_version_id=v.id AND c.state IN ('open','under_review'))
  )
$f$;
CREATE FUNCTION app_private.passage_is_eligible(passage_id uuid) RETURNS boolean LANGUAGE sql STABLE SET search_path=pg_catalog AS $f$
  SELECT EXISTS (SELECT 1 FROM app_private.passages p JOIN app_private.document_versions v ON v.id=p.document_version_id JOIN app_private.source_documents d ON d.id=v.source_document_id
    WHERE p.id=passage_id AND app_private.version_is_eligible(v.id) AND d.current_version_id=v.id AND p.extraction_quality_status='accepted'
    AND ((d.document_type='pdf' AND p.page_number IS NOT NULL) OR (d.document_type<>'pdf' AND p.character_start IS NOT NULL)))
$f$;
CREATE FUNCTION app_private.record_evidence_review() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $f$
DECLARE before_state jsonb; after_state jsonb; key_name text;
BEGIN
  before_state := CASE WHEN TG_OP='UPDATE' THEN jsonb_build_object('status',to_jsonb(OLD)->'status','review_state',to_jsonb(OLD)->'review_state','approval_status',to_jsonb(OLD)->'approval_status','publication_status',to_jsonb(OLD)->'publication_status','verification_status',to_jsonb(OLD)->'verification_status','state',to_jsonb(OLD)->'state','current_version_id',to_jsonb(OLD)->'current_version_id','released_at',to_jsonb(OLD)->'released_at') ELSE NULL END;
  after_state := jsonb_build_object('status',to_jsonb(NEW)->'status','review_state',to_jsonb(NEW)->'review_state','approval_status',to_jsonb(NEW)->'approval_status','publication_status',to_jsonb(NEW)->'publication_status','verification_status',to_jsonb(NEW)->'verification_status','state',to_jsonb(NEW)->'state','current_version_id',to_jsonb(NEW)->'current_version_id','released_at',to_jsonb(NEW)->'released_at');
  IF before_state IS DISTINCT FROM after_state THEN
    key_name := CASE TG_TABLE_NAME WHEN 'sources' THEN 'source_id' WHEN 'source_documents' THEN 'document_id' WHEN 'document_versions' THEN 'version_id' WHEN 'service_claims' THEN 'claim_id' ELSE 'conflict_id' END;
    EXECUTE format('INSERT INTO app_private.evidence_review_events(%I,old_state,new_state,reviewer_id) VALUES ($1,$2,$3,$4)',key_name) USING NEW.id,before_state,after_state,COALESCE((to_jsonb(NEW)->>'reviewed_by')::uuid,(to_jsonb(NEW)->>'resolved_by')::uuid);
  END IF;
  RETURN NULL;
END $f$;
DO $triggers$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['sources','source_documents','document_versions','passages','source_verifications','source_checks','service_claims','source_conflicts'] LOOP
    EXECUTE format('CREATE TRIGGER evidence_lineage BEFORE INSERT OR UPDATE ON app_private.%I FOR EACH ROW EXECUTE FUNCTION app_private.evidence_lineage_guard()',t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['passages','source_verifications','source_checks','embedding_profiles','claim_evidence','conflict_evidence','evidence_review_events'] LOOP
    EXECUTE format('CREATE TRIGGER immutable_evidence BEFORE UPDATE OR DELETE ON app_private.%I FOR EACH ROW EXECUTE FUNCTION app_private.evidence_immutable()',t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['document_versions','service_claims'] LOOP
    EXECUTE format('CREATE TRIGGER content_immutable BEFORE UPDATE OR DELETE ON app_private.%I FOR EACH ROW EXECUTE FUNCTION app_private.evidence_content_guard()',t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['sources','source_documents','document_versions','service_claims','source_conflicts'] LOOP
    EXECUTE format('CREATE TRIGGER touch_editorial BEFORE UPDATE ON app_private.%I FOR EACH ROW EXECUTE FUNCTION app_private.touch_editorial_record()',t);
    EXECUTE format('CREATE TRIGGER review_event AFTER INSERT OR UPDATE ON app_private.%I FOR EACH ROW EXECUTE FUNCTION app_private.record_evidence_review()',t);
  END LOOP;
END $triggers$;
CREATE TRIGGER embedding_content_immutable BEFORE UPDATE OR DELETE ON app_private.passage_embeddings FOR EACH ROW EXECUTE FUNCTION app_private.embedding_content_guard();
DO $security$
DECLARE t text; r text;
BEGIN
  FOREACH t IN ARRAY ARRAY['sources','service_sources','source_documents','document_versions','passages','source_verifications','source_checks','embedding_profiles','passage_embeddings','service_claims','claim_evidence','source_conflicts','conflict_evidence','evidence_review_events'] LOOP
    EXECUTE format('ALTER TABLE app_private.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('ALTER TABLE app_private.%I FORCE ROW LEVEL SECURITY',t);
    EXECUTE format('CREATE POLICY migration_owner ON app_private.%I TO postgres USING (true) WITH CHECK (true)',t);
  END LOOP;
  REVOKE ALL ON ALL TABLES IN SCHEMA app_private FROM PUBLIC;
  REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app_private FROM PUBLIC;
  FOREACH r IN ARRAY ARRAY['askbd_web','anon','authenticated','service_role','authenticator'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=r) THEN
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA app_private FROM %I',r);
      EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app_private FROM %I',r);
    END IF;
  END LOOP;
END $security$;
