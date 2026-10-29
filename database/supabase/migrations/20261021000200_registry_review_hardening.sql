-- P18 review hardening after initial replay: current approval evidence, retired
-- identities and a serialized per-reviewer mutation budget. No prior migration changes.
ALTER TABLE app_private.source_registry_requests ADD COLUMN created_at timestamptz NOT NULL DEFAULT statement_timestamp();
CREATE INDEX registry_requests_budget_idx ON app_private.source_registry_requests(actor_id,created_at);
CREATE OR REPLACE FUNCTION app_staff.registry_command(subject uuid,session uuid,token_hash text,command text,source_id uuid,payload jsonb,expected_revision bigint,request_key uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE actor app_private.admin_memberships; s app_private.sources; previous_state text; domain_id uuid; agency app_private.agencies;
  result jsonb; digest text; saved app_private.source_registry_requests; host text; proof jsonb; proof_type text; allowed text[];
  fresh_until timestamptz; first_reviewer app_private.admin_memberships; sid uuid;
BEGIN
  -- Lock membership before authorizing, so concurrent revocation cannot race a write.
  SELECT * INTO actor FROM app_private.admin_memberships WHERE auth_user_id=subject FOR SHARE;
  IF actor.id IS NULL OR NOT EXISTS(SELECT FROM app_staff.authorize_bound(subject,session,'review',token_hash)) THEN RAISE EXCEPTION USING ERRCODE='P1801';END IF;
  IF request_key IS NULL OR payload IS NULL OR jsonb_typeof(payload)<>'object' OR octet_length(payload::text)>16000
    OR char_length(btrim(payload->>'reason')) NOT BETWEEN 1 AND 2000 OR payload->>'reason' IS NULL THEN RAISE EXCEPTION USING ERRCODE='P1804';END IF;
  allowed:=CASE command WHEN 'create' THEN ARRAY['agency_id','canonical_url','submitted_url','source_name','description','language','source_type','risk_class','reason']
    WHEN 'update' THEN ARRAY['source_name','description','language','source_type','risk_class','reason']
    WHEN 'approve' THEN ARRAY['ownership','authority','content_use_evidence_ref','availability_status','availability_checked_at','availability_evidence_ref','reason']
    ELSE ARRAY['reason'] END;
  IF command NOT IN ('create','update','submit','approve','activate','reject','suspend') OR EXISTS(SELECT FROM jsonb_object_keys(payload) k WHERE NOT k=ANY(allowed)) THEN RAISE EXCEPTION USING ERRCODE='P1804';END IF;
  digest:=encode(extensions.digest(jsonb_build_object('command',command,'source_id',source_id,'payload',payload,'expected_revision',expected_revision)::text,'sha256'),'hex');
  PERFORM pg_advisory_xact_lock(hashtextextended(actor.id::text||request_key::text,1800));
  SELECT * INTO saved FROM app_private.source_registry_requests r WHERE r.actor_id=actor.id AND r.request_key=registry_command.request_key;
  IF FOUND THEN
    IF saved.request_hash<>digest OR saved.expires_at<=statement_timestamp() THEN RAISE EXCEPTION USING ERRCODE='P1807';END IF;
    RETURN saved.response;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(actor.id::text,1802));
  IF (SELECT count(*) FROM app_private.source_registry_requests r WHERE r.actor_id=actor.id AND r.created_at>statement_timestamp()-interval '1 minute')>=30 THEN RAISE EXCEPTION USING ERRCODE='P1809';END IF;
  IF command IN ('approve','activate') AND NOT EXISTS(SELECT FROM app_private.staff_sessions WHERE auth_session_id=session AND created_at>statement_timestamp()-interval '5 minutes') THEN RAISE EXCEPTION USING ERRCODE='P1806';END IF;
  IF command='create' THEN
    IF source_id IS NOT NULL OR expected_revision IS NOT NULL OR NOT app_private.registry_safe_url(payload->>'canonical_url') THEN RAISE EXCEPTION USING ERRCODE='P1804';END IF;
    SELECT * INTO agency FROM app_private.agencies WHERE id=(payload->>'agency_id')::uuid FOR SHARE;
    IF agency.id IS NULL THEN RAISE EXCEPTION USING ERRCODE='P1808';END IF;
    host:=split_part(split_part(payload->>'canonical_url','://',2),'/',1);
    PERFORM pg_advisory_xact_lock(hashtextextended(host,1801));
    SELECT id INTO domain_id FROM app_private.official_domains WHERE hostname=host AND agency_id=agency.id FOR UPDATE;
    IF domain_id IS NULL THEN INSERT INTO app_private.official_domains(agency_id,hostname,is_synthetic) VALUES(agency.id,host,agency.is_synthetic) RETURNING id INTO domain_id;END IF;
    INSERT INTO app_private.sources(agency_id,official_domain_id,canonical_url,source_name,submitted_url,description,language,source_type,risk_class,is_synthetic,registry_created_by,registry_edited_by)
    VALUES(agency.id,domain_id,payload->>'canonical_url',payload->>'source_name',payload->>'submitted_url',payload->>'description',payload->>'language',payload->>'source_type',payload->>'risk_class',agency.is_synthetic,actor.id,actor.id) RETURNING * INTO s;
    IF s.source_name IS NULL OR s.submitted_url IS NULL THEN RAISE EXCEPTION USING ERRCODE='P1804';END IF;
  ELSE
    SELECT * INTO s FROM app_private.sources WHERE id=source_id FOR UPDATE;
    IF s.id IS NULL THEN RAISE EXCEPTION USING ERRCODE='P1808';END IF;
    IF expected_revision IS NULL OR expected_revision<>s.revision THEN RAISE EXCEPTION USING ERRCODE='P1802';END IF;
    previous_state:=s.registry_status;
    PERFORM 1 FROM app_private.official_domains WHERE id=s.official_domain_id FOR UPDATE;
    IF s.status='retired' THEN RAISE EXCEPTION USING ERRCODE='P1803';END IF;
    IF command='update' THEN
      UPDATE app_private.sources SET source_name=payload->>'source_name',description=payload->>'description',language=payload->>'language',source_type=payload->>'source_type',risk_class=payload->>'risk_class',
        registry_status='draft',status=CASE WHEN status IN ('verified','active','suspended') THEN 'suspended' ELSE 'candidate' END,
        registry_created_by=COALESCE(registry_created_by,actor.id),registry_edited_by=actor.id,registry_submitted_by=NULL,
        registry_content_revision=registry_content_revision+1,registry_approved_by=NULL,registry_approved_reviewer_revision=NULL,registry_approved_at=NULL,
        registry_activated_by=NULL,registry_activated_reviewer_revision=NULL,registry_activated_at=NULL,content_use_status='unknown',availability_status='unknown',availability_checked_at=NULL,availability_evidence_ref=NULL
        WHERE id=s.id RETURNING * INTO s;
      IF s.source_name IS NULL THEN RAISE EXCEPTION USING ERRCODE='P1804';END IF;
    ELSIF command='submit' THEN
      IF s.registry_status NOT IN ('draft','rejected','suspended') OR s.registry_created_by IS NULL THEN RAISE EXCEPTION USING ERRCODE='P1803';END IF;
      UPDATE app_private.sources SET registry_status='pending_review',registry_submitted_by=actor.id,status='candidate',registry_approved_by=NULL,registry_approved_at=NULL,registry_activated_by=NULL,registry_activated_at=NULL WHERE id=s.id RETURNING * INTO s;
    ELSIF command='approve' THEN
      IF NOT app_private.registry_safe_url(s.canonical_url) THEN RAISE EXCEPTION USING ERRCODE='P1804';END IF;
      IF s.registry_status<>'pending_review' OR s.is_synthetic THEN RAISE EXCEPTION USING ERRCODE='P1803';END IF;
      IF actor.id IN (s.registry_created_by,s.registry_edited_by,s.registry_submitted_by) THEN RAISE EXCEPTION USING ERRCODE='P1805';END IF;
      IF NOT app_private.registry_proof_valid(payload->'ownership') OR NOT app_private.registry_proof_valid(payload->'authority')
        OR char_length(btrim(payload->>'content_use_evidence_ref')) NOT BETWEEN 1 AND 2048 OR payload->>'content_use_evidence_ref' IS NULL THEN RAISE EXCEPTION USING ERRCODE='P1804';END IF;
      IF payload->>'availability_status' NOT IN ('unknown','accessible','unavailable','restricted') OR payload->>'availability_status' IS NULL THEN RAISE EXCEPTION USING ERRCODE='P1804';END IF;
      IF payload->>'availability_status'<>'unknown' AND (payload->>'availability_checked_at' IS NULL OR (payload->>'availability_checked_at')::timestamptz>statement_timestamp() OR
        char_length(btrim(payload->>'availability_evidence_ref')) NOT BETWEEN 1 AND 2048 OR payload->>'availability_evidence_ref' IS NULL) THEN RAISE EXCEPTION USING ERRCODE='P1804';END IF;
      FOREACH proof_type IN ARRAY ARRAY['ownership','relevance'] LOOP
        proof:=payload->CASE proof_type WHEN 'ownership' THEN 'ownership' ELSE 'authority' END;
        INSERT INTO app_private.source_verifications(source_id,verification_type,status,method,evidence_ref,evidence_excerpt,reviewer_id,verified_at,expires_at,registry_content_revision,notes)
        VALUES(s.id,proof_type,'approved',proof->>'method',proof->>'evidence_ref',proof->>'excerpt',actor.id,(proof->>'checked_at')::timestamptz,(proof->>'expires_at')::timestamptz,s.registry_content_revision,
          CASE WHEN proof_type='relevance' THEN payload->>'content_use_evidence_ref' ELSE NULL END);
      END LOOP;
      UPDATE app_private.official_domains SET authenticity_status='verified',content_authority_status='approved',verification_method=payload->'ownership'->>'method',verification_evidence_ref=payload->'ownership'->>'evidence_ref',verified_at=(payload->'ownership'->>'checked_at')::timestamptz WHERE id=s.official_domain_id;
      UPDATE app_private.sources SET registry_status='approved',status='verified',registry_approved_by=actor.id,registry_approved_reviewer_revision=actor.revision,registry_approved_at=statement_timestamp(),content_use_status='allowed',
        availability_status=payload->>'availability_status',availability_checked_at=CASE WHEN payload->>'availability_status'='unknown' THEN NULL ELSE (payload->>'availability_checked_at')::timestamptz END,availability_evidence_ref=payload->>'availability_evidence_ref'
        WHERE id=s.id RETURNING * INTO s;
    ELSIF command='activate' THEN
      IF s.registry_status<>'approved' OR s.status<>'verified' OR s.registry_approved_by IS NULL THEN RAISE EXCEPTION USING ERRCODE='P1803';END IF;
      IF actor.id IN (s.registry_created_by,s.registry_edited_by,s.registry_submitted_by) OR (s.risk_class='critical' AND actor.id=s.registry_approved_by) THEN RAISE EXCEPTION USING ERRCODE='P1805';END IF;
      SELECT * INTO first_reviewer FROM app_private.admin_memberships WHERE id=s.registry_approved_by FOR SHARE;
      IF first_reviewer.status<>'active' OR first_reviewer.revision<>s.registry_approved_reviewer_revision OR first_reviewer.role NOT IN ('owner','administrator','source_reviewer') THEN RAISE EXCEPTION USING ERRCODE='P1801';END IF;
      SELECT min(v.expires_at) INTO fresh_until FROM app_private.source_verifications v WHERE v.source_id=s.id AND v.registry_content_revision=s.registry_content_revision AND v.reviewer_id=s.registry_approved_by AND v.verification_type IN ('ownership','relevance') AND v.status='approved' AND v.created_at=s.registry_approved_at;
      IF (SELECT count(DISTINCT v.verification_type) FROM app_private.source_verifications v WHERE v.source_id=s.id AND v.registry_content_revision=s.registry_content_revision AND v.reviewer_id=s.registry_approved_by AND v.created_at=s.registry_approved_at AND v.status='approved' AND v.verification_type IN ('ownership','relevance'))<>2 OR fresh_until IS NULL OR fresh_until<=statement_timestamp() OR s.availability_status<>'accessible' OR s.availability_checked_at IS NULL OR s.availability_checked_at<=statement_timestamp()-(CASE s.risk_class WHEN 'critical' THEN interval '7 days' ELSE interval '30 days' END) THEN RAISE EXCEPTION USING ERRCODE='P1804';END IF;
      UPDATE app_private.sources SET status='active',registry_activated_by=actor.id,registry_activated_reviewer_revision=actor.revision,registry_activated_at=statement_timestamp() WHERE id=s.id RETURNING * INTO s;
      INSERT INTO app_private.metadata_releases(source_id,locale,record_revision,created_by,reviewed_by,reviewer_revision,reviewed_at,expires_at)
      SELECT s.id,locale,s.revision,s.registry_created_by,actor.id,actor.revision,statement_timestamp(),LEAST(fresh_until,statement_timestamp()+interval '30 days') FROM (VALUES('bn'),('en')) l(locale);
    ELSE
      IF (command='reject' AND s.registry_status<>'pending_review') OR (command='suspend' AND s.registry_status NOT IN ('approved','pending_review')) THEN RAISE EXCEPTION USING ERRCODE='P1803';END IF;
      UPDATE app_private.sources SET registry_status=CASE command WHEN 'reject' THEN 'rejected' ELSE 'suspended' END,status=CASE command WHEN 'reject' THEN 'candidate' ELSE 'suspended' END WHERE id=s.id RETURNING * INTO s;
    END IF;
  END IF;
  INSERT INTO app_private.source_registry_events(source_id,actor_id,action,old_state,new_state,source_revision,reason) VALUES(s.id,actor.id,command,previous_state,s.registry_status,s.revision,payload->>'reason');
  result:=jsonb_build_object('id',s.id,'revision',s.revision::text,'registry_status',s.registry_status,'status',s.status);
  INSERT INTO app_private.source_registry_requests(actor_id,request_key,request_hash,response) VALUES(actor.id,request_key,digest,result);
  RETURN result;
