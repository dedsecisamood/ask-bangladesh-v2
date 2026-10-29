-- P22: private exact-URL permission and durable request admission. No network I/O.
CREATE SCHEMA app_worker;
REVOKE ALL ON SCHEMA app_worker FROM PUBLIC;
DO $role$ BEGIN
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='askbd_worker') THEN
  CREATE ROLE askbd_worker NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
 ELSIF EXISTS(SELECT FROM pg_roles WHERE rolname='askbd_worker' AND
   (rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole OR rolreplication OR rolinherit
    OR EXISTS(SELECT FROM pg_auth_members WHERE member=pg_roles.oid))) THEN
  RAISE EXCEPTION 'Existing worker role has unsafe privileges';
 END IF;
END $role$;
GRANT USAGE ON SCHEMA app_worker TO askbd_worker;
ALTER TABLE app_private.staff_audit_events DROP CONSTRAINT staff_audit_events_action_check;
ALTER TABLE app_private.staff_audit_events ADD CONSTRAINT staff_audit_events_action_check CHECK(action IN
 ('provision','membership_change','session_open','session_revoke','directory_create','directory_update','directory_publish','directory_withdraw','link_check','crawl_permission'));

CREATE TABLE app_private.crawl_policies (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), source_id uuid NOT NULL REFERENCES app_private.sources(id),
 source_revision bigint NOT NULL, domain_revision bigint NOT NULL,
 approved_by uuid NOT NULL REFERENCES app_private.admin_memberships(id), reviewer_revision bigint NOT NULL,
 approved_urls text[] NOT NULL CHECK(cardinality(approved_urls) BETWEEN 1 AND 100),
 proof jsonb NOT NULL CHECK(app_private.registry_proof_valid(proof)),
 user_agent text NOT NULL CHECK(user_agent ~ '^[A-Za-z][ -~]{0,199}$'),
 max_bytes integer NOT NULL DEFAULT 5242880 CHECK(max_bytes BETWEEN 1 AND 5242880),
 max_redirects integer NOT NULL DEFAULT 3 CHECK(max_redirects BETWEEN 0 AND 5),
 daily_requests integer NOT NULL DEFAULT 100 CHECK(daily_requests BETWEEN 1 AND 100),
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX crawl_policies_source_idx ON app_private.crawl_policies(source_id,created_at DESC,id);
CREATE TABLE app_private.crawl_retrievals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), policy_id uuid NOT NULL REFERENCES app_private.crawl_policies(id),
 source_id uuid NOT NULL REFERENCES app_private.sources(id), requested_url text NOT NULL CHECK(char_length(requested_url)<=2048),
 attempted_at timestamptz NOT NULL DEFAULT clock_timestamp(), completed_at timestamptz,
 final_url text, http_status integer CHECK(http_status BETWEEN 100 AND 599),
 content_type text CHECK(char_length(content_type)<=100), response_size integer NOT NULL DEFAULT 0 CHECK(response_size BETWEEN 0 AND 5242880),
 content_hash text CHECK(content_hash ~ '^[a-f0-9]{64}$'), etag text CHECK(char_length(etag)<=256),
 last_modified text CHECK(char_length(last_modified)<=256), error text CHECK(error ~ '^[A-Z_]{1,60}$'),
 CHECK(completed_at IS NULL OR completed_at>=attempted_at),
 CHECK(content_hash IS NULL OR (http_status=200 AND error IS NULL AND completed_at IS NOT NULL))
);
CREATE INDEX crawl_retrievals_budget_idx ON app_private.crawl_retrievals(source_id,attempted_at);
-- Single global request lease is intentionally stricter than one request per host.
CREATE TABLE app_private.crawl_network_state (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), ticket uuid REFERENCES app_private.crawl_retrievals(id),
 leased_until timestamptz, next_request_at timestamptz NOT NULL DEFAULT '-infinity'
);
INSERT INTO app_private.crawl_network_state(singleton) VALUES(true);
DO $security$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['crawl_policies','crawl_retrievals','crawl_network_state'] LOOP
  EXECUTE format('ALTER TABLE app_private.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE app_private.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY migration_owner ON app_private.%I TO postgres USING(true) WITH CHECK(true)',t);
  EXECUTE format('REVOKE ALL ON app_private.%I FROM PUBLIC,askbd_web,askbd_staff,askbd_worker',t);
 END LOOP;
