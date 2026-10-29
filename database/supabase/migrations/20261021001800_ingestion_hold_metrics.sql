-- Distinguish held targets from runnable due work without exposing source text.
CREATE OR REPLACE FUNCTION app_worker.ingestion_metrics() RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
 SELECT jsonb_build_object('paused',(SELECT paused FROM app_private.ingestion_controls WHERE singleton),
 'jobs',COALESCE((SELECT jsonb_object_agg(state,n) FROM(SELECT state,count(*) n FROM app_private.ingestion_jobs GROUP BY state) counts),'{}'),
 'expired_leases',(SELECT count(*) FROM app_private.ingestion_jobs WHERE state='running' AND leased_until<=clock_timestamp()),
 'oldest_ready_seconds',(SELECT GREATEST(0,extract(epoch FROM clock_timestamp()-min(available_at))) FROM app_private.ingestion_jobs WHERE state IN('queued','retry')),
 'due_targets',(SELECT count(*) FROM app_private.ingestion_targets WHERE NOT blocked AND next_due_at<=clock_timestamp()),
 'manual_holds',(SELECT count(*) FROM app_private.ingestion_targets WHERE blocked),
 'source_circuit_open',(SELECT count(*) FROM app_private.ingestion_targets WHERE failure_streak>=3),
 'pending_index_review',(SELECT count(*) FROM app_private.ingestion_outbox WHERE state='pending_review'),
 'failure_codes',COALESCE((SELECT jsonb_object_agg(error_code,n) FROM(SELECT error_code,count(*) n FROM app_private.ingestion_jobs WHERE error_code IS NOT NULL GROUP BY error_code LIMIT 100) counts),'{}'))
$fn$;
