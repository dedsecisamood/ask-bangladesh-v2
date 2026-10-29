-- P30-P34: exact eligible vectors, explicit profile approvals and delivery recheck.
-- Neither a model profile nor this migration enables an inference service.
DO $role$ BEGIN
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='askbd_embedder') THEN
  CREATE ROLE askbd_embedder NOLOGIN NOINHERIT NOBYPASSRLS;
 END IF;
END $role$;
GRANT USAGE ON SCHEMA app_public TO askbd_embedder;

CREATE TABLE app_private.embedding_profile_approvals (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 profile_id uuid NOT NULL REFERENCES app_private.embedding_profiles(id) ON DELETE RESTRICT,
 enabled boolean NOT NULL DEFAULT false,
 approved_by uuid NOT NULL REFERENCES app_private.admin_memberships(id) ON DELETE RESTRICT,
 approver_revision bigint NOT NULL,
 approved_at timestamptz NOT NULL DEFAULT statement_timestamp(),
 note text NOT NULL CHECK(char_length(btrim(note)) BETWEEN 1 AND 2000)
);
CREATE INDEX embedding_profile_approvals_latest ON app_private.embedding_profile_approvals(profile_id,id DESC);
ALTER TABLE app_private.embedding_profile_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.embedding_profile_approvals FORCE ROW LEVEL SECURITY;
CREATE POLICY migration_owner ON app_private.embedding_profile_approvals TO postgres USING(true) WITH CHECK(true);
CREATE FUNCTION app_private.guard_embedding_approval() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $f$
BEGIN
 SELECT revision INTO NEW.approver_revision FROM app_private.admin_memberships WHERE id=NEW.approved_by AND status='active' AND role IN('owner','administrator');
 IF NEW.approver_revision IS NULL OR NEW.approved_at>statement_timestamp() THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Active operator approval required'; END IF;
 RETURN NEW;
END $f$;
CREATE TRIGGER embedding_approval_actor BEFORE INSERT ON app_private.embedding_profile_approvals FOR EACH ROW EXECUTE FUNCTION app_private.guard_embedding_approval();
CREATE TRIGGER immutable_profile_approval BEFORE UPDATE OR DELETE ON app_private.embedding_profile_approvals FOR EACH ROW EXECUTE FUNCTION app_private.evidence_immutable();
REVOKE ALL ON app_private.embedding_profile_approvals FROM PUBLIC,askbd_web,askbd_staff,askbd_embedder,anon,authenticated,service_role;

-- Immutable compatibility identities; there are deliberately NO approval rows.
INSERT INTO app_private.embedding_profiles(id,provider_key,model_id,model_revision,dimensions,metric,normalization,tokenizer_revision) VALUES
 ('30000000-0000-4000-8000-000000000001','transformersjs-4.3.1-cpu-q8-mean-v1','Xenova/multilingual-e5-small','761b726dd34fb83930e26aab4e9ac3899aa1fa78',384,'cosine','l2_unit','0b44a9d7b51c3c62626640cda0e2c2f70fdacdc25bbbd68038369d14ebdf4c39;max512;e5-prefix-v1'),
 ('30000000-0000-4000-8000-000000000002','transformersjs-4.3.1-cpu-q8-mean-v1','Xenova/paraphrase-multilingual-MiniLM-L12-v2','2c4055b12046f11709e9df2c122e59ffbdc2f900',384,'cosine','l2_unit','b60b6b43406a48bf3638526314f3d232d97058bc93472ff2de930d43686fa441;max128;no-prefix-v1');

CREATE FUNCTION app_private.embedding_profile_enabled(profile uuid) RETURNS boolean LANGUAGE sql STABLE SET search_path=pg_catalog AS $f$
 SELECT COALESCE((SELECT a.enabled AND a.approved_at<=statement_timestamp() AND m.status='active' AND m.revision=a.approver_revision AND m.role IN('owner','administrator')
 FROM app_private.embedding_profile_approvals a JOIN app_private.admin_memberships m ON m.id=a.approved_by
 WHERE a.profile_id=$1 ORDER BY a.id DESC LIMIT 1),false)
$f$;

