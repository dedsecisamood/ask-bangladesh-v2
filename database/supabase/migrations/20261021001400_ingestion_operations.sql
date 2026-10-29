-- P28: conservative retry/backoff, fair due-work admission and emergency controls.
ALTER TABLE app_private.staff_audit_events DROP CONSTRAINT staff_audit_events_action_check;
ALTER TABLE app_private.staff_audit_events ADD CONSTRAINT staff_audit_events_action_check CHECK(action IN
 ('provision','membership_change','session_open','session_revoke','directory_create','directory_update','directory_publish','directory_withdraw','link_check','crawl_permission','ingestion_control','evidence_review'));

CREATE FUNCTION app_worker.fail_ingestion(job_id uuid,token uuid,code text) RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE j app_private.ingestion_jobs;r app_private.crawl_retrievals;d app_private.source_documents;state_name text;delay_seconds integer;
BEGIN
 SELECT * INTO j FROM app_private.ingestion_jobs WHERE id=job_id FOR UPDATE;
 IF j.state IS DISTINCT FROM 'running' OR j.lease_token IS DISTINCT FROM token OR j.leased_until<=clock_timestamp()
  OR code IS NULL OR code !~ '^[A-Z_]{1,80}$' THEN RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 SELECT * INTO r FROM app_private.crawl_retrievals q WHERE q.job_id=j.id AND q.job_fence=token ORDER BY q.attempted_at DESC,q.id DESC LIMIT 1;
 state_name:=CASE WHEN code IN('TIMEOUT','DNS_FAILURE','CONNECTION_FAILURE','REGISTRY_UNAVAILABLE') OR (code='HTTP_ERROR' AND r.http_status BETWEEN 500 AND 599)
  THEN CASE WHEN j.attempts>=5 THEN 'dead' ELSE 'retry' END ELSE 'quarantined' END;
 -- No automatic retry for authorization/TLS/SSRF/CAPTCHA/429/robots/parser failures.
 -- Exponential backoff plus bounded jitter; no upstream text becomes a command.
 delay_seconds:=LEAST(3600,30*(2^(j.attempts-1))::integer)+(random()*10)::integer;
 UPDATE app_private.ingestion_jobs SET state=state_name,error_code=code,lease_token=NULL,leased_until=NULL,
  available_at=clock_timestamp()+make_interval(secs=>delay_seconds),finished_at=CASE WHEN state_name='retry' THEN NULL ELSE clock_timestamp() END WHERE id=j.id;
 INSERT INTO app_private.ingestion_events(job_id,kind,error_code,generation) VALUES(j.id,state_name,code,j.generation);
 UPDATE app_private.ingestion_targets SET failure_streak=failure_streak+1,
  next_due_at=clock_timestamp()+make_interval(secs=>CASE WHEN failure_streak>=2 THEN 86400 ELSE GREATEST(delay_seconds,3600) END)
  WHERE source_id=j.source_id AND url=j.url;
 FOR d IN SELECT * FROM app_private.source_documents q WHERE q.source_id=j.source_id AND q.canonical_url=j.url AND q.current_version_id IS NOT NULL LOOP
  INSERT INTO app_private.source_checks(source_id,document_id,document_version_id,attempted_at,outcome,http_status,error_code)
   VALUES(j.source_id,d.id,d.current_version_id,clock_timestamp(),CASE WHEN r.http_status IN(404,410) THEN 'withdrawn' ELSE 'unavailable' END,r.http_status,code);
 END LOOP;
 RETURN jsonb_build_object('state',state_name,'retry_delay_seconds',CASE WHEN state_name='retry' THEN delay_seconds ELSE NULL END);
END $fn$;

CREATE FUNCTION app_worker.schedule_ingestion() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE s app_private.sources;p jsonb;u text;t app_private.ingestion_targets;result jsonb;scheduled integer:=0;
BEGIN
 IF EXISTS(SELECT FROM app_private.ingestion_controls WHERE singleton AND paused) THEN RETURN jsonb_build_object('scheduled',0,'paused',true);END IF;
 -- Bounded source discovery from approved registry, never links from documents.
 FOR s IN SELECT * FROM app_private.sources q WHERE q.status='active' AND app_worker.crawl_policy(q.id)->>'policy_id' IS NOT NULL
  ORDER BY (SELECT max(t.next_due_at) FROM app_private.ingestion_targets t WHERE t.source_id=q.id) NULLS FIRST,q.id LIMIT 250 LOOP
  p:=app_worker.crawl_policy(s.id);
  IF p->>'policy_id' IS NULL THEN CONTINUE;END IF;
  FOR u IN SELECT jsonb_array_elements_text(p->'urls') LOOP
   INSERT INTO app_private.ingestion_targets(source_id,url) VALUES(s.id,u) ON CONFLICT DO NOTHING;
  END LOOP;
 END LOOP;
 FOR t IN SELECT * FROM app_private.ingestion_targets WHERE next_due_at<=clock_timestamp() ORDER BY next_due_at,source_id,url FOR UPDATE SKIP LOCKED LIMIT 25 LOOP
  result:=app_worker.enqueue_ingestion(t.source_id,t.url,'refresh',gen_random_uuid());
  IF result->>'job_id' IS NOT NULL THEN
   scheduled:=scheduled+1;
   UPDATE app_private.ingestion_targets SET next_due_at=clock_timestamp()+interval '1 hour' WHERE source_id=t.source_id AND url=t.url;
  ELSE
   UPDATE app_private.ingestion_targets SET next_due_at=clock_timestamp()+interval '24 hours' WHERE source_id=t.source_id AND url=t.url;
  END IF;
 END LOOP;
 RETURN jsonb_build_object('scheduled',scheduled,'paused',false);
