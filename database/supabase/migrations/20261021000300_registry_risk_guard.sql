-- A risk downgrade must not remove independent critical-source review.
-- Existing records conservatively require two reviewers when adopted.
ALTER TABLE app_private.sources
  ADD COLUMN registry_second_review_required boolean NOT NULL DEFAULT true;

CREATE FUNCTION app_private.registry_risk_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $fn$
BEGIN
  IF TG_OP='INSERT' THEN
    NEW.registry_second_review_required := NEW.risk_class='critical';
  ELSE
    NEW.registry_second_review_required := OLD.registry_second_review_required OR NEW.risk_class='critical';
  END IF;
  IF NEW.registry_created_by IS NOT NULL AND NEW.status='active'
    AND NEW.registry_second_review_required
    AND NEW.registry_activated_by=NEW.registry_approved_by THEN
    RAISE EXCEPTION USING ERRCODE='P1805';
  END IF;
  RETURN NEW;
END
$fn$;
REVOKE ALL ON FUNCTION app_private.registry_risk_guard() FROM PUBLIC;
CREATE TRIGGER registry_risk_guard BEFORE INSERT OR UPDATE ON app_private.sources
  FOR EACH ROW EXECUTE FUNCTION app_private.registry_risk_guard();
