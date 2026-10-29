-- P15 passage bytes/quality fields are immutable. Append human decisions instead
-- of weakening that identity guard or auto-marking worker output accepted.
CREATE TABLE app_private.passage_reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), passage_id uuid NOT NULL REFERENCES app_private.passages(id),
 reviewer_id uuid NOT NULL REFERENCES app_private.admin_memberships(id), reviewer_revision bigint NOT NULL,
 status text NOT NULL CHECK(status IN('approved','rejected')), proof jsonb, reason text NOT NULL CHECK(char_length(reason) BETWEEN 1 AND 2000),
 reviewed_at timestamptz NOT NULL DEFAULT statement_timestamp(),expires_at timestamptz,
 CHECK(status<>'approved' OR (app_private.registry_proof_valid(proof) AND expires_at>reviewed_at))
);
CREATE INDEX passage_reviews_latest ON app_private.passage_reviews(passage_id,reviewed_at DESC,id);
ALTER TABLE app_private.passage_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.passage_reviews FORCE ROW LEVEL SECURITY;
CREATE POLICY migration_owner ON app_private.passage_reviews TO postgres USING(true) WITH CHECK(true);
REVOKE ALL ON app_private.passage_reviews FROM PUBLIC,askbd_web,askbd_staff,askbd_worker;
CREATE TRIGGER immutable_passage_review BEFORE UPDATE OR DELETE ON app_private.passage_reviews FOR EACH ROW EXECUTE FUNCTION app_private.evidence_immutable();

CREATE OR REPLACE FUNCTION app_private.passage_is_eligible(passage_id uuid) RETURNS boolean LANGUAGE sql STABLE SET search_path=pg_catalog AS $fn$
 SELECT EXISTS(SELECT FROM app_private.passages p JOIN app_private.document_versions v ON v.id=p.document_version_id
  JOIN app_private.source_documents d ON d.id=v.source_document_id
  LEFT JOIN LATERAL(SELECT * FROM app_private.passage_reviews pr WHERE pr.passage_id=p.id ORDER BY pr.reviewed_at DESC,(pr.status='approved') ASC,pr.id DESC LIMIT 1) pr ON true
  WHERE p.id=passage_id AND app_private.version_is_eligible(v.id) AND d.current_version_id=v.id
   AND ((d.document_type='pdf' AND p.page_number IS NOT NULL) OR (d.document_type<>'pdf' AND p.character_start IS NOT NULL))
   AND CASE WHEN pr.id IS NULL THEN p.extraction_quality_status='accepted' ELSE
    pr.status='approved' AND pr.reviewer_id=v.reviewed_by AND pr.expires_at>statement_timestamp()
    AND EXISTS(SELECT FROM app_private.admin_memberships m WHERE m.id=pr.reviewer_id AND m.status='active' AND m.revision=pr.reviewer_revision AND m.role IN('owner','administrator','source_reviewer')) END)
$fn$;

