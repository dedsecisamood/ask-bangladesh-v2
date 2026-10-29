-- P22 verification follow-up: fix reservation variable binding and expose lower
-- source-specific limits without editing an already locally applied migration.
CREATE OR REPLACE FUNCTION app_worker.reserve_retrieval(policy_id uuid,url text) RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE p app_private.crawl_policies;state app_private.crawl_network_state;data jsonb;new_ticket uuid;ts timestamptz:=clock_timestamp();
BEGIN
 SELECT * INTO state FROM app_private.crawl_network_state WHERE singleton FOR UPDATE;
 SELECT * INTO p FROM app_private.crawl_policies WHERE id=policy_id;
 IF p.id IS NULL THEN RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 data:=app_worker.crawl_policy(p.source_id);
 IF data->>'policy_id' IS DISTINCT FROM policy_id::text OR url IS NULL OR NOT (url=ANY(p.approved_urls) OR url='https://'||(data->>'hostname')||'/robots.txt') THEN
  RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 IF state.leased_until>ts OR state.next_request_at>ts THEN RETURN jsonb_build_object('error','BUSY');END IF;
 IF (SELECT count(*) FROM app_private.crawl_retrievals r WHERE r.source_id=p.source_id AND r.attempted_at>=ts-interval '24 hours')>=p.daily_requests THEN
  RETURN jsonb_build_object('error','BUDGET');END IF;
 INSERT INTO app_private.crawl_retrievals(policy_id,source_id,requested_url) VALUES(p.id,p.source_id,url) RETURNING id INTO new_ticket;
 UPDATE app_private.crawl_network_state SET ticket=new_ticket,leased_until=ts+interval '60 seconds',next_request_at=ts+interval '5 seconds' WHERE singleton;
 RETURN jsonb_build_object('ticket',new_ticket);
END $fn$;

DROP FUNCTION app_staff.approve_crawl_policy(uuid,uuid,text,uuid,bigint,text[],jsonb,text,uuid);
CREATE FUNCTION app_staff.approve_crawl_policy(subject uuid,session uuid,token_hash text,source_id uuid,
 expected_revision bigint,urls text[],proof jsonb,user_agent text,request_key uuid,limits jsonb DEFAULT '{}')
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE s app_private.sources;d app_private.official_domains;actor app_private.admin_memberships;
 result jsonb; digest text; saved app_private.source_registry_requests; pid uuid;expiry timestamptz;v_bytes integer;v_redirects integer;v_daily integer;
