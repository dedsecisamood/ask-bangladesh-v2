-- P19: reviewed directory identity metadata, never procedural content publication.
DO $columns$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['agencies','categories','services'] LOOP
    EXECUTE format('ALTER TABLE app_private.%I ADD COLUMN directory_created_by uuid REFERENCES app_private.admin_memberships(id), ADD COLUMN directory_edited_by uuid REFERENCES app_private.admin_memberships(id)',t);
  END LOOP;
END $columns$;
ALTER TABLE app_private.services ADD COLUMN primary_category_id uuid REFERENCES app_private.categories(id) ON DELETE RESTRICT;
ALTER TABLE app_private.staff_audit_events DROP CONSTRAINT staff_audit_events_action_check;
ALTER TABLE app_private.staff_audit_events ADD CONSTRAINT staff_audit_events_action_check CHECK(action IN ('provision','membership_change','session_open','session_revoke','directory_create','directory_update','directory_publish','directory_withdraw','link_check'));
ALTER TABLE app_private.staff_audit_events ADD COLUMN record_kind text, ADD COLUMN record_id uuid,
  ADD COLUMN record_revision bigint, ADD COLUMN reason text CHECK(char_length(reason)<=2000),
  ADD COLUMN evidence_ref text CHECK(char_length(evidence_ref)<=2048),
  ADD COLUMN evidence jsonb CHECK(octet_length(evidence::text)<=8192);

-- Alias edits invalidate metadata releases just like agency/source/category edits.
CREATE TRIGGER service_alias_review AFTER INSERT OR UPDATE OR DELETE ON app_private.service_aliases FOR EACH ROW EXECUTE FUNCTION app_private.invalidate_service_relationship();
CREATE TRIGGER publication_generation AFTER INSERT OR UPDATE OR DELETE ON app_private.service_aliases FOR EACH STATEMENT EXECUTE FUNCTION app_private.bump_publication_generation();

