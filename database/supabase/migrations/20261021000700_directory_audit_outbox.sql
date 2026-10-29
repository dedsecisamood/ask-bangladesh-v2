-- Review follow-up: the existing append-only staff audit doubles as a small
-- transactional metadata outbox. No worker/scheduler consumes it in Phase 4.
ALTER TABLE app_private.staff_audit_events ADD COLUMN outbox_topic text
  CHECK(outbox_topic IN ('directory_metadata_changed','source_link_review_requested'));
CREATE FUNCTION app_private.directory_audit_outbox() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $fn$
BEGIN
 NEW.outbox_topic:=CASE WHEN NEW.action LIKE 'directory_%' THEN 'directory_metadata_changed' WHEN NEW.action='link_check' THEN 'source_link_review_requested' END;
 RETURN NEW;
END $fn$;
REVOKE ALL ON FUNCTION app_private.directory_audit_outbox() FROM PUBLIC;
CREATE TRIGGER directory_audit_outbox BEFORE INSERT ON app_private.staff_audit_events FOR EACH ROW EXECUTE FUNCTION app_private.directory_audit_outbox();
