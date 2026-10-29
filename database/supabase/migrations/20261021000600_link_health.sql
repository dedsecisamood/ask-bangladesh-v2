-- P21: source-level reachability requests are separate from document/content checks.
-- No network transport or scheduler is enabled. A blocked request is not a fetch.
CREATE TABLE app_private.source_link_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES app_private.sources(id) ON DELETE RESTRICT,
  requested_by uuid NOT NULL REFERENCES app_private.admin_memberships(id),
  requested_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  checked_at timestamptz CHECK(checked_at<=requested_at),
  outcome text NOT NULL CHECK(outcome IN ('healthy','redirected','temporarily_unavailable','suspected_broken','confirmed_broken','verification_blocked','manual_review_required')),
  failure_code text CHECK(failure_code ~ '^[A-Z0-9_]{1,80}$'),
  evidence_ref text CHECK(char_length(evidence_ref)<=2048),
  CHECK(outcome NOT IN ('healthy','redirected','confirmed_broken') OR (checked_at IS NOT NULL AND evidence_ref IS NOT NULL))
);
CREATE INDEX source_link_checks_history ON app_private.source_link_checks(source_id,requested_at DESC,id);
ALTER TABLE app_private.source_link_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.source_link_checks FORCE ROW LEVEL SECURITY;
CREATE POLICY migration_owner ON app_private.source_link_checks TO postgres USING(true) WITH CHECK(true);
REVOKE ALL ON app_private.source_link_checks FROM PUBLIC,askbd_staff,askbd_web;
CREATE TRIGGER immutable_link_check BEFORE UPDATE OR DELETE ON app_private.source_link_checks FOR EACH ROW EXECUTE FUNCTION app_private.evidence_immutable();
CREATE TRIGGER publication_generation AFTER INSERT ON app_private.source_link_checks FOR EACH STATEMENT EXECUTE FUNCTION app_private.bump_publication_generation();

CREATE FUNCTION app_private.source_link_health(source_id uuid) RETURNS jsonb LANGUAGE sql STABLE SET search_path=pg_catalog AS $fn$
 WITH recent AS (SELECT * FROM app_private.source_link_checks c WHERE c.source_id=source_link_health.source_id ORDER BY requested_at DESC,id DESC LIMIT 3),
 latest AS (SELECT * FROM recent ORDER BY requested_at DESC,id DESC LIMIT 1),
 status AS (SELECT CASE WHEN outcome='temporarily_unavailable' AND (SELECT count(*) FROM recent WHERE outcome='temporarily_unavailable')=3 THEN 'suspected_broken' ELSE outcome END state,checked_at FROM latest)
 SELECT COALESCE((SELECT jsonb_build_object('state',state,'checked_at',checked_at,'review_required',state IN ('redirected','suspected_broken','confirmed_broken','verification_blocked','manual_review_required')) FROM status),jsonb_build_object('state','not_checked','checked_at',NULL,'review_required',false))
$fn$;
REVOKE ALL ON FUNCTION app_private.source_link_health(uuid) FROM PUBLIC;

CREATE FUNCTION app_staff.request_link_check(subject uuid,session uuid,token_hash text,source_id uuid,payload jsonb,expected_revision bigint,request_key uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE actor app_private.admin_memberships;s app_private.sources;saved app_private.source_registry_requests;digest text;result jsonb;
BEGIN
 SELECT * INTO actor FROM app_private.admin_memberships WHERE auth_user_id=subject FOR SHARE;
 IF actor.id IS NULL OR NOT EXISTS(SELECT FROM app_staff.authorize_bound(subject,session,'review',token_hash)) THEN RETURN jsonb_build_object('error_code','FORBIDDEN');END IF;
 IF payload IS NULL OR jsonb_typeof(payload)<>'object' OR COALESCE(char_length(btrim(payload->>'reason')),0) NOT BETWEEN 1 AND 2000 OR EXISTS(SELECT FROM jsonb_object_keys(payload) k WHERE k<>'reason') OR request_key IS NULL THEN RETURN jsonb_build_object('error_code','INVALID_REQUEST');END IF;
 digest:=encode(extensions.digest(jsonb_build_object('scope','link_check','id',source_id,'payload',payload,'revision',expected_revision)::text,'sha256'),'hex');
 PERFORM pg_advisory_xact_lock(hashtextextended(actor.id::text||request_key::text,1800));
 SELECT * INTO saved FROM app_private.source_registry_requests r WHERE r.actor_id=actor.id AND r.request_key=request_link_check.request_key;
 IF FOUND THEN
  IF saved.request_hash<>digest OR saved.expires_at<=statement_timestamp() THEN RETURN jsonb_build_object('error_code','IDEMPOTENCY_CONFLICT');END IF;RETURN saved.response;
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(actor.id::text,1801));
 IF (SELECT count(*) FROM app_private.source_registry_requests r WHERE r.actor_id=actor.id AND r.created_at>statement_timestamp()-interval '1 minute')>=30 THEN RETURN jsonb_build_object('error_code','RATE_LIMITED');END IF;
 SELECT * INTO s FROM app_private.sources WHERE id=source_id FOR UPDATE;
 IF s.id IS NULL THEN RETURN jsonb_build_object('error_code','RESOURCE_NOT_FOUND');END IF;
 IF expected_revision IS NULL OR s.revision<>expected_revision THEN RETURN jsonb_build_object('error_code','REVISION_CONFLICT');END IF;
 IF s.status<>'active' OR NOT app_private.registry_public_eligible(s.id) THEN RETURN jsonb_build_object('error_code','INVALID_REQUEST');END IF;
 INSERT INTO app_private.source_link_checks(source_id,requested_by,outcome,failure_code) VALUES(s.id,actor.id,'verification_blocked','NETWORK_POLICY_NOT_READY');
 INSERT INTO app_private.staff_audit_events(membership_id,action,record_kind,record_id,record_revision,reason) VALUES(actor.id,'link_check','sources',s.id,s.revision,payload->>'reason');
 result:=jsonb_build_object('id',s.id,'revision',s.revision::text);
 INSERT INTO app_private.source_registry_requests(actor_id,request_key,request_hash,response) VALUES(actor.id,request_key,digest,result);
 RETURN result;
