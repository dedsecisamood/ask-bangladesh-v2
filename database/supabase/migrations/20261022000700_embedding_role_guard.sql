-- Match the existing web/staff fail-closed role policy for the new capability.
DO $guard$ BEGIN
 IF EXISTS(SELECT FROM pg_roles r WHERE r.rolname='askbd_embedder' AND
  (r.rolsuper OR r.rolbypassrls OR r.rolcreatedb OR r.rolcreaterole OR r.rolreplication OR r.rolinherit
   OR EXISTS(SELECT FROM pg_auth_members m WHERE m.member=r.oid))) THEN
  RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Unsafe embedding runtime role';
 END IF;
END $guard$;
