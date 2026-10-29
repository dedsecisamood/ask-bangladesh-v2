# Active implementation plan

## Pre-Phase-9 audit - authorized 2026-10-24

Reconcile Phase 0-8 reports with roadmap acceptance and current code, distinguishing
local/demo implementation from real-content, independent-review and live-provider
gates. Inspect public/admin/API, database/RLS, ingestion, retrieval, chat/privacy,
multilingual contracts and test coverage for confirmed defects. Preserve the staged
tree and all gates; no Phase 9 work, onboarding, paid/live calls or deployment.
Fix confirmed in-scope issues with focused regression tests; then run the complete
local gate and documentation/diff checks. Acceptance: accurate phase matrix, actual
commands/results, repaired local defects and explicit remaining manual evidence.

Outcome: confirmed topic/follow-up, bounded-body and minimum structured feedback
gaps repaired; current summaries reconciled. Clean native validate:phase8 PASS,
exit 0 (724 unit, 156 SQL, 171 Python, 43 browser, 28 Auth/API, 16 parser/OCR,
three offline model checks). Fresh npm audit zero findings; 341-file limited
secret comparison zero matches. Post-test 44 forced-RLS tables/36 migrations,
ordinary source/document/feedback counts zero and no disposable DBs. Local audit
PASS; formal Phases 6-8 PARTIAL on independent corpus/human/provider gates. Stop
before Phase 9; preserve existing staged entries. See PRE_PHASE_9_AUDIT report.

## Remaining Phase 8 - authorized 2026-10-24

P43: extend the existing bounded search-only spelling lexicon and tests; preserve
original minimized text and ambiguity, without inventing service aliases or facts.
P44: reuse existing language contract with exact language-change commands and
bounded prior-user intent, never prior assistant evidence. Preserve source text,
independent claim review, citations and closed public/provider gates. Test language
switches, topic changes, privacy, unsupported cases and failure paths with mocks.
P45: add versioned synthetic multilingual cases, separate per-dimension outcomes,
reproducible evaluation/review export and human rubric. Inspect available corpus
evidence, report pending official/human/provider gates. Run unit/coverage, quality,
browser and applicable Phase 7/6 regressions. Record actual results and stop before
Phase 9. Acceptance: engineering checks pass, no trust regressions, no false formal
PASS or language-quality claims from synthetic examples.

Outcome: all authorized Phase 8 local engineering complete. Native
`npm.cmd run validate:phase8` PASS, exit 0 (707 unit, 152 SQL, 171 Python,
42 browser, 28 Auth/API groups, 16 parser/OCR and three offline model checks).
Initial sandboxed browser teardown failed after 36 passing tests; scoped cleanup
and native rerun passed with unchanged assertions/timeouts. P42-P44 local PASS;
P45 formal PARTIAL, as is Phase 8 on corpus/human/live-provider gates. Review export
is synthetic with blank findings. Stop before Phase 9; see PHASE_8_REPORT.

## P42 localization and rendering - authorized 2026-10-24

Preserve existing bn/en URL preference, bilingual navigation/copy, local fonts,
light/dark styles and closed chat/provider boundaries. Localize source language,
document-type and date labels with safe unknown fallbacks; retain original titles,
URLs and evidence text. Mark known evidence language accurately, unknown language
as unknown, and both UI locales explicitly LTR. Enforce complete warning-copy keys
and check shell/product translation parity. Add focused unit/rendering and mobile
browser regressions; run types/lint/format/coverage, production build, frontend and
Phase 7 UI/unit regressions. No database/backend changes require SQL/model reruns.
Assess P43-P45 as future work; do not implement them. Record results in P42_REPORT
and the checkpoint. Phase 7 stays PARTIAL and Phase 8 is not complete after P42.

Outcome: P42 technical/local PASS: 600 unit tests, scoped coverage, 36 frontend
and five API-mode browser tests, types, lint, formatting and production build.
The initial route-inventory timeout was repaired by splitting unchanged assertions
by locale; final browser command exit 0. Independent multilingual review remains
pending. Stop before P43; formal Phase 7 remains PARTIAL.

## P41 owner clarification: corpus and human review

Inspect versioned evaluation files and the local official-source approval records
for an existing approved corpus. Record aggregate counts without private data.
The owner will arrange an independent Bangla/Banglish/English reviewer; none is
confirmed yet. Preserve formal P41/Phase 7 PARTIAL until the approved corpus,
human findings and documented acceptance gates actually pass. Confirm the final
aggregate after the repaired browser wait, export the synthetic review artifact,
update evidence/checkpoint and stop before Phase 8. No external onboarding or calls.

Outcome: no approved corpus found in the inspected repository/local registry;
ordinary source/document/claim approval counts are zero. Owner-arranged review is
explicitly pending, including the existing independent annotation/adjudication
requirements. Final native `npm.cmd run validate:phase7` PASS, exit 0 (584 unit,
152 SQL, 171 Python, 36 browser tests and the documented Auth/parser/model checks).
No further application changes were needed. P41/Phase 7 remain formally PARTIAL
on the named manual/evaluation gates; no Phase 8 or unauthorized external actions.

## Phase 7 remaining remediation and verification

Owner requested completing Phase 7 after the adapter. Reuse the existing reviewed
claim/evidence records for a narrow server-side support decision projection; bind
every decision to the exact generated text, language, evidence version and quote.
Recheck support at delivery and deny stale/revoked/contradictory reviews. Preserve
the closed public handler and disabled Vertex transport. Add disposable SQL and
repository/pipeline regression tests, then run the aggregate Phase 7 gate. Update
the report/checkpoint with actual results. Formal acceptance still requires the
unavailable independent official-corpus/human evaluation; do not invent approvals.