CREATE FUNCTION app_staff.review_ingestion(subject uuid,session uuid,token_hash text,version_id uuid,expected_revision bigint,action text,proof jsonb,reviewed_flags text[],reason text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE actor app_private.admin_memberships;v app_private.document_versions;d app_private.source_documents;s app_private.sources;pid uuid;expiry timestamptz;
BEGIN
 SELECT * INTO actor FROM app_private.admin_memberships WHERE auth_user_id=subject FOR SHARE;
 IF actor.id IS NULL OR NOT EXISTS(SELECT FROM app_staff.authorize_bound(subject,session,'review',token_hash))
  OR NOT EXISTS(SELECT FROM app_private.staff_sessions WHERE auth_session_id=session AND created_at>statement_timestamp()-interval '5 minutes')
  OR action IS NULL OR action NOT IN('approve','reject','revoke') OR COALESCE(char_length(btrim(reason)),0) NOT BETWEEN 1 AND 2000 THEN RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 SELECT * INTO v FROM app_private.document_versions WHERE id=version_id FOR UPDATE;
 SELECT * INTO d FROM app_private.source_documents WHERE id=v.source_document_id FOR UPDATE;
 SELECT * INTO s FROM app_private.sources WHERE id=d.source_id FOR SHARE;
 IF v.id IS NULL OR v.revision IS DISTINCT FROM expected_revision OR s.is_synthetic OR d.is_synthetic
  OR actor.id IN(s.registry_created_by,s.registry_edited_by,s.registry_submitted_by) OR v.metadata->>'schema' IS DISTINCT FROM 'askbd-extraction-v1'
 THEN RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
 IF action='approve' THEN
  IF v.review_state NOT IN('extracted','needs_review') OR NOT app_private.registry_proof_valid(proof) OR s.status<>'active'
   OR NOT app_private.registry_public_eligible(s.id) OR reviewed_flags IS NULL
   OR (SELECT ARRAY(SELECT jsonb_array_elements_text(v.metadata->'quality_flags') ORDER BY 1)) IS DISTINCT FROM (SELECT ARRAY(SELECT unnest(reviewed_flags) ORDER BY 1))
   OR NOT EXISTS(SELECT FROM app_private.passages WHERE document_version_id=v.id)
  THEN RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
  expiry:=(proof->>'expires_at')::timestamptz;
  INSERT INTO app_private.passage_reviews(passage_id,reviewer_id,reviewer_revision,status,proof,reason,expires_at)
   SELECT p.id,actor.id,actor.revision,'approved',proof,reason,expiry FROM app_private.passages p WHERE p.document_version_id=v.id;
  INSERT INTO app_private.source_verifications(source_id,document_version_id,verification_type,status,method,evidence_ref,evidence_excerpt,reviewer_id,verified_at,expires_at)
   VALUES(s.id,v.id,'document_review','approved',proof->>'method',proof->>'evidence_ref',proof->>'excerpt',actor.id,statement_timestamp(),expiry);
  UPDATE app_private.source_documents SET current_version_id=NULL,approval_status='approved' WHERE id=d.id;
  UPDATE app_private.document_versions SET review_state='approved',reviewed_by=actor.id,reviewed_at=statement_timestamp(),review_note=reason,released_at=statement_timestamp() WHERE id=v.id;
  IF NOT app_private.version_is_eligible(v.id) THEN RAISE EXCEPTION USING ERRCODE='P2701';END IF;
  UPDATE app_private.source_documents SET current_version_id=v.id WHERE id=d.id;
  UPDATE app_private.ingestion_outbox SET state='ready' WHERE ingestion_outbox.version_id=v.id;
 ELSE
  IF action='reject' AND v.released_at IS NOT NULL THEN RETURN jsonb_build_object('error','NOT_APPROVED');END IF;
  UPDATE app_private.source_documents SET current_version_id=NULL,approval_status='suspended' WHERE id=d.id AND current_version_id=v.id;
  INSERT INTO app_private.passage_reviews(passage_id,reviewer_id,reviewer_revision,status,reason)
   SELECT p.id,actor.id,actor.revision,'rejected',reason FROM app_private.passages p WHERE p.document_version_id=v.id;
  INSERT INTO app_private.source_verifications(source_id,document_version_id,verification_type,status,method,evidence_ref,evidence_excerpt,reviewer_id,verified_at)
   VALUES(s.id,v.id,'document_review','rejected','Explicit human rejection/revocation','private:review-event',reason,actor.id,statement_timestamp());
  UPDATE app_private.document_versions SET review_state=CASE action WHEN 'reject' THEN 'rejected' ELSE 'revoked' END,reviewed_by=actor.id,reviewed_at=statement_timestamp(),review_note=reason WHERE id=v.id;
  UPDATE app_private.ingestion_outbox SET state='cancelled' WHERE ingestion_outbox.version_id=v.id;
 END IF;
 INSERT INTO app_private.staff_audit_events(membership_id,action,record_kind,record_id,record_revision,reason,evidence)
  VALUES(actor.id,'evidence_review','document_version',v.id,v.revision,reason,jsonb_build_object('decision',action,'proof',proof));
 RETURN jsonb_build_object('reviewed',true);
EXCEPTION WHEN SQLSTATE 'P2701' OR check_violation OR not_null_violation OR invalid_text_representation THEN RETURN jsonb_build_object('error','NOT_APPROVED');
END $fn$;
REVOKE ALL ON FUNCTION app_staff.review_ingestion(uuid,uuid,text,uuid,bigint,text,jsonb,text[],text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_staff.review_ingestion(uuid,uuid,text,uuid,bigint,text,jsonb,text[],text) TO askbd_staff;