END $security$;
CREATE TRIGGER immutable_crawl_policy BEFORE UPDATE OR DELETE ON app_private.crawl_policies
 FOR EACH ROW EXECUTE FUNCTION app_private.evidence_immutable();

CREATE FUNCTION app_private.crawl_url_allowed(value text,host text) RETURNS boolean
 LANGUAGE sql IMMUTABLE SET search_path=pg_catalog AS $fn$
 SELECT COALESCE(char_length(value)<=2048 AND value ~ '^https://[a-z0-9.-]+/[A-Za-z0-9/_~.-]*$'
  AND split_part(split_part(value,'://',2),'/',1)=host AND value !~ '(^|/)[.]{1,2}(/|$)'
  AND substring(value FROM length('https://'||host)+1) !~ '//',false)
$fn$;
REVOKE ALL ON FUNCTION app_private.crawl_url_allowed(text,text) FROM PUBLIC;

CREATE FUNCTION app_staff.approve_crawl_policy(subject uuid,session uuid,token_hash text,source_id uuid,
 expected_revision bigint,urls text[],proof jsonb,user_agent text,request_key uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE s app_private.sources;d app_private.official_domains;actor app_private.admin_memberships;
 result jsonb; digest text; saved app_private.source_registry_requests; pid uuid;expiry timestamptz;
BEGIN
 SELECT * INTO actor FROM app_private.admin_memberships WHERE auth_user_id=subject FOR SHARE;
 IF actor.id IS NULL OR NOT EXISTS(SELECT FROM app_staff.authorize_bound(subject,session,'review',token_hash)) THEN
  RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 IF NOT EXISTS(SELECT FROM app_private.staff_sessions WHERE auth_session_id=session AND created_at>statement_timestamp()-interval '5 minutes') THEN
  RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 IF request_key IS NULL THEN RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 digest:=encode(extensions.digest(jsonb_build_object('scope','p22','id',source_id,'revision',expected_revision,'urls',urls,'proof',proof,'ua',user_agent)::text,'sha256'),'hex');
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
 INSERT INTO app_private.crawl_policies(source_id,source_revision,domain_revision,approved_by,reviewer_revision,approved_urls,proof,user_agent,expires_at)
 VALUES(s.id,s.revision,d.revision,actor.id,actor.revision,urls,proof,user_agent,expiry) RETURNING id INTO pid;
 INSERT INTO app_private.staff_audit_events(membership_id,action,record_kind,record_id,record_revision,reason,evidence)
 VALUES(actor.id,'crawl_permission','source',s.id,s.revision,'Explicit crawl-scope permission',jsonb_build_object('policy_id',pid,'proof',proof));
 result:=jsonb_build_object('policy_id',pid);
 INSERT INTO app_private.source_registry_requests(actor_id,request_key,request_hash,response) VALUES(actor.id,request_key,digest,result);
 RETURN result;
END $fn$;
REVOKE ALL ON FUNCTION app_staff.approve_crawl_policy(uuid,uuid,text,uuid,bigint,text[],jsonb,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_staff.approve_crawl_policy(uuid,uuid,text,uuid,bigint,text[],jsonb,text,uuid) TO askbd_staff;

CREATE FUNCTION app_worker.crawl_policy(source_id uuid) RETURNS jsonb
 LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
 SELECT COALESCE((SELECT jsonb_build_object('policy_id',p.id,'hostname',d.hostname,'urls',p.approved_urls,
   'expires_at',p.expires_at,'user_agent',p.user_agent,'max_bytes',p.max_bytes,'max_redirects',p.max_redirects)
  FROM app_private.crawl_policies p JOIN app_private.sources s ON s.id=p.source_id
  JOIN app_private.official_domains d ON d.id=s.official_domain_id
  JOIN app_private.agencies a ON a.id=s.agency_id
  JOIN app_private.admin_memberships m ON m.id=p.approved_by
  WHERE p.source_id=crawl_policy.source_id AND p.expires_at>clock_timestamp()
   AND s.revision=p.source_revision AND d.revision=p.domain_revision
   AND s.status='active' AND s.registry_status='approved' AND s.registry_created_by IS NOT NULL
   AND NOT s.is_synthetic AND NOT d.is_synthetic AND NOT a.is_synthetic AND a.status='verified'
   AND s.content_use_status='allowed' AND s.availability_status='accessible'
   AND d.authenticity_status='verified' AND d.content_authority_status='approved' AND d.crawl_permission_status='allowed'
   AND m.status='active' AND m.revision=p.reviewer_revision AND m.role IN('owner','administrator','source_reviewer')
   AND app_private.registry_public_eligible(s.id)
   AND 2=(SELECT count(DISTINCT v.verification_type) FROM app_private.source_verifications v
      WHERE v.source_id=s.id AND v.registry_content_revision=s.registry_content_revision
      AND v.verification_type IN('ownership','relevance') AND v.status='approved'
      AND v.verified_at<=clock_timestamp() AND v.expires_at>clock_timestamp())
  ORDER BY p.created_at DESC,p.id DESC LIMIT 1),jsonb_build_object('error','NOT_APPROVED'))
$fn$;
CREATE FUNCTION app_worker.reserve_retrieval(policy_id uuid,url text) RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE p app_private.crawl_policies;state app_private.crawl_network_state;data jsonb;ticket uuid;ts timestamptz:=clock_timestamp();
BEGIN
 SELECT * INTO state FROM app_private.crawl_network_state WHERE singleton FOR UPDATE;
 SELECT * INTO p FROM app_private.crawl_policies WHERE id=policy_id;
 IF p.id IS NULL THEN RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 data:=app_worker.crawl_policy(p.source_id);
 IF data->>'policy_id' IS DISTINCT FROM policy_id::text OR NOT (url=ANY(p.approved_urls) OR url='https://'||(data->>'hostname')||'/robots.txt') THEN
  RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 IF state.leased_until>ts OR state.next_request_at>ts THEN RETURN jsonb_build_object('error','BUSY');END IF;
 IF (SELECT count(*) FROM app_private.crawl_retrievals r WHERE r.source_id=p.source_id AND r.attempted_at>=ts-interval '24 hours')>=p.daily_requests THEN
  RETURN jsonb_build_object('error','BUDGET');END IF;
 INSERT INTO app_private.crawl_retrievals(policy_id,source_id,requested_url) VALUES(p.id,p.source_id,url) RETURNING id INTO ticket;
 UPDATE app_private.crawl_network_state SET ticket=reserve_retrieval.ticket,leased_until=ts+interval '60 seconds',next_request_at=ts+interval '5 seconds' WHERE singleton;
 RETURN jsonb_build_object('ticket',ticket);
END $fn$;
CREATE FUNCTION app_worker.finish_retrieval(ticket uuid,payload jsonb) RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE r app_private.crawl_retrievals;
BEGIN
 SELECT * INTO r FROM app_private.crawl_retrievals WHERE id=ticket FOR UPDATE;
 IF r.id IS NULL OR r.completed_at IS NOT NULL OR payload IS NULL OR jsonb_typeof(payload)<>'object'
  OR EXISTS(SELECT FROM jsonb_object_keys(payload) k WHERE k NOT IN('final_url','http_status','content_type','response_size','content_hash','etag','last_modified','error'))
  OR (payload->>'final_url' IS NOT NULL AND payload->>'final_url'<>r.requested_url) THEN
  RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 UPDATE app_private.crawl_retrievals SET completed_at=clock_timestamp(),final_url=payload->>'final_url',
  http_status=(payload->>'http_status')::integer,content_type=payload->>'content_type',response_size=(payload->>'response_size')::integer,
  content_hash=payload->>'content_hash',etag=payload->>'etag',last_modified=payload->>'last_modified',error=payload->>'error' WHERE id=r.id;
 UPDATE app_private.crawl_network_state SET ticket=NULL,leased_until=NULL WHERE singleton AND crawl_network_state.ticket=r.id;
 RETURN jsonb_build_object('recorded',true);
EXCEPTION WHEN check_violation OR invalid_text_representation OR not_null_violation THEN
 RETURN jsonb_build_object('error','NOT_APPROVED');
END $fn$;
REVOKE ALL ON FUNCTION app_worker.crawl_policy(uuid),app_worker.reserve_retrieval(uuid,text),app_worker.finish_retrieval(uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_worker.crawl_policy(uuid),app_worker.reserve_retrieval(uuid,text),app_worker.finish_retrieval(uuid,jsonb) TO askbd_worker;