END $fn$;

CREATE FUNCTION app_worker.ingestion_metrics() RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
 SELECT jsonb_build_object('paused',(SELECT paused FROM app_private.ingestion_controls WHERE singleton),
 'jobs',COALESCE((SELECT jsonb_object_agg(state,n) FROM(SELECT state,count(*) n FROM app_private.ingestion_jobs GROUP BY state) counts),'{}'),
 'expired_leases',(SELECT count(*) FROM app_private.ingestion_jobs WHERE state='running' AND leased_until<=clock_timestamp()),
 'oldest_ready_seconds',(SELECT GREATEST(0,extract(epoch FROM clock_timestamp()-min(available_at))) FROM app_private.ingestion_jobs WHERE state IN('queued','retry')),
 'due_targets',(SELECT count(*) FROM app_private.ingestion_targets WHERE next_due_at<=clock_timestamp()),
 'source_circuit_open',(SELECT count(*) FROM app_private.ingestion_targets WHERE failure_streak>=3),
 'pending_index_review',(SELECT count(*) FROM app_private.ingestion_outbox WHERE state='pending_review'),
 'failure_codes',COALESCE((SELECT jsonb_object_agg(error_code,n) FROM(SELECT error_code,count(*) n FROM app_private.ingestion_jobs WHERE error_code IS NOT NULL GROUP BY error_code LIMIT 100) counts),'{}'))
$fn$;

CREATE FUNCTION app_staff.set_ingestion_state(subject uuid,session uuid,token_hash text,paused boolean,reason text,critical_seconds integer DEFAULT 21600,general_seconds integer DEFAULT 86400)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE actor app_private.admin_memberships;
BEGIN
 SELECT * INTO actor FROM app_private.admin_memberships WHERE auth_user_id=subject FOR SHARE;
 IF actor.id IS NULL OR actor.role NOT IN('owner','administrator') OR NOT EXISTS(SELECT FROM app_staff.authorize_bound(subject,session,'review',token_hash))
  OR NOT EXISTS(SELECT FROM app_private.staff_sessions WHERE auth_session_id=session AND created_at>statement_timestamp()-interval '5 minutes')
  OR paused IS NULL OR COALESCE(char_length(btrim(reason)),0) NOT BETWEEN 1 AND 2000
  OR critical_seconds NOT BETWEEN 3600 AND 86400 OR general_seconds NOT BETWEEN 3600 AND 604800 OR critical_seconds IS NULL OR general_seconds IS NULL
 THEN RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 UPDATE app_private.ingestion_controls SET paused=set_ingestion_state.paused,critical_interval_seconds=critical_seconds,general_interval_seconds=general_seconds WHERE singleton;
 INSERT INTO app_private.staff_audit_events(membership_id,action,reason) VALUES(actor.id,'ingestion_control',reason);
 RETURN jsonb_build_object('paused',paused);
END $fn$;
CREATE FUNCTION app_staff.ingestion_status(subject uuid,session uuid,token_hash text) RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
BEGIN
 IF NOT EXISTS(SELECT FROM app_staff.authorize_bound(subject,session,'inspect',token_hash)) THEN RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 RETURN app_worker.ingestion_metrics();
END $fn$;
REVOKE ALL ON FUNCTION app_worker.fail_ingestion(uuid,uuid,text),app_worker.schedule_ingestion(),app_worker.ingestion_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_worker.fail_ingestion(uuid,uuid,text),app_worker.schedule_ingestion(),app_worker.ingestion_metrics() TO askbd_worker;
REVOKE ALL ON FUNCTION app_staff.set_ingestion_state(uuid,uuid,text,boolean,text,integer,integer),app_staff.ingestion_status(uuid,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_staff.set_ingestion_state(uuid,uuid,text,boolean,text,integer,integer),app_staff.ingestion_status(uuid,uuid,text) TO askbd_staff;
