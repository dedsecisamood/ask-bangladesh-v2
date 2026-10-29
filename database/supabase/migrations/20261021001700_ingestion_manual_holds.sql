-- Security/parser denials and exhausted retries must survive scheduler re-admission.
ALTER TABLE app_private.ingestion_targets ADD COLUMN blocked boolean NOT NULL DEFAULT false,
 ADD COLUMN hold_code text CHECK(hold_code ~ '^[A-Z_]{1,80}$');

CREATE OR REPLACE FUNCTION app_worker.enqueue_ingestion(source_id uuid,url text,kind text,request_key uuid) RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE data jsonb;j app_private.ingestion_jobs;
BEGIN
 IF source_id IS NULL OR url IS NULL OR kind NOT IN('ingest','refresh') OR kind IS NULL OR request_key IS NULL THEN RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 data:=app_worker.crawl_policy(source_id);
 IF data->>'policy_id' IS NULL OR NOT (data->'urls' ? url) THEN RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(source_id::text,2701));
 IF EXISTS(SELECT FROM app_private.ingestion_targets t WHERE t.source_id=enqueue_ingestion.source_id AND t.url=enqueue_ingestion.url AND t.blocked) THEN RETURN jsonb_build_object('error','MANUAL_REVIEW_REQUIRED');END IF;
 SELECT * INTO j FROM app_private.ingestion_jobs q WHERE q.source_id=enqueue_ingestion.source_id AND q.request_key=enqueue_ingestion.request_key;
 IF FOUND THEN
  IF j.url<>url OR j.kind<>kind THEN RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
  RETURN jsonb_build_object('job_id',j.id);
 END IF;
 SELECT * INTO j FROM app_private.ingestion_jobs q WHERE q.source_id=enqueue_ingestion.source_id AND q.url=enqueue_ingestion.url AND q.kind=enqueue_ingestion.kind AND q.state IN('queued','running','retry');
 IF FOUND THEN RETURN jsonb_build_object('job_id',j.id);END IF;
 IF (SELECT count(*) FROM app_private.ingestion_jobs q WHERE q.state IN('queued','running','retry'))>=10000 OR
 (SELECT count(*) FROM app_private.ingestion_jobs q WHERE q.source_id=enqueue_ingestion.source_id AND q.created_at>clock_timestamp()-interval '24 hours')>=1000 THEN RETURN jsonb_build_object('error','BUDGET');END IF;
 INSERT INTO app_private.ingestion_jobs(source_id,policy_id,url,kind,request_key) VALUES(source_id,(data->>'policy_id')::uuid,url,kind,request_key) RETURNING * INTO j;
 INSERT INTO app_private.ingestion_events(job_id,kind,generation) VALUES(j.id,'queued',0);
 INSERT INTO app_private.ingestion_targets(source_id,url) VALUES(source_id,url) ON CONFLICT DO NOTHING;
 RETURN jsonb_build_object('job_id',j.id);
END $fn$;

CREATE OR REPLACE FUNCTION app_worker.schedule_ingestion() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE s app_private.sources;p jsonb;u text;t app_private.ingestion_targets;result jsonb;scheduled integer:=0;
BEGIN
 IF EXISTS(SELECT FROM app_private.ingestion_controls WHERE singleton AND paused) THEN RETURN jsonb_build_object('scheduled',0,'paused',true);END IF;
 -- Bounded source discovery from approved registry, never links from documents.
 FOR s IN SELECT * FROM app_private.sources q WHERE q.status='active' AND app_worker.crawl_policy(q.id)->>'policy_id' IS NOT NULL
  ORDER BY (SELECT max(target.next_due_at) FROM app_private.ingestion_targets target WHERE target.source_id=q.id) NULLS FIRST,q.id LIMIT 250 LOOP
  p:=app_worker.crawl_policy(s.id);
  IF p->>'policy_id' IS NULL THEN CONTINUE;END IF;
  FOR u IN SELECT jsonb_array_elements_text(p->'urls') LOOP
   INSERT INTO app_private.ingestion_targets(source_id,url) VALUES(s.id,u) ON CONFLICT DO NOTHING;
  END LOOP;
 END LOOP;
 FOR t IN SELECT * FROM app_private.ingestion_targets WHERE NOT blocked AND next_due_at<=clock_timestamp() ORDER BY next_due_at,source_id,url FOR UPDATE SKIP LOCKED LIMIT 25 LOOP
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

