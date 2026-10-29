# Phase 3 — Database and data foundation

Date: 2026-10-20, Asia/Dhaka. **PASS for the local Phase 3 foundation, through P17.**
This is not approval for hosted identity, real source publication or deployment.

## Scope and architecture

P14/P15 supplied 24 private core and evidence tables. P16 adds four staff security
tables; P17 adds metadata_releases and publication_state: **30 private tables**.
Seven forward SQL migrations share the Supabase CLI history. PostgreSQL 17.11 and
pgvector 0.8.2 remain unchanged. No ORM, provider change or remote service exists.

Supabase Auth is now the selected staff provider. The local implementation uses
official GoTrue v2.197.0, the Supabase JavaScript SDK 2.118.0 and SSR 0.12.7.
Auth cookies and a separate random staff binding are HttpOnly, SameSite=Strict,
Secure with `__Host-` names on HTTPS; HTTP is limited to explicit loopback local
configuration. Online user validation plus verified AAL2 claims precedes DB
authorization. The DB enforces role, active membership/revision, 30-minute idle
and 12-hour absolute expiry. Logout commits local revocation even during an Auth
outage. Admin responses are private/no-store and exclude indexing.

| Role | Inspect | Review capability | Operations capability | Role-management capability |
| --- | --- | --- | --- | --- |
| owner | yes | yes | yes | yes |
| administrator | yes | yes | yes | no |
| source_reviewer | yes | yes | no | no |
| auditor | yes | no | no | no |

Only inspection, authentication and session operations are exposed now; the
capabilities do not imply publication/write APIs or a full dashboard exist.
Membership creation/revocation remains an explicitly controlled offline operator
procedure. No production account or predictable default account was created.

## API contracts and publication boundary

Implemented read-only collections/details:

- `/api/v1/services` and `/api/v1/services/{slug}`
- `/api/v1/categories` and `/api/v1/categories/{slug}`
- `/api/v1/agencies` and `/api/v1/agencies/{slug}`
- `/api/v1/sources` and `/api/v1/sources/{uuid}`

`locale=bn|en` defaults to bn; limit defaults to 20 and is capped at 50. Services
also accept category slug and agency UUID. Cursor tokens are HMAC signed, bound to
normalized filters, limit, policy and publication generation, and expire after
30 minutes. Unsupported/duplicate parameters, search text, sorting, invalid slugs
and UUIDs are rejected. Free-text search remains the future POST search contract.

Collections return `{data:[],meta:{limit,next_cursor,policy_revision},request_id}`.
Details return `{data:{...},meta:{policy_revision},request_id}`. Unknown/private
records are 404; bad input/cursors are 400; unavailable DB/policy is 503 without
SQL, credentials or fake empty results. Unimplemented mutations return 405.

The web role can execute one bounded fixed-search-path definer function and has
no raw table/view grants. Projections require independent active creators and
reviewers, current revisions, locale review and a live metadata release. Changes
to relationships invalidate service review; expiry/withdrawal/reviewer revocation
fail closed. Sources additionally need valid domain ownership, current checks
and independently eligible current document evidence. Public responses contain
identity metadata only: no summaries that might contain unsupported instructions,
review notes, actors, storage keys, text passages or embeddings. Source output
explicitly marks `evidence_eligible:false`: it is not a claim/citation interface.

Protected GET `/api/v1/admin/session` exposes only the role.
GET `/api/v1/admin/records/{kind}/{uuid}` reauthorizes both in the BFF and the DB
and returns selected internal identity/state fields only. Kinds cover agencies,
categories, services, domains, sources, documents, versions, passages and
verifications. It cannot assign roles, modify sources or approve anything.

The explicit `fetchPublishedDirectory` adapter is ready for Phase 4; existing
Phase 2 pages remain in their labeled DB-independent demo scope.

## Verification evidence