Outcome: remaining support repository/runtime composition and two forward
migrations implemented. All component checks pass after fixing a flaky readiness
wait: 584 unit, 152 SQL, 171 Python, 36 browser, 28 Auth/API groups, five guards,
16 parser/OCR checks and three offline model tests. Aggregate invocation failure
history is preserved; no aggregate zero exit is claimed. Independent corpus/human
and live-provider gates keep formal Phase 7 PARTIAL. See the report/checkpoint.
No paid calls, real onboarding, public generation or Phase 8 work was performed.

## Vertex AI provider adapter - owner authorization 2026-10-23

Implement only the approved Google Gemini/Vertex AI transport behind the existing
provider interface, using the official Google Gen AI SDK and deterministic mocks.
Verify current stable Flash availability and SDK contracts. Acceptance: validated
server-only ADC configuration, bounded requests, cancellation, no retries, safe
errors and usage accounting; local unit/types/lint/build checks pass. Keep the
default provider disabled and public generation closed. Cloud project, billing,
credit eligibility and live usage remain unverified and unauthorized. Update the
checkpoint with actual results and stop after the adapter, before further work.

Outcome: adapter implementation/mock verification PASS; 574 unit cases, strict
types, lint, formatting, dependency tree and production build pass. See
[VERTEX_AI](docs/VERTEX_AI.md) and [checkpoint](docs/CODEX_PROGRESS.md). Live Cloud
configuration/credit eligibility and model quality remain unverified. Stopped at
the adapter boundary; no paid call, public activation or further package.

## Complete Phase 7 - owner authorization

Outcome: local aggregate `npm.cmd run validate:phase7` PASS (545 unit, 135 SQL,
171 Python, 36 standalone browser cases, 28 Auth/API groups, five guards,
16 native parser checks and three real offline embedding tests). See
[PHASE_7_REPORT](docs/PHASE_7_REPORT.md). Assessment through P41 is complete;
formal Phase 7 PARTIAL pending live-provider verification, real support review and
independent corpus evaluation. Stop before Phase 8; no public generation enabled.

1. Preserve P35 and Phase 6; inspect source, UI, privacy and evaluation contracts.
2. P36: bounded server-only provider/configuration/prompt/usage ports and deterministic
   mock transport. No unapproved vendor selection or paid requests.
3. P37-P39: structured RAG orchestration using existing retrieval, server-resolved
   citations, batched delivery rechecks and conservative claim approval boundary.
   Fail closed on missing independent support, conflicts, outdated evidence and
   unsupported fees/deadlines; no substring-based claim of semantic entailment.
4. P40: reuse existing conversation UI/state with a validated API adapter, bounded
   ephemeral user context, reset/cancellation/isolation and accessible source/warning
   rendering. Preserve labeled demo; no automatic public activation.
5. P41: deterministic synthetic evaluation and adversarial/failure/budget tests,
   real local HTTP/browser regression, full unit/types/lint/format/build checks.
   Record counts/limits/human review and formal PARTIAL where gates remain unmet.

Acceptance: coherent tested local software through P41; unsupported claims/URLs
cannot pass the independent support boundary, no raw logging/shared chat cache,
all required available checks pass and missing real-provider/human quality evidence
is explicit. Stop before Phase 8; no deployment, commit, paid call or real source.

## P35 secure question API - authorized 2026-10-23

Outcome: PASS locally. [P35_REPORT](docs/P35_REPORT.md) records 18 new tests,
488 total unit cases, one production HTTP case, five development HTTP checks,
types/lint/format/build passing. Production closed; no AI/history enabled. Stop
before P36 and preserve Phase 6's unresolved human/official-corpus quality gate.

Implement only P35, then stop before P36. Inspect and reuse the approved
`POST /api/v1/answers` contract and Phase 6 types. Add strict bounded JSON/Unicode
validation, ephemeral minimization, generated request IDs, conservative process
admission and safe unavailable envelopes. Production stays closed pending trusted
distributed admission, reviewed corpus and generation/citation gates. No AI calls,
database writes, history or public evidence delivery. Acceptance: real HTTP and
unit rejection/language/privacy/abuse/failure tests, types, lint and build pass.

## Owner-supplied logo - 2026-10-23

Use the owner's supplied PNG in the shared header/footer brand instead of the
temporary drawn mark. Preserve the original image and aspect ratio, accessible
home-link name, themes and existing independent-project disclosure. Check image
delivery, both themes and mobile layout, strict types/lint and scoped formatting.
No backend, phase advancement or deployment is included.

Acceptance: the supplied asset renders without distortion or a broken image in
the shared brand; light/dark and mobile pages remain usable. Record actual checks
in the development checkpoint.

Outcome: PASS locally. Shared header/footer use the unchanged owner PNG through
Next.js Image. Strict app/database type checks, scoped lint/format and six shell
tests passed. Actual Chromium image decoding and screenshots checked in both
desktop themes and at 320px; mobile has no horizontal overflow and the optimized
logo response was 1,020 bytes. No production build or full suite rerun for this
asset-only presentation change; no backend or phase status change.

## Authorized completion of Phase 6 - P30-P34

The owner's latest explicit request authorizes all remaining search/retrieval
packages after verified P29. Stop before Phase 7. The screenshot frontend refresh
is complete and verified alongside the final frontend regression.

