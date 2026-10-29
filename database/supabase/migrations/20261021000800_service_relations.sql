-- Service detail relationships must not disappear beyond the first option page.
CREATE FUNCTION app_public.service_relations(service uuid,locale text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $fn$
 SELECT jsonb_build_object(
  'categories',COALESCE((SELECT jsonb_agg(c.data ORDER BY c.id) FROM app_private.service_categories sc JOIN app_private.public_category_metadata c ON c.id=sc.category_id AND c.locale=service_relations.locale WHERE sc.service_id=service),'[]'::jsonb),
  'agencies',COALESCE((SELECT jsonb_agg(a.data ORDER BY a.id) FROM app_private.service_agencies sa JOIN app_private.public_agency_metadata a ON a.id=sa.agency_id AND a.locale=service_relations.locale WHERE sa.service_id=service AND sa.review_state='reviewed'),'[]'::jsonb),
  'sources',COALESCE((SELECT jsonb_agg(s.data ORDER BY s.id) FROM app_private.service_sources ss JOIN app_private.public_source_metadata s ON s.id=ss.source_id AND s.locale=service_relations.locale WHERE ss.service_id=service),'[]'::jsonb))
 WHERE locale IN ('bn','en') AND EXISTS(SELECT FROM app_private.public_service_metadata s WHERE s.id=service AND s.locale=service_relations.locale)
$fn$;
REVOKE ALL ON FUNCTION app_public.service_relations(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_public.service_relations(uuid,text) TO askbd_web;
