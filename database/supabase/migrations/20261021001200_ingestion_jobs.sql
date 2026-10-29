-- Phase 5: private durable queue, fencing, metadata-only events and offline stop.
CREATE TABLE app_private.ingestion_controls (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), paused boolean NOT NULL DEFAULT true,
 critical_interval_seconds integer NOT NULL DEFAULT 21600 CHECK(critical_interval_seconds BETWEEN 3600 AND 86400),
 general_interval_seconds integer NOT NULL DEFAULT 86400 CHECK(general_interval_seconds BETWEEN 3600 AND 604800)
);
INSERT INTO app_private.ingestion_controls(singleton) VALUES(true);
CREATE TABLE app_private.ingestion_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), source_id uuid NOT NULL REFERENCES app_private.sources(id),
 policy_id uuid NOT NULL REFERENCES app_private.crawl_policies(id), url text NOT NULL CHECK(char_length(url)<=2048),
 kind text NOT NULL CHECK(kind IN('ingest','refresh')), request_key uuid NOT NULL,
 state text NOT NULL DEFAULT 'queued' CHECK(state IN('queued','running','retry','completed','quarantined','dead','cancelled')),
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 5), generation bigint NOT NULL DEFAULT 0,
 lease_token uuid, leased_until timestamptz, heartbeat_at timestamptz,
 available_at timestamptz NOT NULL DEFAULT clock_timestamp(), started_at timestamptz, finished_at timestamptz,
 version_id uuid REFERENCES app_private.document_versions(id), error_code text CHECK(error_code ~ '^[A-Z_]{1,80}$'),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), UNIQUE(source_id,request_key),
 CHECK((state='running')=(lease_token IS NOT NULL AND leased_until IS NOT NULL))
);
CREATE UNIQUE INDEX ingestion_jobs_active ON app_private.ingestion_jobs(source_id,url,kind) WHERE state IN('queued','running','retry');
CREATE INDEX ingestion_jobs_ready ON app_private.ingestion_jobs(available_at,id) WHERE state IN('queued','retry');
CREATE TABLE app_private.ingestion_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, job_id uuid NOT NULL REFERENCES app_private.ingestion_jobs(id),
 kind text NOT NULL CHECK(kind IN('queued','claimed','heartbeat','retry','completed','quarantined','dead','cancelled','lease_expired','observed')),
 error_code text CHECK(error_code ~ '^[A-Z_]{1,80}$'), generation bigint NOT NULL,
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX ingestion_events_job ON app_private.ingestion_events(job_id,id);
CREATE TABLE app_private.ingestion_targets (
 source_id uuid NOT NULL REFERENCES app_private.sources(id), url text NOT NULL CHECK(char_length(url)<=2048),
 next_due_at timestamptz NOT NULL DEFAULT clock_timestamp(), last_success_at timestamptz,
 failure_streak integer NOT NULL DEFAULT 0 CHECK(failure_streak>=0), PRIMARY KEY(source_id,url)
);
CREATE INDEX ingestion_targets_due ON app_private.ingestion_targets(next_due_at,source_id);
CREATE TABLE app_private.ingestion_outbox (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), version_id uuid NOT NULL REFERENCES app_private.document_versions(id),
 topic text NOT NULL DEFAULT 'evidence_extracted' CHECK(topic='evidence_extracted'),
 profile text NOT NULL, state text NOT NULL DEFAULT 'pending_review' CHECK(state IN('pending_review','ready','delivered','cancelled')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), UNIQUE(version_id,topic)
);
DO $security$ DECLARE t text;BEGIN
 FOREACH t IN ARRAY ARRAY['ingestion_controls','ingestion_jobs','ingestion_events','ingestion_targets','ingestion_outbox'] LOOP
  EXECUTE format('ALTER TABLE app_private.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE app_private.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY migration_owner ON app_private.%I TO postgres USING(true) WITH CHECK(true)',t);
  EXECUTE format('REVOKE ALL ON app_private.%I FROM PUBLIC,askbd_web,askbd_staff,askbd_worker',t);
 END LOOP;
END $security$;
CREATE TRIGGER immutable_ingestion_event BEFORE UPDATE OR DELETE ON app_private.ingestion_events FOR EACH ROW EXECUTE FUNCTION app_private.evidence_immutable();
ALTER TABLE app_private.crawl_retrievals ADD COLUMN job_id uuid REFERENCES app_private.ingestion_jobs(id), ADD COLUMN job_fence uuid;

CREATE FUNCTION app_worker.enqueue_ingestion(source_id uuid,url text,kind text,request_key uuid) RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE data jsonb;j app_private.ingestion_jobs;
BEGIN
 IF source_id IS NULL OR url IS NULL OR kind NOT IN('ingest','refresh') OR kind IS NULL OR request_key IS NULL THEN RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 data:=app_worker.crawl_policy(source_id);
 IF data->>'policy_id' IS NULL OR NOT (data->'urls' ? url) THEN RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(source_id::text,2701));
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

