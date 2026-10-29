# P18 — Verified-source registry and approval workflow

Date: 2026-10-21, Asia/Dhaka. **P18 PASS — local implementation and verification.**
Authorized scope is P18 only. P19 is not started. No real source, government
website access, production approval, deployment or cloud operation is included.

## Implementation and decisions

Preserved the PostgreSQL 17.11/pgvector, Supabase CLI SQL history, Supabase staff
MFA, dedicated runtime roles and the conservative P17 public metadata projection.
No dependency or provider was added. Three forward migrations extend sources and
source_verifications and add two private forced-RLS tables:

- `source_registry_events`: immutable actor/action/reason/state/revision events,
  also a transactional `source_registry_changed` outbox feed. No consumer/job is
  enabled. Events commit with the state change, never after it in a separate call.
- `source_registry_requests`: immutable actor/key/request-hash/response ledger,
  with 24-hour retry validity and a per-actor 30-new-mutations/minute budget.
  Identical valid retries replay the original response, even if state later moved;
  clients must GET current status. Different payloads or expired keys conflict.

New-source metadata includes original and canonical URL, name, description,
language/type/risk, creator/editor/submission and approval/activation references,
content revision, and separate manual availability information. Ownership and
authority proofs reuse append-only source_verifications, preserving method,
reference, quoted evidence, reviewer and check/expiry times. Approval timestamps
are generated separately from manual verification times. No publication date is
invented. URL/domain identity remains immutable; a new identity needs a separate
candidate. Editing descriptive metadata resets approval and withholds publication.

Review lifecycle: draft → pending_review → approved; pending may be rejected,
and reviewed/pending sources may be suspended. Rejected/suspended records can
be resubmitted. Operational status remains candidate → verified → active with
suspension, preserving the approved schema. Approval alone is not activation.
Retired identities cannot be silently resurrected through this workflow.

Creator, last editor and submitter cannot approve/activate their own record.
For critical sources, activation also requires a different reviewer from the
first approver. The second-review requirement remains sticky after any critical
classification, so repeated risk downgrades cannot bypass it. Other general
sources permit the same independent reviewer to approve and activate. Thus
critical onboarding requires an editor and two independent
reviewers; real staffing remains an owner decision before real onboarding.
Both approval and activation require a DB-bound MFA session opened within five
minutes. Session expiry/revocation, membership role/revision, source revisions,
verification expiry and human availability evidence are checked server-side.

Activation requires current ownership/authority/use evidence and a separately
recorded accessible check within the risk TTL. These are staff assertions with
evidence, not automatic HTTP results. Crawler permission remains unchanged/unknown.
Government-looking suffixes and successful accessibility assertions never approve
procedures or authorize retrieval. No source input is fetched or DNS-resolved.

Public reads retain all P17 agency/domain/current-document/freshness gates. P18
adds current approval/activation actor and evidence checks for workflow-managed
records. Previously reviewed legacy projections are preserved until adoption;
editing them adopts the new workflow and resets trust. No legacy projection is
created by this task. Activation creates only independent source metadata release
records; it cannot create a document, passage, claim or citation. A new activated
source remains publicly unavailable until independent document eligibility also
exists. Returned source metadata remains `metadata_only`, `evidence_eligible:false`.

## Protected API contracts

- `POST /api/v1/admin/sources`: create a private candidate under an existing agency.
- `GET /api/v1/admin/sources/{uuid}`: authenticated source status, latest 20
  verification records and latest 50 review events. Full history stays in SQL.
- `PATCH /api/v1/admin/sources/{uuid}`: full editable metadata replacement;
  reason and expected revision required, URL/agency/trust fields not accepted.
- `POST /api/v1/admin/sources/{uuid}/{submit|approve|activate|reject|suspend}`:
  explicit state transition with reason and expected revision.

Every mutation requires an active staff review capability, HttpOnly MFA-bound
session, exact configured Origin and Host, JSON body ≤16 KiB, strict Zod fields
and an UUID `Idempotency-Key`. The database repeats authorization and policy
checks within the transaction. Auditors can read; they cannot mutate. Public
visitors can use the existing read-only source APIs without accounts.

