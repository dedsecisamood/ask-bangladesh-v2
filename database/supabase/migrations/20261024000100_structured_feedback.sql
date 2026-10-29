-- Minimal Phase 7 correction intake. No free text, citizen IDs, IPs or chat history.
CREATE TABLE app_private.feedback (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 category text NOT NULL CHECK(category IN('incorrect','outdated','missing_source','accessibility','other')),
 locale text NOT NULL CHECK(locale IN('bn','en')),
 page text CHECK(page IN('ask','services','sources','accessibility')),
 service_id uuid REFERENCES app_private.services(id) ON DELETE SET NULL,
 source_id uuid REFERENCES app_private.sources(id) ON DELETE SET NULL,
 state text NOT NULL DEFAULT 'pending' CHECK(state IN('pending','resolved')),
 created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
 expires_at timestamptz NOT NULL DEFAULT statement_timestamp()+interval '90 days',
 CHECK(expires_at>created_at AND expires_at<=created_at+interval '90 days')
);
ALTER TABLE app_private.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.feedback FORCE ROW LEVEL SECURITY;
REVOKE ALL ON app_private.feedback FROM PUBLIC,anon,authenticated,askbd_web,askbd_staff,askbd_embedder;
CREATE INDEX feedback_expiry_idx ON app_private.feedback(expires_at);

CREATE FUNCTION app_public.submit_feedback(payload jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE result uuid; service uuid; source uuid;
BEGIN
 IF jsonb_typeof(payload) IS DISTINCT FROM 'object' OR octet_length(payload::text)>2048
 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid feedback'; END IF;
 IF EXISTS(SELECT FROM jsonb_object_keys(payload) k WHERE k NOT IN('category','locale','page','service_id','source_id','consent'))
  OR payload->'consent' IS DISTINCT FROM 'true'::jsonb
  OR COALESCE(payload->>'category','') NOT IN('incorrect','outdated','missing_source','accessibility','other')
  OR COALESCE(payload->>'locale','') NOT IN('bn','en')
  OR (payload ? 'page' AND COALESCE(payload->>'page','') NOT IN('ask','services','sources','accessibility'))
 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid feedback'; END IF;
 BEGIN
  service:=CASE WHEN payload ? 'service_id' THEN (payload->>'service_id')::uuid END;
  source:=CASE WHEN payload ? 'source_id' THEN (payload->>'source_id')::uuid END;
 EXCEPTION WHEN invalid_text_representation THEN
  RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid feedback';
 END;
 IF (payload ? 'service_id' AND service IS NULL) OR (payload ? 'source_id' AND source IS NULL)
  OR (service IS NOT NULL AND NOT EXISTS(SELECT FROM app_private.public_service_metadata s WHERE s.id=service AND s.locale=payload->>'locale'))
  OR (source IS NOT NULL AND NOT EXISTS(SELECT FROM app_private.public_source_metadata s WHERE s.id=source AND s.locale=payload->>'locale'))
 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid feedback'; END IF;
 -- Serialize admission so concurrency cannot exceed the bounded queue. This lock
 -- grants no read/list/update capability to the public BFF role.
 PERFORM pg_advisory_xact_lock(240001,1);
 DELETE FROM app_private.feedback WHERE expires_at<=statement_timestamp();
 IF (SELECT count(*) FROM app_private.feedback)>=10000 THEN
  RAISE EXCEPTION USING ERRCODE='54000',MESSAGE='Feedback capacity unavailable';
 END IF;
 INSERT INTO app_private.feedback(category,locale,page,service_id,source_id)
 VALUES(payload->>'category',payload->>'locale',payload->>'page',service,source) RETURNING id INTO result;
 RETURN result;
END $fn$;
REVOKE ALL ON FUNCTION app_public.submit_feedback(jsonb) FROM PUBLIC,anon,authenticated,askbd_staff,askbd_embedder;
GRANT EXECUTE ON FUNCTION app_public.submit_feedback(jsonb) TO askbd_web;