Outcome, 2026-10-23: implementation through P34 and the complete
`npm.cmd run validate:phase6` aggregate PASS locally (470 unit, 135 SQL, 171 Python,
31 Chromium, 28 Auth/API groups, five guards, 16 native parser checks, three real
model tests). A repeat reproduced metrics/routed passage orders. See
[PHASE_6_REPORT](docs/PHASE_6_REPORT.md). Formal Phase 6 remains **PARTIAL** because
independent held-out real-government relevance evidence is not authorized/available.
Stop before P35. Screenshot refresh PASS; no live collection or deployment.

1. Inspect P29 eligibility, existing embedding schema and complete P30-P34 prompt.
   Verify official local embedding/model and pinned pgvector documentation.
2. P30: compare free multilingual candidates, implement bounded local/offline
   provider interfaces, immutable profile-bound vectors, idempotent approved-passage
   batches and exact filtered cosine search. No paid provider or remote model calls.
3. P31: bounded RRF fusion, stable provenance identity, explicit branch degradation
   and current publication rechecks. P32: deterministic relevance/diversity ranking,
   approved service/authority signals, distinct freshness clocks and conflict holds.
4. P33: conservative approved-directory alias routing, Banglish variants, ambiguity
   and safe general fallback; redact identifier-like inputs before local inference.
5. P34: versioned synthetic functional/model benchmarks with explicit labeling,
   per-language metrics and regressions. Never substitute synthetic relevance for
   an independently reviewed real-government corpus or production-quality gate.
6. Run schema/eligibility/security, provider and pipeline tests, model experiments,
   existing frontend/unit/Python checks, types/lint/format/build and local Git review.
   Update exact evidence, pending human/real-corpus gates and Phase 6 decision.

Acceptance: compatible real local embeddings and persistence/search work; filters
cannot leak ineligible evidence in either branch or final bundle; fusion/routing/
reranking are bounded and tested; failures remain honest; benchmark methodology
and actual findings are reviewable. No answer generation or new public chat API.

## Authorized screenshot frontend refresh - 2026-10-22

The owner requested the supplied English light, Bangla dark homepage and Bangla
About dashboard appearance. This is a scoped frontend refresh, not authorization
to advance to P30. Preserve the demo handoff, published directory adapter, public
routes, independent disclosure, backend work and Git index.

1. Match the reference's serif typography, white/navy and emerald palette,
   spacious centered hero, compact header, question bar and four navigation cards.
2. Add an accessible light/dark switch with only a local theme preference stored;
   retain language switching and keyboard/mobile navigation.
3. Give About the outlined metric/freshness/privacy layout with honest development
   states. Do not fabricate metrics, source approvals or security guarantees.
4. Verify both locales/themes at desktop and small mobile widths, manually inspect
   browser screenshots, run unit/contrast/accessibility/regression checks, strict
   types, lint, formatting and production build. Record actual results.

Acceptance: reference layout reproduced responsively; themes persist without
storing questions; demo and directories still work; no false live-service claims;
checks pass. No deployment, commit, source requests or paid services.

## Authorized P29 - keyword passage retrieval

Completed: **P29 PASS locally**. [P29_REPORT](docs/P29_REPORT.md) records 113 full
SQL cases (27 P29), 365 unit cases, 171 Python, 28 Chromium, 28 real MFA/API/browser
grouped checks and five guards passing, plus strict types/lint/format/build.
Mixed-corpus tests exposed and corrected the existing passage-ID eligibility
binding; a selective synthetic probe exercised the private GIN index. No real
corpus, public endpoint, provider/model, paid service, commit or deployment.
Stop before P30. Phase 6 is not complete.

The owner supplied the P29-P34 attachment on 2026-10-22. Execute its first package,
P29, and honor the explicit stop before P30. Phase 5 local prerequisites pass;
the ordinary database contains no real approved corpus. Use guarded disposable
fixtures and preserve directory search, ingestion, public UI and the staged index.

1. Inspect existing schemas/eligibility/repositories and official PostgreSQL FTS
   guidance. Verify Bangla/combining-mark behavior on both actual database locales.
2. Add one forward SQL migration with a GIN passage text/heading index, safe
   non-stemming keyword query handling, bounded filters/pagination, deterministic
   score components and stable passage UUID tie ordering. No duplicate entities.
3. Expose only a reviewed read projection via a narrowly granted function. Repeat
   current passage/version/source/domain/reviewer/freshness/conflict/metadata gates;
   never grant raw-table access or return private notes/storage keys/identities.
4. Add a server-only typed/Zod retrieval repository using the existing DB pool,
   preserving original query only in request memory. Return exact source/passages,
   locators, separate verification/check timestamps and versioned normalized scores
   usable by future P31. No HTTP/chatbot endpoint, embeddings or UI changes.
5. Test English/Bangla/mixed script, punctuation/phrases, exact-token limitations,
   ranking, filters, limits/paging, malicious/invalid requests, provenance and all
   trust exclusions. Exercise GIN query plans with synthetic data and fail closed
   on DB/contract errors. Run actual SQL, unit, lint, type, format/build/regressions.
6. Update architecture/data/AI/security/evaluation/checkpoint and P29 report with
   commands, measured results and remaining real-corpus/production gates. Stop.

Acceptance: only eligible current evidence can be returned through the restricted
projection; Bangla survives normalization; pagination/ranking are deterministic;
all important validation/leakage/failure cases pass; GIN is exercised; no real
government data, persistent raw questions, paid call, commit or deployment.

