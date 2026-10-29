-- Only fenced, validated captures can produce private immutable derivatives.
CREATE FUNCTION app_worker.observe_ingestion(job_id uuid,token uuid,capture_id uuid) RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE j app_private.ingestion_jobs;r app_private.crawl_retrievals;d app_private.source_documents;v app_private.document_versions;
BEGIN
 SELECT * INTO j FROM app_private.ingestion_jobs WHERE id=job_id FOR UPDATE;
 SELECT * INTO r FROM app_private.crawl_retrievals WHERE id=capture_id;
 IF NOT app_private.ingestion_lease(job_id,token) OR r.job_id IS DISTINCT FROM j.id OR r.job_fence IS DISTINCT FROM token
  OR r.completed_at IS NULL OR r.error IS NOT NULL OR r.http_status<>200 OR r.content_hash IS NULL THEN RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 FOR d IN SELECT * FROM app_private.source_documents q WHERE q.source_id=j.source_id AND q.canonical_url IN(j.url,r.final_url) AND q.current_version_id IS NOT NULL FOR UPDATE LOOP
  SELECT * INTO v FROM app_private.document_versions WHERE id=d.current_version_id;
  IF v.content_hash<>r.content_hash OR d.canonical_url<>r.final_url THEN
   INSERT INTO app_private.source_checks(source_id,document_id,document_version_id,attempted_at,outcome,http_status,content_hash,final_url,origin_validated,mime_validated)
    VALUES(j.source_id,d.id,v.id,clock_timestamp(),'changed',200,r.content_hash,r.final_url,true,true);
   UPDATE app_private.source_documents SET approval_status='pending_review',current_version_id=NULL WHERE id=d.id;
  END IF;
 END LOOP;
 INSERT INTO app_private.ingestion_events(job_id,kind,generation) VALUES(j.id,'observed',j.generation);
 RETURN jsonb_build_object('observed',true);
END $fn$;

CREATE FUNCTION app_worker.complete_ingestion(job_id uuid,token uuid,capture_id uuid,payload jsonb) RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE j app_private.ingestion_jobs;r app_private.crawl_retrievals;d app_private.source_documents;v app_private.document_versions;
 item jsonb;flags jsonb;number integer;count_passages integer;raw_text text;start_at integer;end_at integer;version_uuid uuid;
 state_name text;extracted_key text;snapshot_key text;profile text;kind text;total_chars integer:=0;
