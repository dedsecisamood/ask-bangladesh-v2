-- P32/P33: ambiguous supported-service questions must not hide known conflicts.
CREATE FUNCTION app_public.routing_conflict_hold(service_ids uuid[],locale text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog SET statement_timeout='3s' AS $f$
BEGIN
 IF service_ids IS NULL OR cardinality(service_ids)>200 OR locale IS NULL OR locale NOT IN('bn','en') THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid routing scope';END IF;
 RETURN EXISTS(SELECT FROM app_private.source_conflicts c JOIN app_private.public_service_metadata s ON s.id=c.service_id AND s.locale=$2 WHERE c.service_id=ANY($1) AND c.state IN('open','under_review'));
END $f$;
REVOKE ALL ON FUNCTION app_public.routing_conflict_hold(uuid[],text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_public.routing_conflict_hold(uuid[],text) TO askbd_web;