## Authorized Phase 5 completion — P23–P28

Completed: **P22-P28 PASS in the local implementation/test scope**.
[PHASE_5_REPORT](docs/PHASE_5_REPORT.md) records 86 SQL, 171 Python, 16 native
parser/OCR, 315 Vitest, 28 Chromium, 28 real MFA/API/browser grouped checks and
five guards passing, plus build/types/lint/format/dependency validation. No live
source, cloud, paid call, commit or deployment. Stop before P29/Phase 6.

The owner explicitly requested the whole remaining phase, superseding the earlier
P22/P23 automatic-advance stops. Implement P23–P28 from the approved roadmap;
the supplied attachment contains only the beginning of P23. Preserve P22 and
all earlier public functionality. Stop before P29/Phase 6. No live government
fetch, real source onboarding, paid APIs, cloud provision, deployment or commits.

1. P23: bounded, offline HTML extraction with structure/link provenance, Bangla/
   English support and quality flags; no external resource fetch or script execution.
2. P24: licensed PDF text extraction with physical page/label/metadata preservation,
   rejection of encrypted/active/oversized content, disposable parser isolation.
3. P25: conditional local Bengali/English OCR with page image/engine/traineddata
   lineage, strict time/pixel/page limits, deterministic and real synthetic tests.
4. P26: conservative Unicode cleaning, source-offset maps, bounded page/section
   passage segmentation and extraction quality/review quarantine.
5. P27: private content-addressed snapshots/derivatives; immutable SQL versions and
   passages; durable leased/fenced jobs, idempotency, dedup and indexing outbox.
   Prepare indexes/jobs only; embeddings/search belong to Phase 6.
6. P28: source freshness/adverse observations, due-job scheduling, bounded retries,
   dead letters, structured metadata-only metrics/events and an emergency stop.
   Keep live execution disabled; all source I/O in verification is simulated.
7. Audit the full phase, fix confirmed defects, run real migration/integration,
   extraction/OCR/security and frontend quality regressions, update checkpoint and
   docs/PHASE_5_REPORT.md with actual counts and operational limitations.

Acceptance: permitted synthetic HTML/text PDFs/scans produce immutable traceable
private artifacts and locatable passages; malformed/unsafe/low-quality content
fails or remains quarantined; jobs survive retry/restart/lease theft without stale
commits; no worker can publish/approve evidence; changes/withdrawals suppress old
evidence immediately; all available required checks pass. Production egress,
real-world language quality and hosted CI remain separately evidenced gates.

## Historical authorized P22 — secure retrieval boundary

Implementation and local verification now PASS; see [P22_REPORT](docs/P22_REPORT.md).
Actual results: 70 SQL, 127 Python, 315 Vitest, 28 Chromium and five local-guard
cases pass, plus build, strict types, lint and formatting. Default runtime stays
disabled. No live source requests, source onboarding, cloud, commit or P23 work.

The owner supplied the P22 implementation prompt on 2026-10-21. Implement P22
only, preserving Phase 4 and the staged index; stop before P23. The attachment
also contains an incomplete P23 outline; it is not part of this task. No live
crawling, source onboarding, cloud activation, paid calls, deployment or commits.

1. Inspect registry, SQL provenance, permissions and Python conventions; verify
   changing transport assumptions against official Python/OWASP documentation.
2. Add an isolated worker package: registry authorization, strict exact-URL scope,
   public-address validation, DNS-pinned TLS transport with peer checks, robots
   restrictions, bounded retrieval/cancellation and sanitized results.
3. Add one canonical forward SQL migration for reviewed per-source exact URL
   policies, durable per-hop reservation budgets and private retrieval manifests.
   Worker SQL functions must not publish evidence or modify staff/source approval.
4. Exercise deterministic transport simulations, malicious URLs/DNS/redirects,
   response limits, permissions, robots, cancellation and failure persistence.
   Replay/test SQL on guarded disposable local databases; run relevant existing
   Python/frontend/quality/build checks and update P22 evidence/checkpoint.

Acceptance: unapproved sources fail before DNS, each connection uses only a
validated IP with hostname TLS and peer verification, redirects repeat all gates,
budgets survive worker restarts, retrieval metadata is private, tests pass and
no live source request runs. Infrastructure egress deployment is unconfigured;
production networking stays blocked until separately reviewed and authorized.

## Authorized Phase 4 completion — P19-P21

The owner requested finishing Phase 4. Preserve P18 and the staged index; stop
before Phase 5/P22. No cloud, paid calls, commits, deployment, crawling or real
source approval. Implement using guarded synthetic fixtures; public empty/error
states remain honest until separately evidenced content is approved.
The owner confirmed **implementation and tests only** when asked about real
onboarding. Acceptance here is local implementation readiness, not production
coverage, staffed review or source-site verification.

Completed: **P19/P20/P21 PASS in that local scope**, preserving P18 PASS. See
[PHASE_4_REPORT](docs/PHASE_4_REPORT.md). Actual final checks: 60 SQL, 315 Vitest,
28 real MFA/API/browser grouped checks, 28 frontend Chromium cases, five guards
and nine Python cases pass; strict types/lint/build pass. Five new forward SQL
migrations, no new dependency. Real content/networking/remote CI remain unverified.
Stop before P22. No deployment, paid service, commit, push or real source approval.