| Actual command/check | Result |
| --- | --- |
| `npm.cmd install --workspace @ask-bangladesh/web --save-exact @supabase/ssr@0.12.7 @supabase/supabase-js@2.118.0` | PASS; two direct packages, ten total packages added; one root lockfile |
| `npm.cmd run db:start`, `test:database` | PASS; seven canonical migrations, 40/40 real checks, zero skipped |
| `npm.cmd run db:types`, `typecheck:database` | PASS; types generated against actual PostgreSQL schema |
| `npm.cmd run test:coverage` | PASS; 227/227 unit/component/contract cases across 15 files |
| Existing selected-module coverage gates | PASS; 97.70% statements, 100% branches, 92.85% functions, 97.61% lines; not whole-system/SQL/Auth integration coverage |
| `npm.cmd run test:integration` | PASS; 19/19 grouped real provider/HTTP/API checks, clean exit and disposable cleanup |
| `npm.cmd run test:e2e -- --workers=2` | PASS; 28/28 Chromium frontend/axe cases, clean exit, about 1.1 minutes |
| `npm.cmd run test:database:guards` | PASS; 5/5 local-target and real connection-failure checks |
| `npm.cmd run test:python` | PASS; 9/9 offline tests |
| `npm.cmd run typecheck`, `lint`, `format:check` | PASS; strict application/generated types, zero lint warnings and formatting clean |
| `npm.cmd run build` | PASS; 119 prerendered public/framework pages plus five dynamic staff/API route patterns; no Auth/DB credential required to build |
| `npm.cmd ls --all --parseable` | PASS; locked workspace graph consistent |
| `npm.cmd audit --json` | Exit 1; five existing high development-chain findings, zero critical |
| `npm.cmd audit --omit=dev --json` | PASS; zero production advisories |
| `npm.cmd run docs:check` | PASS; 13 required documents and 203 local links; structural checks only |
| CI YAML syntax | PASS using existing Prettier YAML parser; workflow reviewed locally, hosted run unverified |
| `git diff --check`, `git diff --cached --check` | PASS; 14 pre-existing staged entries retained, nothing staged/committed by this task |
| Limited actual-credential/private-key scan | PASS; 170 tracked/unignored nonbinary text files, zero matches; not a guarantee that no possible secret exists |
| Ordinary local DB inspection | Zero memberships, metadata releases or sources; zero remaining disposable databases |
| `npm.cmd run auth:stop` | PASS; owned Auth container stopped without deleting its database |
| `node scripts/auth-local.mjs dev` controlled smoke | PASS; real dev server serves staff sign-in, public Bangla page and empty directory API; only its spawned process tree was stopped |

The aggregate `validate:phase3` is configured to fail on any component failure;
its constituent commands above were executed individually, not claimed as an
executed aggregate. The final integration additionally tests a deliberately closed
local Auth gateway during logout, an invalid BFF binding, actual publication-cursor
paging/invalidation, DB permission failure returning 503 and public mutation 405.
The auth-enabled development command pins port 3000 to match its injected
APP_ORIGIN; it fails if that port is occupied instead of switching origins.

Initial failures were corrected and rerun: SQL test-only SET-role grants, local
Auth schema search path/ownership, Next origin/Host comparison, ambiguous SQL
revision binding and an unintended Vitest beforeEach cleanup callback. Formatting
initially failed on newly edited tests and passed after formatting. No failing
run is represented as a passing result. Raw provider errors/credentials were
withheld from diagnostic output. An elevated Git check needed the already known
command-scoped workspace trust setting; global Git configuration was not changed.

Changed-file groups: four new SQL migrations; generated schema types; staff and
directory modules/route handlers; local Auth and real integration scripts; staff/
directory SQL fixtures and tests; Auth, HTTP, cursor and adapter unit tests; npm
workspace manifest/lockfile and CI; example configuration, README/testing/database
instructions, architecture/security/source/AI/deployment/product docs, plan,
roadmap, progress and this report. Existing frontend feature code and owner
masterprompt.txt are preserved.

## Known limitations and release gates

No government crawler, automated extraction, OCR, embedding generation, hybrid
retrieval, RAG, live AI chatbot, full admin dashboard or production deployment.
No official source was accessed, seeded or approved. Publication test fixtures
simulate eligible states only inside guarded disposable databases and use
reserved `.invalid` URLs; they are not research or genuine verification results.

Production identity provisioning/recovery, phishing-resistant MFA, actual hosting
TLS/provider configuration and remote CI remain unverified release gates. The
four-role model refines the earlier proposed capability inventory; future billing
and operational roles must be scoped before their features are exposed. Staff
tokens require an individual account and MFA; citizens still need no account.

Metadata release creation is reserved for P18's protected audited workflow;
manually modifying production rows is not an approved onboarding shortcut.
Claim semantic/contextual entailment and final citation delivery remain later
release gates; P17 deliberately exposes no actionable evidence. Current raw
retention/purge and backup/recovery operations remain the later scoped work.

Local Auth uses a separate private database with provider-owned schema migrations;
application migrations remain the sole authority for app_private/app_staff/
app_public. Local secrets live in owned Docker container configuration and memory,
not tracked files. The Linux loopback host-network branch is specified for CI;
actual execution evidence here is Windows Docker Desktop. Remote CI is unverified.

## Work-package decision

P14: PASS (historical local, regression tested).
P15: PASS (historical local, regression tested).
P16: PASS (local staff authentication/authorization foundation).
P17: PASS (local repositories/read-only APIs/integration and final audit).
**Phase 3: PASS locally. Phase 4 can begin with explicit authorization for P18.**
Stop before P18; no commit, push, deployment, paid service or cloud provisioning.
