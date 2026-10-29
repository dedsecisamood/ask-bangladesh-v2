-- P29: indexed lexical retrieval; no raw-table grants or public HTTP endpoint.
CREATE FUNCTION app_private.keyword_normalize(value text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path=pg_catalog AS $fn$
 SELECT btrim(regexp_replace(translate(normalize(value,NFC),
 'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),
 '[[:space:][:punct:]।॥“”‘’‐‑‒–—―]+',' ','g'))
$fn$;
CREATE FUNCTION app_private.keyword_vector(body text,heading text) RETURNS tsvector
LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path=pg_catalog AS $fn$
 SELECT to_tsvector('simple'::regconfig,app_private.keyword_normalize(COALESCE(body,'')||' '||COALESCE(heading,'')))
$fn$;
REVOKE ALL ON FUNCTION app_private.keyword_normalize(text),app_private.keyword_vector(text,text) FROM PUBLIC;
CREATE INDEX passages_keyword_gin ON app_private.passages USING gin(app_private.keyword_vector(normalized_text,heading));

CREATE FUNCTION app_public.keyword_search(query text,locale text DEFAULT 'bn',page_limit integer DEFAULT 10,page_offset integer DEFAULT 0,
 service_id uuid DEFAULT NULL,agency_id uuid DEFAULT NULL,source_id uuid DEFAULT NULL,language text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog SET statement_timeout='3s' AS $fn$
DECLARE term text;terms text[];search tsquery;data jsonb;more boolean;capped boolean;generation text;
BEGIN
 IF query IS NULL OR char_length(query) NOT BETWEEN 1 AND 256 OR octet_length(query)>1024
  OR query ~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]'
  OR locale IS NULL OR locale NOT IN('bn','en') OR page_limit IS NULL OR page_limit NOT BETWEEN 1 AND 50
  OR page_offset IS NULL OR page_offset NOT BETWEEN 0 AND 500
  OR (language IS NOT NULL AND language NOT IN('bn','en','banglish','mixed','unknown'))
 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid keyword request';END IF;
 term:=app_private.keyword_normalize(query);
 terms:=tsvector_to_array(to_tsvector('simple'::regconfig,term));
 IF cardinality(terms) NOT BETWEEN 1 AND 64 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid keyword request';END IF;
 -- These are literal lexemes emitted by PostgreSQL, never citizen tsquery syntax.
 SELECT string_agg(quote_literal(t),' | ')::tsquery INTO search FROM unnest(terms) t;
 WITH candidates AS MATERIALIZED (
  SELECT p.*,d.id document_id,d.canonical_url,d.document_title,d.document_type,s.id source_id,s.agency_id,
   v.content_hash version_hash,v.extraction_profile,v.published_at,v.effective_from,v.effective_to,v.reviewed_at,
   ps.data->>'ownership_verified_at' ownership_verified_at,
   (SELECT sc.content_checked_at FROM app_private.source_checks sc WHERE sc.document_id=d.id ORDER BY sc.attempted_at DESC,(sc.outcome='matched') ASC,sc.id DESC LIMIT 1) content_checked_at
  FROM app_private.passages p JOIN app_private.document_versions v ON v.id=p.document_version_id
  JOIN app_private.source_documents d ON d.id=v.source_document_id JOIN app_private.sources s ON s.id=d.source_id
  JOIN app_private.public_source_metadata ps ON ps.id=s.id AND ps.locale=keyword_search.locale
  JOIN app_private.admin_memberships reviewer ON reviewer.id=v.reviewed_by AND reviewer.status='active' AND reviewer.role IN('owner','administrator','source_reviewer')
  WHERE app_private.keyword_vector(p.normalized_text,p.heading) @@ search
   AND app_private.passage_is_eligible(p.id)
   AND NOT (COALESCE(v.metadata->'quality_flags','[]'::jsonb) ?| ARRAY['possible_personal_data','instruction_like_content','corrupt_text','low_ocr_confidence'])
   AND (keyword_search.source_id IS NULL OR s.id=keyword_search.source_id) AND (keyword_search.agency_id IS NULL OR s.agency_id=keyword_search.agency_id)
   AND (keyword_search.language IS NULL OR p.language=keyword_search.language)
   AND (keyword_search.service_id IS NULL OR EXISTS(SELECT FROM app_private.service_sources ss JOIN app_private.public_service_metadata svc ON svc.id=ss.service_id AND svc.locale=keyword_search.locale WHERE ss.source_id=s.id AND ss.service_id=keyword_search.service_id))
   AND NOT EXISTS(SELECT FROM app_private.source_conflicts conflict JOIN app_private.service_sources ss ON ss.service_id=conflict.service_id WHERE ss.source_id=s.id AND conflict.state IN('open','under_review'))
 ), signals AS (
  SELECT c.*,
   (SELECT count(*)::numeric/cardinality(terms) FROM unnest(terms) t WHERE t=ANY(tsvector_to_array(app_private.keyword_vector(c.normalized_text,c.heading)))) coverage,
   strpos(' '||app_private.keyword_normalize(c.normalized_text)||' ',' '||term||' ')>0 phrase,
   (SELECT count(*)::numeric/cardinality(terms) FROM unnest(terms) t WHERE t=ANY(tsvector_to_array(to_tsvector('simple',COALESCE(c.heading,''))))) heading_coverage,
   (SELECT count(*)::numeric/cardinality(terms) FROM unnest(terms) t WHERE t=ANY(tsvector_to_array(to_tsvector('simple',c.document_title)))) title_coverage
  FROM candidates c
 ), scored AS (
  SELECT s.*,round(0.70*coverage+0.15*phrase::integer+0.10*heading_coverage+0.05*title_coverage,6) score FROM signals s
 ), bounded AS MATERIALIZED (
  SELECT * FROM scored ORDER BY score DESC,id LIMIT page_limit+1 OFFSET page_offset
 ), visible AS (SELECT * FROM bounded ORDER BY score DESC,id LIMIT page_limit)
 SELECT COALESCE(jsonb_agg(jsonb_build_object(
  'passage_id',id,'document_id',document_id,'document_version_id',document_version_id,'source_id',visible.source_id,'agency_id',visible.agency_id,
  'source_url',canonical_url,'document_title',document_title,'document_type',document_type,'text',passage_text,'language',visible.language,
  'heading',heading,'section_path',section_path,'page_number',page_number,'page_label',page_label,
  'character_start',character_start,'character_end',character_end,
  'content_hash',version_hash,'passage_hash',content_hash,'extraction_profile',extraction_profile,
  'published_at',published_at,'effective_from',effective_from,'effective_to',effective_to,
  'ownership_verified_at',ownership_verified_at,'document_reviewed_at',reviewed_at,'content_checked_at',content_checked_at,
  'score',score,'signals',jsonb_build_object('token_coverage',coverage,'exact_phrase',phrase,'heading_coverage',heading_coverage,'title_coverage',title_coverage),
  'content_trust','untrusted_data') ORDER BY score DESC,id),'[]'::jsonb),
  (SELECT count(*)>page_limit AND page_offset+page_limit<=500 FROM bounded),
  (SELECT count(*)>page_limit AND page_offset+page_limit>500 FROM bounded)
 INTO data,more,capped FROM visible;
 SELECT p.generation::text INTO generation FROM app_private.publication_state p;
 RETURN jsonb_build_object('items',data,'normalized_query',term,'tokens',terms,'limit',page_limit,'offset',page_offset,
  'has_more',more,'next_offset',CASE WHEN more THEN page_offset+page_limit ELSE NULL END,'pagination_capped',capped,
  'generation',generation,'rank_version','p29-keyword-v1','policy_revision','p29-eligible-v1','evaluated_at',statement_timestamp());
END $fn$;
REVOKE ALL ON FUNCTION app_public.keyword_search(text,text,integer,integer,uuid,uuid,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_public.keyword_search(text,text,integer,integer,uuid,uuid,uuid,text) TO askbd_web;