1. P19: extend SQL-first staff commands for agencies/categories/services with
   translations, reviewed aliases and source/agency/category relationships.
   Reuse MFA sessions, actor-bound retry/budget records and audit infrastructure.
   Independent, evidence-backed metadata release must follow edits; privileged
   status fields are never client-controlled. Preserve document eligibility.
2. P20: extend bounded public queries with normalized keyword/alias search,
   related-source filtering and cursor bindings. Connect current bn/en routes in
   explicitly configured published mode; keep the existing demo usable without
   DB credentials. Use request-time server queries, safe links, pagination,
   accessible filters and honest unavailable/unknown states.
3. P21: integrate append-only verification/link-health history and review flags.
   Default network checking to blocked: no transport may fetch until destination
   IP pinning/redirect restrictions and approved permission policy are implemented.
   Exercise deterministic offline failure/redirect/timeout/SSRF classifications;
   health never grants ownership, publication or crawler permission.
4. Verify real migrations/constraints/RLS/release revocation, protected HTTP,
   search quality, public routes/mobile/keyboard/axe, units, Python, types, lint,
   formatting, build, docs, dependencies and whitespace. Record actual evidence
   and production coverage/manual-review gaps in docs/PHASE_4_REPORT.md and progress.

Acceptance: independent metadata review and source relationships fail closed;
aliases/filters/pagination work on eligible rows; no private/draft metadata leaks;
published frontend consumes reviewed DB data without AI or citizen login; health
history and integrity diagnostics work; required local checks pass. Distinguish
implementation readiness from real staffed/approved source coverage and remote CI.

## Authorized P18 — verified-source registry, 2026-10-21

The owner requested P18 after confirming Phase 3 completion. Stop after P18;
P19–P21, real source onboarding, external source checks and production approvals
are not authorized by this implementation task. Preserve the owner-staged index.

1. Extend existing sources/domains/verifications with candidate metadata and a
   separate review lifecycle. Keep immutable URL/provenance identities and the
   existing private evidence/public projection boundaries.
2. Add narrow staff functions and API operations for candidate creation/edit,
   submission, verified approval, activation, rejection and suspension. Enforce
   active MFA-bound sessions, roles, fresh authentication for approval/activation,
   optimistic revisions, idempotency and atomic append-only audit/outbox events.
3. Require evidenced ownership/authority/use review and independent reviewers;
   critical activation needs a second reviewer. Unknown availability/crawl rights
   stay unknown. Material edits reset approval and immediately withhold public rows.
4. Validate HTTPS/IDNA/host/path/query identities without DNS or HTTP requests.
   Reject unsafe schemes, credentials, local/IP destinations and ambiguity. No
   governmental suffix automatically verifies anything. Keep notes/actors private.
5. Exercise real SQL allow/deny/state/idempotency/audit/public-filter cases plus
   actual MFA/HTTP mutations with disposable synthetic fixtures. Run existing
   regression/type/lint/format/build/docs/credential checks; record exact evidence
   in docs/P18_REPORT.md and progress. Do not claim remote CI or live source checks.

Acceptance: no automatic candidate trust, invalid/self/unauthorized transitions
denied, failed mutations atomic, retries safe, evidence preserved, rejected/
suspended/changed sources excluded, public responses sanitized, real tests pass.

Completed P18: **PASS locally**, see [P18_REPORT](docs/P18_REPORT.md).
50 DB, five guards, 263 Vitest, 23 real MFA/HTTP, 28 Chromium and nine Python
checks pass; strict types/lint/format/build and dependency consistency pass.
Coverage workers are bounded to two; a browser navigation race was corrected.
Three forward migrations preserve prior history and prevent risk downgrades
from removing second review. No dependency or real source was added. After the
initial automatic approval block, the owner authorized npm metadata submission.
Fresh audit commands completed: zero production findings, five high dev-chain
findings, zero critical. Dependencies/lockfile remain unchanged; scoped tooling
remediation is open. Remote CI is unverified. Stop before P19.

## Authorized Phase 3 completion: P16 then P17 — 2026-10-20

Completed: **P16/P17 PASS locally**. See [PHASE_3_REPORT](docs/PHASE_3_REPORT.md).
40 DB tests, five guards, 227 unit/component cases, 19 real provider/HTTP checks,
28 Chromium cases and nine Python cases pass; strict types/lint/format/build,
real generated types, dependency consistency, YAML/docs and Git whitespace pass.
Five existing high dev advisories remain; production audit zero. Remote CI and
production identity/recovery remain unverified. No real source/user publication,
cloud provisioning, deployment or Git write. Stop before P18.

The owner's “Finish it” authorizes the remaining Phase 3 prerequisites identified
in the preceding response. Complete P16 before P17; stop before P18. Preserve the
P14/P15 SQL-first foundation and the independent Phase 2 demo. No remote identity
provisioning, source onboarding, cloud services, paid calls, deployment or Git writes.

1. P16: use Supabase Auth with server-only cookie sessions, MFA, trusted private
   memberships and bounded session metadata. Add protected `/admin` and identity
   endpoints, origin-checked login/MFA/logout, restrictive grants and real DB
   allow/deny tests. No open signup, role-assignment API or full dashboard.
2. Verify P16 using synthetic local identities, real provider integration where
   the local runtime permits, authorization/session tests, strict types and lint.
   Do not claim provider behavior from mocks. Record any actual blocker.
3. P17 after P16 passes: add reviewed, allowlisted public metadata projections,
   typed repositories and bounded validated read-only API contracts. Raw evidence,
   notes, storage keys, embeddings and actionable guidance remain private. Keep
   the frontend demo independent; provide an explicit API adapter boundary.
