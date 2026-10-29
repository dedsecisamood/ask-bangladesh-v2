-- P38: reuse independently reviewed curated claims, not model self-verification.
-- Read-only bounded decision projection; no raw claim/reviewer records granted.
CREATE FUNCTION app_public.answer_support(requests jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog SET statement_timeout='3s' AS $f$
DECLARE item jsonb; ev jsonb; approved boolean; result jsonb := '[]';
BEGIN
 IF requests IS NULL OR jsonb_typeof(requests)<>'array' OR octet_length(requests::text)>400000
 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid support request'; END IF;
 IF jsonb_array_length(requests)>12 OR (SELECT count(DISTINCT x->>'key') FROM jsonb_array_elements(requests) x)<>jsonb_array_length(requests)
 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid support request'; END IF;
 FOR item IN SELECT * FROM jsonb_array_elements(requests) LOOP
  IF jsonb_typeof(item)<>'object' OR (SELECT array_agg(k ORDER BY k) FROM jsonb_object_keys(item) k) IS DISTINCT FROM ARRAY['evidence','key','language','text','type']
   OR jsonb_typeof(item->'text') IS DISTINCT FROM 'string' OR char_length(item->>'text') NOT BETWEEN 1 AND 2000
   OR jsonb_typeof(item->'key') IS DISTINCT FROM 'string' OR item->>'key' !~ '^[a-f0-9]{64}$'
   OR COALESCE(item->>'language','') NOT IN('bn','en','banglish') OR COALESCE(item->>'type','') NOT IN('general','procedure','fee','deadline','eligibility','documents')
   OR jsonb_typeof(item->'evidence') IS DISTINCT FROM 'array'
  THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid support request'; END IF;
  IF jsonb_array_length(item->'evidence') NOT BETWEEN 1 AND 4 OR
    (SELECT count(DISTINCT e->>'passage_id') FROM jsonb_array_elements(item->'evidence') e)<>jsonb_array_length(item->'evidence')
  THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid support request'; END IF;
  FOR ev IN SELECT * FROM jsonb_array_elements(item->'evidence') LOOP
   IF jsonb_typeof(ev)<>'object' OR (SELECT array_agg(k ORDER BY k) FROM jsonb_object_keys(ev) k) IS DISTINCT FROM ARRAY['content_hash','passage_hash','passage_id','quote','version_id']
    OR COALESCE(ev->>'passage_id','') !~ '^[a-f0-9-]{36}$' OR COALESCE(ev->>'version_id','') !~ '^[a-f0-9-]{36}$'
    OR COALESCE(ev->>'passage_hash','') !~ '^[a-f0-9]{64}$' OR COALESCE(ev->>'content_hash','') !~ '^[a-f0-9]{64}$'
    OR jsonb_typeof(ev->'quote') IS DISTINCT FROM 'string' OR char_length(ev->>'quote') NOT BETWEEN 1 AND 16000
   THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid support request'; END IF;
  END LOOP;
  SELECT EXISTS(
   SELECT FROM app_private.service_claims c
   JOIN app_private.admin_memberships reviewer ON reviewer.id=c.reviewed_by AND reviewer.status='active' AND reviewer.role IN('owner','administrator','source_reviewer')
   JOIN app_private.public_service_metadata svc ON svc.id=c.service_id AND svc.locale=CASE WHEN item->>'language'='en' THEN 'en' ELSE 'bn' END
   WHERE app_private.claim_is_eligible(c.id) AND c.claim_text=item->>'text' AND c.language=item->>'language'
    AND c.claim_type=CASE item->>'type' WHEN 'general' THEN 'other' WHEN 'documents' THEN 'required_documents' ELSE item->>'type' END
    -- Scoped/applicant-specific claims require a later explicit applicability matcher.
    AND c.applicability='{}'::jsonb
    AND NOT EXISTS(
     SELECT FROM jsonb_array_elements(item->'evidence') e WHERE NOT EXISTS(
      SELECT FROM app_private.claim_evidence ce
      JOIN app_private.admin_memberships er ON er.id=ce.reviewed_by AND er.status='active' AND er.role IN('owner','administrator','source_reviewer')
      JOIN app_private.retrieval_candidates(CASE WHEN item->>'language'='en' THEN 'en' ELSE 'bn' END,c.service_id,NULL,NULL,NULL,ARRAY[(e->>'passage_id')::uuid]) r ON r.passage_id=ce.passage_id
      WHERE ce.claim_id=c.id AND ce.support_type='supports' AND ce.reviewed_at<=statement_timestamp() AND ce.reviewed_by<>c.created_by
       AND (item->>'type'='general' OR ce.reviewed_by<>c.reviewed_by)
       AND r.document_version_id=(e->>'version_id')::uuid AND r.evidence->>'passage_hash'=e->>'passage_hash'
       AND r.evidence->>'content_hash'=e->>'content_hash' AND strpos(r.evidence->>'text',e->>'quote')>0
     )
    )
  ) INTO approved;
  result:=result||jsonb_build_array(jsonb_build_object('key',item->>'key','supported',approved,'critical',approved AND item->>'type'<>'general'));
 END LOOP;
 RETURN result;
END $f$;
REVOKE ALL ON FUNCTION app_public.answer_support(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_public.answer_support(jsonb) TO askbd_web;
