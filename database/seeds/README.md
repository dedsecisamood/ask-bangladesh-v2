# Database fixtures boundary

`p14.synthetic.sql` contains fictional, unverified records and a reserved `.invalid`
hostname. It is loaded only by the isolated integration suite, inside disposable
test databases; it rejects other database names. Automatic Supabase seeding is
disabled. No government facts, procedures, fees, official URLs or citizen records
are supplied. See [DATABASE](../../docs/DATABASE.md) and
[SOURCE_POLICY](../../docs/SOURCE_POLICY.md). Real core/evidence tests pass on local
PostgreSQL. P15 adds transient synthetic fixtures inside its test module; none is
seeded into the ordinary local database or connected to the public frontend.
