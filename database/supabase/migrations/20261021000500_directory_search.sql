-- P20: bounded reviewed metadata search. Query text is never stored.
CREATE FUNCTION app_private.directory_term(value text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path=pg_catalog AS $fn$
  SELECT lower(normalize(regexp_replace(btrim(value),'\s+',' ','g'),NFC))
$fn$;
REVOKE ALL ON FUNCTION app_private.directory_term(text) FROM PUBLIC;

-- Retain the original reviewed identity projection and add only eligible relations.
ALTER VIEW app_private.public_service_metadata RENAME TO public_service_metadata_base;
CREATE VIEW app_private.public_service_metadata AS
SELECT b.id,b.slug,b.locale,b.data || jsonb_build_object('source_ids',COALESCE((SELECT jsonb_agg(s.id ORDER BY s.id)
  FROM app_private.service_sources ss JOIN app_private.public_source_metadata s ON s.id=ss.source_id AND s.locale=b.locale WHERE ss.service_id=b.id),'[]'::jsonb)) data
FROM app_private.public_service_metadata_base b JOIN app_private.services record ON record.id=b.id
WHERE record.directory_created_by IS NULL OR (
  EXISTS(SELECT FROM app_private.public_category_metadata c WHERE c.id=record.primary_category_id AND c.locale=b.locale)
  AND EXISTS(SELECT FROM app_private.service_agencies sa JOIN app_private.public_agency_metadata a ON a.id=sa.agency_id AND a.locale=b.locale WHERE sa.service_id=b.id AND sa.review_state='reviewed' AND sa.relationship='responsible'));
REVOKE ALL ON app_private.public_service_metadata FROM PUBLIC,askbd_web,askbd_staff;

CREATE FUNCTION app_public.directory_search(kind text,locale text,after_id uuid DEFAULT NULL,page_limit integer DEFAULT 20,
  category text DEFAULT NULL,agency uuid DEFAULT NULL,lookup text DEFAULT NULL,query text DEFAULT '',service uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog SET statement_timeout='3s' AS $fn$
DECLARE items jsonb; generation text; last_id uuid; has_more boolean; term text:=app_private.directory_term(query);
BEGIN
  IF kind NOT IN ('agencies','categories','services','sources') OR locale NOT IN ('bn','en') OR page_limit NOT BETWEEN 1 AND 50
    OR query IS NULL OR char_length(query)>120 OR query ~ '[[:cntrl:]]' OR (kind<>'services' AND (category IS NOT NULL OR agency IS NOT NULL))
    OR (kind<>'sources' AND service IS NOT NULL) THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid directory request';END IF;
  WITH rows AS (
    SELECT a.id,a.slug,a.data FROM app_private.public_agency_metadata a WHERE kind='agencies' AND a.locale=directory_search.locale
    UNION ALL SELECT c.id,c.slug,c.data FROM app_private.public_category_metadata c WHERE kind='categories' AND c.locale=directory_search.locale
    UNION ALL SELECT s.id,s.slug,s.data FROM app_private.public_service_metadata s WHERE kind='services' AND s.locale=directory_search.locale
      AND (category IS NULL OR EXISTS(SELECT FROM app_private.service_categories sc JOIN app_private.public_category_metadata c ON c.id=sc.category_id AND c.locale=directory_search.locale WHERE sc.service_id=s.id AND c.slug=category))
      AND (agency IS NULL OR s.data->'agency_ids' @> to_jsonb(ARRAY[agency]))
    UNION ALL SELECT s.id,s.slug,s.data FROM app_private.public_source_metadata s WHERE kind='sources' AND s.locale=directory_search.locale
      AND (service IS NULL OR EXISTS(SELECT FROM app_private.service_sources ss JOIN app_private.public_service_metadata svc ON svc.id=ss.service_id AND svc.locale=directory_search.locale WHERE ss.source_id=s.id AND ss.service_id=service))
  ), matching AS (
    SELECT * FROM rows r WHERE term='' OR strpos(app_private.directory_term(r.data->>'name'),term)>0
      OR (kind='services' AND (
        EXISTS(SELECT FROM app_private.service_aliases a WHERE a.service_id=r.id AND a.review_state='reviewed' AND strpos(app_private.directory_term(a.alias),term)>0)
        OR EXISTS(SELECT FROM app_private.service_categories sc JOIN app_private.public_category_metadata c ON c.id=sc.category_id AND c.locale=directory_search.locale WHERE sc.service_id=r.id AND strpos(app_private.directory_term(c.data->>'name'),term)>0)
        OR EXISTS(SELECT FROM app_private.service_agencies sa JOIN app_private.public_agency_metadata a ON a.id=sa.agency_id AND a.locale=directory_search.locale WHERE sa.service_id=r.id AND sa.review_state='reviewed' AND strpos(app_private.directory_term(a.data->>'name'),term)>0)))
  ), bounded AS (
    SELECT * FROM matching WHERE (after_id IS NULL OR id>after_id) AND (lookup IS NULL OR CASE WHEN kind='sources' THEN id::text=lookup ELSE slug=lookup END) ORDER BY id LIMIT page_limit+1
  ), visible AS (SELECT * FROM bounded ORDER BY id LIMIT page_limit)
  SELECT COALESCE(jsonb_agg(data ORDER BY id),'[]'),(array_agg(id ORDER BY id DESC))[1],(SELECT count(*)>page_limit FROM bounded) INTO items,last_id,has_more FROM visible;
  SELECT p.generation::text INTO generation FROM app_private.publication_state p;
  RETURN jsonb_build_object('items',items,'after_id',CASE WHEN has_more THEN last_id ELSE NULL END,'generation',generation);
END $fn$;
REVOKE ALL ON FUNCTION app_public.directory_search(text,text,uuid,integer,text,uuid,text,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_public.directory_search(text,text,uuid,integer,text,uuid,text,text,uuid) TO askbd_web;
-- Existing GET clients retain the same contract and publication gates.
CREATE OR REPLACE FUNCTION app_public.directory(kind text,locale text,after_id uuid DEFAULT NULL,page_limit integer DEFAULT 20,category text DEFAULT NULL,agency uuid DEFAULT NULL,lookup text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
  SELECT app_public.directory_search(kind,locale,after_id,page_limit,category,agency,lookup)
$fn$;