4. Verify migration replay, SQL privileges/RLS, public filtering/revocation,
   API contracts/failures, authentication, frontend regressions, Python, formatting,
   strict types, build, docs, dependencies and Git whitespace. Update progress,
   security/database/architecture/setup docs and `docs/PHASE_3_REPORT.md` with
   actual commands and counts. Remote CI is unverified until a real hosted run.

Acceptance: verified staff login/MFA/logout and revoked/expired/unauthorized denial;
private tables inaccessible to public clients; only reviewed metadata returned;
safe failures never masquerade as empty results; all required local checks pass.
If a critical prerequisite cannot be completed, report PARTIAL and stop dependent
work rather than silently weakening it.

## Authorized P14 completion followed by P15

Latest status: **P14 and P15 PASS locally**; see [P14_REPORT](docs/P14_REPORT.md)
and [P15_REPORT](docs/P15_REPORT.md). Three canonical migrations, 24 private tables,
28 real DB tests, five guards, 195 unit/component tests, 28 browser cases and nine
Python cases pass, with generated types/lint/strict types/format/build checks.
The browser suite required the normal Windows process context for clean teardown.
Stop at P15. P16/P17 and full Phase 3 completion are not claimed. Runtime
investigation and the original plan below are historical, not remaining tasks.

The owner explicitly requested completing P14 and proceeding to P15. Resolve the
missing local runtime first; no P15 implementation until real P14 migration and
security tests pass. Inspect WSL/virtualization, install the supported local
prerequisites where possible, then run local startup, migration/replay/constraint/
permission/concurrency tests and type generation. A host elevation, restart or
virtualization blocker must be recorded accurately; never substitute a remote DB.

Runtime remediation: WSL 3.0.3.0 verified and installed (exit 0); Virtual Machine
Platform enabled (DISM exit 3010, restart required and suppressed). Docker Desktop
4.95.0.242831 installed (exit 0), CLI 29.8.2 verified; engine cannot start before
restart. Resume real verification after the required host restart.

After P14 PASS, inspect P15 source/evidence contracts; add one forward SQL
migration for immutable document versions/passages, verification, claims/evidence,
conflicts and model-aware embeddings with private defaults. Add synthetic real DB
tests for provenance, lifecycle, preservation and invalid references. Run database,
frontend, quality and build checks; update the schema/AI/source/progress docs and
P15 report with actual results. Stop after P15; P16 is not authorized here.

## Historical P14 foundation plan and original blocker

Status: authored foundation, **PARTIAL** until real local PostgreSQL verification;
see [P14_REPORT](docs/P14_REPORT.md). Initial runtime absence is historical;
WSL/Docker are now installed but require Windows restart before engine startup.

The owner supplied the complete P14-P17 package. Honor P14's stop: P15-P17 are
not started automatically. Phase 2's local PASS is the baseline. No DB/toolkit
exists; preserve SQL-first migrations, normalized translation rows and many-to-many
service/category links from Phase 0 rather than duplicating bilingual columns.

1. Inspect core contracts, source policy, security, local tooling, env/tests/CI/Git.
2. Compare Supabase and Cloud SQL; select Supabase-compatible PostgreSQL with
   its pinned local CLI and one SQL migration tree, without cloud activation.
3. Implement private core tables, translations, relation constraints, hierarchy
   safety, indexes, deny-by-default grants/RLS and synthetic-only test fixtures.
4. Add lazy server-only pooled PostgreSQL access, validated optional configuration,
   sanitized failures and explicit transactions; keep the frontend DB-independent.
5. Add local-only CLI wrappers and a disposable-database integration suite. Never
   reset a linked DB; commands must reject remote targets and unrecognized flags.
6. Run available unit/frontend/type/lint/format/build/doc/security checks. Report
   actual migration tests separately from mocks/static checks. Docker-compatible
   runtime and PostgreSQL executables were not found; no database execution PASS
   may be claimed until a real disposable local PostgreSQL run succeeds.
7. Document schema/ERD, provider decision, workflows, actual results and blockers;
   update progress, then stop at P14 with PASS/PARTIAL/FAIL based on evidence.

Acceptance: real PostgreSQL migration/constraint/permission checks plus available
quality checks pass; secure config, no public/raw data exposure, accurate docs,
frontend preserved, no real government data/credentials/paid infrastructure.

## Historical Phase 2 plan

## Authorized P09-P13 batch — 2026-10-19

The owner explicitly requested P09 through P13. Their individual automatic-advance
stops are superseded for this batch only. P08 is the locally passing baseline.
Stop after P13; P14 remains separate and its prompt is incomplete.

Status: **P09-P13 PASS locally**. See [PHASE_2_REPORT](docs/PHASE_2_REPORT.md)
for actual verification and remaining human/device/production gates.

1. P09: complete the localized homepage, suggested questions, eight priority
   discovery cards and in-memory question handoff; test without URLs/storage.
2. P10: typed structured answers/source cards and cancellable local demo adapter;
   bounded transient conversation, IME-safe composer, honest feedback and retry.
3. P11: central bilingual 16-category taxonomy, clearly labeled preparation
   service records, directory search/filter/detail templates, empty agency views.
4. P12: source/guide templates, information/trust/draft policies, local-only
   feedback validation and honest disconnected status. No invented official data.
5. P13: test routes/navigation, both locales and six widths, privacy, keyboard,
   accessibility/reflow and measured transfer; inspect real screenshots, fix defects,
   run all quality/build checks and write the Phase 2 report and progress checkpoint.