Creation accepts agency_id, url, source_name, description, language, source_type,
risk_class and reason. Approval additionally requires ownership and authority
objects `{method,evidence_ref,excerpt,checked_at,expires_at}`, content_use_evidence_ref,
and separate availability status/check/reference. Nonunknown availability requires
its own check time and evidence. Proof expiry must be current and within 90 days
of its check; shorter limits are permitted. Current proof sets are bound to each
approval event, so renewed approval does not rewrite or inherit expired history.

Results use `{data:{id,revision,registry_status,status},request_id}`; revisions
are decimal strings. Errors are sanitized codes: 400 bad input, 401 missing
identity, 403 role/self-review/reauthentication denial, 404 missing record, 409
duplicate/revision/transition/idempotency conflict, 413 oversized body, 415 wrong
media type, 429 mutation budget, 503 unavailable infrastructure. No SQL/provider
errors, credentials, private notes or actors appear in public responses.

URL normalization uses the installed Node WHATWG parser: HTTPS, lowercase/IDNA
host and default-port normalization, fragment removal and preservation of semantic
query order. Original input remains private for review. IP/numeric/IPv6/local/
reserved hosts, credentials, nonstandard ports, unsafe schemes, backslashes,
control/bidi characters, dot/separator ambiguity and credential-shaped query or
fragment parameters are rejected. This validates syntax/identity, not official
ownership, accessibility, DNS destination or crawl permission. Future worker
networking must independently enforce destination-IP/redirect safety.

## Verification

Commands below ran from the repository root, using npm.cmd on Windows. Component
commands were run individually; the validate:p18 aggregate was not itself run.

| Actual command/check | Result |
| --- | --- |
| npm.cmd run test:database | PASS, 50/50 real SQL cases, no skips; ten migrations replayed on independent disposable DBs |
| npm.cmd run db:types | PASS, generated/formatted current schema types |
| npm.cmd run test:unit -- apps/web/src/lib/registry/contracts.test.ts apps/web/src/lib/registry/http.test.ts | PASS, 36 new URL/contract/HTTP cases |
| npm.cmd run test:coverage | PASS, 263/263 cases across 17 files; selected coverage 97.70% statements, 100% branches, 92.85% functions, 97.61% lines |
| npm.cmd run test:integration | PASS, 23 grouped checks using real local Supabase password/TOTP/MFA/cookies and production HTTP server, including four P18 groups |
| npm.cmd run test:e2e -- --workers=2 | PASS, 28/28 Chromium regression/accessibility cases |
| npm.cmd run test:database:guards | PASS, 5/5 local-target/connection-failure guards |
| npm.cmd run test:python | PASS, 9/9 synthetic Python cases |
| npm.cmd run typecheck | PASS, strict application and generated schema types |
| npm.cmd run lint | PASS, zero warnings |
| npm.cmd run format:check | PASS, including CI YAML parsing/formatting |
| npm.cmd run build | PASS, 119 static pages and protected/public dynamic routes compiled |
| npm.cmd ls --all --parseable | PASS, installed lockfile/workspace graph consistent; no dependency added |
| npm.cmd audit --omit=dev --json | Exit 0, fresh owner-authorized scan: zero production findings |
| npm.cmd audit --json | Exit 1, five high development-chain findings; no critical findings; unresolved tooling risk |
| node scripts/python.mjs -m pip check | PASS, no broken requirements |
| npm.cmd run docs:check | PASS final rerun, 13 required documents and 210 local links; structural checks only |
| git diff --check; git diff --cached --check | PASS; only existing LF/CRLF notices |

The first full coverage run had seven worker-start timeouts under concurrent
local load and did not pass its coverage gate. Setting maxWorkers:2 preserved all
tests/isolation/thresholds; the full rerun passed. An existing browser assertion
queried all h2 elements before client navigation completed (27/28 initial pass).
It now waits for the destination URL and exact accessible heading; 28/28 rerun
passed. A URL test caught encoded-dot normalization; raw paths are checked before
WHATWG parsing can hide ambiguity. A test-table typing error was corrected before
strict validation passed. None of these failed attempts is recorded as passing.
Two optional YAML-parser probes were unavailable; no parser dependency was added.
The existing Prettier YAML parser and manual CI inspection validate syntax.

