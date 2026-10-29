# P14 - PostgreSQL foundation verification

Date: 2026-10-19, Asia/Dhaka. **P14 PASS - locally verified.**
The owner authorized finishing P14 then P15; stop after P15, before P16.

## Implementation

PostgreSQL 17.11, pinned Supabase CLI 2.121.0, pg 8.23.1 and @types/pg 8.23.1.
No ORM, competing migration system, hosted project or provider change. Hosted
Supabase remains a future managed option; Google Cloud credits were not used.
Supabase fits the approved PostgreSQL/optional-auth bundle and existing SQL-first
design. Cloud SQL would add separate IAM/network/instance operations and identity
decisions; credits alone do not justify that change. No paid cost assumptions.

`20261019000100_core_foundation.sql` was applied by the real CLI and defines ten
private tables: agencies, agency_translations, categories, category_translations,
services, service_translations, service_categories, service_agencies,
service_aliases and official_domains. UUID/FK/unique/check constraints, timezone
timestamps, immutable IDs, revision triggers, bounded text, normalized Unicode
aliases and hierarchy locks/cycle checks preserve Phase 0. Agency/domain identity,
content authority and crawling permission are independent. No official data exists.

Lazy server-only pg pooling, explicit transactions, sanitized errors and optional
configuration preserve the DB-independent frontend. Hand-authored selected-row
contracts explain pg runtime types; generated schema types now exist separately.
The app role remains NOLOGIN and has no raw data access. Elevated local credentials
are used only for migrations/testing, not public application requests.

Created/updated: database config/migration/fixtures/test/generated types/README,
scripts/database-local.mjs, database.mjs, database.test.mjs, web database modules
and tests, manifests/lockfile, CI, env example/gitignore and architecture/progress/
setup documentation. No frontend route/functionality was redesigned.

## Runtime findings and corrections

- Verified Microsoft WSL 3.0.3.0 MSI against its SHA-256 and Microsoft signature;
  installed successfully. Enabled Virtual Machine Platform (DISM 3010) without
  automatic restart. The owner restarted Windows; its restart marker cleared.
- Docker Desktop 4.95.0.242831 installed successfully; engine/CLI 29.8.2 now run.
- Router DNS initially failed for official registries. A temporary VM-only
  resolver diagnostic was restored. The owner fixed connectivity; Windows DNS,
  VPN and firewall configuration were not modified by this work.
- Classic CLI startup ignored its custom network's default host binding on this
  Docker combination. The experimental managed runtime's gateway also bound to
  all interfaces (confirmed by socket inspection and local LAN-address probe).
  Both were stopped; neither is the supported startup strategy.
- Supported startup directly runs the Supabase PostgreSQL image with an explicit
  loopback publish, digest pinned to
  `sha256:b15d862126dd2dac02da524696ccfde2dcce2ceaee0a58973b2727befe492706`.
  Actual Windows listener: **127.0.0.1:54322**. CLI remains the sole migration/type
  tool; its fixed local URL has no password, supplied instead in the environment.
- An unnecessary bootstrap role file caused a duplicate factory-role error.
  It was removed; only the newly created failed disposable container/labeled
  volume was removed, then initialization succeeded. No existing user DB was reset.
- The first real suite passed 11/12; role switching required temporary SET grants
  for the non-superuser maintenance caller. The harness now grants them inside a
  rolled-back transaction, and all twelve cases pass without weakening app grants.

## Actual verification

| Command/check | Result |
| --- | --- |
| `npm.cmd run db:start`, `db:status`, `db:migrate` | PASS: real local PostgreSQL and CLI migration history |
| `npm.cmd run test:database` | PASS: 12/12, zero skips; replay, constraints/FKs/statuses, Unicode, revisions, synthetic guards, role denial and concurrent opposite-parent writes |
| `npm.cmd run db:types` | PASS: real schema types generated |
| Strict standalone tsc for generated.types.ts | PASS |
| `npm.cmd run test:database:guards` | PASS: 5/5, including real pg closed-loopback-port failure |
| `npm.cmd run test:unit` | PASS: 195/195 across 11 files |
| Actual server/extension availability query | PostgreSQL 17.11; pgvector 0.8.2 available, not enabled in P14 |
| Actual Windows listener inspection | 127.0.0.1:54322, not all interfaces |

Full lint, strict application TypeScript and production build passed; the build
generated 119 public/framework pages without DATABASE_URL. Documentation structure
and Git whitespace checks passed. P14's local acceptance criteria are satisfied;
P15 is now the explicitly authorized next package. No remote CI PASS is claimed.
Earlier baseline checks also passed 28 Chromium cases, nine Python tests, coverage,
workspace consistency and production build. They are historical, not remote CI.
CI includes offline guards and local database tests with failure propagation;
no hosted GitHub Actions run is claimed. Five existing high dev-only dependency
advisories remain; the prior production-only audit was zero. No forced downgrade.

## Security and boundary

All core tables have enabled/forced RLS and no grants to PUBLIC, anon,
authenticated, service_role, authenticator or askbd_web. Actual role-denial tests
pass. Random local secrets are kept out of source, reports and process arguments;
Docker administrators can inspect local development credentials. Local postgres
is an offline maintenance identity, never a production/runtime credential.
Source fixtures use fictional text and reserved .invalid hosts, remain private
and cannot be promoted. No government website, paid AI, cloud resource, public
DB API, authentication, ingestion, deployment, commit or push was performed.

The wrapper refuses remote Docker, foreign containers/volumes, unexpected mounts
or port mappings, linked-project markers, caller URLs and extra flags. Only
random validated disposable test databases are deleted. Production backups,
restore/recovery and credential provisioning remain later gates.

## Primary references

Checked 2026-10-19: [Supabase CLI local workflow](https://supabase.com/docs/guides/local-development/cli-workflows),
[local runtime and binding guidance](https://supabase.com/docs/guides/local-development),
[managed stack limitations](https://supabase.com/docs/guides/local-development/running-multiple-local-projects),
[gateway source at the pinned CLI version](https://github.com/supabase/cli/blob/v2.121.0/packages/stack/src/Network.ts),
[PostgreSQL constraints](https://www.postgresql.org/docs/17/ddl-constraints.html),
[node-postgres pooling](https://node-postgres.com/features/pooling).
