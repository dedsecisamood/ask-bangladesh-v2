-- P17: reviewed directory identity only. No public claims, passages or snapshots.
CREATE SCHEMA app_public;
REVOKE ALL ON SCHEMA app_public FROM PUBLIC;
GRANT USAGE ON SCHEMA app_public TO askbd_web;
ALTER DEFAULT PRIVILEGES IN SCHEMA app_public REVOKE ALL ON FUNCTIONS FROM PUBLIC;
CREATE TABLE app_private.metadata_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES app_private.agencies(id) ON DELETE RESTRICT,
  category_id uuid REFERENCES app_private.categories(id) ON DELETE RESTRICT,
  service_id uuid REFERENCES app_private.services(id) ON DELETE RESTRICT,
  source_id uuid REFERENCES app_private.sources(id) ON DELETE RESTRICT,
  locale text NOT NULL CHECK(locale IN ('bn','en')),
  record_revision bigint NOT NULL CHECK(record_revision>0),
  translation_revision bigint CHECK(translation_revision>0),
  created_by uuid NOT NULL REFERENCES app_private.admin_memberships(id) ON DELETE RESTRICT,
  reviewed_by uuid NOT NULL REFERENCES app_private.admin_memberships(id) ON DELETE RESTRICT,
  reviewer_revision bigint NOT NULL CHECK(reviewer_revision>0),
  reviewed_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  withdrawn_at timestamptz,
  CHECK(num_nonnulls(agency_id,category_id,service_id,source_id)=1),
  CHECK(created_by<>reviewed_by),
  CHECK(expires_at>reviewed_at AND expires_at<=reviewed_at+interval '30 days')
);
CREATE INDEX metadata_agency_idx ON app_private.metadata_releases(agency_id,locale);
CREATE INDEX metadata_category_idx ON app_private.metadata_releases(category_id,locale);
CREATE INDEX metadata_service_idx ON app_private.metadata_releases(service_id,locale);
CREATE INDEX metadata_source_idx ON app_private.metadata_releases(source_id,locale);
CREATE TABLE app_private.publication_state (
  singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
  generation bigint NOT NULL DEFAULT 1
);
INSERT INTO app_private.publication_state DEFAULT VALUES;
DO $rls$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['metadata_releases','publication_state'] LOOP
    EXECUTE format('ALTER TABLE app_private.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('ALTER TABLE app_private.%I FORCE ROW LEVEL SECURITY',t);
    EXECUTE format('CREATE POLICY migration_owner ON app_private.%I TO postgres USING(true) WITH CHECK(true)',t);
    EXECUTE format('REVOKE ALL ON app_private.%I FROM PUBLIC,askbd_web,askbd_staff',t);
  END LOOP;
END $rls$;
CREATE FUNCTION app_private.bump_publication_generation() RETURNS trigger LANGUAGE plpgsql
SET search_path=pg_catalog AS $fn$
BEGIN UPDATE app_private.publication_state SET generation=generation+1;RETURN NULL;END $fn$;
REVOKE ALL ON FUNCTION app_private.bump_publication_generation() FROM PUBLIC;
DO $triggers$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['agencies','agency_translations','categories','category_translations','services','service_translations',
    'service_categories','service_agencies','service_sources','official_domains','sources','source_documents','document_versions',
    'source_verifications','source_checks','source_conflicts','conflict_evidence','admin_memberships','metadata_releases'] LOOP
    EXECUTE format('CREATE TRIGGER publication_generation AFTER INSERT OR UPDATE OR DELETE ON app_private.%I FOR EACH STATEMENT EXECUTE FUNCTION app_private.bump_publication_generation()',t);
  END LOOP;
END $triggers$;
CREATE FUNCTION app_private.metadata_released(kind text,record_id uuid,locale text,revision bigint,translation_revision bigint)
RETURNS boolean LANGUAGE sql STABLE SET search_path=pg_catalog AS $fn$
  SELECT EXISTS(SELECT FROM app_private.metadata_releases r
    JOIN app_private.admin_memberships reviewer ON reviewer.id=r.reviewed_by
    JOIN app_private.admin_memberships creator ON creator.id=r.created_by
    WHERE CASE kind WHEN 'agencies' THEN r.agency_id WHEN 'categories' THEN r.category_id WHEN 'services' THEN r.service_id WHEN 'sources' THEN r.source_id END=record_id
      AND r.locale=metadata_released.locale AND r.record_revision=metadata_released.revision
      AND r.translation_revision IS NOT DISTINCT FROM metadata_released.translation_revision
      AND r.withdrawn_at IS NULL AND r.reviewed_at<=statement_timestamp() AND r.expires_at>statement_timestamp()
      AND reviewer.status='active' AND reviewer.revision=r.reviewer_revision AND reviewer.role IN ('owner','administrator','source_reviewer')
      AND creator.status='active' AND creator.role IN ('owner','administrator','source_reviewer'))
$fn$;
REVOKE ALL ON FUNCTION app_private.metadata_released(text,uuid,text,bigint,bigint) FROM PUBLIC;

CREATE VIEW app_private.public_agency_metadata AS
SELECT a.id,a.slug,t.locale,jsonb_build_object('id',a.id,'slug',a.slug,'name',t.name,'locale',t.locale,'coverage','metadata_only') data
FROM app_private.agencies a JOIN app_private.agency_translations t ON t.agency_id=a.id
WHERE a.status='verified' AND a.publication_status='published' AND NOT a.is_synthetic AND t.review_state='reviewed'
  AND a.verified_at<=statement_timestamp() AND a.verified_at>statement_timestamp()-interval '90 days'
  AND app_private.metadata_released('agencies',a.id,t.locale,a.revision,t.revision);
CREATE VIEW app_private.public_category_metadata AS
SELECT c.id,c.slug,t.locale,jsonb_build_object('id',c.id,'slug',c.slug,'name',t.name,'locale',t.locale,'coverage','metadata_only') data
FROM app_private.categories c JOIN app_private.category_translations t ON t.category_id=c.id
WHERE c.publication_status='published' AND NOT c.is_synthetic AND t.review_state='reviewed'
  AND app_private.metadata_released('categories',c.id,t.locale,c.revision,t.revision);
CREATE VIEW app_private.public_service_metadata AS
SELECT s.id,s.slug,t.locale,jsonb_build_object('id',s.id,'slug',s.slug,'name',t.title,'locale',t.locale,'coverage','metadata_only',
  'category_ids',COALESCE((SELECT jsonb_agg(c.id ORDER BY c.id) FROM app_private.service_categories sc JOIN app_private.public_category_metadata c ON c.id=sc.category_id AND c.locale=t.locale WHERE sc.service_id=s.id),'[]'::jsonb),
  'agency_ids',COALESCE((SELECT jsonb_agg(a.id ORDER BY a.id) FROM app_private.service_agencies sa JOIN app_private.public_agency_metadata a ON a.id=sa.agency_id AND a.locale=t.locale WHERE sa.service_id=s.id AND sa.review_state='reviewed'),'[]'::jsonb)) data
FROM app_private.services s JOIN app_private.service_translations t ON t.service_id=s.id
WHERE s.publication_status='published' AND NOT s.is_synthetic AND t.review_state='reviewed'
  AND app_private.metadata_released('services',s.id,t.locale,s.revision,t.revision);
CREATE VIEW app_private.public_source_metadata AS
SELECT s.id,NULL::text slug,lang.locale,jsonb_build_object('id',s.id,'agency_id',s.agency_id,'name',od.hostname,'url',s.canonical_url,
  'locale',lang.locale,'coverage','metadata_only','evidence_eligible',false,'ownership_verified_at',ownership.verified_at) data
FROM app_private.sources s JOIN app_private.official_domains od ON od.id=s.official_domain_id
CROSS JOIN (VALUES('bn'),('en')) lang(locale)
JOIN app_private.public_agency_metadata a ON a.id=s.agency_id AND a.locale=lang.locale
JOIN LATERAL(SELECT sv.* FROM app_private.source_verifications sv WHERE sv.source_id=s.id AND sv.verification_type='ownership'
  ORDER BY sv.created_at DESC,(sv.status='approved') ASC,sv.id DESC LIMIT 1) ownership ON true
JOIN app_private.admin_memberships reviewer ON reviewer.id=ownership.reviewer_id AND reviewer.status='active' AND reviewer.role IN ('owner','administrator','source_reviewer')
WHERE s.status='active' AND NOT s.is_synthetic AND s.content_use_status='allowed'
  AND od.authenticity_status='verified' AND od.content_authority_status='approved' AND NOT od.is_synthetic
  AND od.verified_at<=statement_timestamp() AND od.verified_at>statement_timestamp()-interval '90 days'
  AND ownership.status='approved' AND ownership.verified_at<=statement_timestamp() AND ownership.expires_at>statement_timestamp()
  AND app_private.metadata_released('sources',s.id,lang.locale,s.revision,NULL)
  AND EXISTS(SELECT FROM app_private.source_documents d WHERE d.source_id=s.id AND d.current_version_id IS NOT NULL
    AND app_private.version_is_eligible(d.current_version_id));
REVOKE ALL ON app_private.public_agency_metadata,app_private.public_category_metadata,app_private.public_service_metadata,app_private.public_source_metadata FROM PUBLIC,askbd_web,askbd_staff;

-- A bounded API function is the only public DB read surface. No raw-table grants.
CREATE FUNCTION app_public.directory(kind text,locale text,after_id uuid DEFAULT NULL,page_limit integer DEFAULT 20,
  category text DEFAULT NULL,agency uuid DEFAULT NULL,lookup text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE items jsonb; generation text; last_id uuid; has_more boolean;
BEGIN
  IF kind NOT IN ('agencies','categories','services','sources') OR locale NOT IN ('bn','en') OR page_limit NOT BETWEEN 1 AND 50 THEN
    RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid directory request'; END IF;
  WITH rows AS (
    SELECT a.id,a.slug,a.data FROM app_private.public_agency_metadata a WHERE kind='agencies' AND a.locale=directory.locale
    UNION ALL SELECT c.id,c.slug,c.data FROM app_private.public_category_metadata c WHERE kind='categories' AND c.locale=directory.locale
    UNION ALL SELECT s.id,s.slug,s.data FROM app_private.public_service_metadata s WHERE kind='services' AND s.locale=directory.locale
      AND (category IS NULL OR EXISTS(SELECT FROM app_private.service_categories sc JOIN app_private.public_category_metadata c ON c.id=sc.category_id AND c.locale=directory.locale WHERE sc.service_id=s.id AND c.slug=category))
      AND (agency IS NULL OR s.data->'agency_ids' @> to_jsonb(ARRAY[agency]))
    UNION ALL SELECT s.id,s.slug,s.data FROM app_private.public_source_metadata s WHERE kind='sources' AND s.locale=directory.locale
  ), bounded AS (
    SELECT * FROM rows WHERE (after_id IS NULL OR id>after_id) AND (lookup IS NULL OR CASE WHEN kind='sources' THEN id::text=lookup ELSE slug=lookup END)
    ORDER BY id LIMIT page_limit+1
  ), visible AS (SELECT * FROM bounded ORDER BY id LIMIT page_limit)
  SELECT COALESCE(jsonb_agg(data ORDER BY id),'[]'),(array_agg(id ORDER BY id DESC))[1],(SELECT count(*)>page_limit FROM bounded)
    INTO items,last_id,has_more FROM visible;
  SELECT p.generation::text INTO generation FROM app_private.publication_state p;
  RETURN jsonb_build_object('items',items,'after_id',CASE WHEN has_more THEN last_id ELSE NULL END,'generation',generation);
END $fn$;
REVOKE ALL ON FUNCTION app_public.directory(text,text,uuid,integer,text,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_public.directory(text,text,uuid,integer,text,uuid,text) TO askbd_web;

-- Staff inspection uses verified bound sessions for every operation, never arbitrary SQL.
CREATE FUNCTION app_staff.inspect_record(subject uuid,session uuid,token_hash text,kind text,record_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE result jsonb;
BEGIN
  IF NOT EXISTS(SELECT FROM app_staff.authorize_bound(subject,session,'inspect',token_hash)) THEN
    RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Staff access denied'; END IF;
  CASE kind
    WHEN 'agencies' THEN SELECT jsonb_build_object('id',id,'slug',slug,'status',status,'publication_status',publication_status) INTO result FROM app_private.agencies WHERE id=record_id;
    WHEN 'categories' THEN SELECT jsonb_build_object('id',id,'slug',slug,'publication_status',publication_status) INTO result FROM app_private.categories WHERE id=record_id;
    WHEN 'services' THEN SELECT jsonb_build_object('id',id,'slug',slug,'publication_status',publication_status) INTO result FROM app_private.services WHERE id=record_id;
    WHEN 'domains' THEN SELECT jsonb_build_object('id',id,'agency_id',agency_id,'hostname',hostname,'authenticity_status',authenticity_status,'crawl_permission_status',crawl_permission_status) INTO result FROM app_private.official_domains WHERE id=record_id;
    WHEN 'sources' THEN SELECT jsonb_build_object('id',id,'agency_id',agency_id,'canonical_url',canonical_url,'status',status) INTO result FROM app_private.sources WHERE id=record_id;
    WHEN 'documents' THEN SELECT jsonb_build_object('id',id,'source_id',source_id,'document_title',document_title,'approval_status',approval_status) INTO result FROM app_private.source_documents WHERE id=record_id;
    WHEN 'versions' THEN SELECT jsonb_build_object('id',id,'source_document_id',source_document_id,'version_number',version_number,'review_state',review_state) INTO result FROM app_private.document_versions WHERE id=record_id;
    WHEN 'passages' THEN SELECT jsonb_build_object('id',id,'document_version_id',document_version_id,'ordinal',ordinal,'extraction_quality_status',extraction_quality_status) INTO result FROM app_private.passages WHERE id=record_id;
    WHEN 'verifications' THEN SELECT jsonb_build_object('id',id,'source_id',source_id,'verification_type',verification_type,'status',status,'verified_at',verified_at) INTO result FROM app_private.source_verifications WHERE id=record_id;
    ELSE RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Unsupported inspection';
  END CASE;
  RETURN result;
END $fn$;
REVOKE ALL ON FUNCTION app_staff.inspect_record(uuid,uuid,text,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_staff.inspect_record(uuid,uuid,text,text,uuid) TO askbd_staff;