CREATE FUNCTION app_staff.directory_command(subject uuid,session uuid,token_hash text,kind text,command text,record_id uuid,payload jsonb,expected_revision bigint,request_key uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE actor app_private.admin_memberships; saved app_private.source_registry_requests; digest text; snapshot jsonb;
  rid uuid:=record_id; rev bigint; creator uuid; editor uuid; synthetic boolean; tr jsonb; item jsonb;
  allowed text[]; proof jsonb; relation_id uuid; result jsonb; expiry timestamptz;
BEGIN
  SELECT * INTO actor FROM app_private.admin_memberships WHERE auth_user_id=subject FOR SHARE;
  IF actor.id IS NULL OR NOT EXISTS(SELECT FROM app_staff.authorize_bound(subject,session,'review',token_hash)) THEN RAISE EXCEPTION USING ERRCODE='P1801';END IF;
  IF kind NOT IN ('agencies','categories','services') OR command NOT IN ('create','update','publish','withdraw')
    OR payload IS NULL OR jsonb_typeof(payload)<>'object' OR octet_length(payload::text)>16000
    OR COALESCE(char_length(btrim(payload->>'reason')),0) NOT BETWEEN 1 AND 2000 OR request_key IS NULL THEN RAISE EXCEPTION USING ERRCODE='P1804';END IF;
  allowed:=CASE WHEN command IN ('publish','withdraw') THEN ARRAY['reason','proof'] ELSE ARRAY['reason','slug','translations','parent_id','primary_category_id','category_ids','agencies','source_ids','aliases'] END;
  IF EXISTS(SELECT FROM jsonb_object_keys(payload) k WHERE NOT k=ANY(allowed)) THEN RAISE EXCEPTION USING ERRCODE='P1804';END IF;
  digest:=encode(extensions.digest(jsonb_build_object('scope','directory','kind',kind,'command',command,'id',record_id,'revision',expected_revision,'payload',payload)::text,'sha256'),'hex');
  PERFORM pg_advisory_xact_lock(hashtextextended(actor.id::text||request_key::text,1800));
  SELECT * INTO saved FROM app_private.source_registry_requests r WHERE r.actor_id=actor.id AND r.request_key=directory_command.request_key;
  IF FOUND THEN
    IF saved.request_hash<>digest OR saved.expires_at<=statement_timestamp() THEN RAISE EXCEPTION USING ERRCODE='P1807';END IF;
    RETURN saved.response;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(actor.id::text,1801));
  IF (SELECT count(*) FROM app_private.source_registry_requests r WHERE r.actor_id=actor.id AND r.created_at>statement_timestamp()-interval '1 minute')>=30 THEN RAISE EXCEPTION USING ERRCODE='P1809';END IF;
  IF command='create' THEN
    IF record_id IS NOT NULL OR expected_revision IS NOT NULL THEN RAISE EXCEPTION USING ERRCODE='P1804';END IF;
    CASE kind
      WHEN 'agencies' THEN INSERT INTO app_private.agencies(slug,directory_created_by,directory_edited_by) VALUES(payload->>'slug',actor.id,actor.id) RETURNING id INTO rid;
      WHEN 'categories' THEN INSERT INTO app_private.categories(slug,directory_created_by,directory_edited_by) VALUES(payload->>'slug',actor.id,actor.id) RETURNING id INTO rid;
      WHEN 'services' THEN INSERT INTO app_private.services(slug,directory_created_by,directory_edited_by) VALUES(payload->>'slug',actor.id,actor.id) RETURNING id INTO rid;
    END CASE;
  END IF;
  -- Identifiers below are selected only from the fixed allowlist, never client SQL.
  EXECUTE format('SELECT to_jsonb(r) FROM app_private.%I r WHERE id=$1 FOR UPDATE',kind) INTO snapshot USING rid;
  IF snapshot IS NULL THEN RAISE EXCEPTION USING ERRCODE='P1808';END IF;
  rev:=(snapshot->>'revision')::bigint; creator:=(snapshot->>'directory_created_by')::uuid;editor:=(snapshot->>'directory_edited_by')::uuid;synthetic:=(snapshot->>'is_synthetic')::boolean;
  IF command<>'create' AND (expected_revision IS NULL OR expected_revision<>rev) THEN RAISE EXCEPTION USING ERRCODE='P1802';END IF;
  IF command IN ('create','update') THEN
    IF command='update' AND (payload->>'slug') IS DISTINCT FROM snapshot->>'slug' THEN RAISE EXCEPTION USING ERRCODE='P1804';END IF;
    IF jsonb_typeof(payload->'translations') IS DISTINCT FROM 'array' OR jsonb_array_length(payload->'translations') NOT BETWEEN 1 AND 2 THEN RAISE EXCEPTION USING ERRCODE='P1804';END IF;
    IF kind='services' THEN
      IF payload->>'parent_id' IS NOT NULL OR payload->>'primary_category_id' IS NULL
        OR jsonb_typeof(payload->'category_ids') IS DISTINCT FROM 'array' OR jsonb_array_length(payload->'category_ids') NOT BETWEEN 1 AND 16
        OR NOT (payload->'category_ids' @> jsonb_build_array(payload->>'primary_category_id'))
        OR jsonb_typeof(payload->'agencies') IS DISTINCT FROM 'array' OR jsonb_array_length(payload->'agencies') NOT BETWEEN 1 AND 16
        OR jsonb_typeof(payload->'source_ids') IS DISTINCT FROM 'array' OR jsonb_array_length(payload->'source_ids')>32
        OR jsonb_typeof(payload->'aliases') IS DISTINCT FROM 'array' OR jsonb_array_length(payload->'aliases')>64 THEN RAISE EXCEPTION USING ERRCODE='P1804';END IF;
      UPDATE app_private.services SET publication_status='draft',primary_category_id=(payload->>'primary_category_id')::uuid,directory_created_by=COALESCE(directory_created_by,actor.id),directory_edited_by=actor.id WHERE id=rid;
      DELETE FROM app_private.service_sources WHERE service_id=rid;
      DELETE FROM app_private.service_agencies WHERE service_id=rid;
      DELETE FROM app_private.service_categories WHERE service_id=rid;
      DELETE FROM app_private.service_aliases WHERE service_id=rid;
      FOR item IN SELECT value FROM jsonb_array_elements(payload->'category_ids') LOOP
        INSERT INTO app_private.service_categories(service_id,category_id) VALUES(rid,(item#>>'{}')::uuid);
      END LOOP;
      FOR item IN SELECT value FROM jsonb_array_elements(payload->'agencies') LOOP
        IF EXISTS(SELECT FROM jsonb_object_keys(item) k WHERE k NOT IN ('id','relationship')) THEN RAISE EXCEPTION USING ERRCODE='P1804';END IF;
        INSERT INTO app_private.service_agencies(service_id,agency_id,relationship) VALUES(rid,(item->>'id')::uuid,item->>'relationship');
      END LOOP;
      IF NOT EXISTS(SELECT FROM app_private.service_agencies WHERE service_id=rid AND relationship='responsible') THEN RAISE EXCEPTION USING ERRCODE='P1804';END IF;
      FOR item IN SELECT value FROM jsonb_array_elements(payload->'source_ids') LOOP
        relation_id:=(item#>>'{}')::uuid;
        PERFORM 1 FROM app_private.sources s WHERE s.id=relation_id AND s.status='active' AND app_private.registry_public_eligible(s.id)
          AND EXISTS(SELECT FROM app_private.service_agencies sa WHERE sa.service_id=rid AND sa.agency_id=s.agency_id) FOR SHARE;
        IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P1804';END IF;
        INSERT INTO app_private.service_sources(service_id,source_id) VALUES(rid,relation_id);
      END LOOP;
      FOR item IN SELECT value FROM jsonb_array_elements(payload->'aliases') LOOP
        IF EXISTS(SELECT FROM jsonb_object_keys(item) k WHERE k NOT IN ('alias','language')) THEN RAISE EXCEPTION USING ERRCODE='P1804';END IF;
        INSERT INTO app_private.service_aliases(service_id,alias,language) VALUES(rid,regexp_replace(btrim(item->>'alias'),'\s+',' ','g'),item->>'language');
      END LOOP;
    ELSE
      IF EXISTS(SELECT FROM jsonb_object_keys(payload) k WHERE k IN ('primary_category_id','category_ids','agencies','source_ids','aliases')) THEN RAISE EXCEPTION USING ERRCODE='P1804';END IF;
      IF kind='agencies' THEN
        UPDATE app_private.agencies SET parent_agency_id=(payload->>'parent_id')::uuid,status='candidate',publication_status='draft',directory_created_by=COALESCE(directory_created_by,actor.id),directory_edited_by=actor.id WHERE id=rid;
      ELSE
        UPDATE app_private.categories SET parent_category_id=(payload->>'parent_id')::uuid,publication_status='draft',directory_created_by=COALESCE(directory_created_by,actor.id),directory_edited_by=actor.id WHERE id=rid;
      END IF;
    END IF;
    -- Replacing current translations withdraws old locale releases. Old audit is retained.
    EXECUTE format('DELETE FROM app_private.%I WHERE %I=$1',CASE kind WHEN 'agencies' THEN 'agency_translations' WHEN 'categories' THEN 'category_translations' ELSE 'service_translations' END,CASE kind WHEN 'agencies' THEN 'agency_id' WHEN 'categories' THEN 'category_id' ELSE 'service_id' END) USING rid;
    FOR tr IN SELECT value FROM jsonb_array_elements(payload->'translations') LOOP
      IF EXISTS(SELECT FROM jsonb_object_keys(tr) k WHERE k NOT IN ('locale','name','description')) THEN RAISE EXCEPTION USING ERRCODE='P1804';END IF;
      CASE kind
        WHEN 'agencies' THEN INSERT INTO app_private.agency_translations(agency_id,locale,name,description) VALUES(rid,tr->>'locale',tr->>'name',tr->>'description');
        WHEN 'categories' THEN INSERT INTO app_private.category_translations(category_id,locale,name,description) VALUES(rid,tr->>'locale',tr->>'name',tr->>'description');
        WHEN 'services' THEN INSERT INTO app_private.service_translations(service_id,locale,title,summary) VALUES(rid,tr->>'locale',tr->>'name',tr->>'description');
      END CASE;
    END LOOP;
  ELSIF command='publish' THEN
    proof:=payload->'proof';
    IF synthetic OR creator IS NULL OR editor IS NULL OR actor.id IN (creator,editor) THEN RAISE EXCEPTION USING ERRCODE='P1805';END IF;
    IF NOT app_private.registry_proof_valid(proof) THEN RAISE EXCEPTION USING ERRCODE='P1804';END IF;
    IF NOT EXISTS(SELECT FROM app_private.staff_sessions WHERE auth_session_id=session AND created_at>statement_timestamp()-interval '5 minutes') THEN RAISE EXCEPTION USING ERRCODE='P1806';END IF;
    expiry:=LEAST((proof->>'expires_at')::timestamptz,statement_timestamp()+interval '30 days');
    IF kind='services' THEN
      IF NOT EXISTS(SELECT FROM app_private.services s JOIN app_private.public_category_metadata c ON c.id=s.primary_category_id WHERE s.id=rid)
        OR NOT EXISTS(SELECT FROM app_private.service_agencies sa JOIN app_private.public_agency_metadata a ON a.id=sa.agency_id WHERE sa.service_id=rid AND sa.relationship='responsible')
        OR EXISTS(SELECT FROM app_private.service_sources ss JOIN app_private.sources s ON s.id=ss.source_id WHERE ss.service_id=rid AND (s.status<>'active' OR NOT app_private.registry_public_eligible(s.id))) THEN RAISE EXCEPTION USING ERRCODE='P1804';END IF;
      UPDATE app_private.service_agencies SET review_state='reviewed' WHERE service_id=rid;
      UPDATE app_private.service_aliases SET review_state='reviewed' WHERE service_id=rid;
      UPDATE app_private.service_translations SET review_state='reviewed' WHERE service_id=rid;
    ELSIF kind='agencies' THEN
      UPDATE app_private.agencies SET status='verified',verification_method=left(proof->>'method',120),verification_evidence_ref=proof->>'evidence_ref',verified_at=(proof->>'checked_at')::timestamptz WHERE id=rid;
      UPDATE app_private.agency_translations SET review_state='reviewed' WHERE agency_id=rid;
    ELSE
      UPDATE app_private.category_translations SET review_state='reviewed' WHERE category_id=rid;
    END IF;
    EXECUTE format('UPDATE app_private.%I SET publication_status=''published'' WHERE id=$1',kind) USING rid;
    EXECUTE format('SELECT revision FROM app_private.%I WHERE id=$1',kind) INTO rev USING rid;
    FOR tr IN EXECUTE format('SELECT to_jsonb(t) FROM app_private.%I t WHERE %I=$1',CASE kind WHEN 'agencies' THEN 'agency_translations' WHEN 'categories' THEN 'category_translations' ELSE 'service_translations' END,CASE kind WHEN 'agencies' THEN 'agency_id' WHEN 'categories' THEN 'category_id' ELSE 'service_id' END) USING rid LOOP
      INSERT INTO app_private.metadata_releases(agency_id,category_id,service_id,locale,record_revision,translation_revision,created_by,reviewed_by,reviewer_revision,reviewed_at,expires_at)
      VALUES(CASE WHEN kind='agencies' THEN rid END,CASE WHEN kind='categories' THEN rid END,CASE WHEN kind='services' THEN rid END,tr->>'locale',rev,(tr->>'revision')::bigint,creator,actor.id,actor.revision,statement_timestamp(),expiry);
    END LOOP;
  ELSE
    EXECUTE format('UPDATE app_private.%I SET publication_status=''withdrawn'' WHERE id=$1',kind) USING rid;
  END IF;
  EXECUTE format('SELECT revision FROM app_private.%I WHERE id=$1',kind) INTO rev USING rid;
  INSERT INTO app_private.staff_audit_events(membership_id,action,record_kind,record_id,record_revision,reason,evidence_ref,evidence)
    VALUES(actor.id,'directory_'||command,kind,rid,rev,payload->>'reason',proof->>'evidence_ref',proof);
  result:=jsonb_build_object('id',rid,'revision',rev::text);
  INSERT INTO app_private.source_registry_requests(actor_id,request_key,request_hash,response) VALUES(actor.id,request_key,digest,result);
  RETURN result;
EXCEPTION
  WHEN SQLSTATE 'P1801' THEN RETURN jsonb_build_object('error_code','FORBIDDEN');
  WHEN SQLSTATE 'P1802' THEN RETURN jsonb_build_object('error_code','REVISION_CONFLICT');
  WHEN SQLSTATE 'P1804' THEN RETURN jsonb_build_object('error_code','INVALID_REQUEST');
  WHEN SQLSTATE 'P1805' THEN RETURN jsonb_build_object('error_code','INDEPENDENT_REVIEW_REQUIRED');
  WHEN SQLSTATE 'P1806' THEN RETURN jsonb_build_object('error_code','REAUTHENTICATION_REQUIRED');
  WHEN SQLSTATE 'P1807' THEN RETURN jsonb_build_object('error_code','IDEMPOTENCY_CONFLICT');
  WHEN SQLSTATE 'P1808' THEN RETURN jsonb_build_object('error_code','RESOURCE_NOT_FOUND');
  WHEN SQLSTATE 'P1809' THEN RETURN jsonb_build_object('error_code','RATE_LIMITED');
  WHEN unique_violation THEN RETURN jsonb_build_object('error_code','DUPLICATE_RECORD');
  WHEN foreign_key_violation THEN RETURN jsonb_build_object('error_code','INVALID_RELATIONSHIP');
  WHEN check_violation OR not_null_violation OR invalid_text_representation OR invalid_datetime_format OR datetime_field_overflow THEN RETURN jsonb_build_object('error_code','INVALID_REQUEST');
END $fn$;
REVOKE ALL ON FUNCTION app_staff.directory_command(uuid,uuid,text,text,text,uuid,jsonb,bigint,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_staff.directory_command(uuid,uuid,text,text,text,uuid,jsonb,bigint,uuid) TO askbd_staff;