CREATE FUNCTION app_public.embedding_profile_authorized(profile uuid,model_revision text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $f$
 SELECT EXISTS(SELECT FROM app_private.embedding_profiles e WHERE e.id=$1 AND e.model_revision=$2 AND e.metric='cosine' AND e.normalization='l2_unit' AND app_private.embedding_profile_enabled(e.id))
$f$;

-- Shared reviewed projection. Never returns storage keys, review notes or vectors.
CREATE FUNCTION app_private.retrieval_candidates(locale text,service_filter uuid DEFAULT NULL,agency_filter uuid DEFAULT NULL,source_filter uuid DEFAULT NULL,language_filter text DEFAULT NULL,passage_ids uuid[] DEFAULT NULL)
RETURNS TABLE(passage_id uuid,document_version_id uuid,source_id uuid,document_id uuid,evidence jsonb)
LANGUAGE sql STABLE SET search_path=pg_catalog AS $f$
 SELECT p.id,p.document_version_id,s.id,d.id,jsonb_build_object(
 'passage_id',p.id,'document_id',d.id,'document_version_id',v.id,'source_id',s.id,'agency_id',s.agency_id,
 'source_url',d.canonical_url,'document_title',d.document_title,'document_type',d.document_type,'text',p.passage_text,'language',p.language,
 'heading',p.heading,'section_path',p.section_path,'page_number',p.page_number,'page_label',p.page_label,'character_start',p.character_start,'character_end',p.character_end,
 'content_hash',v.content_hash,'passage_hash',p.content_hash,'extraction_profile',v.extraction_profile,
 'published_at',v.published_at,'effective_from',v.effective_from,'effective_to',v.effective_to,
 'ownership_verified_at',ps.data->>'ownership_verified_at','document_reviewed_at',v.reviewed_at,
 'content_checked_at',(SELECT sc.content_checked_at FROM app_private.source_checks sc WHERE sc.document_id=d.id ORDER BY sc.attempted_at DESC,(sc.outcome='matched') ASC,sc.id DESC LIMIT 1),
 'score',0,'signals',jsonb_build_object('token_coverage',0,'exact_phrase',false,'heading_coverage',0,'title_coverage',0),'content_trust','untrusted_data')
 FROM app_private.passages p JOIN app_private.document_versions v ON v.id=p.document_version_id
 JOIN app_private.source_documents d ON d.id=v.source_document_id JOIN app_private.sources s ON s.id=d.source_id
 JOIN app_private.public_source_metadata ps ON ps.id=s.id AND ps.locale=$1
 JOIN app_private.admin_memberships reviewer ON reviewer.id=v.reviewed_by AND reviewer.status='active' AND reviewer.role IN('owner','administrator','source_reviewer')
 WHERE app_private.passage_is_eligible(p.id)
 AND NOT(COALESCE(v.metadata->'quality_flags','[]'::jsonb) ?| ARRAY['possible_personal_data','instruction_like_content','corrupt_text','low_ocr_confidence'])
 AND ($2 IS NULL OR EXISTS(SELECT FROM app_private.service_sources ss JOIN app_private.public_service_metadata svc ON svc.id=ss.service_id AND svc.locale=$1 WHERE ss.source_id=s.id AND ss.service_id=$2))
 AND ($3 IS NULL OR s.agency_id=$3) AND ($4 IS NULL OR s.id=$4) AND ($5 IS NULL OR p.language=$5) AND ($6 IS NULL OR p.id=ANY($6))
 AND NOT EXISTS(SELECT FROM app_private.source_conflicts conflict JOIN app_private.service_sources ss ON ss.service_id=conflict.service_id WHERE ss.source_id=s.id AND conflict.state IN('open','under_review'))
$f$;

CREATE FUNCTION app_public.semantic_search(profile uuid,model_revision text,query_vector text,locale text DEFAULT 'bn',page_limit integer DEFAULT 20,service_filter uuid DEFAULT NULL,agency_filter uuid DEFAULT NULL,source_filter uuid DEFAULT NULL,language_filter text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog SET statement_timeout='3s' AS $f$
DECLARE v extensions.vector; dim integer; result jsonb;
BEGIN
 IF locale IS NULL OR locale NOT IN('bn','en') OR page_limit IS NULL OR page_limit NOT BETWEEN 1 AND 50 OR query_vector IS NULL OR octet_length(query_vector)>100000
 OR (language_filter IS NOT NULL AND language_filter NOT IN('bn','en','banglish','mixed','unknown')) THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid semantic request'; END IF;
 IF NOT app_private.embedding_profile_enabled(profile) THEN RAISE EXCEPTION USING ERRCODE='55000',MESSAGE='Embedding profile unavailable'; END IF;
 SELECT ep.dimensions INTO dim FROM app_private.embedding_profiles ep WHERE ep.id=$1 AND ep.model_revision=$2 AND ep.metric='cosine' AND ep.normalization='l2_unit';
 v:=query_vector::extensions.vector;
 IF dim IS NULL OR extensions.vector_dims(v)<>dim OR abs(extensions.vector_norm(v)-1)>0.001 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Incompatible query vector'; END IF;
 -- Exact cosine over an eligibility-filtered materialized set; no ANN recall loss.
 WITH eligible AS MATERIALIZED(SELECT * FROM app_private.retrieval_candidates(locale,service_filter,agency_filter,source_filter,language_filter)),
 ranked AS(SELECT r.evidence,r.passage_id,1-(e.vector_data OPERATOR(extensions.<=>) v) similarity FROM eligible r JOIN app_private.passage_embeddings e ON e.passage_id=r.passage_id AND e.profile_id=profile AND e.indexing_status='indexed' ORDER BY e.vector_data OPERATOR(extensions.<=>) v,r.passage_id LIMIT page_limit)
 SELECT COALESCE(jsonb_agg(jsonb_build_object('evidence',evidence,'similarity',greatest(-1,least(1,similarity))) ORDER BY similarity DESC,passage_id),'[]') INTO result FROM ranked;
 RETURN jsonb_build_object('items',result,'profile_id',profile,'model_revision',model_revision,'generation',(SELECT generation::text FROM app_private.publication_state),'evaluated_at',statement_timestamp());
END $f$;

CREATE FUNCTION app_public.embedding_batch(profile uuid,locale text DEFAULT 'bn',page_limit integer DEFAULT 8)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog SET statement_timeout='3s' AS $f$
DECLARE data jsonb;
BEGIN
 IF locale IS NULL OR locale NOT IN('bn','en') OR page_limit IS NULL OR page_limit NOT BETWEEN 1 AND 8 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid embedding batch'; END IF;
 IF NOT app_private.embedding_profile_enabled(profile) THEN RAISE EXCEPTION USING ERRCODE='55000',MESSAGE='Embedding profile unavailable'; END IF;
 SELECT COALESCE(jsonb_agg(jsonb_build_object('passage_id',passage_id,'passage_hash',evidence->>'passage_hash','text',evidence->>'text') ORDER BY passage_id),'[]') INTO data
 FROM(SELECT r.* FROM app_private.retrieval_candidates(locale) r WHERE NOT EXISTS(SELECT FROM app_private.passage_embeddings e WHERE e.passage_id=r.passage_id AND e.profile_id=profile) ORDER BY r.passage_id LIMIT page_limit) b;
 RETURN jsonb_build_object('items',data,'profile_id',profile);
END $f$;

CREATE FUNCTION app_public.store_embeddings(profile uuid,model_revision text,locale text,entries jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog SET statement_timeout='3s' AS $f$
DECLARE item jsonb; dim integer; v extensions.vector; n integer:=0; inserted integer;
BEGIN
 IF locale IS NULL OR locale NOT IN('bn','en') OR entries IS NULL OR jsonb_typeof(entries)<>'array' OR jsonb_array_length(entries) NOT BETWEEN 1 AND 8 OR octet_length(entries::text)>200000 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid embedding commit'; END IF;
 IF NOT app_private.embedding_profile_enabled(profile) THEN RAISE EXCEPTION USING ERRCODE='55000',MESSAGE='Embedding profile unavailable'; END IF;
 SELECT ep.dimensions INTO dim FROM app_private.embedding_profiles ep WHERE ep.id=$1 AND ep.model_revision=$2 AND ep.metric='cosine' AND ep.normalization='l2_unit';
 IF dim IS NULL OR (SELECT count(DISTINCT x->>'passage_id') FROM jsonb_array_elements(entries) x)<>jsonb_array_length(entries) THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Incompatible embedding batch'; END IF;
 FOR item IN SELECT * FROM jsonb_array_elements(entries) LOOP
  IF jsonb_typeof(item)<>'object' OR (SELECT array_agg(k ORDER BY k) FROM jsonb_object_keys(item) k)<>ARRAY['passage_hash','passage_id','vector'] OR jsonb_typeof(item->'vector')<>'array'
   OR NOT EXISTS(SELECT FROM app_private.retrieval_candidates(locale,NULL,NULL,NULL,NULL,ARRAY[(item->>'passage_id')::uuid]) r WHERE r.evidence->>'passage_hash'=item->>'passage_hash') THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Passage no longer eligible'; END IF;
  v:=(item->'vector')::text::extensions.vector;
  IF extensions.vector_dims(v)<>dim OR abs(extensions.vector_norm(v)-1)>0.001 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Incompatible passage vector'; END IF;
  INSERT INTO app_private.passage_embeddings(passage_id,profile_id,embedding_dimension,vector_data,indexing_status) VALUES((item->>'passage_id')::uuid,profile,dim,v,'indexed') ON CONFLICT(passage_id,profile_id) DO NOTHING;
  GET DIAGNOSTICS inserted=ROW_COUNT; n:=n+inserted;
 END LOOP;
 RETURN n;
END $f$;

CREATE FUNCTION app_public.recheck_retrieval(passage_ids uuid[],locale text,service_filter uuid DEFAULT NULL,agency_filter uuid DEFAULT NULL,source_filter uuid DEFAULT NULL,language_filter text DEFAULT NULL,profile uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog SET statement_timeout='3s' AS $f$
DECLARE data jsonb; conflict_hold boolean;
BEGIN
 IF passage_ids IS NULL OR cardinality(passage_ids)>100 OR locale IS NULL OR locale NOT IN('bn','en') OR (language_filter IS NOT NULL AND language_filter NOT IN('bn','en','banglish','mixed','unknown')) THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid retrieval recheck'; END IF;
 IF profile IS NOT NULL AND NOT app_private.embedding_profile_enabled(profile) THEN RAISE EXCEPTION USING ERRCODE='55000',MESSAGE='Embedding profile unavailable'; END IF;
 SELECT COALESCE(jsonb_agg(evidence ORDER BY passage_id),'[]') INTO data FROM app_private.retrieval_candidates(locale,service_filter,agency_filter,source_filter,language_filter,passage_ids);
 SELECT EXISTS(SELECT FROM app_private.source_conflicts c WHERE c.state IN('open','under_review') AND (c.service_id=service_filter OR EXISTS(SELECT FROM app_private.service_sources ss WHERE ss.service_id=c.service_id AND ss.source_id=source_filter))) INTO conflict_hold;
 RETURN jsonb_build_object('items',data,'generation',(SELECT generation::text FROM app_private.publication_state),'conflict_hold',conflict_hold,'evaluated_at',statement_timestamp());
END $f$;

CREATE FUNCTION app_public.routing_catalog(locale text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog SET statement_timeout='3s' AS $f$
DECLARE data jsonb;
BEGIN
 IF locale IS NULL OR locale NOT IN('bn','en') THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid routing locale'; END IF;
 SELECT COALESCE(jsonb_agg(jsonb_build_object('service_id',approved.id,'name',approved.data->>'name','aliases',approved.aliases) ORDER BY approved.id),'[]') INTO data
 FROM(SELECT s.id,s.data,COALESCE((SELECT jsonb_agg(jsonb_build_object('text',alias,'language',language) ORDER BY id) FROM(SELECT a.id,a.alias,a.language FROM app_private.service_aliases a WHERE a.service_id=s.id AND a.review_state='reviewed' ORDER BY a.id LIMIT 32) a),'[]') aliases FROM app_private.public_service_metadata s WHERE s.locale=$1 ORDER BY s.id LIMIT 200) approved;
 RETURN jsonb_build_object('items',data,'generation',(SELECT generation::text FROM app_private.publication_state));
END $f$;

REVOKE ALL ON FUNCTION app_private.embedding_profile_enabled(uuid),app_private.guard_embedding_approval(),app_private.retrieval_candidates(text,uuid,uuid,uuid,text,uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_public.embedding_profile_authorized(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_public.embedding_profile_authorized(uuid,text) TO askbd_web;
REVOKE ALL ON FUNCTION app_public.semantic_search(uuid,text,text,text,integer,uuid,uuid,uuid,text),app_public.embedding_batch(uuid,text,integer),app_public.store_embeddings(uuid,text,text,jsonb),app_public.recheck_retrieval(uuid[],text,uuid,uuid,uuid,text,uuid),app_public.routing_catalog(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_public.semantic_search(uuid,text,text,text,integer,uuid,uuid,uuid,text),app_public.recheck_retrieval(uuid[],text,uuid,uuid,uuid,text,uuid),app_public.routing_catalog(text) TO askbd_web;
GRANT EXECUTE ON FUNCTION app_public.embedding_batch(uuid,text,integer),app_public.store_embeddings(uuid,text,text,jsonb) TO askbd_embedder;
