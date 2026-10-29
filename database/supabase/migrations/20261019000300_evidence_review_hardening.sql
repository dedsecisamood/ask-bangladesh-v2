-- Forward correction after real P15 replay/review: deterministic adverse-event
-- ordering, review expiry, document risk and claim contradiction guards.
ALTER TABLE app_private.source_documents ADD COLUMN risk_class text NOT NULL DEFAULT 'critical' CHECK (risk_class IN ('critical','general'));
CREATE OR REPLACE FUNCTION app_private.version_is_eligible(version_id uuid) RETURNS boolean LANGUAGE sql STABLE SET search_path=pg_catalog AS $f$
  SELECT EXISTS (
    SELECT 1 FROM app_private.document_versions v JOIN app_private.source_documents d ON d.id=v.source_document_id
    JOIN app_private.sources s ON s.id=d.source_id JOIN app_private.official_domains od ON od.id=s.official_domain_id
    JOIN app_private.agencies a ON a.id=s.agency_id
    JOIN LATERAL (SELECT * FROM app_private.source_checks sc WHERE sc.document_id=d.id ORDER BY attempted_at DESC,(outcome='matched') ASC,id DESC LIMIT 1) ck ON true
    WHERE v.id=version_id AND v.review_state='approved' AND v.released_at<=statement_timestamp() AND v.reviewed_at<=statement_timestamp()
      AND v.extraction_status='succeeded' AND d.approval_status='approved' AND NOT d.is_synthetic AND s.status='active' AND NOT s.is_synthetic
      AND s.content_use_status='allowed' AND od.authenticity_status='verified' AND od.content_authority_status='approved' AND NOT od.is_synthetic AND a.status='verified' AND NOT a.is_synthetic
      AND (v.effective_from IS NULL OR v.effective_from<=statement_timestamp()) AND (v.effective_to IS NULL OR v.effective_to>statement_timestamp()) AND (v.expires_at IS NULL OR v.expires_at>statement_timestamp())
      AND ck.outcome='matched' AND ck.document_version_id=v.id AND ck.content_hash=v.content_hash AND ck.content_checked_at<=statement_timestamp()
      AND ck.content_checked_at>statement_timestamp()-CASE WHEN s.risk_class='critical' OR d.risk_class='critical' THEN interval '7 days' ELSE interval '30 days' END
      AND (SELECT sv.status='approved' AND sv.verified_at<=statement_timestamp() AND sv.expires_at>statement_timestamp() FROM app_private.source_verifications sv WHERE sv.source_id=s.id AND sv.verification_type='ownership' ORDER BY sv.created_at DESC,(sv.status='approved') ASC,sv.id DESC LIMIT 1)
      AND (SELECT sv.status='approved' AND sv.reviewer_id=v.reviewed_by AND sv.verified_at<=statement_timestamp() AND sv.expires_at>statement_timestamp() FROM app_private.source_verifications sv WHERE sv.document_version_id=v.id AND sv.verification_type='document_review' ORDER BY sv.created_at DESC,(sv.status='approved') ASC,sv.id DESC LIMIT 1)
      AND NOT EXISTS (SELECT 1 FROM app_private.source_conflicts c JOIN app_private.conflict_evidence ce ON ce.conflict_id=c.id JOIN app_private.passages p ON p.id=ce.passage_id WHERE p.document_version_id=v.id AND c.state IN ('open','under_review'))
  )
$f$;
CREATE FUNCTION app_private.claim_support_is_eligible(claim_id uuid, service_id uuid, claim_type text) RETURNS boolean LANGUAGE sql STABLE SET search_path=pg_catalog AS $f$
  SELECT EXISTS (
    SELECT 1 FROM app_private.claim_evidence ce JOIN app_private.passages p ON p.id=ce.passage_id
    JOIN app_private.document_versions v ON v.id=p.document_version_id JOIN app_private.source_documents d ON d.id=v.source_document_id
    JOIN app_private.service_sources ss ON ss.source_id=d.source_id AND ss.service_id=claim_support_is_eligible.service_id
    WHERE ce.claim_id=claim_support_is_eligible.claim_id AND ce.support_type='supports' AND ce.reviewed_at<=statement_timestamp()
      AND app_private.passage_is_eligible(p.id)
      AND (claim_support_is_eligible.claim_type='other' OR EXISTS (SELECT 1 FROM app_private.source_checks sc WHERE sc.document_version_id=v.id AND sc.outcome='matched' AND sc.content_checked_at>statement_timestamp()-interval '7 days' AND sc.content_checked_at<=statement_timestamp()))
  ) AND NOT EXISTS (SELECT 1 FROM app_private.claim_evidence ce WHERE ce.claim_id=claim_support_is_eligible.claim_id AND ce.support_type='contradicts')
    AND NOT EXISTS (SELECT 1 FROM app_private.source_conflicts c WHERE (c.claim_id=claim_support_is_eligible.claim_id OR c.service_id=claim_support_is_eligible.service_id) AND c.state IN ('open','under_review'))
