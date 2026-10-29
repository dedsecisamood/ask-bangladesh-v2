-- P16: trusted BFF staff access, no browser grants or password storage.
DO $roles$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='askbd_staff') THEN
    CREATE ROLE askbd_staff NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
  ELSIF EXISTS (SELECT FROM pg_roles WHERE rolname='askbd_staff' AND
    (rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole OR rolreplication OR rolinherit
      OR EXISTS (SELECT FROM pg_auth_members WHERE member=pg_roles.oid))) THEN
    RAISE EXCEPTION 'Unsafe existing staff runtime role';
  END IF;
END $roles$;
CREATE SCHEMA app_staff;
REVOKE ALL ON SCHEMA app_staff FROM PUBLIC;
GRANT USAGE ON SCHEMA app_staff TO askbd_staff;
ALTER DEFAULT PRIVILEGES IN SCHEMA app_staff REVOKE ALL ON FUNCTIONS FROM PUBLIC;

CREATE TABLE app_private.admin_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE,
  role text NOT NULL CHECK(role IN ('owner','administrator','source_reviewer','auditor')),
  status text NOT NULL DEFAULT 'revoked' CHECK(status IN ('active','revoked')),
  revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT statement_timestamp()
);
CREATE TRIGGER touch_editorial BEFORE UPDATE ON app_private.admin_memberships
  FOR EACH ROW EXECUTE FUNCTION app_private.touch_editorial_record();