Acceptance: P09-P13 interactions and routes work; no fabricated guidance, outbound
question requests, persistent drafts, backend/DB/AI or deployment. All required
available checks pass; report human screen-reader/device/translation limitations.
Preserve existing owner work and staged index. Existing Phase 1/P08 history below.

## Historical P08 and Phase 1 plan

Status: Phase 1 P04-P07 passed local checks; see
[PHASE_1_REPORT](docs/PHASE_1_REPORT.md). The owner supplied the Phase 2 package
on 2026-10-19. **P08 passed local checks**; see [P08_REPORT](docs/P08_REPORT.md).
Honor its explicit stop before P09; Phase 2 as a whole is not complete.
No commit, push, deployment or paid activation. Updated: 2026-10-19 (Asia/Dhaka).

## Authorized scope

Current P08 scope and sequence:

1. Inspect the approved product, architecture, design, security and Phase 1
   evidence; preserve owner files and the fourteen preexisting staged entries.
2. Verify current Next/shadcn/Tailwind guidance and licensed font assets. Keep
   npm workspaces and the existing framework; add only required UI primitives.
3. Centralize measured light-mode tokens, self-host Bangla/Latin fonts, and build
   reusable controls plus the responsive header/footer/skip link.
4. Implement typed bn/en dictionaries and server-rendered locale roots; `/`
   selects `/bn`. Language links preserve the resource path and drop query/hash.
   Required navigation destinations get explicit preparation-state shells only;
   unknown paths/locales return 404. No complete P09-P12 page or live service.
5. Verify components, keyboard focus, language switching, responsive widths
   320/375/390/768/1024/1440, contrast, fonts and production build. Use actual
   browser screenshots for visual review; report assistive-tech/device limits.
6. Record tokens, components, dependency/license decisions and actual checks in
   docs/DESIGN_SYSTEM.md and docs/CODEX_PROGRESS.md; recommend P09 and stop.

P08 acceptance: consistent tokens and typography; usable shared components;
responsive bilingual shell with functional navigation/locale switch; measured
contrast, visible keyboard focus and independent-project disclosures; passing
relevant tests/type/lint/format/build; no AI, ingestion, DB, auth, admin or deployment.

The completed Phase 1 sequence is retained below as history:

1. P05: compatible ESLint flat configuration, scoped Prettier, strict type checks,
   one lockfile and least-privilege GitHub Actions configuration. Verify format,
   lint, typecheck and production build; do not claim remote CI has run.
2. P06: Vitest/unit/component tests, Chromium Playwright smoke tests, lightweight
   isolated Pytest and CI test steps. Use synthetic/local fixtures only. Verify
   test failures return nonzero; no government or paid-provider requests.
3. P07: validate actually supported environment settings with safe server/client
   boundaries, document example settings and scripts, run aggregate checks and
   record docs/PHASE_1_REPORT.md plus the progress checkpoint with actual results.

Preserve owner files (including masterprompt.txt), the preexisting Git index and
the approved architecture. P08 changes the shell; later frontend pages remain gated.
Do not weaken compiler rules or skip failures; document necessary compatibility
changes. P03 trust/data follow-ups remain gates before their later features.

The completed P04 scope below is retained as historical evidence:

Current P04 scope: initialize one Next.js App Router/strict TypeScript/Tailwind
application under apps/web, npm workspaces with one root lockfile, minimal local
scripts, reserved future subsystem directories, a minimal Bangla foundation page,
updated setup documentation and an honest CODEX_PROGRESS checkpoint. Verify install,
workspace recognition, development page, typecheck, production build and scoped
Git/secret hygiene. No commit, push, deployment, live sources, AI, DB or auth.

P04 sequence: inspect and verify official setup guidance; select compatible pinned
packages; create workspace and minimal app; install at root; run development and
production checks; review security/scope and record actual results; stop before P05.

The original Phase 0 scope below is retained as historical planning evidence:

Inspect the repository and inherited instructions; check the proposed stack using
official technical documentation; create the thirteen requested planning files;
create a small offline documentation validator; review cross-document consistency,
all thirty product capabilities, and trust boundaries. Do not create application code.

## Work packages and acceptance

| Work | Acceptance | State |
| --- | --- | --- |
| Repository discovery | Existing files/instructions and Git constraints recorded | Complete |
| Product and experience | All 30 requirements, sitemap, language model, accessibility, and phase gates documented | Complete |
| Architecture and data | Component boundaries, API contracts, entities, lifecycle, ingestion, retrieval, scale/cost decisions documented | Complete |
| Trust and operations | Source verification/freshness, privacy/security, evaluation, deployment/rollback and spending controls specified | Complete |
| Consistency and validation | Required-file and local-link checks pass; semantic review recorded honestly | Complete |
| Handoff | Risks, assumptions, file inventory, actual checks, and first Phase 1 task reported; stop | Complete; awaiting user review |

## Evidence and decision rules

Technical documentation can establish compatibility, not a tested integration.
Version pins, model/provider selection, government source approval, launch coverage,
hosting region, costs, legal review, and operational budgets remain proposals until
verified and approved in the relevant phase. No government service facts are seeded.

## Phase boundary

Phase 0 approval was explicitly received after the read-only audit. The prior
audit decision remains PARTIAL for full product implementation contracts; P03
follow-ups are deferred to their relevant feature gates, not marked resolved.
Phase 1 is complete locally. Current authorization advances only through P08's
shared design and shell foundation, then stops before P09. See
[ROADMAP](docs/ROADMAP.md) for its acceptance criteria and explicit stop points.