EXCEPTION
  WHEN SQLSTATE 'P1801' THEN RETURN jsonb_build_object('error_code','FORBIDDEN');
  WHEN SQLSTATE 'P1802' THEN RETURN jsonb_build_object('error_code','REVISION_CONFLICT');
  WHEN SQLSTATE 'P1803' THEN RETURN jsonb_build_object('error_code','INVALID_TRANSITION');
  WHEN SQLSTATE 'P1804' THEN RETURN jsonb_build_object('error_code','INVALID_REQUEST');
  WHEN SQLSTATE 'P1805' THEN RETURN jsonb_build_object('error_code','INDEPENDENT_REVIEW_REQUIRED');
  WHEN SQLSTATE 'P1806' THEN RETURN jsonb_build_object('error_code','REAUTHENTICATION_REQUIRED');
  WHEN SQLSTATE 'P1807' THEN RETURN jsonb_build_object('error_code','IDEMPOTENCY_CONFLICT');
  WHEN SQLSTATE 'P1809' THEN RETURN jsonb_build_object('error_code','RATE_LIMITED');
  WHEN SQLSTATE 'P1808' THEN RETURN jsonb_build_object('error_code','RESOURCE_NOT_FOUND');
  WHEN unique_violation THEN RETURN jsonb_build_object('error_code','DUPLICATE_SOURCE');
  WHEN foreign_key_violation THEN RETURN jsonb_build_object('error_code','RESOURCE_NOT_FOUND');
  WHEN check_violation OR not_null_violation OR invalid_text_representation OR invalid_datetime_format OR datetime_field_overflow THEN RETURN jsonb_build_object('error_code','INVALID_REQUEST');