CREATE TABLE app_private.staff_sessions (
  auth_session_id uuid PRIMARY KEY,
  membership_id uuid NOT NULL REFERENCES app_private.admin_memberships(id) ON DELETE RESTRICT,
  membership_revision bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  last_seen_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  expires_at timestamptz NOT NULL DEFAULT statement_timestamp()+interval '12 hours',
  revoked_at timestamptz,
  CHECK(expires_at <= created_at+interval '12 hours')
);
CREATE INDEX staff_sessions_member_idx ON app_private.staff_sessions(membership_id);
CREATE TABLE app_private.staff_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id uuid REFERENCES app_private.admin_memberships(id) ON DELETE RESTRICT,
  action text NOT NULL CHECK(action IN ('provision','membership_change','session_open','session_revoke')),
  created_at timestamptz NOT NULL DEFAULT statement_timestamp()
);
CREATE TABLE app_private.staff_auth_budgets (
  window_start timestamptz PRIMARY KEY,
  attempts integer NOT NULL CHECK(attempts>0)
);
DO $security$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['admin_memberships','staff_sessions','staff_audit_events','staff_auth_budgets'] LOOP
    EXECUTE format('ALTER TABLE app_private.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('ALTER TABLE app_private.%I FORCE ROW LEVEL SECURITY',t);
    EXECUTE format('CREATE POLICY migration_owner ON app_private.%I TO postgres USING(true) WITH CHECK(true)',t);
    EXECUTE format('REVOKE ALL ON app_private.%I FROM PUBLIC,askbd_web,askbd_staff',t);
  END LOOP;
END $security$;
CREATE FUNCTION app_private.audit_membership() RETURNS trigger LANGUAGE plpgsql
SET search_path=pg_catalog AS $fn$
BEGIN
  INSERT INTO app_private.staff_audit_events(membership_id,action)
  VALUES(NEW.id,CASE WHEN TG_OP='INSERT' THEN 'provision' ELSE 'membership_change' END);
  RETURN NEW;
END $fn$;
REVOKE ALL ON FUNCTION app_private.audit_membership() FROM PUBLIC;
CREATE TRIGGER membership_audit AFTER INSERT OR UPDATE ON app_private.admin_memberships
FOR EACH ROW EXECUTE FUNCTION app_private.audit_membership();
CREATE FUNCTION app_private.keep_staff_audit() RETURNS trigger LANGUAGE plpgsql
SET search_path=pg_catalog AS $fn$ BEGIN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Staff audit is append only'; END $fn$;
REVOKE ALL ON FUNCTION app_private.keep_staff_audit() FROM PUBLIC;
CREATE TRIGGER staff_audit_immutable BEFORE UPDATE OR DELETE ON app_private.staff_audit_events
FOR EACH ROW EXECUTE FUNCTION app_private.keep_staff_audit();

-- Only the dedicated, server-held staff connection can call these narrow functions.
-- Subject/session IDs must come from online Supabase user and signed-claim validation.
CREATE FUNCTION app_staff.membership(subject uuid) RETURNS TABLE(id uuid,role text)
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
  SELECT m.id,m.role FROM app_private.admin_memberships m WHERE m.auth_user_id=subject AND m.status='active'
$fn$;
CREATE FUNCTION app_staff.consume_auth_budget() RETURNS boolean LANGUAGE plpgsql
SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE n integer;
BEGIN
  DELETE FROM app_private.staff_auth_budgets WHERE window_start < statement_timestamp()-interval '2 minutes';
  INSERT INTO app_private.staff_auth_budgets VALUES(date_trunc('minute',statement_timestamp()),1)
  ON CONFLICT(window_start) DO UPDATE SET attempts=app_private.staff_auth_budgets.attempts+1 RETURNING attempts INTO n;
  RETURN n<=30;
END $fn$;
CREATE FUNCTION app_staff.open_session(subject uuid,session uuid) RETURNS boolean LANGUAGE plpgsql
SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE m app_private.admin_memberships;
BEGIN
  SELECT * INTO m FROM app_private.admin_memberships WHERE auth_user_id=subject AND status='active' FOR SHARE;
  IF m.id IS NULL THEN RETURN false; END IF;
  INSERT INTO app_private.staff_sessions(auth_session_id,membership_id,membership_revision)
  VALUES(session,m.id,m.revision) ON CONFLICT DO NOTHING;
  IF FOUND THEN INSERT INTO app_private.staff_audit_events(membership_id,action) VALUES(m.id,'session_open'); END IF;
  RETURN EXISTS(SELECT FROM app_private.staff_sessions s WHERE s.auth_session_id=session AND s.membership_id=m.id
    AND s.membership_revision=m.revision AND s.revoked_at IS NULL AND s.expires_at>statement_timestamp()
    AND s.last_seen_at>statement_timestamp()-interval '30 minutes');
END $fn$;
CREATE FUNCTION app_staff.authorize(subject uuid,session uuid,capability text) RETURNS TABLE(id uuid,role text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
BEGIN
  RETURN QUERY WITH live AS (
    UPDATE app_private.staff_sessions s SET last_seen_at=statement_timestamp()
    FROM app_private.admin_memberships m WHERE m.id=s.membership_id AND m.auth_user_id=subject AND m.status='active'
      AND s.auth_session_id=session AND s.revoked_at IS NULL AND s.membership_revision=m.revision
      AND s.expires_at>statement_timestamp() AND s.last_seen_at>statement_timestamp()-interval '30 minutes'
      AND (capability='inspect' OR (capability='review' AND m.role IN ('owner','administrator','source_reviewer'))
        OR (capability='operate' AND m.role IN ('owner','administrator')) OR (capability='manage_roles' AND m.role='owner'))
    RETURNING m.id,m.role
  ) SELECT * FROM live;
END $fn$;
CREATE FUNCTION app_staff.revoke_session(subject uuid,session uuid) RETURNS void LANGUAGE plpgsql
SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE mid uuid;
BEGIN
  UPDATE app_private.staff_sessions s SET revoked_at=statement_timestamp()
  FROM app_private.admin_memberships m WHERE m.id=s.membership_id AND m.auth_user_id=subject
    AND s.auth_session_id=session AND s.revoked_at IS NULL RETURNING m.id INTO mid;
  IF mid IS NOT NULL THEN INSERT INTO app_private.staff_audit_events(membership_id,action) VALUES(mid,'session_revoke'); END IF;
END $fn$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app_staff FROM PUBLIC;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app_staff TO askbd_staff;