BEGIN
 SELECT * INTO j FROM app_private.ingestion_jobs WHERE id=job_id FOR UPDATE;
 SELECT * INTO r FROM app_private.crawl_retrievals WHERE id=capture_id;
 IF NOT app_private.ingestion_lease(job_id,token) OR r.job_id IS DISTINCT FROM j.id OR r.job_fence IS DISTINCT FROM token
  OR r.policy_id IS DISTINCT FROM j.policy_id OR r.completed_at IS NULL OR r.error IS NOT NULL OR r.http_status<>200
  OR r.content_type NOT IN('text/html','application/pdf') OR r.content_hash IS NULL THEN RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 IF payload IS NULL OR jsonb_typeof(payload)<>'object' OR octet_length(payload::text)>2000000 OR
  EXISTS(SELECT FROM jsonb_object_keys(payload) k WHERE k NOT IN('title','media_type','content_hash','extraction_profile','snapshot_key','extracted_key','raw_text','passages','flags','extraction_method'))
  OR payload->>'media_type' IS DISTINCT FROM r.content_type OR payload->>'content_hash' IS DISTINCT FROM r.content_hash
  OR COALESCE(char_length(payload->>'title'),0) NOT BETWEEN 1 AND 500
  OR jsonb_typeof(payload->'passages') IS DISTINCT FROM 'array' OR jsonb_array_length(payload->'passages') NOT BETWEEN 1 AND 1000
  OR jsonb_typeof(payload->'flags') IS DISTINCT FROM 'array' OR octet_length((payload->'flags')::text)>4096
  OR COALESCE(char_length(payload->>'raw_text'),0) NOT BETWEEN 1 AND 250000 THEN RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 raw_text:=payload->>'raw_text';flags:=payload->'flags';profile:=payload->>'extraction_profile';
 extracted_key:=payload->>'extracted_key';snapshot_key:=payload->>'snapshot_key';kind:=payload->>'extraction_method';
 IF profile IS NULL OR profile !~ '^p5-[a-f0-9]{64}$' OR kind IS NULL OR kind NOT IN('html','pdf_text','ocr_bn')
  OR (r.content_type='text/html')<>(kind='html')
  OR snapshot_key IS DISTINCT FROM ('original/sha256/'||left(r.content_hash,2)||'/'||r.content_hash)
  OR extracted_key IS NULL OR extracted_key !~ '^derivative/sha256/[a-f0-9]{2}/[a-f0-9]{64}$' THEN RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(j.source_id::text||r.final_url,2702));
 SELECT * INTO d FROM app_private.source_documents q WHERE q.source_id=j.source_id AND q.canonical_url=r.final_url FOR UPDATE;
 IF d.id IS NULL THEN
  INSERT INTO app_private.source_documents(source_id,canonical_url,document_title,document_type,approval_status,risk_class)
   SELECT j.source_id,r.final_url,payload->>'title',CASE r.content_type WHEN 'text/html' THEN 'html' ELSE 'pdf' END,'pending_review',s.risk_class FROM app_private.sources s WHERE s.id=j.source_id RETURNING * INTO d;
 END IF;
 SELECT * INTO v FROM app_private.document_versions q WHERE q.source_document_id=d.id AND q.content_hash=r.content_hash AND q.extraction_profile=profile;
 IF v.id IS NOT NULL THEN
  -- Identical input/profile is idempotent; it may never silently rewrite locators.
  IF v.extracted_key IS DISTINCT FROM extracted_key THEN RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 ELSE
  SELECT COALESCE(max(q.version_number),0)+1 INTO number FROM app_private.document_versions q WHERE q.source_document_id=d.id;
  INSERT INTO app_private.document_versions(source_document_id,version_number,content_hash,extraction_profile,retrieved_at,extraction_status,extraction_method,
   snapshot_backend,snapshot_key,extracted_backend,extracted_key,supersedes_id,review_state,metadata)
  VALUES(d.id,number,r.content_hash,profile,r.retrieved_at,'succeeded',kind,'local_private',snapshot_key,'local_private',extracted_key,
   (SELECT q.id FROM app_private.document_versions q WHERE q.source_document_id=d.id ORDER BY q.version_number DESC LIMIT 1),
   'extracted',jsonb_build_object('quality_flags',flags,'capture_id',r.id,'schema','askbd-extraction-v1')) RETURNING * INTO v;
  count_passages:=0;
  FOR item IN SELECT value FROM jsonb_array_elements(payload->'passages') LOOP
   start_at:=(item->>'character_start')::integer;end_at:=(item->>'character_end')::integer;
   IF jsonb_typeof(item)<>'object' OR (item->>'ordinal')::integer<>count_passages OR start_at IS NULL OR end_at IS NULL
    OR start_at<0 OR end_at>char_length(raw_text) OR end_at<=start_at OR end_at-start_at>4000
    OR substring(raw_text FROM start_at+1 FOR end_at-start_at) IS DISTINCT FROM item->>'text'
    OR COALESCE(char_length(item->>'normalized_text'),0) NOT BETWEEN 1 AND 4000 OR item->>'quality_status' IS DISTINCT FROM 'pending'
    OR jsonb_typeof(item->'locator') IS DISTINCT FROM 'object' OR octet_length((item->'locator')::text)>4096
    OR (r.content_type='application/pdf' AND (item->>'page_number')::integer IS NULL)
    OR (r.content_type='text/html' AND item->>'page_number' IS NOT NULL) THEN RAISE EXCEPTION USING ERRCODE='P2701';END IF;
   total_chars:=total_chars+char_length(item->>'text');
   IF total_chars>250000 THEN RAISE EXCEPTION USING ERRCODE='P2701';END IF;
   INSERT INTO app_private.passages(document_version_id,ordinal,passage_text,normalized_text,heading,section_path,page_number,page_label,character_start,character_end,locator,language,extraction_quality_status)
   VALUES(v.id,count_passages,item->>'text',item->>'normalized_text',item->>'heading',
    ARRAY(SELECT jsonb_array_elements_text(item->'section_path')),(item->>'page_number')::integer,item->>'page_label',start_at,end_at,item->'locator',item->>'language','pending');
   count_passages:=count_passages+1;
  END LOOP;
  IF jsonb_array_length(flags)>0 THEN UPDATE app_private.document_versions SET review_state='needs_review' WHERE id=v.id;END IF;
  INSERT INTO app_private.ingestion_outbox(version_id,profile) VALUES(v.id,profile) ON CONFLICT DO NOTHING;
 END IF;
 -- A matching check is an acquisition observation; it grants no review/release.
 INSERT INTO app_private.source_checks(source_id,document_id,document_version_id,attempted_at,content_checked_at,outcome,http_status,content_hash,final_url,origin_validated,mime_validated)
 VALUES(j.source_id,d.id,v.id,clock_timestamp(),r.retrieved_at,'matched',200,r.content_hash,r.final_url,true,true);
 state_name:=CASE WHEN jsonb_array_length(flags)>0 THEN 'quarantined' ELSE 'completed' END;
 UPDATE app_private.ingestion_jobs SET state=state_name,version_id=v.id,finished_at=clock_timestamp(),lease_token=NULL,leased_until=NULL WHERE id=j.id;
 UPDATE app_private.ingestion_targets SET last_success_at=clock_timestamp(),failure_streak=0,
  next_due_at=clock_timestamp()+make_interval(secs=>CASE (SELECT risk_class FROM app_private.sources WHERE id=j.source_id) WHEN 'critical' THEN (SELECT critical_interval_seconds FROM app_private.ingestion_controls WHERE singleton) ELSE (SELECT general_interval_seconds FROM app_private.ingestion_controls WHERE singleton) END)
  WHERE source_id=j.source_id AND url=j.url;
 INSERT INTO app_private.ingestion_events(job_id,kind,generation) VALUES(j.id,state_name,j.generation);
 RETURN jsonb_build_object('version_id',v.id,'state',state_name);
EXCEPTION WHEN SQLSTATE 'P2701' OR check_violation OR not_null_violation OR invalid_text_representation OR numeric_value_out_of_range OR foreign_key_violation THEN
 RETURN jsonb_build_object('error','NOT_APPROVED');
END $fn$;
REVOKE ALL ON FUNCTION app_worker.observe_ingestion(uuid,uuid,uuid),app_worker.complete_ingestion(uuid,uuid,uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_worker.observe_ingestion(uuid,uuid,uuid),app_worker.complete_ingestion(uuid,uuid,uuid,jsonb) TO askbd_worker;
