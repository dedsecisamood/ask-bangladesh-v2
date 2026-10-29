# Local PostgreSQL and SQL migrations

Current audit addition: structured feedback has separate askbd_feedback permissions
and two additive migrations. Apply with `db:migrate`, regenerate with `db:types`.
The optional server-only FEEDBACK_DATABASE_URL must use that writer role, never the
public reader/admin credentials. Leave unset for the demo. Production intake stays
closed even in CHAT_MODE=api; no real source, user or feedback is seeded. Earlier
table/migration counts below are historical checkpoints.

P14 uses PostgreSQL 17.11 from a digest-pinned Supabase PostgreSQL image, Docker,
and Supabase CLI 2.121.0 as the sole SQL migration/type-generation tool. No hosted
project, paid resource, ORM or parallel migration history exists. Public access
is limited to the BFF's reviewed read-only projections, never raw tables.

## Prerequisites and commands

P29 adds three forward migrations, for **42 private tables / 28 migrations**;
see [P29 report](../docs/P29_REPORT.md). After `db:migrate`, use
`npm run test:retrieval` for focused disposable keyword tests, or `test:database`
for the full migration, permission, ingestion and retrieval regression suite.
The focused command runs P29 only; it does not certify the entire database suite.
No real source is added. The GIN index remains private; only the bounded approved
projection is executable by the existing BFF role.

Phase 5 extends the same history to 42 private forced-RLS tables and 25 migrations;
see [Phase 5 report](../docs/PHASE_5_REPORT.md). For the complete SQL/real Python
pipeline tests, first install the worker test requirements and run
`npm run parser:build` with local Docker. The parser is offline at runtime and
uses synthetic HTML/native PDF/Bangla scan fixtures. No live source is seeded.
`npm run validate:phase5` is the fail-fast full foundation/database/auth/parser
gate after those prerequisites; actual component results belong in the report.

P19-P21 extends this same database to 33 private tables and fifteen SQL migrations.
See [Phase 3 report](../docs/PHASE_3_REPORT.md), [P18 report](../docs/P18_REPORT.md)
and [Phase 4 report](../docs/PHASE_4_REPORT.md). No real source records are seeded.
`npm run validate:phase4` includes the existing regressions plus directory SQL,
MFA/HTTP and published-browser cases. After `db:start` and `db:migrate`,
`npm run auth:dev` starts the separate local Supabase Auth database/container and
a loopback-only Node gateway, then starts Next with runtime secrets injected in
memory. No user credentials are printed or written to an environment file.
`auth:start` starts the same gateway in the foreground without the web app;
`auth:stop` stops the owned container. Ctrl+C ends the foreground gateway/process.

Official GoTrue v2.197.0 is pinned by digest. Windows Docker Desktop publishes
only 127.0.0.1:54326; the gateway binds 127.0.0.1:54325 and forwards only the
fixed /auth/v1 prefix to that fixed loopback port. On Linux, Auth uses host
networking with the Auth listener explicitly bound to 127.0.0.1:54326. No generic
proxy or arbitrary destination is supported. Auth startup checks project identity
and local Docker before reading development secrets from the owned container.
Application migrations still use Supabase CLI. GoTrue owns only its separate
Auth schema/database history; it does not migrate application tables.

No default account exists. To exercise login safely use `npm run test:integration`,
which provisions/deletes synthetic local users and uses a disposable app DB.
An owner's real staff identity requires the separate trusted provisioning process
documented in [security](../docs/SECURITY.md). Never use a development Auth admin
token or migration-owner DB credential in application runtime configuration.

Install the root lockfile with `npm ci`, start a local Docker-compatible engine,
then use these root commands (`npm.cmd` in Windows PowerShell):

```text
npm run db:start
npm run db:status
npm run db:migrate
npm run test:database:guards
npm run test:database
npm run db:types
npm run db:stop
```

The startup script detects the standard Windows Docker Desktop installation when
the current terminal has an older PATH. First startup may download the 1.7 GB
uncompressed image. It creates only `askbd-postgres-local` and the labeled
`askbd-postgres-local-data` volume. The port is explicitly published as
`127.0.0.1:54322:5432` and is checked before any connection. A random 256-bit
development password is passed through the Docker process environment, retained
in the owned container's configuration and read only in memory on later runs.
No plaintext password is written into the repository or CLI arguments.

Stop retains the container/volume. Restart reuses its credentials/data. There is
no reset/delete script. A foreign container/volume, unexpected port/mount, remote
Docker endpoint, unhealthy server or linked-project marker causes refusal.
An orphaned volume needs owner review, not an automatic destructive reset.
Docker administrators can inspect development credentials; never deploy this
local superuser setup or expose its port to a LAN.

## Why the CLI does not start containers

On the verified Windows Docker Desktop 4.95.0 / engine 29.8.2 combination, the
classic CLI's documented custom-network default still published on all interfaces.
The CLI's experimental managed stack explicitly publishes its container on
loopback but creates a separate all-interface gateway. Both were stopped and are
excluded from the supported workflow. The project scripts directly start only
PostgreSQL with an explicit loopback port; they do not use experimental services.
The database provider and SQL migration strategy remain unchanged. Do not run
raw `supabase start` or enable the experimental stack to bypass the wrappers.

The Windows restart prerequisite and router DNS outage were resolved. The
temporary diagnostic VM resolver override was restored; Windows DNS/VPN/firewall
settings were not changed. Registry downloads use normal authenticated TLS.

## Migration and type authority

`database/supabase/migrations` is the only schema history; `database/migrations`
is a pointer. The wrapper validates its own fixed local container, then invokes
`supabase migration up --db-url` with a password-free literal-loopback URL and
an environment-only password. It never accepts user-supplied connection targets
or forwards flags. `--linked`, remote migration, reset and db push are unsupported.
The real CLI migration-history table is checked by the test harness.

`db:types` generates `database/generated.types.ts` from the real private schema.
Review/format generated types and validate them with strict TypeScript; these are
schema/API shapes, not pg runtime decoders. In particular pg bigint is a string
and timestamptz is a Date by default; selected-row contracts document that boundary.
No migration is inferred from generated TypeScript. Applied migrations are
forward-only; add a new SQL version rather than editing shared history.

## Integrity and private access

The ten P14 core tables use normalized translations and many-to-many relations.
P15 adds fourteen private provenance/review/evidence/embedding tables and enables
pgvector 0.8.2. There are 24 private tables and three canonical migrations; the
combined real integration suite has 28 cases. No real source or vector is seeded.
Raw data has enabled/forced RLS, maintenance-only policies and no public/API-role
grants. `askbd_web` is NOLOGIN/nonprivileged; it is not a usable migration identity.
Future login provisioning, public projections and staff permissions are later work.
The public frontend renders/builds without DATABASE_URL and does not use this DB.

Tests create random `askbd_p14_test_<32 hex>` databases only on the inspected local
server, replay the canonical migrations, load guarded synthetic fixtures and drop
only their generated databases. No ordinary local DB reset or live source is used.
Role-denial tests grant transaction-local SET permission to the maintenance caller
and roll it back; they do not grant application access. Fixtures cannot publish or
become verified. No real government information is seeded.

`npm run validate` is the frontend/harness gate; `npm run validate:p14` and
`validate:p15` add local guards and the current real database tests. CI runs the same local DB path. Remote GitHub
Actions execution remains unverified. See [P14_REPORT](../docs/P14_REPORT.md) and
[P15_REPORT](../docs/P15_REPORT.md).
