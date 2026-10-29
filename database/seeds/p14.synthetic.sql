-- Only loaded into a newly created disposable test database, never automatically seeded.
DO $guard$
BEGIN
  IF current_database() !~ '^askbd_p14_test_[a-f0-9]{32}$' THEN
    RAISE EXCEPTION 'Synthetic fixtures are restricted to disposable P14 test databases';
  END IF;
END
$guard$;
INSERT INTO app_private.agencies (id, slug, is_synthetic) VALUES ('14000000-0000-4000-8000-000000000001', 'synthetic-test-agency', true);
INSERT INTO app_private.agency_translations (agency_id, locale, name) VALUES
('14000000-0000-4000-8000-000000000001', 'en', 'Synthetic test organization - NOT a government agency'),
('14000000-0000-4000-8000-000000000001', 'bn', 'কাল্পনিক পরীক্ষার সংস্থা - সরকারি সংস্থা নয়');
INSERT INTO app_private.categories (id, slug, is_synthetic) VALUES ('14000000-0000-4000-8000-000000000002', 'synthetic-test-category', true);
INSERT INTO app_private.category_translations (category_id, locale, name) VALUES ('14000000-0000-4000-8000-000000000002', 'en', 'Synthetic test category');
INSERT INTO app_private.services (id, slug, is_synthetic) VALUES ('14000000-0000-4000-8000-000000000003', 'synthetic-test-service', true);
INSERT INTO app_private.service_translations (service_id, locale, title) VALUES ('14000000-0000-4000-8000-000000000003', 'en', 'Synthetic test topic - no government guidance');
INSERT INTO app_private.service_categories (service_id, category_id) VALUES ('14000000-0000-4000-8000-000000000003', '14000000-0000-4000-8000-000000000002');
INSERT INTO app_private.service_agencies (service_id, agency_id) VALUES ('14000000-0000-4000-8000-000000000003', '14000000-0000-4000-8000-000000000001');
INSERT INTO app_private.service_aliases (service_id, alias, language) VALUES ('14000000-0000-4000-8000-000000000003', 'Synthetic Alias', 'en');
INSERT INTO app_private.official_domains (agency_id, hostname, is_synthetic, notes) VALUES ('14000000-0000-4000-8000-000000000001', 'synthetic.example.invalid', true, 'Reserved invalid hostname; no requests or verification performed.');