## Repository findings and checkpoint

The project directory was empty at inspection. No applicable AGENTS.md was found
in the inspected workspace or ancestor paths. Git initially discovered a repository
at the user's home directory and failed access/ownership checks. An isolated
repository was initialized inside this project on `main` so project review does
not modify the home repository. A command-local safe.directory exception permits
review of this exact project; no global Git configuration was changed.

There is no configured Git author identity. No author was invented and no commit
was created. The fourteen deliverable files are staged for review; creating the
first commit with the user's chosen identity remains a Phase 1 setup task.

## Created file inventory

All thirteen requested files were newly created:

- AGENTS.md
- README.md
- PLANS.md
- docs/PRD.md
- docs/ARCHITECTURE.md
- docs/DATABASE.md
- docs/DESIGN_SYSTEM.md
- docs/SOURCE_POLICY.md
- docs/SECURITY.md
- docs/AI_SYSTEM.md
- docs/EVALUATION.md
- docs/DEPLOYMENT.md
- docs/ROADMAP.md

Additional deliverable: scripts/validate_docs.py, a standard-library-only offline
documentation harness. Local .git metadata was also initialized. No application
code, package/lockfiles, migrations, secrets, government data or deployment exists.

## Validation performed (2026-10-18)

- `python -B scripts/validate_docs.py`: passed all thirteen required documents,
  146 local file links, CAP-01 through CAP-30, Phase 0 through Phase 12, and future
  scope. Checks include readable UTF-8 and document titles. Anchor targets and
  external URLs are outside the harness's scope.
- Temporary-fixture checks passed for a valid copied package and six negative
  cases: missing file, invalid UTF-8, broken local link, path escaping the fixture,
  incorrect capability ID, and missing phase. The fixture was removed afterward.
- Git staged-diff whitespace validation and a narrow high-confidence secret
  pattern sweep are recorded at handoff; these do not constitute security testing.
- Manual cross-document review mapped all thirty capabilities and reconciled
  locale/routes, lifecycle enums, API fields, data ownership, phase sequencing,
  retention, evidence clocks, outages and release metrics. Review found and fixed
  search-query URLs, local-vs-global citation IDs, transaction-start freshness,
  critical-fact constraints, derived extraction/chunking version identity, and
  Phase 4 metadata versus Phase 5 actionable evidence sequencing.
- Official technical documentation was read for stack compatibility, extraction
  licenses, retrieval, security, backup and accessibility. Exact primary links
  and check dates are embedded beside the relevant decisions.

No application, browser, provider, database, model-quality, penetration, performance,
or government-source verification test ran. Planned targets are not measured
results. The documentation validator cannot establish semantic correctness,
legal compliance, factual government accuracy or production readiness.

## Significant open decisions and risks

- Official source accessibility, ownership, reuse terms, conflicts and freshness
  need actual source-by-source evidence and funded reviewer capacity.
- Bangla/Banglish retrieval, OCR digits/tables, translation and natural-language
  entailment remain unmeasured. Initial fees/deadlines/eligibility require curated
  reviewed fact atoms; automated validation alone cannot guarantee correctness.
- Tailwind 4's browser floor needs device research and an agreed supported-browser
  decision. Font shaping/size and assistive-technology checks remain open.
- PyMuPDF licensing needs review or an evaluated alternative; worker separation
  does not resolve licensing. Worker dependency pins remain unselected; P04 web
  pins and actual compatibility checks are recorded in docs/CODEX_PROGRESS.md.
- Hosting/region, processor privacy terms, backup coverage, real-user consent,
  staffing, numeric budgets and operating objectives require approval/evidence.
- Privacy-first provenance intentionally omits generated answer wording; metadata
  cannot reconstruct the exact answer later. Richer capture requires a separately
  approved privacy purpose and retention policy.

## P04 historical acceptance checklist

- npm recognizes the web workspace and one root package-lock.json governs installs.
- The minimal app renders without secrets, external data or runtime network fetches.
- App Router, src layout, import alias and strict TypeScript are configured.
- Tailwind/PostCSS compile and the page adapts to a narrow viewport.
- Development startup, typecheck and production build have actual recorded results.
- Existing Phase 0 specifications are preserved; current authorization/setup records
  are updated without claiming unimplemented audit corrections are complete.
- docs/CODEX_PROGRESS.md records results, limitations and P05 as the next proposal.
- No automatic Git staging/commit/push, P05 work or deployment is performed.

Installed tools observed: Node.js v24.22.0; npm 11.19.1 via npm.cmd. PowerShell
blocks npm.ps1; npm.cmd works without changing execution policy. Selected package
pins and final verification results are recorded in docs/CODEX_PROGRESS.md.

The P04 foundation targets the documented Next.js/Tailwind 4 modern-browser floor
(Chrome/Edge 111+, Safari 16.4+, Firefox 128+). This is a development baseline;
actual low-end-device coverage and any broader support remain Phase 2 review gates.
Keep CSS readable without external fonts or optional bleeding-edge utilities.

Outstanding P03 gates: complete actionable claim/scope/revision contracts and
independent citation lifecycle before schema/answer features; define durable
recovery/deletion/spend reconciliation before recovery/beta; define redaction,
distributed limits, staff capabilities, feedback/retry/multiturn and OCR derivative
contracts before their owning features. Reconcile category/trust routes and the
owner's initial service priorities in later documentation work. No source is verified.
