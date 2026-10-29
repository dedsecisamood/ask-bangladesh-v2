-- P18: source review workflow, not crawling or document publication.
ALTER TABLE app_private.sources
  ADD COLUMN source_name text CHECK(char_length(btrim(source_name)) BETWEEN 1 AND 240),
  ADD COLUMN description text CHECK(char_length(description)<=2000),
  ADD COLUMN language text NOT NULL DEFAULT 'unknown' CHECK(language IN ('bn','en','mixed','unknown')),
  ADD COLUMN source_type text NOT NULL DEFAULT 'portal' CHECK(source_type IN ('portal','html','pdf','text','other')),
  ADD COLUMN submitted_url text CHECK(char_length(submitted_url)<=2048),
  ADD COLUMN registry_status text NOT NULL DEFAULT 'draft' CHECK(registry_status IN ('draft','pending_review','approved','rejected','suspended')),
  ADD COLUMN registry_content_revision bigint NOT NULL DEFAULT 1 CHECK(registry_content_revision>0),
  ADD COLUMN registry_created_by uuid REFERENCES app_private.admin_memberships(id),
  ADD COLUMN registry_edited_by uuid REFERENCES app_private.admin_memberships(id),
  ADD COLUMN registry_submitted_by uuid REFERENCES app_private.admin_memberships(id),
  ADD COLUMN registry_approved_by uuid REFERENCES app_private.admin_memberships(id),
  ADD COLUMN registry_approved_reviewer_revision bigint,
  ADD COLUMN registry_approved_at timestamptz,
  ADD COLUMN registry_activated_by uuid REFERENCES app_private.admin_memberships(id),
  ADD COLUMN registry_activated_reviewer_revision bigint,
  ADD COLUMN registry_activated_at timestamptz,
  ADD COLUMN availability_status text NOT NULL DEFAULT 'unknown' CHECK(availability_status IN ('unknown','accessible','unavailable','restricted')),
  ADD COLUMN availability_checked_at timestamptz,
  ADD COLUMN availability_evidence_ref text CHECK(char_length(availability_evidence_ref)<=2048);
ALTER TABLE app_private.source_verifications
  ADD COLUMN evidence_excerpt text CHECK(char_length(evidence_excerpt)<=3000),
  ADD COLUMN registry_content_revision bigint CHECK(registry_content_revision>0);
