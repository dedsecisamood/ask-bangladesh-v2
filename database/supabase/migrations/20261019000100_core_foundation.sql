-- SQL-first schema authority. No credentials, public projections or government data.
CREATE SCHEMA app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC;
DO $roles$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'askbd_web') THEN
    CREATE ROLE askbd_web NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
  ELSIF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'askbd_web'
    AND (rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole OR rolreplication OR rolinherit
      OR EXISTS (SELECT 1 FROM pg_catalog.pg_auth_members WHERE member = pg_roles.oid))) THEN
    RAISE EXCEPTION 'Existing askbd_web role has unsafe privileges';
  END IF;
END
$roles$;

CREATE TABLE app_private.agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (char_length(slug) BETWEEN 1 AND 120 AND slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  abbreviation text CHECK (char_length(abbreviation) BETWEEN 1 AND 80),
  parent_agency_id uuid REFERENCES app_private.agencies(id) ON DELETE RESTRICT,
  administrative_level text CHECK (administrative_level IN ('national','division','district','subdistrict','local','other')),
  status text NOT NULL DEFAULT 'candidate' CHECK (status IN ('candidate','verified','suspended','retired')),
  publication_status text NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft','in_review','published','withdrawn')),
  verification_method text CHECK (char_length(btrim(verification_method)) BETWEEN 1 AND 120),
  verification_evidence_ref text CHECK (char_length(btrim(verification_evidence_ref)) BETWEEN 1 AND 2048),
  verified_at timestamptz,
  is_synthetic boolean NOT NULL DEFAULT false,
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  CHECK (parent_agency_id IS DISTINCT FROM id),
  CHECK (status <> 'verified' OR (verified_at IS NOT NULL AND verification_method IS NOT NULL AND verification_evidence_ref IS NOT NULL AND NOT is_synthetic)),
  CHECK (publication_status <> 'published' OR (status = 'verified' AND NOT is_synthetic))
);
CREATE INDEX agencies_parent_idx ON app_private.agencies(parent_agency_id) WHERE parent_agency_id IS NOT NULL;
CREATE TABLE app_private.agency_translations (
  agency_id uuid NOT NULL REFERENCES app_private.agencies(id) ON DELETE CASCADE,
  locale text NOT NULL CHECK (locale IN ('bn','en')),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 240),
  description text CHECK (char_length(description) <= 4000),
  review_state text NOT NULL DEFAULT 'draft' CHECK (review_state IN ('draft','in_review','reviewed')),
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  PRIMARY KEY (agency_id, locale)
);
CREATE TABLE app_private.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (char_length(slug) BETWEEN 1 AND 120 AND slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  parent_category_id uuid REFERENCES app_private.categories(id) ON DELETE RESTRICT,
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order BETWEEN 0 AND 10000),
  publication_status text NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft','in_review','published','withdrawn')),
  is_synthetic boolean NOT NULL DEFAULT false,
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  CHECK (parent_category_id IS DISTINCT FROM id),
  CHECK (NOT is_synthetic OR publication_status <> 'published')
);
CREATE INDEX categories_parent_idx ON app_private.categories(parent_category_id) WHERE parent_category_id IS NOT NULL;
CREATE TABLE app_private.category_translations (
  category_id uuid NOT NULL REFERENCES app_private.categories(id) ON DELETE CASCADE,
  locale text NOT NULL CHECK (locale IN ('bn','en')),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 240),
  description text CHECK (char_length(description) <= 4000),
  review_state text NOT NULL DEFAULT 'draft' CHECK (review_state IN ('draft','in_review','reviewed')),
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  PRIMARY KEY (category_id, locale)
);
CREATE TABLE app_private.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (char_length(slug) BETWEEN 1 AND 120 AND slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  publication_status text NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft','in_review','published','withdrawn')),
  is_synthetic boolean NOT NULL DEFAULT false,
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  CHECK (NOT is_synthetic OR publication_status <> 'published')
);
CREATE TABLE app_private.service_translations (
  service_id uuid NOT NULL REFERENCES app_private.services(id) ON DELETE CASCADE,
  locale text NOT NULL CHECK (locale IN ('bn','en')),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 240),
  summary text CHECK (char_length(summary) <= 4000),
  review_state text NOT NULL DEFAULT 'draft' CHECK (review_state IN ('draft','in_review','reviewed')),
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  PRIMARY KEY (service_id, locale)
);
CREATE TABLE app_private.service_categories (
  service_id uuid NOT NULL REFERENCES app_private.services(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES app_private.categories(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  PRIMARY KEY (service_id, category_id)
);
CREATE INDEX service_categories_category_idx ON app_private.service_categories(category_id);
CREATE TABLE app_private.service_agencies (
  service_id uuid NOT NULL REFERENCES app_private.services(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES app_private.agencies(id) ON DELETE RESTRICT,
  relationship text NOT NULL DEFAULT 'responsible' CHECK (relationship IN ('responsible','supporting')),
  review_state text NOT NULL DEFAULT 'draft' CHECK (review_state IN ('draft','in_review','reviewed')),
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  PRIMARY KEY (service_id, agency_id, relationship)
);
CREATE INDEX service_agencies_agency_idx ON app_private.service_agencies(agency_id);
CREATE TABLE app_private.service_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES app_private.services(id) ON DELETE CASCADE,
  alias text NOT NULL CHECK (char_length(btrim(alias)) BETWEEN 1 AND 200),
  normalized_alias text GENERATED ALWAYS AS (lower(normalize(btrim(alias), NFC))) STORED,
  language text NOT NULL CHECK (language IN ('bn','en','banglish')),
  review_state text NOT NULL DEFAULT 'draft' CHECK (review_state IN ('draft','in_review','reviewed')),
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  UNIQUE (service_id, language, normalized_alias)
);
CREATE TABLE app_private.official_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES app_private.agencies(id) ON DELETE RESTRICT,
  hostname text NOT NULL CHECK (char_length(hostname) BETWEEN 3 AND 253 AND hostname = lower(hostname)
    AND hostname ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$' AND hostname !~ '^[0-9.]+$'),
  canonical_hostname text GENERATED ALWAYS AS (lower(hostname)) STORED UNIQUE,
  authenticity_status text NOT NULL DEFAULT 'candidate' CHECK (authenticity_status IN ('candidate','verified','suspended','retired')),
  content_authority_status text NOT NULL DEFAULT 'unknown' CHECK (content_authority_status IN ('unknown','in_review','approved','rejected')),
  crawl_permission_status text NOT NULL DEFAULT 'unknown' CHECK (crawl_permission_status IN ('unknown','allowed','denied','restricted')),
  verification_method text CHECK (char_length(btrim(verification_method)) BETWEEN 1 AND 120),
  verification_evidence_ref text CHECK (char_length(btrim(verification_evidence_ref)) BETWEEN 1 AND 2048),
  verified_at timestamptz,
  notes text CHECK (char_length(notes) <= 4000),
  is_synthetic boolean NOT NULL DEFAULT false,
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  CHECK (authenticity_status <> 'verified' OR (verified_at IS NOT NULL AND verification_method IS NOT NULL AND verification_evidence_ref IS NOT NULL AND NOT is_synthetic)),
  CHECK (NOT is_synthetic OR (content_authority_status <> 'approved' AND crawl_permission_status <> 'allowed'))
);
CREATE INDEX official_domains_agency_idx ON app_private.official_domains(agency_id);

CREATE FUNCTION app_private.touch_editorial_record() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $function$
BEGIN
  IF to_jsonb(NEW)->'id' IS DISTINCT FROM to_jsonb(OLD)->'id' THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Record identity is immutable';
  END IF;
  IF to_jsonb(OLD)->'is_synthetic' = 'true'::jsonb AND to_jsonb(NEW)->'is_synthetic' IS DISTINCT FROM 'true'::jsonb THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Synthetic identity cannot be promoted into real records';
  END IF;
  NEW.created_at := OLD.created_at;
  NEW.updated_at := statement_timestamp();
  NEW.revision := OLD.revision + 1;
  RETURN NEW;
END
$function$;
-- All graph writers share a transaction lock. Concurrent behavior requires real DB tests.
CREATE FUNCTION app_private.lock_hierarchy() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $function$
BEGIN
  PERFORM pg_advisory_xact_lock(90714, CASE TG_TABLE_NAME WHEN 'agencies' THEN 1 ELSE 2 END);
  RETURN NULL;
END
$function$;
CREATE FUNCTION app_private.check_agency_hierarchy() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $function$
BEGIN
  IF NEW.parent_agency_id IS NOT NULL AND EXISTS (
    WITH RECURSIVE ancestors AS (
      SELECT id, parent_agency_id FROM app_private.agencies WHERE id = NEW.parent_agency_id
      UNION SELECT a.id, a.parent_agency_id FROM app_private.agencies a JOIN ancestors p ON a.id = p.parent_agency_id
    ) SELECT 1 FROM ancestors WHERE id = NEW.id
  ) THEN RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Agency hierarchy must be acyclic'; END IF;
  RETURN NEW;
END
$function$;
CREATE FUNCTION app_private.check_category_hierarchy() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $function$
BEGIN
  IF NEW.parent_category_id IS NOT NULL AND EXISTS (
    WITH RECURSIVE ancestors AS (
      SELECT id, parent_category_id FROM app_private.categories WHERE id = NEW.parent_category_id
      UNION SELECT a.id, a.parent_category_id FROM app_private.categories a JOIN ancestors p ON a.id = p.parent_category_id
    ) SELECT 1 FROM ancestors WHERE id = NEW.id
  ) THEN RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Category hierarchy must be acyclic'; END IF;
  RETURN NEW;
END
$function$;
CREATE TRIGGER agencies_graph_lock BEFORE INSERT OR UPDATE OR DELETE ON app_private.agencies FOR EACH STATEMENT EXECUTE FUNCTION app_private.lock_hierarchy();
CREATE TRIGGER categories_graph_lock BEFORE INSERT OR UPDATE OR DELETE ON app_private.categories FOR EACH STATEMENT EXECUTE FUNCTION app_private.lock_hierarchy();
CREATE TRIGGER agencies_no_cycle BEFORE INSERT OR UPDATE ON app_private.agencies FOR EACH ROW EXECUTE FUNCTION app_private.check_agency_hierarchy();
CREATE TRIGGER categories_no_cycle BEFORE INSERT OR UPDATE ON app_private.categories FOR EACH ROW EXECUTE FUNCTION app_private.check_category_hierarchy();
DO $security$
DECLARE table_name text; role_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['agencies','agency_translations','categories','category_translations','services','service_translations','service_categories','service_agencies','service_aliases','official_domains'] LOOP
    EXECUTE format('ALTER TABLE app_private.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE app_private.%I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('CREATE POLICY migration_owner ON app_private.%I TO postgres USING (true) WITH CHECK (true)', table_name);
  END LOOP;
  FOREACH table_name IN ARRAY ARRAY['agencies','agency_translations','categories','category_translations','services','service_translations','official_domains'] LOOP
    EXECUTE format('CREATE TRIGGER touch_editorial BEFORE UPDATE ON app_private.%I FOR EACH ROW EXECUTE FUNCTION app_private.touch_editorial_record()', table_name);
  END LOOP;
  REVOKE ALL ON ALL TABLES IN SCHEMA app_private FROM PUBLIC;
  REVOKE ALL ON ALL SEQUENCES IN SCHEMA app_private FROM PUBLIC;
  REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app_private FROM PUBLIC;
  FOREACH role_name IN ARRAY ARRAY['askbd_web','anon','authenticated','service_role','authenticator'] LOOP
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = role_name) THEN
      EXECUTE format('REVOKE ALL ON SCHEMA app_private FROM %I', role_name);
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA app_private FROM %I', role_name);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA app_private FROM %I', role_name);
      EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app_private FROM %I', role_name);
    END IF;
  END LOOP;
END
$security$;
ALTER DEFAULT PRIVILEGES IN SCHEMA app_private REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA app_private REVOKE ALL ON SEQUENCES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA app_private REVOKE ALL ON FUNCTIONS FROM PUBLIC;
COMMENT ON SCHEMA app_private IS 'Ask Bangladesh private core; no public projections or evidence publication in P14';
