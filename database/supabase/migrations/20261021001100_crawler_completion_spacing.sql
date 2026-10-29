-- P22 review: wait five seconds after completion too, so slow DNS/HTTP cannot
-- consume the spacing window. Sample admission time only after acquiring its lock.
CREATE OR REPLACE FUNCTION app_worker.reserve_retrieval(policy_id uuid,url text) RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE p app_private.crawl_policies;state app_private.crawl_network_state;data jsonb;new_ticket uuid;ts timestamptz;
BEGIN
 SELECT * INTO state FROM app_private.crawl_network_state WHERE singleton FOR UPDATE;
 ts:=clock_timestamp();
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

CREATE OR REPLACE FUNCTION app_worker.finish_retrieval(ticket uuid,payload jsonb) RETURNS jsonb
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
 UPDATE app_private.crawl_network_state SET ticket=NULL,leased_until=NULL,next_request_at=GREATEST(next_request_at,clock_timestamp()+interval '5 seconds') WHERE singleton AND crawl_network_state.ticket=r.id;
 RETURN jsonb_build_object('recorded',true);
EXCEPTION WHEN check_violation OR invalid_text_representation OR not_null_violation THEN
 RETURN jsonb_build_object('error','NOT_APPROVED');
END $fn$;
