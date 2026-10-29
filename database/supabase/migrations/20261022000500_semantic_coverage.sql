-- P31: missing vectors are incomplete retrieval, never an authentic empty corpus.
CREATE OR REPLACE FUNCTION app_public.semantic_search(profile uuid,model_revision text,query_vector text,locale text DEFAULT 'bn',page_limit integer DEFAULT 20,service_filter uuid DEFAULT NULL,agency_filter uuid DEFAULT NULL,source_filter uuid DEFAULT NULL,language_filter text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog SET statement_timeout='3s' AS $f$
DECLARE v extensions.vector; dim integer; result jsonb; eligible_count bigint; embedded_count bigint;
BEGIN
 IF locale IS NULL OR locale NOT IN('bn','en') OR page_limit IS NULL OR page_limit NOT BETWEEN 1 AND 50 OR query_vector IS NULL OR octet_length(query_vector)>100000
 OR (language_filter IS NOT NULL AND language_filter NOT IN('bn','en','banglish','mixed','unknown')) THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid semantic request'; END IF;
 IF NOT app_private.embedding_profile_enabled(profile) THEN RAISE EXCEPTION USING ERRCODE='55000',MESSAGE='Embedding profile unavailable'; END IF;
 SELECT ep.dimensions INTO dim FROM app_private.embedding_profiles ep WHERE ep.id=$1 AND ep.model_revision=$2 AND ep.metric='cosine' AND ep.normalization='l2_unit';
 v:=query_vector::extensions.vector;
 IF dim IS NULL OR extensions.vector_dims(v)<>dim OR abs(extensions.vector_norm(v)-1)>0.001 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Incompatible query vector'; END IF;
 -- Exact cosine over an eligibility-filtered materialized set; no ANN recall loss.
 WITH eligible AS MATERIALIZED(SELECT * FROM app_private.retrieval_candidates(locale,service_filter,agency_filter,source_filter,language_filter)),
 vectors AS MATERIALIZED(SELECT r.evidence,r.passage_id,e.vector_data FROM eligible r JOIN app_private.passage_embeddings e ON e.passage_id=r.passage_id AND e.profile_id=profile AND e.indexing_status='indexed'),
 ranked AS(SELECT evidence,passage_id,1-(vector_data OPERATOR(extensions.<=>) v) similarity FROM vectors ORDER BY vector_data OPERATOR(extensions.<=>) v,passage_id LIMIT page_limit)
 SELECT COALESCE(jsonb_agg(jsonb_build_object('evidence',evidence,'similarity',greatest(-1,least(1,similarity))) ORDER BY similarity DESC,passage_id),'[]'),(SELECT count(*) FROM eligible),(SELECT count(*) FROM vectors) INTO result,eligible_count,embedded_count FROM ranked;
 RETURN jsonb_build_object('coverage',jsonb_build_object('eligible',eligible_count,'embedded',embedded_count,'complete',eligible_count=embedded_count),'items',result,'profile_id',profile,'model_revision',model_revision,'generation',(SELECT generation::text FROM app_private.publication_state),'evaluated_at',statement_timestamp());
END $f$;