CREATE TABLE app_private.source_registry_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES app_private.sources(id),
  actor_id uuid NOT NULL REFERENCES app_private.admin_memberships(id),
  action text NOT NULL CHECK(action IN ('create','update','submit','approve','activate','reject','suspend')),
  old_state text,new_state text NOT NULL,
  source_revision bigint NOT NULL,
  reason text NOT NULL CHECK(char_length(btrim(reason)) BETWEEN 1 AND 2000),
  outbox_topic text NOT NULL DEFAULT 'source_registry_changed' CHECK(outbox_topic='source_registry_changed'),
  recorded_at timestamptz NOT NULL DEFAULT statement_timestamp()
);
CREATE INDEX registry_events_source_idx ON app_private.source_registry_events(source_id,recorded_at,id);
CREATE TABLE app_private.source_registry_requests (
  actor_id uuid NOT NULL REFERENCES app_private.admin_memberships(id),
  request_key uuid NOT NULL,
  request_hash text NOT NULL CHECK(request_hash ~ '^[a-f0-9]{64}$'),
  response jsonb NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT statement_timestamp()+interval '24 hours',
  PRIMARY KEY(actor_id,request_key)
);
DO $security$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['source_registry_events','source_registry_requests'] LOOP
    EXECUTE format('ALTER TABLE app_private.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('ALTER TABLE app_private.%I FORCE ROW LEVEL SECURITY',t);
    EXECUTE format('CREATE POLICY migration_owner ON app_private.%I TO postgres USING(true) WITH CHECK(true)',t);
    EXECUTE format('REVOKE ALL ON app_private.%I FROM PUBLIC,askbd_web,askbd_staff',t);
    EXECUTE format('CREATE TRIGGER immutable_registry BEFORE UPDATE OR DELETE ON app_private.%I FOR EACH ROW EXECUTE FUNCTION app_private.evidence_immutable()',t);
  END LOOP;
END $security$;

CREATE FUNCTION app_private.registry_safe_url(value text) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path=pg_catalog AS $fn$
  SELECT COALESCE(char_length(value)<=2048 AND value ~ '^https://[a-z0-9.-]+/[^#[:space:]\\]*$' AND value !~ '@'
    AND split_part(split_part(value,'://',2),'/',1) ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'
    AND split_part(split_part(value,'://',2),'/',1) !~ '^[0-9.]+$'
    AND split_part(split_part(value,'://',2),'/',1) !~ '(^|[.])(localhost|local|internal|invalid|test|example|localdomain)$'
    AND split_part(split_part(value,'://',2),'/',1) !~ '(^|[.])home[.]arpa$'
    AND value !~* '%(2f|5c|00|0a|0d)' AND value !~* '[?&](password|access_token|refresh_token|api_key|session|nid|passport)=',false)
$fn$;
CREATE FUNCTION app_private.registry_proof_valid(proof jsonb) RETURNS boolean LANGUAGE plpgsql SET search_path=pg_catalog AS $fn$
DECLARE checked timestamptz; expiry timestamptz;
BEGIN
  IF jsonb_typeof(proof) IS DISTINCT FROM 'object' OR proof IS NULL OR
    EXISTS(SELECT FROM jsonb_object_keys(proof) k WHERE k NOT IN ('method','evidence_ref','excerpt','checked_at','expires_at')) THEN RETURN false;END IF;
  checked:=(proof->>'checked_at')::timestamptz;expiry:=(proof->>'expires_at')::timestamptz;
  RETURN COALESCE(jsonb_typeof(proof->'method')='string' AND char_length(btrim(proof->>'method')) BETWEEN 1 AND 200
    AND jsonb_typeof(proof->'evidence_ref')='string' AND char_length(btrim(proof->>'evidence_ref')) BETWEEN 1 AND 2048
    AND jsonb_typeof(proof->'excerpt')='string' AND char_length(btrim(proof->>'excerpt')) BETWEEN 1 AND 3000
    AND (proof->>'checked_at') ~ '(Z|[+-][0-9]{2}:[0-9]{2})$' AND (proof->>'expires_at') ~ '(Z|[+-][0-9]{2}:[0-9]{2})$'
    AND checked<=statement_timestamp() AND expiry>statement_timestamp() AND expiry>checked AND expiry<=checked+interval '90 days',false);
END $fn$;
REVOKE ALL ON FUNCTION app_private.registry_safe_url(text),app_private.registry_proof_valid(jsonb) FROM PUBLIC;

CREATE FUNCTION app_staff.registry_command(subject uuid,session uuid,token_hash text,command text,source_id uuid,payload jsonb,expected_revision bigint,request_key uuid)
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
      SELECT min(v.expires_at) INTO fresh_until FROM app_private.source_verifications v WHERE v.source_id=s.id AND v.registry_content_revision=s.registry_content_revision AND v.reviewer_id=s.registry_approved_by AND v.verification_type IN ('ownership','relevance') AND v.status='approved';
      IF fresh_until IS NULL OR fresh_until<=statement_timestamp() OR s.availability_status<>'accessible' OR s.availability_checked_at IS NULL OR s.availability_checked_at<=statement_timestamp()-(CASE s.risk_class WHEN 'critical' THEN interval '7 days' ELSE interval '30 days' END) THEN RAISE EXCEPTION USING ERRCODE='P1804';END IF;
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
  WHEN SQLSTATE 'P1808' THEN RETURN jsonb_build_object('error_code','RESOURCE_NOT_FOUND');
  WHEN unique_violation THEN RETURN jsonb_build_object('error_code','DUPLICATE_SOURCE');
  WHEN foreign_key_violation THEN RETURN jsonb_build_object('error_code','RESOURCE_NOT_FOUND');
  WHEN check_violation OR not_null_violation OR invalid_text_representation OR invalid_datetime_format OR datetime_field_overflow THEN RETURN jsonb_build_object('error_code','INVALID_REQUEST');
END $fn$;
REVOKE ALL ON FUNCTION app_staff.registry_command(uuid,uuid,text,text,uuid,jsonb,bigint,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_staff.registry_command(uuid,uuid,text,text,uuid,jsonb,bigint,uuid) TO askbd_staff;

CREATE FUNCTION app_private.registry_public_eligible(source_id uuid) RETURNS boolean LANGUAGE sql STABLE SET search_path=pg_catalog AS $fn$
  SELECT EXISTS(SELECT FROM app_private.sources s WHERE s.id=source_id AND (s.registry_created_by IS NULL OR
    (s.registry_status='approved' AND s.status='active' AND s.registry_activated_at IS NOT NULL
      AND EXISTS(SELECT FROM app_private.admin_memberships m WHERE m.id=s.registry_approved_by AND m.status='active' AND m.revision=s.registry_approved_reviewer_revision AND m.role IN ('owner','administrator','source_reviewer'))
      AND EXISTS(SELECT FROM app_private.admin_memberships m WHERE m.id=s.registry_activated_by AND m.status='active' AND m.revision=s.registry_activated_reviewer_revision AND m.role IN ('owner','administrator','source_reviewer'))
      AND NOT EXISTS(SELECT FROM app_private.source_verifications v WHERE v.source_id=s.id AND v.registry_content_revision=s.registry_content_revision AND v.status='approved' AND v.expires_at<=statement_timestamp()))))
$fn$;
REVOKE ALL ON FUNCTION app_private.registry_public_eligible(uuid) FROM PUBLIC;
ALTER VIEW app_private.public_source_metadata RENAME TO public_source_metadata_base;
CREATE VIEW app_private.public_source_metadata AS SELECT b.* FROM app_private.public_source_metadata_base b WHERE app_private.registry_public_eligible(b.id);
REVOKE ALL ON app_private.public_source_metadata FROM PUBLIC,askbd_web,askbd_staff;

CREATE FUNCTION app_staff.registry_read(subject uuid,session uuid,token_hash text,source_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE data jsonb;
BEGIN
  IF NOT EXISTS(SELECT FROM app_staff.authorize_bound(subject,session,'inspect',token_hash)) THEN RETURN jsonb_build_object('error_code','FORBIDDEN');END IF;
  SELECT jsonb_build_object('id',s.id,'agency_id',s.agency_id,'canonical_url',s.canonical_url,'submitted_url',s.submitted_url,'source_name',s.source_name,'description',s.description,'language',s.language,'source_type',s.source_type,'risk_class',s.risk_class,
    'registry_status',s.registry_status,'status',s.status,'revision',s.revision::text,'content_revision',s.registry_content_revision::text,'approved_at',s.registry_approved_at,'activated_at',s.registry_activated_at,'availability_status',s.availability_status,
    'verifications',COALESCE((SELECT jsonb_agg(jsonb_build_object('type',v.verification_type,'status',v.status,'method',v.method,'evidence_ref',v.evidence_ref,'excerpt',v.evidence_excerpt,'verified_at',v.verified_at,'expires_at',v.expires_at) ORDER BY v.created_at DESC,v.id) FROM (SELECT * FROM app_private.source_verifications v WHERE v.source_id=s.id ORDER BY v.created_at DESC,v.id LIMIT 20) v),'[]'::jsonb),
    'history',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',e.id,'action',e.action,'old_state',e.old_state,'new_state',e.new_state,'revision',e.source_revision::text,'reason',e.reason,'recorded_at',e.recorded_at) ORDER BY e.recorded_at DESC,e.id) FROM (SELECT * FROM app_private.source_registry_events e WHERE e.source_id=s.id ORDER BY e.recorded_at DESC,e.id LIMIT 50) e),'[]'::jsonb)) INTO data FROM app_private.sources s WHERE s.id=source_id;
  RETURN COALESCE(data,jsonb_build_object('error_code','RESOURCE_NOT_FOUND'));
END $fn$;
REVOKE ALL ON FUNCTION app_staff.registry_read(uuid,uuid,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_staff.registry_read(uuid,uuid,text,uuid) TO askbd_staff;
