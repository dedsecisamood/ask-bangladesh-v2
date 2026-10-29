-- Bind provider sessions to a separate random HttpOnly BFF cookie. Store hashes only.
ALTER TABLE app_private.staff_sessions ADD COLUMN bff_token_hash text UNIQUE CHECK(bff_token_hash ~ '^[a-f0-9]{64}$');
CREATE FUNCTION app_staff.open_bound_session(subject uuid,session uuid,token_hash text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
BEGIN
  IF token_hash IS NULL OR token_hash !~ '^[a-f0-9]{64}$' THEN RETURN false; END IF;
  IF NOT app_staff.open_session(subject,session) THEN RETURN false; END IF;
  UPDATE app_private.staff_sessions SET bff_token_hash=token_hash WHERE auth_session_id=session AND bff_token_hash IS NULL;
  RETURN EXISTS(SELECT FROM app_private.staff_sessions WHERE auth_session_id=session AND bff_token_hash=token_hash);
END $fn$;
CREATE FUNCTION app_staff.authorize_bound(subject uuid,session uuid,capability text,token_hash text) RETURNS TABLE(id uuid,role text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
BEGIN
  IF token_hash IS NULL OR NOT EXISTS(SELECT FROM app_private.staff_sessions s WHERE s.auth_session_id=session AND s.bff_token_hash=token_hash) THEN RETURN; END IF;
  RETURN QUERY SELECT * FROM app_staff.authorize(subject,session,capability);
END $fn$;
CREATE FUNCTION app_staff.logout_bound(token_hash text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE mid uuid;
BEGIN
  UPDATE app_private.staff_sessions s SET revoked_at=statement_timestamp() WHERE s.bff_token_hash=token_hash AND s.revoked_at IS NULL RETURNING s.membership_id INTO mid;
  IF mid IS NOT NULL THEN INSERT INTO app_private.staff_audit_events(membership_id,action) VALUES(mid,'session_revoke'); END IF;
END $fn$;
REVOKE ALL ON FUNCTION app_staff.open_session(uuid,uuid),app_staff.authorize(uuid,uuid,text),app_staff.revoke_session(uuid,uuid) FROM askbd_staff;
REVOKE ALL ON FUNCTION app_staff.open_bound_session(uuid,uuid,text),app_staff.authorize_bound(uuid,uuid,text,text),app_staff.logout_bound(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_staff.open_bound_session(uuid,uuid,text),app_staff.authorize_bound(uuid,uuid,text,text),app_staff.logout_bound(text) TO askbd_staff;