$f$;
CREATE FUNCTION app_private.claim_is_eligible(claim_id uuid) RETURNS boolean LANGUAGE sql STABLE SET search_path=pg_catalog AS $f$
  SELECT EXISTS (SELECT 1 FROM app_private.service_claims c WHERE c.id=claim_is_eligible.claim_id AND NOT c.is_synthetic AND c.publication_status='published' AND c.verification_status='reviewed'
    AND c.created_by IS NOT NULL AND c.reviewed_by<>c.created_by AND c.reviewed_at<=statement_timestamp()
    AND (c.effective_from IS NULL OR c.effective_from<=statement_timestamp()) AND (c.effective_to IS NULL OR c.effective_to>statement_timestamp())
    AND app_private.claim_support_is_eligible(c.id,c.service_id,c.claim_type))
$f$;
CREATE FUNCTION app_private.claim_publication_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $f$
BEGIN
  IF NEW.publication_status='published' AND NOT app_private.claim_support_is_eligible(NEW.id,NEW.service_id,NEW.claim_type) THEN
    RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Publication needs reviewed current service-bound evidence without contradictions'; END IF;
  RETURN NEW;
END $f$;
CREATE TRIGGER claim_publication_policy BEFORE INSERT OR UPDATE ON app_private.service_claims FOR EACH ROW EXECUTE FUNCTION app_private.claim_publication_guard();
CREATE FUNCTION app_private.conflict_scope_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $f$
BEGIN
  IF (NEW.service_id,NEW.claim_id,NEW.conflict_key,NEW.conflict_type,NEW.applicability,NEW.detected_at) IS DISTINCT FROM
     (OLD.service_id,OLD.claim_id,OLD.conflict_key,OLD.conflict_type,OLD.applicability,OLD.detected_at) THEN
    RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Conflict scope is immutable; record a new conflict'; END IF;
  RETURN NEW;
END $f$;
CREATE TRIGGER conflict_scope_immutable BEFORE UPDATE ON app_private.source_conflicts FOR EACH ROW EXECUTE FUNCTION app_private.conflict_scope_guard();
CREATE OR REPLACE FUNCTION app_private.record_evidence_review() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $f$
DECLARE before_state jsonb; after_state jsonb; key_name text; fields text[] := ARRAY['status','review_state','approval_status','publication_status','verification_status','state','current_version_id','released_at','reviewed_by','reviewed_at','review_note','resolved_by','resolved_at','resolution','risk_class','content_use_status'];
BEGIN
  IF TG_OP='UPDATE' THEN SELECT jsonb_object_agg(key,value) INTO before_state FROM jsonb_each(to_jsonb(OLD)) WHERE key=ANY(fields); END IF;
  SELECT jsonb_object_agg(key,value) INTO after_state FROM jsonb_each(to_jsonb(NEW)) WHERE key=ANY(fields);
  IF before_state IS DISTINCT FROM after_state THEN
    key_name := CASE TG_TABLE_NAME WHEN 'sources' THEN 'source_id' WHEN 'source_documents' THEN 'document_id' WHEN 'document_versions' THEN 'version_id' WHEN 'service_claims' THEN 'claim_id' ELSE 'conflict_id' END;
    EXECUTE format('INSERT INTO app_private.evidence_review_events(%I,old_state,new_state,reviewer_id) VALUES ($1,$2,$3,$4)',key_name) USING NEW.id,before_state,after_state,COALESCE((to_jsonb(NEW)->>'reviewed_by')::uuid,(to_jsonb(NEW)->>'resolved_by')::uuid);
  END IF;
  RETURN NULL;
END $f$;
REVOKE ALL ON FUNCTION app_private.claim_support_is_eligible(uuid,uuid,text),app_private.claim_is_eligible(uuid),app_private.claim_publication_guard(),app_private.conflict_scope_guard() FROM PUBLIC;
