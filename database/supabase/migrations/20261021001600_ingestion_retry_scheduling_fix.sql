-- Phase 5 executable-verification fixes, without rewriting applied migrations.
ALTER TABLE app_private.crawl_retrievals ADD COLUMN retry_after_seconds integer CHECK(retry_after_seconds BETWEEN 0 AND 86400);
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

CREATE OR REPLACE FUNCTION app_worker.finish_retrieval(ticket uuid,payload jsonb) RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE r app_private.crawl_retrievals;
BEGIN
 SELECT * INTO r FROM app_private.crawl_retrievals WHERE id=ticket FOR UPDATE;
 IF r.id IS NULL OR r.completed_at IS NOT NULL OR payload IS NULL OR jsonb_typeof(payload)<>'object'
  OR EXISTS(SELECT FROM jsonb_object_keys(payload) k WHERE k NOT IN('final_url','http_status','content_type','response_size','content_hash','etag','last_modified','error','retry_after_seconds'))
  OR (payload->>'final_url' IS NOT NULL AND payload->>'final_url'<>r.requested_url) THEN
  RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 UPDATE app_private.crawl_retrievals SET completed_at=clock_timestamp(),final_url=payload->>'final_url',
  http_status=(payload->>'http_status')::integer,content_type=payload->>'content_type',response_size=(payload->>'response_size')::integer,
  content_hash=payload->>'content_hash',etag=payload->>'etag',last_modified=payload->>'last_modified',error=payload->>'error',retry_after_seconds=(payload->>'retry_after_seconds')::integer WHERE id=r.id;
 UPDATE app_private.crawl_network_state SET ticket=NULL,leased_until=NULL,next_request_at=GREATEST(next_request_at,clock_timestamp()+interval '5 seconds') WHERE singleton AND crawl_network_state.ticket=r.id;
 RETURN jsonb_build_object('recorded',true);
EXCEPTION WHEN check_violation OR invalid_text_representation OR not_null_violation THEN
 RETURN jsonb_build_object('error','NOT_APPROVED');
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
 UPDATE app_private.ingestion_targets SET failure_streak=failure_streak+1,
  next_due_at=clock_timestamp()+make_interval(secs=>CASE WHEN failure_streak>=2 THEN 86400 ELSE GREATEST(delay_seconds,3600) END)
  WHERE source_id=j.source_id AND url=j.url;
 FOR d IN SELECT * FROM app_private.source_documents q WHERE q.source_id=j.source_id AND q.canonical_url=j.url AND q.current_version_id IS NOT NULL LOOP
  INSERT INTO app_private.source_checks(source_id,document_id,document_version_id,attempted_at,outcome,http_status,error_code)
   VALUES(j.source_id,d.id,d.current_version_id,clock_timestamp(),CASE WHEN r.http_status IN(404,410) THEN 'withdrawn' ELSE 'unavailable' END,r.http_status,code);
 END LOOP;
 RETURN jsonb_build_object('state',state_name,'retry_delay_seconds',CASE WHEN state_name='retry' THEN delay_seconds ELSE NULL END);
END $fn$;