BEGIN
 IF limits IS NULL OR jsonb_typeof(limits)<>'object' OR octet_length(limits::text)>200
  OR EXISTS(SELECT FROM jsonb_object_keys(limits) k WHERE k NOT IN('max_bytes','max_redirects','daily_requests')) THEN
  RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 v_bytes:=COALESCE((limits->>'max_bytes')::integer,5242880);
 v_redirects:=COALESCE((limits->>'max_redirects')::integer,3);
 v_daily:=COALESCE((limits->>'daily_requests')::integer,100);
 IF v_bytes NOT BETWEEN 1 AND 5242880 OR v_redirects NOT BETWEEN 0 AND 5 OR v_daily NOT BETWEEN 1 AND 100 THEN
  RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 SELECT * INTO actor FROM app_private.admin_memberships WHERE auth_user_id=subject FOR SHARE;
 IF actor.id IS NULL OR NOT EXISTS(SELECT FROM app_staff.authorize_bound(subject,session,'review',token_hash)) THEN
  RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 IF NOT EXISTS(SELECT FROM app_private.staff_sessions WHERE auth_session_id=session AND created_at>statement_timestamp()-interval '5 minutes') THEN
  RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 IF request_key IS NULL THEN RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 digest:=encode(extensions.digest(jsonb_build_object('scope','p22','id',source_id,'revision',expected_revision,'urls',urls,'proof',proof,'ua',user_agent,'limits',limits)::text,'sha256'),'hex');
 PERFORM pg_advisory_xact_lock(hashtextextended(actor.id::text||request_key::text,1800));
 SELECT * INTO saved FROM app_private.source_registry_requests r WHERE r.actor_id=actor.id AND r.request_key=approve_crawl_policy.request_key;
 IF FOUND THEN
  IF saved.request_hash<>digest OR saved.expires_at<=statement_timestamp() THEN RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
  RETURN saved.response;
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(actor.id::text,1801));
 IF (SELECT count(*) FROM app_private.source_registry_requests r WHERE r.actor_id=actor.id AND r.created_at>statement_timestamp()-interval '1 minute')>=30 THEN RETURN jsonb_build_object('error','BUDGET');END IF;
 SELECT * INTO s FROM app_private.sources WHERE id=source_id FOR UPDATE;
 SELECT * INTO d FROM app_private.official_domains WHERE id=s.official_domain_id FOR UPDATE;
 IF s.id IS NULL OR s.revision IS DISTINCT FROM expected_revision OR s.status<>'active' OR s.registry_status<>'approved'
  OR s.is_synthetic OR d.is_synthetic OR s.registry_created_by IS NULL OR s.content_use_status<>'allowed'
  OR d.authenticity_status<>'verified' OR d.content_authority_status<>'approved'
  OR NOT app_private.registry_public_eligible(s.id) OR s.availability_status<>'accessible'
  OR actor.id IN(s.registry_created_by,s.registry_edited_by,s.registry_submitted_by)
  OR NOT app_private.registry_proof_valid(proof) OR cardinality(urls) NOT BETWEEN 1 AND 100 OR urls IS NULL
  OR EXISTS(SELECT FROM unnest(urls) u WHERE NOT app_private.crawl_url_allowed(u,d.hostname) OR NOT starts_with(u,'https://'||d.hostname||s.scope_path))
  OR user_agent IS NULL OR user_agent !~ '^[A-Za-z][ -~]{0,199}$' THEN
  RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 expiry:=LEAST((proof->>'expires_at')::timestamptz,statement_timestamp()+interval '30 days');
 -- This explicit, fresh-MFA review is the independent crawl permission decision.
 -- It does not approve source content or renew document freshness.
 UPDATE app_private.official_domains SET crawl_permission_status='allowed' WHERE id=d.id RETURNING * INTO d;
 INSERT INTO app_private.crawl_policies(source_id,source_revision,domain_revision,approved_by,reviewer_revision,approved_urls,proof,user_agent,max_bytes,max_redirects,daily_requests,expires_at)
 VALUES(s.id,s.revision,d.revision,actor.id,actor.revision,urls,proof,user_agent,v_bytes,v_redirects,v_daily,expiry) RETURNING id INTO pid;
 INSERT INTO app_private.staff_audit_events(membership_id,action,record_kind,record_id,record_revision,reason,evidence)
 VALUES(actor.id,'crawl_permission','source',s.id,s.revision,'Explicit crawl-scope permission',jsonb_build_object('policy_id',pid,'proof',proof));
 result:=jsonb_build_object('policy_id',pid);
 INSERT INTO app_private.source_registry_requests(actor_id,request_key,request_hash,response) VALUES(actor.id,request_key,digest,result);
 RETURN result;
EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN RETURN jsonb_build_object('error','NOT_APPROVED');
END $fn$;
REVOKE ALL ON FUNCTION app_staff.approve_crawl_policy(uuid,uuid,text,uuid,bigint,text[],jsonb,text,uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_staff.approve_crawl_policy(uuid,uuid,text,uuid,bigint,text[],jsonb,text,uuid,jsonb) TO askbd_staff;

ALTER TABLE app_private.crawl_retrievals ADD COLUMN retrieved_at timestamptz
 CHECK(retrieved_at IS NULL OR (completed_at IS NOT NULL AND http_status=200 AND error IS NULL AND content_hash IS NOT NULL));
CREATE FUNCTION app_private.crawl_manifest_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $fn$
BEGIN
 IF OLD.completed_at IS NOT NULL THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Completed retrieval manifest is immutable';END IF;
 IF NEW.content_hash IS NOT NULL AND NEW.error IS NULL AND NEW.http_status=200 THEN NEW.retrieved_at:=NEW.completed_at;END IF;
 RETURN NEW;
END $fn$;
REVOKE ALL ON FUNCTION app_private.crawl_manifest_guard() FROM PUBLIC;
CREATE TRIGGER completed_manifest_immutable BEFORE UPDATE ON app_private.crawl_retrievals FOR EACH ROW EXECUTE FUNCTION app_private.crawl_manifest_guard();
CREATE TRIGGER no_manifest_delete BEFORE DELETE ON app_private.crawl_retrievals FOR EACH ROW EXECUTE FUNCTION app_private.evidence_immutable();