CREATE OR REPLACE FUNCTION app_worker.fail_ingestion(job_id uuid,token uuid,code text) RETURNS jsonb
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
 delay_seconds:=GREATEST(LEAST(3600,30*(2^(j.attempts-1))::integer)+(random()*10)::integer,COALESCE(r.retry_after_seconds,0));
 UPDATE app_private.ingestion_jobs SET state=state_name,error_code=code,lease_token=NULL,leased_until=NULL,
  available_at=clock_timestamp()+make_interval(secs=>delay_seconds),finished_at=CASE WHEN state_name='retry' THEN NULL ELSE clock_timestamp() END WHERE id=j.id;
 INSERT INTO app_private.ingestion_events(job_id,kind,error_code,generation) VALUES(j.id,state_name,code,j.generation);
 PERFORM pg_advisory_xact_lock(hashtextextended(j.source_id::text,2701));
 UPDATE app_private.ingestion_targets SET failure_streak=failure_streak+1,
  blocked=state_name IN('quarantined','dead'),hold_code=CASE WHEN state_name IN('quarantined','dead') THEN code ELSE NULL END,
  next_due_at=clock_timestamp()+make_interval(secs=>CASE WHEN failure_streak>=2 THEN 86400 ELSE GREATEST(delay_seconds,3600) END)
  WHERE source_id=j.source_id AND url=j.url;
 FOR d IN SELECT * FROM app_private.source_documents q WHERE q.source_id=j.source_id AND q.canonical_url=j.url AND q.current_version_id IS NOT NULL LOOP
  INSERT INTO app_private.source_checks(source_id,document_id,document_version_id,attempted_at,outcome,http_status,error_code)
   VALUES(j.source_id,d.id,d.current_version_id,clock_timestamp(),CASE WHEN r.http_status IN(404,410) THEN 'withdrawn' ELSE 'unavailable' END,r.http_status,code);
 END LOOP;
 RETURN jsonb_build_object('state',state_name,'retry_delay_seconds',CASE WHEN state_name='retry' THEN delay_seconds ELSE NULL END);
END $fn$;

CREATE FUNCTION app_staff.resume_ingestion_target(subject uuid,session uuid,token_hash text,source_id uuid,url text,reason text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE actor app_private.admin_memberships;
BEGIN
 SELECT * INTO actor FROM app_private.admin_memberships WHERE auth_user_id=subject FOR SHARE;
 IF actor.id IS NULL OR actor.role NOT IN('owner','administrator') OR NOT EXISTS(SELECT FROM app_staff.authorize_bound(subject,session,'review',token_hash))
  OR NOT EXISTS(SELECT FROM app_private.staff_sessions WHERE auth_session_id=session AND created_at>statement_timestamp()-interval '5 minutes')
  OR COALESCE(char_length(btrim(reason)),0) NOT BETWEEN 1 AND 2000 THEN RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(source_id::text,2701));
 UPDATE app_private.ingestion_targets SET blocked=false,hold_code=NULL,failure_streak=0,next_due_at=clock_timestamp()
  WHERE ingestion_targets.source_id=resume_ingestion_target.source_id AND ingestion_targets.url=resume_ingestion_target.url AND blocked;
 IF NOT FOUND THEN RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 INSERT INTO app_private.staff_audit_events(membership_id,action,record_kind,record_id,reason)
  VALUES(actor.id,'ingestion_control','source',source_id,reason);
 RETURN jsonb_build_object('resumed',true);
END $fn$;
REVOKE ALL ON FUNCTION app_staff.resume_ingestion_target(uuid,uuid,text,uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_staff.resume_ingestion_target(uuid,uuid,text,uuid,text,text) TO askbd_staff;
