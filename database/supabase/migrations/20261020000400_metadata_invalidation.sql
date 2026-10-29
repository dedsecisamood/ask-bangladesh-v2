-- Relationship edits require renewed review; registered domains cannot be retargeted.
CREATE FUNCTION app_private.invalidate_service_relationship() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $fn$
BEGIN
  IF TG_OP<>'INSERT' THEN UPDATE app_private.services SET updated_at=statement_timestamp() WHERE id=OLD.service_id; END IF;
  IF TG_OP<>'DELETE' THEN UPDATE app_private.services SET updated_at=statement_timestamp() WHERE id=NEW.service_id; END IF;
  RETURN NULL;
END $fn$;
REVOKE ALL ON FUNCTION app_private.invalidate_service_relationship() FROM PUBLIC;
CREATE TRIGGER service_category_review AFTER INSERT OR UPDATE OR DELETE ON app_private.service_categories FOR EACH ROW EXECUTE FUNCTION app_private.invalidate_service_relationship();
CREATE TRIGGER service_agency_review AFTER INSERT OR UPDATE OR DELETE ON app_private.service_agencies FOR EACH ROW EXECUTE FUNCTION app_private.invalidate_service_relationship();
CREATE TRIGGER service_source_review AFTER INSERT OR UPDATE OR DELETE ON app_private.service_sources FOR EACH ROW EXECUTE FUNCTION app_private.invalidate_service_relationship();
CREATE FUNCTION app_private.domain_identity_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $fn$
BEGIN
  IF NEW.hostname IS DISTINCT FROM OLD.hostname AND EXISTS(SELECT FROM app_private.sources WHERE official_domain_id=OLD.id) THEN
    RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Referenced domain identity is immutable'; END IF;
  RETURN NEW;
END $fn$;
REVOKE ALL ON FUNCTION app_private.domain_identity_guard() FROM PUBLIC;
CREATE TRIGGER domain_provenance_identity BEFORE UPDATE ON app_private.official_domains FOR EACH ROW EXECUTE FUNCTION app_private.domain_identity_guard();