END $fn$;
REVOKE ALL ON FUNCTION app_staff.request_link_check(uuid,uuid,text,uuid,jsonb,bigint,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_staff.request_link_check(uuid,uuid,text,uuid,jsonb,bigint,uuid) TO askbd_staff;

ALTER FUNCTION app_staff.registry_read(uuid,uuid,text,uuid) RENAME TO registry_read_base;
REVOKE EXECUTE ON FUNCTION app_staff.registry_read_base(uuid,uuid,text,uuid) FROM askbd_staff;
CREATE FUNCTION app_staff.registry_read(subject uuid,session uuid,token_hash text,source_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE result jsonb;BEGIN
 result:=app_staff.registry_read_base(subject,session,token_hash,source_id);
 IF result IS NULL OR result ? 'error_code' THEN RETURN result;END IF;
 RETURN result||jsonb_build_object('link_health',app_private.source_link_health(source_id),'link_checks',COALESCE((SELECT jsonb_agg(to_jsonb(c)) FROM (SELECT requested_at,checked_at,outcome,failure_code,evidence_ref FROM app_private.source_link_checks WHERE source_link_checks.source_id=registry_read.source_id ORDER BY requested_at DESC,id DESC LIMIT 20)c),'[]'::jsonb));
END $fn$;
REVOKE ALL ON FUNCTION app_staff.registry_read(uuid,uuid,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_staff.registry_read(uuid,uuid,text,uuid) TO askbd_staff;

ALTER VIEW app_private.public_source_metadata RENAME TO public_source_metadata_prehealth;
CREATE VIEW app_private.public_source_metadata AS SELECT * FROM app_private.public_source_metadata_prehealth s WHERE NOT (app_private.source_link_health(s.id)->>'review_required')::boolean;
REVOKE ALL ON app_private.public_source_metadata FROM PUBLIC,askbd_staff,askbd_web;
CREATE OR REPLACE VIEW app_private.public_service_metadata AS
SELECT b.id,b.slug,b.locale,b.data || jsonb_build_object('source_ids',COALESCE((SELECT jsonb_agg(s.id ORDER BY s.id)
 FROM app_private.service_sources ss JOIN app_private.public_source_metadata s ON s.id=ss.source_id AND s.locale=b.locale WHERE ss.service_id=b.id),'[]'::jsonb)) data
FROM app_private.public_service_metadata_base b JOIN app_private.services record ON record.id=b.id
WHERE record.directory_created_by IS NULL OR (
 EXISTS(SELECT FROM app_private.public_category_metadata c WHERE c.id=record.primary_category_id AND c.locale=b.locale)
 AND EXISTS(SELECT FROM app_private.service_agencies sa JOIN app_private.public_agency_metadata a ON a.id=sa.agency_id AND a.locale=b.locale WHERE sa.service_id=b.id AND sa.review_state='reviewed' AND sa.relationship='responsible'));

CREATE FUNCTION app_staff.directory_integrity(subject uuid,session uuid,token_hash text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
BEGIN
 IF NOT EXISTS(SELECT FROM app_staff.authorize_bound(subject,session,'inspect',token_hash)) THEN RAISE EXCEPTION USING ERRCODE='42501';END IF;
 RETURN jsonb_build_object(
 'services_without_category',(SELECT count(*) FROM app_private.services s WHERE NOT EXISTS(SELECT FROM app_private.service_categories sc WHERE sc.service_id=s.id)),
 'services_without_responsible_agency',(SELECT count(*) FROM app_private.services s WHERE NOT EXISTS(SELECT FROM app_private.service_agencies sa WHERE sa.service_id=s.id AND sa.relationship='responsible')),
 'inactive_source_relationships',(SELECT count(*) FROM app_private.service_sources ss JOIN app_private.sources s ON s.id=ss.source_id WHERE s.status<>'active' OR NOT app_private.registry_public_eligible(s.id)),
 'orphaned_aliases',(SELECT count(*) FROM app_private.service_aliases a LEFT JOIN app_private.services s ON s.id=a.service_id WHERE s.id IS NULL),
 'duplicate_service_slugs',(SELECT count(*) FROM (SELECT slug FROM app_private.services GROUP BY slug HAVING count(*)>1)x),
 'duplicate_source_urls',(SELECT count(*) FROM (SELECT canonical_url FROM app_private.sources GROUP BY canonical_url HAVING count(*)>1)x),
 'sources_requiring_link_review',(SELECT count(*) FROM app_private.sources s WHERE (app_private.source_link_health(s.id)->>'review_required')::boolean));
END $fn$;
REVOKE ALL ON FUNCTION app_staff.directory_integrity(uuid,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_staff.directory_integrity(uuid,uuid,text) TO askbd_staff;