END $fn$;

CREATE OR REPLACE FUNCTION app_private.registry_public_eligible(source_id uuid) RETURNS boolean LANGUAGE sql STABLE SET search_path=pg_catalog AS $fn$
  SELECT EXISTS(SELECT FROM app_private.sources s WHERE s.id=source_id AND (s.registry_created_by IS NULL OR
    (s.registry_status='approved' AND s.status='active' AND s.registry_activated_at IS NOT NULL
      AND EXISTS(SELECT FROM app_private.admin_memberships m WHERE m.id=s.registry_approved_by AND m.status='active' AND m.revision=s.registry_approved_reviewer_revision AND m.role IN ('owner','administrator','source_reviewer'))
      AND EXISTS(SELECT FROM app_private.admin_memberships m WHERE m.id=s.registry_activated_by AND m.status='active' AND m.revision=s.registry_activated_reviewer_revision AND m.role IN ('owner','administrator','source_reviewer'))
      AND (SELECT count(DISTINCT v.verification_type) FROM app_private.source_verifications v WHERE v.source_id=s.id
        AND v.registry_content_revision=s.registry_content_revision AND v.reviewer_id=s.registry_approved_by AND v.created_at=s.registry_approved_at
        AND v.verification_type IN ('ownership','relevance') AND v.status='approved' AND v.verified_at<=statement_timestamp() AND v.expires_at>statement_timestamp())=2)))
$fn$;
