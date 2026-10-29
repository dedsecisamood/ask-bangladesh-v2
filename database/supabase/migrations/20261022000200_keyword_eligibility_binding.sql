-- P29 positive/mixed-corpus tests exposed parameter shadowing by pr.passage_id.
-- Bind the requested UUID explicitly; preserve every existing policy predicate.
CREATE OR REPLACE FUNCTION app_private.passage_is_eligible(passage_id uuid) RETURNS boolean LANGUAGE sql STABLE SET search_path=pg_catalog AS $fn$
 SELECT EXISTS(SELECT FROM app_private.passages p JOIN app_private.document_versions v ON v.id=p.document_version_id
  JOIN app_private.source_documents d ON d.id=v.source_document_id
  LEFT JOIN LATERAL(SELECT * FROM app_private.passage_reviews pr WHERE pr.passage_id=p.id ORDER BY pr.reviewed_at DESC,(pr.status='approved') ASC,pr.id DESC LIMIT 1) pr ON true
  WHERE p.id=$1 AND app_private.version_is_eligible(v.id) AND d.current_version_id=v.id
   AND ((d.document_type='pdf' AND p.page_number IS NOT NULL) OR (d.document_type<>'pdf' AND p.character_start IS NOT NULL))
   AND CASE WHEN pr.id IS NULL THEN p.extraction_quality_status='accepted' ELSE
    pr.status='approved' AND pr.reviewer_id=v.reviewed_by AND pr.expires_at>statement_timestamp()
    AND EXISTS(SELECT FROM app_private.admin_memberships m WHERE m.id=pr.reviewer_id AND m.status='active' AND m.revision=pr.reviewer_revision AND m.role IN('owner','administrator','source_reviewer')) END)
$fn$;