Final limited credential scan: **186 tracked/unignored text files**, compared
against four actual local container password/secret values plus private-key
headers, zero matching files. This is not an exhaustive secret scanner. Fourteen
pre-existing owner-staged entries remain; this task stages/commits nothing.
Final local DB check: zero sources, memberships, releases, registry events,
leftover disposable databases and provider users. Test servers cleanly stopped.
The owned Auth container is stopped after verification without data deletion.

Fresh npm advisory requests were initially blocked before execution by automatic
approval review because they export dependency metadata. The owner subsequently
explicitly approved npm metadata submission; both scans then executed successfully.
Results saved in ignored .cache/p18-audit-production.json and p18-audit-all.json:
zero production findings (exit 0), five high development-chain findings (exit 1),
zero critical findings. This confirms the earlier advisory counts with fresh
evidence; it does not make the full dependency audit clean.

The five affected packages are braces, micromatch, fast-glob,
@next/eslint-plugin-next and eslint-config-next, tracing to one
[braces stack-exhaustion advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
npm proposes eslint-config-next 14.2.35 as a major-version change from the approved
16.4.2 stack. No automatic fix, override, downgrade or suppression was applied.
Scoped tooling remediation needs a compatible solution and regression validation.
No application code, package version or lockfile changed in this audit follow-up.
Remote GitHub Actions was not executed; existing CI discovers the extended SQL,
Vitest and real MFA integration cases through its unchanged fail-fast scripts.

## Files and boundaries

New files: three `20261021000*` SQL migrations; registry URL/contracts/repository/
HTTP modules and tests; three protected route files; SQL registry cases and
guarded evidence fixture; real registry integration helper; this report.
Updated shared SQL harness/table-count check, generated types, real MFA integration
runner, npm validation alias, bounded Vitest worker count, a navigation wait in
the existing frontend test, project instructions/plan/progress and relevant
architecture/database/source/security/setup/testing documentation.

Canonical migration files under database/supabase/migrations:

- 20261021000100_source_registry.sql — schema, constrained commands, selected
  private read and public eligibility extension.
- 20261021000200_registry_review_hardening.sql — per-actor mutation budget,
  exact current-approval proof selection and retired-identity guard.
- 20261021000300_registry_risk_guard.sql — sticky independent second review.

Application additions: apps/web/src/lib/registry/{url,contracts,repository,http}.ts,
contracts.test.ts, http.test.ts and app/api/v1/admin/sources route handlers.
Test additions: database/tests/registry.cases.mjs, registry-fixture.mjs and
scripts/registry-integration.mjs. Shared harness edits are in core.test.mjs,
evidence.cases.mjs and phase3-integration.mjs. Other changes: generated.types.ts,
package.json, vitest.config.ts, tests/e2e/frontend.spec.ts, AGENTS.md, PLANS.md,
README.md, tests/README.md, database/README.md and the relevant docs listed above.
package-lock.json and dependency versions are unchanged by P18.

No Phase 2 feature code or owner masterprompt was replaced. No final admin UI,
P19 agency/service writes, P20 frontend connection, P21 live link checks, ingestion,
AI, real corpus, secrets, new package, remote service, commit or push was added.
Remote CI and production identity/recovery remain unverified. The five freshly
confirmed development-chain findings remain open for scoped remediation; no
dependency changes were made by P18 or the owner-authorized audit follow-up.

Residual boundaries: proof is a staff assertion, not an external verification;
real accountable reviewers and independent research are required for onboarding.
The append-only retry ledger has no pruning job, and the audit outbox has no
consumer. These are bounded local foundation features, not deployed operations.
SSRF-safe network retrieval, live permission/freshness monitors, human accessibility
conformance and production identity/recovery remain later release gates.

Primary references checked 2026-10-21:
[PostgreSQL secure function definitions](https://www.postgresql.org/docs/17/sql-createfunction.html),
[Node 24.22.0 URL behavior](https://github.com/nodejs/node/blob/v24.22.0/doc/api/url.md),
[OWASP transaction authorization](https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html).
The Node HTML documentation request was inaccessible; its official versioned
source was read instead, and normalization was tested on the installed runtime.

## Decision

P18: **PASS locally**. Its candidate creation, explicit independent evidenced
review, valid transitions, public withdrawal/filtering, immutable audit, grants,
URL/input validation and regression criteria passed. Phase 4 is still in progress;
P19–P21 have not been completed by this task. Recommended next work package: P19,
separately authorized. Stop at P18; no real production approvals are authorized.
