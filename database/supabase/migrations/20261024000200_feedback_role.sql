-- Preserve separation between public directory reads and structured intake writes.
DO $roles$
BEGIN
 IF NOT EXISTS(SELECT FROM pg_catalog.pg_roles WHERE rolname='askbd_feedback') THEN
  CREATE ROLE askbd_feedback NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
 ELSIF EXISTS(SELECT FROM pg_catalog.pg_roles WHERE rolname='askbd_feedback' AND
  (rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole OR rolreplication OR rolinherit
   OR EXISTS(SELECT FROM pg_catalog.pg_auth_members WHERE member=pg_roles.oid))) THEN
  RAISE EXCEPTION 'Existing askbd_feedback role has unsafe privileges';
 END IF;
END $roles$;
REVOKE ALL ON FUNCTION app_public.submit_feedback(jsonb) FROM askbd_web;
GRANT USAGE ON SCHEMA app_public TO askbd_feedback;
GRANT EXECUTE ON FUNCTION app_public.submit_feedback(jsonb) TO askbd_feedback;
REVOKE ALL ON app_private.feedback FROM askbd_feedback;