CREATE FUNCTION app_worker.claim_ingestion() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE j app_private.ingestion_jobs;policy jsonb;
BEGIN
 PERFORM 1 FROM app_private.ingestion_controls WHERE singleton AND NOT paused FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('job',NULL);END IF;
 FOR j IN SELECT * FROM app_private.ingestion_jobs q WHERE q.state='running' AND q.leased_until<=clock_timestamp() FOR UPDATE SKIP LOCKED LOOP
  UPDATE app_private.ingestion_jobs SET state=CASE WHEN attempts>=5 THEN 'dead' ELSE 'retry' END,
   available_at=clock_timestamp()+interval '30 seconds',lease_token=NULL,leased_until=NULL,error_code='LEASE_EXPIRED' WHERE id=j.id;
  INSERT INTO app_private.ingestion_events(job_id,kind,error_code,generation) VALUES(j.id,'lease_expired','LEASE_EXPIRED',j.generation);
 END LOOP;
 IF (SELECT count(*) FROM app_private.ingestion_jobs q WHERE q.state='running')>=2 THEN RETURN jsonb_build_object('job',NULL);END IF;
 FOR j IN SELECT * FROM app_private.ingestion_jobs q WHERE q.state IN('queued','retry') AND q.available_at<=clock_timestamp()
  AND NOT EXISTS(SELECT FROM app_private.ingestion_jobs r WHERE r.source_id=q.source_id AND r.state='running')
  ORDER BY q.available_at,q.id FOR UPDATE SKIP LOCKED LIMIT 25 LOOP
  policy:=app_worker.crawl_policy(j.source_id);
  IF policy->>'policy_id' IS DISTINCT FROM j.policy_id::text OR NOT (policy->'urls' ? j.url) THEN
   UPDATE app_private.ingestion_jobs SET state='cancelled',finished_at=clock_timestamp(),error_code='NOT_APPROVED' WHERE id=j.id;
   INSERT INTO app_private.ingestion_events(job_id,kind,error_code,generation) VALUES(j.id,'cancelled','NOT_APPROVED',j.generation);
   CONTINUE;
  END IF;
  UPDATE app_private.ingestion_jobs SET state='running',attempts=attempts+1,generation=generation+1,lease_token=gen_random_uuid(),
   leased_until=clock_timestamp()+interval '5 minutes',heartbeat_at=clock_timestamp(),started_at=clock_timestamp(),error_code=NULL WHERE id=j.id RETURNING * INTO j;
  INSERT INTO app_private.ingestion_events(job_id,kind,generation) VALUES(j.id,'claimed',j.generation);
  RETURN jsonb_build_object('job',jsonb_build_object('id',j.id,'source_id',j.source_id,'url',j.url,'kind',j.kind,'lease_token',j.lease_token,'generation',j.generation));
 END LOOP;
 RETURN jsonb_build_object('job',NULL);
END $fn$;

CREATE FUNCTION app_private.ingestion_lease(job_id uuid,token uuid) RETURNS boolean LANGUAGE sql VOLATILE SET search_path=pg_catalog AS $fn$
 SELECT EXISTS(SELECT FROM app_private.ingestion_jobs j WHERE j.id=job_id AND j.lease_token=token AND j.state='running' AND j.leased_until>clock_timestamp()
  AND j.started_at>clock_timestamp()-interval '15 minutes'
  AND EXISTS(SELECT FROM app_private.ingestion_controls WHERE singleton AND NOT paused)
  AND app_worker.crawl_policy(j.source_id)->>'policy_id'=j.policy_id::text)
$fn$;
REVOKE ALL ON FUNCTION app_private.ingestion_lease(uuid,uuid) FROM PUBLIC;

CREATE FUNCTION app_worker.heartbeat_ingestion(job_id uuid,token uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
BEGIN
 PERFORM 1 FROM app_private.ingestion_jobs WHERE id=job_id FOR UPDATE;
 IF NOT app_private.ingestion_lease(job_id,token) THEN RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 UPDATE app_private.ingestion_jobs SET leased_until=clock_timestamp()+interval '5 minutes',heartbeat_at=clock_timestamp() WHERE id=job_id;
 RETURN jsonb_build_object('renewed',true);
END $fn$;
CREATE FUNCTION app_worker.reserve_ingestion(job_id uuid,token uuid,url text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE j app_private.ingestion_jobs;r jsonb;
BEGIN
 SELECT * INTO j FROM app_private.ingestion_jobs WHERE id=job_id FOR SHARE;
 IF NOT app_private.ingestion_lease(job_id,token) THEN RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 r:=app_worker.reserve_retrieval(j.policy_id,url);
 IF r->>'ticket' IS NOT NULL THEN UPDATE app_private.crawl_retrievals SET job_id=j.id,job_fence=token WHERE id=(r->>'ticket')::uuid;END IF;
 RETURN r;
END $fn$;
CREATE FUNCTION app_worker.latest_ingestion_capture(job_id uuid,token uuid) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
 SELECT CASE WHEN app_private.ingestion_lease(job_id,token) THEN COALESCE((SELECT jsonb_build_object('capture_id',r.id)
  FROM app_private.crawl_retrievals r WHERE r.job_id=latest_ingestion_capture.job_id AND r.job_fence=token AND r.completed_at IS NOT NULL
  AND r.http_status=200 AND r.error IS NULL AND r.content_type IN('text/html','application/pdf') ORDER BY r.completed_at DESC,r.id DESC LIMIT 1),jsonb_build_object('error','NOT_APPROVED'))
 ELSE jsonb_build_object('error','NOT_APPROVED') END
$fn$;
REVOKE ALL ON FUNCTION app_worker.enqueue_ingestion(uuid,text,text,uuid),app_worker.claim_ingestion(),app_worker.heartbeat_ingestion(uuid,uuid),app_worker.reserve_ingestion(uuid,uuid,text),app_worker.latest_ingestion_capture(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_worker.enqueue_ingestion(uuid,text,text,uuid),app_worker.claim_ingestion(),app_worker.heartbeat_ingestion(uuid,uuid),app_worker.reserve_ingestion(uuid,uuid,text),app_worker.latest_ingestion_capture(uuid,uuid) TO askbd_worker;
