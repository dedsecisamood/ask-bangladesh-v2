# Ask Bangladesh development checkpoint

## Pre-Phase-9 audit - 2026-10-24 (Asia/Dhaka)

Owner requested rechecking all earlier phases and fixing issues. Confirmed fixes:
complete questions no longer inherit/discard prior service topics as follow-ups;
admin forms/directory search now have bounded body-read time and strict UTF-8;
minimum structured correction intake/private queue now exists with a separate
askbd_feedback role, API-mode bilingual UI and production gate closed. Free text,
citizen IDs, contacts and chat content are not collected. Applied two additive
local migrations and regenerated types. Stale overview prose corrected.

Focused checks PASS 72 tests; updated types PASS. Initial TypeScript fixture and
two SQL SET-role fixture failures were corrected without changing security
permissions. Fresh authorized npm audit returned zero vulnerabilities. Limited
worktree scan: 341 text files, zero local database-secret/private-key-block matches.
Clean final native `npm.cmd run validate:phase8` **PASS, exit 0**: 724 unit tests,
156 SQL cases, five guards, 171 Python tests, 36 frontend plus seven API-mode UI
cases, 28 Auth/API groups, 16 parser/OCR checks and three offline model/SQL tests.
Build, dependency checks, types, lint, formatting and scoped coverage passed.
Initial full run had one new locator collision with Next's route announcer; it
was fixed, the UI suite reran PASS and the clean full aggregate then passed. Logs
retain all failures: `.cache/pre-phase9/full-validation.log`, `ui-recheck.log` and
final authority `.cache/pre-phase9/final-validation.log`.

Post-test read-only state: 44/44 forced-RLS private tables, 36 applied migrations,
zero ordinary sources/documents/feedback and zero disposable test databases.
Feedback writer has no login/raw read; public reader has no intake permission.
No new production identity, real corpus, paid call, cloud service, commit or push.
The local pre-Phase-9 audit/remediation decision is PASS in this limited scope;
see [audit](PRE_PHASE_9_AUDIT.md). Stop before Phase 9. Formal Phases 6-8
remain PARTIAL on approved official corpus, independent human and provider gates.

## Earlier checkpoint: Phase 8 local engineering complete - 2026-10-24 (Asia/Dhaka)

Owner now authorizes completing P43-P45 after P42. Local bounded normalization,
language/context selection, minimized generation wording, multilingual warnings
and synthetic evaluation/review export are implemented. Initial focused regression
PASS 84 tests; `test:phase8` PASS 105 tests. Final native
`npm.cmd run validate:phase8` **PASS, exit 0**: 707 unit/component tests, scoped
coverage 93.1% functions, 152 SQL tests, five guards, 171 Python tests, 36 frontend
and six chat UI browser tests, 28 real local Auth/API groups, 16 parser/OCR checks
and three actual offline model/PostgreSQL tests. Dependency checks, formatting,
lint, types, docs and production build (124 pages) passed. Logs:
`.cache/phase8/final-validation-native.log`. Initial sandboxed aggregate passed
the 36 frontend assertions but failed teardown (exit 1); scoped cleanup and native
rerun passed without relaxing assertions or timeouts. That failure is preserved
in `final-validation.log`. Original staged work is preserved.

P42-P44 PASS locally; P45 technical implementation complete, formal PARTIAL.
Synthetic metrics: routing/language selection 31/31 each, mock RAG 30/30, abstention
24/24, citations 6/6, language follow-ups 3/3 and unsupported fees/deadlines 6/6.
These are engineering results, not production quality or independent human review.
The 61-case hashed review export has blank reviewer/approval fields. Fresh verified
local registry read found 0 sources/documents/versions/claims; no approved corpus
was found in the inspected scope. Hosted CI and live-provider evaluation not run.
See [Phase 8 report](PHASE_8_REPORT.md). Stop before Phase 9. Formal Phase 7 and
Phase 8 remain PARTIAL on existing official-corpus, independent human and live
provider evidence. No real data onboarding, paid calls or deployment authorized.

## Earlier checkpoint: P42 local PASS - 2026-10-24 (Asia/Dhaka)

The owner's attached Phase 8 instructions explicitly authorize P42 engineering
while Phase 7 remains formally PARTIAL. P42 is complete in its technical/local
scope; **stop before P43**. Phase 8 remains incomplete; P43-P45 were assessed,
not implemented. See [P42 report](P42_REPORT.md) for the full findings and limits.

Localized evidence language/type/page/date presentation and unknown states,
accurate source language tags, explicit LTR roots, named Bengali fallback fonts
and exhaustive warning translations preserve existing routes, design and trust
boundaries. No dependencies, migrations, live provider or source onboarding.

Actual verification: `npm.cmd run test:unit` and `test:coverage` PASS 600 tests /
36 files, scoped function coverage 93.1%; `typecheck`, `lint`, `format:check` and
`build` PASS (124 static pages). `test:e2e` PASS 36 Chromium cases and
`test:phase7:ui` PASS five cases; combined native browser command exit 0. Initial
browser run was 34/35 with the old combined route-inventory case timing out.
Splitting it by locale preserved all assertions and the existing timeout; final
run passed. Initial formatting issue was corrected. Local mobile snapshots were
inspected, including blocked-font Bangla rendering; this is agent visual review.
Logs: `.cache/phase7/p42-*.log`; snapshots: `.cache/p42`.

Full SQL/Auth/Python/parser/model aggregate was not rerun for frontend-only work;
previous Phase 7 aggregate evidence below remains historical. Unit/mock and chat
UI regressions were rerun. Independent translation review, real-device/assistive
technology review, approved official corpus, human grounding evaluations and live
Vertex verification remain pending. Formal P41/Phase 7 remains PARTIAL on its
existing gates; public guidance and the real provider remain closed. No paid
calls, deployment, commit or push. Recommended next engineering package: P43,
only after explicit owner authorization.

## Phase 7 status recheck - 2026-10-24 (Asia/Dhaka)

Owner again requested completing Phase 7. Inspected current instructions,
checkpoint, review worksheet and versioned evaluation file inventory. No new
approved corpus manifest, confirmed independent reviewer or completed acceptance
results were found in the inspected repository or supplied in the conversation.
The last local registry inspection remains the 2026-10-23 inspection below; it
was not repeated for this documentation-only status check. No further authorized
coding work was identified. Preserve the clean final aggregate exit-0 evidence
below; do not rerun unchanged suites to imply progress on human acceptance.

Formal P41/Phase 7 remains PARTIAL on P41-HUMAN, P41-CORPUS, P41-QUALITY and
LIVE-PROVIDER. Next actions are the owner-arranged independent review coverage,
approved versioned official corpus and resulting evaluations; live testing also
requires the previously documented configuration/billing and explicit approval.
No approval/result is inferred from this repeat completion request. Public
generation stays closed; no paid call, onboarding, deployment or Phase 8 work.

Updated: during the 2026-10-22/23 local implementation run (Asia/Dhaka).

## P41 manual gates confirmed by owner

The owner confirms no independent reviewer or formally approved evaluation corpus
has been appointed/approved. The owner will arrange an independent reviewer with
Bangla, Banglish and English proficiency and government-service verification
knowledge. Do not substitute automated judgments or invent an identity/approval.

Repository inspection found the versioned Phase 6 regression set explicitly
synthetic/not human adjudicated and the P41 artifact explicitly deterministic
mock/engineering-only. Read-only inspection of the ordinary loopback registry
found **0 sources, 0 active nonsynthetic sources, 0 approved verifications,
0 approved nonsynthetic documents, 0 approved document versions, 0 published
reviewed claims and 0 claim-evidence records**; ingestion paused. No approved,
versioned official corpus was found in this inspected scope. Remote resources
were not accessed. Initial real scope remains e-passport, NID and land services.

Explicit acceptance blockers:

- **P41-HUMAN:** owner-arranged independent reviewer not confirmed; qualification,
  independence, signed findings and adjudication evidence pending.
- **P41-CORPUS:** approved versioned official corpus absent; source approvals,
  document/version hashes, passage provenance and frozen dataset manifest pending.
- **P41-QUALITY:** required real-corpus evaluations, denominators, repeated runs
  and independent human outcomes absent. Synthetic results cannot close this gate.
- **LIVE-PROVIDER:** project/ADC, privacy/location, billing/credit verification
  and explicit live-call authorization remain pending; real Gemini disabled.

Existing EVALUATION specifies 300 held-out cases (180 answerable / 120 otherwise),
two independent annotations per answerable case with adjudication, and repeated
runs. The owner's planned reviewer is not a completed appointment or waiver of
these criteria. Required review coverage remains an owner-arranged manual action.

Remaining local code was already completed in the preceding follow-up; no further
application changes were needed. The complete final native-shell
`npm.cmd run validate:phase7` **PASS, exit 0** is recorded in
`.cache/phase7/p41-final-verification.log`. Actual totals: 584 unit/component tests,
152 disposable SQL tests, 171 Python tests, 32 default plus four API-mode Chromium
tests, 28 real local Auth/API groups, five guards, 16 parser/OCR checks and three
real offline embedding/SQL tests. Types, lint, formatting, dependency checks,
scoped coverage (93.1% functions), documentation and production build passed.
This closes the aggregate verification uncertainty from the earlier failed runs;
those failures and their remediation remain preserved below. The 18-case mock
review export remains engineering-only, with human review pending.
Final cleanup reconfirmed zero ordinary sources/documents/claims/vectors, zero
Auth users and zero disposable databases; ingestion paused. Owned Auth stopped;
only the existing PostgreSQL container remains running. All 14 original staged
entries retained. Final docs/link and working/staged whitespace checks PASS.
P41 and Phase 7 remain formally PARTIAL until all required acceptance evidence
exists. No Phase 8, real onboarding, paid calls or external operations authorized.

## Phase 7 completion follow-up - 2026-10-23

Owner requested completing the remaining Phase 7 work after the Vertex adapter.
Implemented the real reviewed-claim repository (`answers/review.ts`) and prepared
disabled server composition (`answers/runtime.ts`). Two forward SQL migrations
add/harden a narrow read-only support projection over existing claim/evidence
records. No new tables, administrative writes, credentials or public activation.
Support requires exact independently reviewed curated text/type/language and
current eligible versions/hashes/quotes, published service, no contradictions and
no unresolved applicability. Critical claims require an additional independent
evidence reviewer. Later membership changes invalidate old reviews, including
revoke/reactivate. RAG rechecks support after delivery eligibility checks.

Added nine repository tests, one pipeline withdrawal regression and 17 actual
SQL cases. The review exporter/worksheet preserves 18 synthetic mock cases without
overwriting annotations. See [PHASE_7_REPORT](PHASE_7_REPORT.md) and
[P41_HUMAN_REVIEW](P41_HUMAN_REVIEW.md).

Actual verification: the first `npm.cmd run validate:phase7` log reports all
checks passing: 584 unit/component tests in 34 files, 93.1% scoped function
coverage with unchanged thresholds, 152 SQL tests, 171 Python tests, 32 default
plus four API-mode Chromium tests, 28 real local Auth/API groups, five guards,
16 native parser/OCR checks and three actual offline embedding/SQL tests. The
PowerShell wrapper returned 1 after recording color warnings on stderr; this is
not recorded as aggregate exit-0 success. The native aggregate confirmation then
returned 1 on a real frontend timeout waiting for networkidle. The test now
checks visible-heading readiness after document/scripts/styles and fonts load,
preserving the two-font, local-origin and 300 KiB transfer assertions. The full
frontend rerun passed 32/32 with native exit 0 in 59.0s; no test skipped, timeout
raised or transfer threshold relaxed. See completion-browser-fixed.log.
Separate final API-mode UI rerun: four PASS, native exit 0. Types, formatting,
lint, dependency tree, docs and build have successful result evidence.
Fresh `npm.cmd audit --omit=dev --json --fetch-retries=0 --fetch-timeout=15000`
returned exit 0 with zero reported production vulnerabilities. Dependency metadata
submission used the owner's existing approval; no model service was contacted.
All relevant component checks have successful execution evidence; no claim is
made that either historical aggregate invocation returned zero. Remaining code
changes after those checks were limited to the corrected browser wait and docs.

Final cleanup: 34 migrations / 43 forced-RLS tables; zero ordinary documents,
claims, vectors, Auth users and disposable DBs. Ingestion paused. Owned Auth
stopped; only existing PostgreSQL running. All 14 original staged entries retained.

`npm.cmd run phase7:review` exported all 18 synthetic cases; repeated exports
preserved annotations. No independent human labels or real-model results exist.
Initial Docker checks failed because the engine was stopped; the existing local
installation was started, without resource/settings changes, then local replay
succeeded. Initial TypeScript failure in a parameterized test was fixed by
passing named case objects; strict type checking subsequently passed.

Formal Phase 7 remains PARTIAL: owner must identify the approved official corpus
and independent bilingual reviewer; project/ADC/billing/credit eligibility and
explicit live-call approval also remain unavailable. A process-environment check
found no GOOGLE_CLOUD_PROJECT/GOOGLE_CLOUD_LOCATION (not a cloud-account audit).
Public guidance remains closed. Stop before Phase 8; no commit, deployment,
real onboarding or paid service was performed.

## Vertex AI adapter follow-up - 2026-10-23

Owner selected Gemini through Vertex AI for adapter implementation/mock testing
only. Implemented `answers/vertex.ts` with pinned `@google/genai` 2.31.0, stable
Flash model allowlist (recommended `gemini-3.8-flash`), ADC-only authentication,
fixed Google endpoints, LOW thinking, bounded output/deadlines, zero retries,
safe failure mapping and reasoning-inclusive usage. Default remains disabled;
environment configuration cannot grant live approval and the public route never
composes this adapter. No real credentials, model requests or Cloud resources.
See [VERTEX_AI](VERTEX_AI.md) for exact sources, configuration and remaining gates.

Actual checks after this change:

| Command | Result |
| --- | --- |
| `npm.cmd view @google/genai version engines --json --fetch-retries=0 --fetch-timeout=15000` | 2.31.0; Node >=20, compatible with local Node 24 |
| `npm.cmd install @google/genai@2.31.0 --workspace apps/web --save-exact --ignore-scripts --no-audit --no-fund --fetch-retries=0 --fetch-timeout=20000` | PASS; 26 packages added; transitive node-domexception deprecation warning |
| `npm.cmd run test:phase7` | PASS, 103 tests before final signed-text regression |
| `npx.cmd vitest run apps/web/src/lib/answers/vertex.test.ts` | PASS, first 28 adapter tests before signed-text case |
| `npm.cmd run test:unit` | PASS, 574 tests / 33 files, including all 29 final adapter cases |
| `npm.cmd run typecheck` | PASS, web and database types |
| `npm.cmd run lint` | PASS, zero warnings |
| `npm.cmd run format:check` | PASS |
| `npm.cmd ls --all` | PASS |
| `npm.cmd run build` | PASS, 124 prerendered pages |
| `npm.cmd run docs:check` | PASS, 13 required documents / 286 local links; structure only |
| Working and staged `git diff --check` | PASS; existing line-ending notices only |

The direct `py -3 scripts/validate_docs.py` attempt failed because `py` is not on
PATH; use the configured `npm.cmd run docs:check` wrapper. No test result is
inferred from that failed invocation. SQL, browser, parser and offline model
aggregates below remain historical; these unchanged subsystems were not rerun
for the isolated SDK adapter. No new dependency vulnerability audit was run.
The initial sandboxed npm metadata lookup failed with EACCES; the permitted
metadata retry and SDK installation succeeded as recorded above.

Adapter implementation/mock verification: PASS. Live integration: NOT RUN and
not authorized. Formal Phase 7 remains PARTIAL on project/ADC/billing/credit
eligibility, independent support-review adapter/data, human corpus evaluation and
production admission/budgets. Do not start another package or Phase 8 automatically.

## Phase 7 completion work - P36-P41

The owner authorized the whole remaining phase after P35. Local implementation
and assessment through P41 are verified. Formal Phase 7
remains PARTIAL pending verified live-provider configuration, real support-review adapter
and independent real-corpus/human grounding evaluation. See
[PHASE_7_REPORT](PHASE_7_REPORT.md). No Phase 8, paid calls, real collection,
production generation, deployment or commit is authorized or performed.

Provider policy/mocks, bounded prompt/RAG orchestration, deterministic citations,
deny-by-default independent claim support, uncertainty/conflict/temporal safeguards
and API-backed ephemeral conversation UI are implemented. The public handler stays
closed in production. CHAT_MODE=api selects interface only; default demo preserved.
`npm.cmd run validate:phase7` completed with exit 0: **545 unit/component tests,
135 SQL cases, 171 Python cases, 32 default plus four API-mode Chromium cases,
28 real local Auth/API grouped checks, five guards, 16 parser/OCR/isolation checks
and three actual offline embedding/SQL tests PASS**. Dependencies, scoped coverage
(93.1% functions; threshold unchanged), strict types, lint, format, docs and build
PASS. The first coverage failure was fixed by testing bounded retention of API
answer text, not lowering the gate. Eighteen synthetic pipeline expectations pass;
real-world release targets/human review remain NOT EVALUATED. Hosted CI unexecuted.

Cleanup: 43 forced-RLS tables / 32 migrations; zero ordinary documents, vectors,
profile approvals and Auth users; ingestion paused. Zero disposable DBs/temporary
model roles. Auth stopped, original PostgreSQL left running. Limited password/
private-key scan: 313 text files, one actual local password, zero matches. All
14 original staged entries preserved. P36/P38/P41 and formal Phase 7 remain PARTIAL
on the documented provider/support/human quality gates. Last fully completed phase
remains Phase 5 because Phase 6's real-corpus gate also remains pending.
Next task: resolve those Phase 7 gates; **do not begin P42/Phase 8 automatically**.

## P35 secure chat API foundation - 2026-10-23

**P35 PASS locally; stop before P36.** The owner's P35-P41 prompt explicitly
requires stopping after P35. Phase 6 remains PARTIAL on real-corpus quality;
only independently safe API foundation work was performed. See
[P35_REPORT](P35_REPORT.md) for exact contracts, paths, controls and limitations.

Added the approved POST /api/v1/answers with strict schemas, capped streamed JSON,
Unicode normalization, request IDs, no-store responses, process-local admission,
minimization and narrow existing-retrieval integration types. Valid development
requests return safe 503 unavailable with no guidance. Production is closed by
policy; no question storage, active retrieval, provider, citizen login or history.

Actual checks: 18 new tests PASS; full unit suite **488 in 28 files PASS**;
strict app/database type checks, scoped ESLint, full formatting and production
build PASS (124 static pages). Five real development HTTP validation cases PASS.
The new production Next HTTP Playwright case PASS (1), including policy closure,
no reflection/cookies required and GET 405. No hosted CI or SQL/Python/model suite
rerun. No new dependencies/migration, paid calls, source collection, commit or
deployment. Next proposed task P36 requires explicit authorization.

## Owner-supplied logo - 2026-10-23

The shared header/footer now use the owner's unchanged transparent PNG at
`apps/web/public/ask-bangladesh-logo.png`, replacing the temporary inline drawing.
SHA-256: `e1eb512f2c54c29e5ad6896782ecaab7f353a534a9ef230cdb3bdc0c02b92b81`.
Next.js Image preserves the aspect ratio and provides small same-origin delivery;
the existing accessible home-link name and independent disclosure remain.

Actual checks PASS: `npm.cmd run typecheck`, six existing shell tests via
`npm.cmd run test:unit -- apps/web/src/components/layout/public-shell.test.tsx`,
scoped Prettier and ESLint. Headless Chromium checked header/footer image decoding
in light/dark desktop views and English mobile at 320px; no mobile horizontal
overflow. The optimized mobile image response was 1,020 bytes. Screenshots were
captured and inspected under `.cache/frontend-refresh/owner-logo-*.png`.
An initial mobile probe waited for an offscreen lazy image; checking after
scrolling each image into view passed. No full-suite/build rerun was needed for
this scoped asset presentation update. Phase 6's quality gate remains PARTIAL;
no phase advancement, commit or deployment.

## Latest authorized Phase 6 completion work

The owner explicitly requested finishing Phase 6 after P29. P30-P34 software and
local verification are finished; see
[PHASE_6_REPORT](PHASE_6_REPORT.md) and [EMBEDDINGS](EMBEDDINGS.md). This supersedes
the historical stop before P30 below. Phase 7 is not authorized or started.

Actual offline model/SQL experiments have run for two pinned free CPU candidates.
The source corpus/labels are explicitly synthetic, never real government approval.
Formal Phase 6 quality readiness remains PARTIAL pending reviewed official evidence
and independent held-out relevance labels. Do not advertise supported live coverage
or mark the entire phase production-ready from these functional experiments.

The screenshot frontend refresh is complete locally with 31 passing Chromium
cases, captured/inspected desktop and mobile themes, honest status panels and the
existing memory-only demo preserved. See [FRONTEND_REFRESH_REPORT](FRONTEND_REFRESH_REPORT.md).

`npm.cmd run validate:phase6` passed in full: **470 unit/component cases, 135 SQL
cases (49 retrieval cases), 171 Python cases, 31 Chromium cases, 28 real local
MFA/API/browser grouped checks, five local guards, 16 native parser/OCR checks and
three real-model integration tests**. Dependencies, strict types, lint, formatting,
documentation and production build pass. A second model run reproduced all
five-stage metrics and final routed passage orders for both pinned candidates.
E5 routed Recall@3 was .9231 versus MiniLM .8462 across only 13 positive synthetic
cases; neither candidate is approved or activated for production. See the report
for per-language results, timings and limitations. Hosted CI remains unexecuted.

Local implementation is complete through P34; **P30-P33 PASS locally, P34 and
formal Phase 6 PARTIAL** pending authorized reviewed official evidence and
independent held-out relevance evaluation. Last fully completed phase remains
Phase 5. Next task: prepare/review that missing evaluation evidence within explicit
onboarding authorization; **do not begin P35/Phase 7 automatically**.

Cleanup: 43 forced-RLS private tables / 32 migrations, zero ordinary documents,
vectors or profile approvals, ingestion paused, zero disposable test databases or
temporary model roles. Owned Auth stopped; original PostgreSQL left running.
Limited credential/private-key scan: 293 text files, one actual local password,
zero matches. All 14 original staged entries preserved. No paid calls, real source
collection, remote provisioning, commit, push or deployment.

## Historical P29 scope and authorization

Current active phase: **Phase 6, in progress**. Last completed work package:
**P29 - local implementation/test PASS**. Last completed full phase: **Phase 5**.
Completed packages: **P04-P29**, following owner-approved Phase 0. Next proposed
package: **P30**, only after explicit authorization; no automatic model/provider
selection or calls. The supplied P29-P34 attachment's first explicit stop applies.
P30-P34 are not implemented here. See [P29_REPORT](P29_REPORT.md).

P29 adds a server-only typed keyword passage repository and restricted PostgreSQL
projection over existing evidence, a private GIN index, explicit non-stemming
Unicode/literal query handling, deterministic rank components and bounded filters/
pages. Results preserve exact original passage/source/version/locator hashes and
independent verification clocks, with no private notes/storage keys/reviewer IDs.
Original queries are ephemeral request context, never persisted or logged. The
public frontend/directory remains preserved; no public evidence or chatbot API.

Mixed approved/pending corpus tests exposed an older passage_is_eligible parameter
collision with a joined column. A forward fix binds the requested UUID explicitly,
preventing another passage from conferring eligibility. All existing trust gates
remain; unsafe flags and unresolved service conflicts also block retrieval. A
separate forward correction makes title/heading Unicode ranking consistent. No
applied migration history was rewritten. Schema: **42 forced-RLS private tables,
28 migrations**, with regenerated actual database types; no new dependency/ORM.

Final P29 verification: **113 full SQL cases (27 P29), 27 focused retrieval cases,
365 unit cases (50 new), 171 Python cases, five local guards, 28 frontend Chromium
cases and 28 real local MFA/API/published-browser grouped checks PASS**. Strict
types, lint, format, production build, documentation and working/staged whitespace
checks pass. Real SQL output is parsed through the shared TypeScript/Zod contract.
The 1,600-passage selective GIN probe executed in 0.302 ms in the full run; this
does not measure full retrieval/production latency. No forced planner flag used.

No real government corpus, site inspection, source approval or human relevance
evaluation is claimed. Exact-token retrieval does not stem, fuzzy-match, translate,
normalize Banglish/digits, generate embeddings or answer questions. Rank weights
are versioned initial heuristics, not measured confidence. Corpus coverage, real
language/latency benchmarks and all existing production/privacy/egress/storage
gates remain. Hosted CI is unverified; existing configured suites include P29.
Node's shared-.ts-contract module detection notice is documented, not suppressed.

Limited credential review: **249 text files, four local development values/private-
key checks, zero matches**. All 14 original staged entries remain. Cleanup verified
zero disposable DBs, worker logins, synthetic Auth users and parser containers;
owned local Auth is stopped. Ordinary sources/policies/retrievals/jobs remain zero,
ingestion paused, Python live defaults disabled. No real identities, live source,
cloud/paid service, commit, push, deployment or P30 work occurred.

## Historical Phase 5 checkpoint

Current completed phase: **Phase 5 - local implementation/test PASS**.
Last completed work package: **P28**. Completed packages: **P04-P28**, following
owner-approved Phase 0. Next proposed package: **P29**, only after explicit
Phase 6 authorization and a readiness review. Stop here; Phase 6 has not started.

The owner explicitly requested the entire phase, superseding P22/P23 individual
stops. P22 is preserved; P23-P28 implement bounded offline HTML/PDF extraction,
conditional local Bangla OCR, conservative Unicode/offset-preserving passages,
private content-addressed artifacts, immutable versions, leased/fenced SQL jobs,
review-blocked indexing outbox, freshness/adverse checks, retries/dead letters,
persistent manual holds, protected pause/recovery and metadata-only monitoring.
See [PHASE_5_REPORT](PHASE_5_REPORT.md) for files, decisions, dependency inventory,
actual commands, interruptions, final results and operational limits.

Final local evidence: **86 real database cases, 171 Python cases, 16 native
parser/OCR/isolation checks, 315 Vitest cases, 28 frontend Chromium cases,
28 real local MFA/API/published-browser grouped checks and five local guards
PASS**. Production build, strict web/generated schema types, ESLint, Prettier,
installed dependency graph and Python dependency consistency pass. Database types
were generated from **42 forced-RLS private tables / 25 canonical migrations**.
CI now builds/tests the offline parser before the SQL/Python pipeline probe;
GitHub-hosted execution remains unverified. Components were executed individually;
the validate:phase5 aggregate itself was reviewed, not separately rerun.

The actual Bangla OCR observation is one synthetic clean typeset line: CER 0.0,
confidence 95.563. It does not establish real-world OCR quality. Native pypdf/
Poppler/Tesseract and model/image hashes are recorded; native apt rebuilds can
change versions. Shipping requires fresh native advisory/license/notice review.
No npm package or lockfile change; previous five high dev-chain/zero production
advisory results remain historical. No new broad Python static-analysis claim.

Interrupted browser/adapter/Auth runs failed and were not counted as passing.
Final completed reruns passed without loosening deadlines, session constraints or
security. One positively identified example.invalid synthetic Auth user left by
an interrupted run was removed through the guarded local provider API; no real
identity was touched. Final cleanup/default-state verification is recorded below.
Limited credential comparison: **241 repository text files, four local credential
values/private-key checks, zero matches**. All 14 original staged entries remain;
no staging, commit, push or deployment. Working/staged whitespace checks pass.

No government website was accessed or official record approved. Source HTTP is
simulated in tests; native parser/OCR, DB, Auth and browser executions are real
local tools as stated. Ordinary database sources/policies/retrievals/jobs are zero,
and controls remain paused. Python network_ready defaults false; no live CLI,
cron/daemon or runtime environment switch enables it. No source onboarding,
production networking, cloud resource, paid OCR/AI, embeddings, retrieval/RAG,
chatbot, full dashboard or production deployment was started.

Remaining gates before live ingestion: approved exact URLs/terms/contact identity,
independently enforced egress denial, private object-store IAM/NTFS ACL/retention/
recovery, dedicated identities, safe review tooling/staffing, representative human-
reviewed multilingual extraction/critical-number benchmarks, advisory/license
review, operational alerts, hosted CI and explicit owner activation approval.
Source authenticity, reachability, crawl permission and freshness stay distinct.

Final cleanup verified: zero disposable databases, temporary worker logins,
synthetic Auth users and parser containers; all 25 migrations are applied.
The owned local Auth container is stopped; ordinary PostgreSQL remains available
on loopback with retained data/credentials. No user files/volumes were reset.
Final documentation/local-link, formatting and working/staged Git whitespace
checks pass. See the report for test scope and the limited credential scan.

## Historical P22 checkpoint

Latest completed work package: **P22 — local implementation/test PASS**; Phase 5
is in progress, not complete. The owner supplied the P22 implementation prompt
on 2026-10-21. Stop before P23; its incomplete outline was not executed. Phase 4
remains the last fully completed phase. See [P22_REPORT](P22_REPORT.md).

Added isolated, default-disabled one-document Python retrieval, exact-source SQL
permission, numeric-IP-pinned TLS, robots/access controls, durable per-hop budgets
and private manifests. No real source onboarding, live crawl, scheduler, production
network, AI, extraction or cloud operation. No public frontend behavior changed.

Actual evidence: 70 real SQL cases, 315 Vitest and 28 Chromium regressions pass;
127 Python cases and five local guards pass; strict types/lint/format/build pass.
Real Python-to-PostgreSQL probe uses a generated temporary least-privilege login
and simulated HTTP. Schema: 36 forced-RLS private tables, 18 migrations. Isolated
runtime pins: pg8000 1.31.5 and four transitive dependencies; npm lock unchanged.
Cleanup verified zero ordinary sources/policies/retrievals, disposable DBs and
temporary worker logins. Remote CI and production network enforcement unverified.
Docs validation passes 13 required documents/226 local links; working/staged Git
whitespace passes. Limited local-password/private-key comparison of 226 repository
text files found zero matches. All 14 pre-existing staged entries remain.

Next proposed package: **P23**, only after separate authorization. Runtime enablement
requires reviewed exact URLs/terms/contact identity, deployed independent egress
denial and explicit live approval. Existing source records alone cannot enable it.

## Historical Phase 4 checkpoint

Current completed phase: **Phase 4 — local implementation/test scope PASS**.
Completed work packages: **P04-P21**, following owner-approved Phase 0.
Last completed work package: **P21**. Next: **P22 readiness assessment after
separate authorization**, not automatic Phase 5 implementation.

The owner requested finishing Phase 4 and explicitly chose implementation/tests
only. P18 is preserved; P19 adds independently reviewed agency/category/service
management and aliases/relationships, P20 connects reviewed public directory
routes and bounded private-text keyword search, and P21 adds private link-health
history, blocked check requests and integrity diagnostics. See
[PHASE_4_REPORT](PHASE_4_REPORT.md). No real source is researched/onboarded/approved,
no government site is contacted, and no actual network link health is claimed.

Final local evidence: **33 forced-RLS private tables, 15 migrations, 60 real SQL
tests, 315 Vitest cases, 28 real MFA/HTTP/published-browser grouped checks,
28 frontend Chromium cases, five local guards and nine Python tests pass**.
Production build, strict application/schema types, lint and formatting pass.
Published mode is explicit; default demo is DB-independent. Source publication
still requires eligible document evidence. Live checks fail closed because the
isolated worker has not implemented approved IP-pinning/redirect/egress controls.

Limited actual credential comparison: 210 repository text files, four local
credential values/private-key header checks, zero matches. Fourteen pre-existing
owner-staged entries remain; no staging, commit, push or deployment. No remaining
ordinary sources/memberships/releases/link checks, disposable DBs or synthetic Auth
users. The owned Auth container is stopped after tests. No packages were added;
last owner-approved npm audit has zero production and five high dev-chain findings.
Remote CI, production identities/recovery, human translation/device/screen-reader
review and actual source coverage remain release gates. Phase 5 is not started.

## Historical P18 checkpoint

Current completed phase: **Phase 3 — Database and data foundation, local PASS**.
Completed work packages: **P04-P07, P08-P13, P14-P17 and P18**.
Latest completed work package: **P18 — Verified-source registry and approval workflow**.
Current active phase: **Phase 4, in progress**; P19–P21 are not completed here.
Recommended next work package: **P19**, separately authorized. Stop before P19.
The owner authorized P18 on 2026-10-21. Local P18 acceptance passed; see
[P18_REPORT](P18_REPORT.md). Three forward migrations add protected source
candidate/review operations, private immutable audit/outbox and retry records,
separate ownership/authority/availability evidence and sticky critical-source
second review. URL validation performs no network request. Existing public
document eligibility and Phase 2 demonstration boundaries remain intact.

Current evidence: **32 forced-RLS private tables, ten SQL migrations, 50 real DB
tests, five guards, 263 unit/component/contract tests, 23 real local MFA/HTTP
checks, 28 Chromium cases and nine Python cases pass**. Strict types, lint,
formatting, generated types, dependency graph and production build pass.
No new dependency, real source, source-site access, paid operation or remote
service was added. Remote CI remains unverified. After the initial automatic
approval block, the owner explicitly approved npm dependency metadata submission.
Fresh audits now confirm **zero production findings** (exit 0) and **five high
development-chain findings** (exit 1), zero critical. The braces advisory propagates
through micromatch/fast-glob into Next ESLint tooling. npm's proposed major
downgrade was not applied; scoped remediation remains open. Dependencies/lockfile
are unchanged. See the P18 report for exact commands and evidence.
Local secret comparison: 186 text files, four actual local
credential values, zero matches. Fourteen owner-staged entries remain.
No ordinary sources/memberships/releases/registry events, leftover disposable DBs
or synthetic provider users remain. Auth is stopped after tests. No commit/push.

## Historical P17 checkpoint — 2026-10-20

On 2026-10-20 the owner requested finishing the P16/P17 prerequisites after the
blocker was explained. P16 and P17 now pass locally. See
[PHASE_3_REPORT](PHASE_3_REPORT.md) and [P16_REPORT](P16_REPORT.md).

Then-current evidence: 30 forced-RLS private tables, seven SQL migrations, 40 real DB
tests, five targeting guards, 227 unit/component/contract tests, 19 real local
Auth/HTTP/API checks, 28 Chromium cases and nine Python cases pass. Strict types,
lint, formatting, generated schema types and production build pass. Real local
Supabase password/TOTP/cookies/logout, permission denial, expiry/revocation,
published metadata filtering and cursor invalidation are verified. No live
government fact/source, public claim evidence, AI or ingestion was added.

Remote CI and production identity/recovery/TLS remain unverified release gates.
Five existing high development-chain advisories remain; production audit is zero.
Limited actual local credential scan: 170 text files, zero matches. No ordinary
DB memberships/releases/sources or leftover test DBs remain. Local Auth is
stopped, no production user was created, and no files were staged/committed/pushed.
The 14 owner-staged entries remained. That P18 stop was superseded only by the
owner's 2026-10-21 P18 authorization above.

## Historical P14/P15 checkpoint

The owner explicitly requested the P09-P13 batch after P08. Actual results and
limits are in [PHASE_2_REPORT](PHASE_2_REPORT.md). The earlier P14 prompt truncation
was resolved by the owner's complete Phase 3 package.
Current scope completed: **P14 and P15 PASS locally**. PostgreSQL 17.11/pgvector
0.8.2, three migrations and 24 private tables are verified. All 28 real core/evidence
tests, five guards, 195 Vitest tests, 28 Chromium cases and nine Python tests pass.
Types generated; lint/strict types/format/119-page build pass. See
[P14_REPORT](P14_REPORT.md) and [P15_REPORT](P15_REPORT.md). Stop before P16. Do not
commit, push, deploy, provision remote services or make paid calls.

At that checkpoint the owner subsequently authorized completing P14 and proceeding to P15 after
P14 passes. Both packages passed locally. The then-applicable P15 stop was
superseded only by the owner's 2026-10-20 Phase 3 completion request above.

Historical runtime remediation: verified Microsoft WSL 3.0.3.0 installed successfully
(exit 0). Virtual Machine Platform enabled; DISM exit 3010 confirms a Windows
restart is required, deliberately not performed automatically. Docker Desktop
4.95.0.242831 installed successfully (exit 0), CLI 29.8.2 verified. Engine startup
returned "Docker Desktop is unable to start" before restart. See [P14_REPORT](P14_REPORT.md)
checkpoint. The owner subsequently restarted Windows and corrected DNS. The final
supported runtime explicitly publishes only PostgreSQL on loopback; experimental
and classic CLI startup were rejected for non-loopback listeners. CLI SQL
migrations and type generation still own the schema. Real tests now pass.

The earlier P02 audit decision was PARTIAL. Approval permits this local foundation;
it does not claim P03 corrections have been implemented. The outstanding claim,
citation, recovery, redaction, rate-limit, staff-role, feedback/retry, conversation
and OCR-identity contracts remain gates before their relevant later features.

## P15 completed checkpoint - 2026-10-19

- Fourteen evidence/source/check/review/claim/conflict/embedding tables added to
  the ten core tables. Immutable source/version/passage identities, SHA-256 hashes,
  exact PDF/text locators, provider-neutral snapshot keys, independent lifecycle
  states and append-only review metadata are implemented. No real source is seeded.
- SQL grants/RLS and private status/freshness/selection/claim-support predicates
  deny API roles. Row policies also deny data under temporary test grants. These
  structural predicates do not replace contextual applicability, semantic support,
  trusted staff authorization or positive release tests before public exposure.
- Profiles support different dimensions without choosing a model. No vectors,
  verified claims or source documents remain in the ordinary local DB. All
  disposable test databases were removed. No paid model or cloud resource was used.
- Real tests: 28 DB, five guards, 195 Vitest with selected coverage gates, 28
  Chromium and nine Pytest pass. Production build, strict application/generated
  schema types, lint and formatting pass. Remote CI remains unverified.
- First browser teardown was denied by the Windows process sandbox; its verified
  test server was stopped and the unchanged suite passed with clean teardown in
  the normal process context. Real failing SQL tests were corrected and rerun;
  no failing command was marked passing. Full audit has five existing high dev
  findings, production-only audit zero. Final checks: docs structural validation
  (194 links), YAML syntax, locked dependency graph and Git whitespace pass;
  141-file limited credential scan has no matches. Fourteen pre-existing staged
  entries are preserved. Local stop/restart and deterministic type generation pass.
- Next: P16 after explicit authorization. No staff auth, public DB API, ingestion,
  retrieval, AI, cloud deployment, commit or push was added. P17 will complete the
  Phase 3 public data-access integration and final audit.

## Historical P14 authored checkpoint - 2026-10-19

- Supabase-compatible PostgreSQL 17 with project-local CLI 2.121.0 selected;
  SQL-first normalized schema preserved. No Cloud SQL/cloud resource activation.
- One migration defines ten private core/translation/relation/domain tables,
  bounded fields, FKs, unique identities, lifecycle checks, revisions, graph
  protection and deny-by-default grants/RLS. **No database tables actually created
  in a running server yet.** Synthetic fixtures cannot auto-seed or publish.
- Optional server-only pooled pg 8.23.1 client, sanitized errors and transactions;
  frontend stays DB-independent. Hand-authored row contracts are not represented
  as generated schema types. Real type generation remains blocked.
- Actual checks so far: 195 Vitest tests pass (11 files), five local guard/client
  failure tests pass; initial db:start and test:database exited 1 because Docker was missing.
  Migration, PostgreSQL constraint/RLS/concurrency tests are authored, not passed.
  Final checks also passed: 28 Chromium cases, nine Python tests, strict types,
  lint, format, production build, workspace dependencies and docs (182 local links).
  Full advisory scan retains five existing high development findings; production
  scan zero. Limited credential-pattern scan found no matches in 136 text files.
- P14 PARTIAL; next task is Windows restart, local engine startup and real P14
  verification, then the explicitly authorized P15. Stop after P15.
  No commit/push/deployment/paid operation or remote DB reset.

## P09-P13 completed checkpoint — historical Phase 2

- P09 PASS: complete bn/en homepage, eight preparation topics, five mixed-language
  examples, empty/length validation and in-memory question handoff to `/ask`.
- P10 PASS: local deterministic demo only, structured answer/source cards,
  multilingual input, IME-safe keyboard behavior, stop/retry/clear and bounded
  transient conversation. No raw questions reach the adapter, URL or storage.
- P11 PASS: sixteen bilingual categories, working combined text/category filters,
  safe service/category/guide layouts, empty agency/source registries and real
  404s for absent records. Status labels separate metadata from eligible guidance.
- P12 PASS: information/trust/source-policy/help, draft Privacy/Terms, honest local
  feedback validation and disconnected status; no fabricated facts or metrics.
- P13 PASS locally: 175 tests across nine Vitest files, 28 Chromium cases including
  22 default axe scans, nine Python tests; format/lint/strict type/build checks pass.
  Build prerendered 119 public/framework pages and guide redirects. Remote CI
  execution remains unverified. Full accessibility conformance is not claimed.
- Added only dev dependency `@axe-core/playwright@4.14.0`; exact root lockfile.
  Full audit has five existing high braces-chain development findings, production
  audit zero. No forced downgrade or suppression. Existing CI runs the expanded
  suite without deployment, new secrets or ignored failures.
- Fixed actual visible-label naming and 200%-text/narrow reflow defects. Initial
  browser failures were recorded and rerun. Measured cold constrained lab transfer
  is 219,214 encoded HTML/CSS/JS bytes + 155,976 local font bytes (375,190 total).
  Current Chromium at 390x844, 150ms latency, 1.6Mbps down, 4x CPU: load 3,614ms.
- Human screen-reader, fluent translation, real mobile keyboards/devices, older
  browsers, Firefox/WebKit and production legal/privacy review remain pending.
- No government website access, source verification, AI/API, database, ingestion,
  authentication, admin, tracking, production infrastructure or deployment added.
  No commit, push, paid activation or automatic Phase 3 implementation.

## P04 plan and decisions — historical Phase 1 evidence

- Inspect existing documentation, Git state and installed Node/npm; preserve all
  existing files and the owner's staged additions.
- One npm-workspace repository at the existing root; web app in apps/web with src
  App Router, strict TypeScript and @/* alias. No nested ask-bangladesh folder.
- Reserve worker/shared/database/tests/infrastructure paths with small boundary
  READMEs; create application modules only when real code needs them.
- Runtime: Node.js 24.22.0; package manager: npm 11.19.1. One root lockfile and
  root installation. npm.cmd avoids this machine's npm.ps1 execution-policy error.
- Minimal Bangla page at / with semantic HTML, system fonts, development status
  and independence disclosure. Locale routing, final design and service facts
  remain outside P04. No provider, DB, crawler, auth or administrative integration.
- Modern-browser development baseline: Chrome/Edge 111+, Safari 16.4+, Firefox
  128+. Broader citizen-device support and actual assistive-technology validation
  remain Phase 2 gates. CSS uses a readable basic fallback around Tailwind utilities.
- Install only framework/React/TypeScript/Tailwind build dependencies. Linting,
  formatter/CI and test infrastructure belong to P05/P06, environment modules P07.

## Verification evidence

Observed before implementation:

- node --version: v24.22.0.
- npm.cmd --version: 11.19.1.
- Git: no commits on main; fourteen preexisting staged documentation/harness files.
- No application, workspace configuration, lockfile or progress file existed.
- Official Next.js, Tailwind and npm workspace instructions were accessed; exact
  links are below. Current package metadata is being resolved from npm, not assumed.
- Default-sandbox npm registry access failed with EACCES; scoped public-registry
  access is being used for the authorized dependency installation.

## Selected and installed packages — P04 history

Package versions were read from the public npm registry before pinning. Next's
bundled documentation was also read after installation, including its TypeScript
7 guidance, CSS setup, type generation and managed agent-file behavior.

| Package | Exact version | Purpose |
| --- | --- | --- |
| next | 16.4.2 | App Router framework and local web server |
| react, react-dom | 19.3.1 each | Framework rendering dependencies |
| typescript | 7.0.2 | Strict type checking; verified with Next's native-compiler support |
| tailwindcss, @tailwindcss/postcss | 4.3.3 each | Utility CSS compiler and PostCSS integration |
| postcss | 8.5.30 | CSS processing dependency |
| @types/node | 24.19.2 | Node 24 development types |
| @types/react, @types/react-dom | 19.3.0 each | React development types |

There are ten direct package pins in the web workspace. npm reported 48 packages
added and 50 packages audited (including workspace/root records), with zero
reported vulnerabilities at installation. This advisory check is not a security
certification. No lint, formatter, test framework, parser, DB or AI SDK was installed.

## Commands and actual results

| Command / check | Actual result |
| --- | --- |
| Public `npm.cmd view ... version engines peerDependencies --json` queries | Passed; compatible pins recorded above |
| `npm.cmd install --fetch-retries=0 --fetch-timeout=30000` | Passed, root lockfile generated; scoped registry access required by sandbox |
| `npm.cmd ci --offline` | Passed from populated cache; 48 packages added, 50 audited, zero reported vulnerabilities |
| `npm.cmd run typecheck` | Passed after clean install and again after server shutdown; `next typegen && tsc --noEmit` |
| `npm.cmd ls --depth=0` | Passed; one linked web workspace and no reported missing/invalid direct dependencies |
| `npm.cmd pkg get name workspaces packageManager engines` | Passed; private root uses apps/* and packages/*, npm 11 and Node 24 |
| `npm.cmd pkg get name --workspaces` | Passed; only @ask-bangladesh/web is currently a package |
| `npm.cmd run build` | Passed; Next compiled, type-checked and prerendered / plus framework not-found handling |
| `npm.cmd run dev` | Passed; ready on 127.0.0.1:3000; HTTP page and CSS checks passed |
| `npm.cmd run start` with process-local PORT=3001 | Passed; ready on 127.0.0.1:3001; production HTTP page and CSS checks passed |
| Inline Node fetch/assert checks against both servers | Passed: HTTP 200, HTML/Bangla language, heading, development/independence notices, noindex, no powered-by header, CSS 200, generated layout utilities, 40rem responsive rules and system-font declaration |
| `python -B scripts/validate_docs.py` | Passed: 13 required documents, 148 local file links, all capability IDs/phases; structural scope only |
| `git diff --check` and `git diff --cached --check` | Passed; preexisting index additions preserved |
| Narrow secret/environment/whitespace checks over tracked and unignored text files | Passed: 36 files checked, zero high-confidence secret-pattern matches, zero real .env paths, zero trailing-whitespace findings |

Next telemetry was disabled with a process-local NEXT_TELEMETRY_DISABLED=1 for
verification. Server sessions were stopped after checks; no deployment occurred.
Only package-registry and official documentation access was used; no government
system or paid provider was contacted by the application.

Initial verification attempts are not hidden: a typecheck was launched before
`npm ci` finished and failed because the next executable was not yet available;
it passed after installation completed. The first inline HTTP probe hit PowerShell
ASCII pipe encoding, and a later probe incorrectly expected a retained Tailwind
license comment. UTF-8 piping and checking actual generated CSS rules resolved
those probe errors. Neither required weakening application validation.

## P04 historical browser limitation — superseded by P06

The computer-use tool returned an empty browser inventory. Attempting to open
127.0.0.1:3000 returned `Browser is not available: iab`. No screenshot, browser
visual inspection, JavaScript-console check, narrow-viewport rendering test,
screen-reader audit or Playwright test was performed. SSR HTML and responsive CSS
were checked directly; actual visual/device validation remains pending. P06 adds
the browser test infrastructure; Phase 2 evaluates the complete interface.

## Files and scope

New reviewable files:

- .gitignore, .node-version, .npmrc, package.json, package-lock.json
- apps/web/package.json, apps/web/tsconfig.json, apps/web/next.config.ts
- apps/web/postcss.config.mjs, apps/web/AGENTS.md (framework-generated)
- apps/web/src/app/layout.tsx, apps/web/src/app/page.tsx
- apps/web/src/styles/globals.css, apps/web/public/README.md
- workers/ingestion/README.md, packages/shared/README.md
- database/migrations/README.md, database/seeds/README.md
- tests/README.md, infrastructure/README.md, docs/CODEX_PROGRESS.md

Existing files modified: AGENTS.md, README.md, PLANS.md, docs/ARCHITECTURE.md,
docs/PRD.md and docs/ROADMAP.md. Specification bodies were preserved; changes
record authorization, implementation status and setup. The existing documentation
validator was not modified. The concurrently added masterprompt.txt is owner
work and was preserved, not created or modified by P04.

node_modules, npm cache, .next, tsbuildinfo and Next's generated next-env.d.ts
are ignored. There is only one reviewable package-lock.json at the root. P04 did
not stage files or change the preexisting Git index, commit, push or deploy.

## P04 acceptance

| Criterion | Decision |
| --- | --- |
| Approved monorepo boundaries and future reservations | PASS |
| Next.js runs locally and renders initial server HTML | PASS |
| Strict TypeScript, App Router/src layout and aliases | PASS |
| Tailwind compiles and serves responsive utility CSS | PASS; visual viewport verification unavailable |
| One coherent dependency and root-lockfile strategy | PASS; normal install and clean cached install verified |
| Production build | PASS |
| Phase 0 specifications preserved and status reconciled | PASS |
| No unapproved application features | PASS |

## Technical references

Checked 2026-10-18; documentation guidance is not a tested integration:

- [Next.js App Router installation](https://nextjs.org/docs/app/getting-started/installation)
- [Tailwind with Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs)
- [npm workspaces](https://docs.npmjs.com/cli/v11/using-npm/workspaces/)
- [Node.js release support](https://nodejs.org/en/about/previous-releases)
- [Architecture](ARCHITECTURE.md), [roadmap](ROADMAP.md), [active plan](../PLANS.md)

## Completion and next boundary

P04: PASS. P05: PASS. P06: PASS. P07: PASS for the local foundation.
Phase 1 is complete. Its historical [completion report](PHASE_1_REPORT.md) owns
the Phase 1 package table, file inventory, command evidence and limitations. The P04 sections
above are historical; P06 supersedes its unavailable automated-browser check.
Do not begin P08 automatically. Remote CI has not run.

## P05 checkpoint

Formatting, ESLint, strict TypeScript and production build passed locally.
Root scripts invoke ESLint directly, never removed `next lint`. Official actions
are pinned to verified full commits with contents:read and no persisted checkout
credentials. Remote GitHub execution has not occurred.

TypeScript changed from 7.0.2 to 6.0.3 because typescript-eslint requires the JS
compiler API absent in TypeScript 7. Strict settings were preserved. Active ESLint
is 10.13.0; version-scoped overrides adapt three Next-config plugin peer declarations
to the direct ESLint version, supported by Next 16.4.2's built-in compatibility
wrappers. Normal install, full dependency listing and actual lint passed after
the override; no legacy-peer-deps, force install or handwritten node_modules patch.

The full npm audit reports five high dependency-chain findings rooted in the
unpatched development-only braces stack-exhaustion advisory
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
No fixed release is listed. Only repository-controlled glob patterns are used.
Production-only audit passed with zero findings. This is an open tooling risk,
not a clean full security audit; no framework downgrade or advisory suppression.

## Final P06-P07 evidence

- `npm.cmd ci --offline`: PASS after scoped execution permission; 448 installed,
  450 audited from populated cache. Public audit results are separate below.
- `npm.cmd run validate`: PASS, exit 0, after the clean install. It executes full
  dependency checks, formatting, ESLint, strict TypeScript, unit coverage, pip
  consistency, Pytest, documentation validation, production build and Chromium.
- Vitest: 41 passed in two files (39 environment cases, two page component cases).
  Page/schema coverage: 100% statements/branches/functions/lines; 90% gates. This
  is an explicit two-module scope, not whole-product coverage.
- Playwright: two passed at 1280px and 320px in 9.3 seconds in the final aggregate.
  Failure screenshot/trace configured; actual browser assertions ran, without a
  claimed manual visual, screen-reader or real-device audit.
- Pytest: nine passed in 0.84 seconds in the final aggregate; no broken pip
  requirements. Fresh per-run cache/fixtures avoid cross-account permissions.
- Actual invalid APP_ORIGIN production build: exit 1, sanitized configuration
  error, no supplied-value echo. Vitest/Playwright/Pytest assertion probes and
  ESLint unused/any/React/ARIA probes returned expected nonzero status.
- Final dev startup via actual root script: PASS with no credentials/environment
  file. HTTP 200, Bangla/disclosures/noindex/local CSS; owned process tree stopped,
  port 3000 confirmed closed. Playwright managed production port 3100 separately.
- Narrow known-credential scan: 55 tracked/unignored text files, zero matches.
  Environment ignore rules and Git whitespace checks passed. Original fourteen
  staged files and owner masterprompt preserved; no staging, commit or push.
- Public full npm audit: five high development-chain findings for one unpatched
  braces advisory; production-only audit: zero. This remains an open tooling risk.
- CI YAML parsing, official action SHA checks and manual least-privilege/script
  review passed. GitHub-hosted execution remains unverified.
- Final documentation reconciliation: 13 required files and 158 local links
  passed structural validation. Both local verification ports were confirmed closed.

Repaired attempts: missing DOM matcher type discovery; root ESM config warning;
Prettier scanning a private cache; shared Python cache permissions; interrupted
initial install and browser runs. The final scripts passed after repair. Planning
requirements and the existing documentation validator were preserved. No AI,
database, ingestion, authentication, admin, deployment or Phase 2 feature added.

## P08 completion — historical checkpoint

P08: **PASS**. See [P08_REPORT](P08_REPORT.md) for the current inventory, token
values, dependencies, route/localization decisions, measured results and limits.

- Implemented source-owned shadcn/Radix controls, centralized warm-white/teal
  tokens and typography, self-hosted licensed Noto Sans Bengali/Inter, independent
  speech-mark identity, responsive header/footer, mobile dialog, language menu,
  skip link, loading/error primitives and metadata.
- `/` selects `/bn`; `/en` is a fully translated shell with server-rendered HTML
  language. Both locales have explicit preparation-state navigation destinations.
  Unknown locales/sections return 404. Full pages remain P09-P12 work.
- Language switching keeps supported paths and drops query/hash text; no locale
  cookie, private draft storage, analytics or remote font request was introduced.
- Seven pinned UI dependencies added through npm; one root lockfile preserved.
  Two licensed font assets total 155,976 bytes (152.32 KiB), documented in
  [FONTS](FONTS.md). No framework/runtime or package-manager switch.
- `npm.cmd run test:coverage`: **120 passed**, five files. Six selected behavior
  modules have 100% statements/branches/functions/lines, with existing 90% gates.
  Includes 15 color-contrast checks, locale/privacy cases and component interaction.
- `P08_SCREENSHOTS=1` with `npm.cmd run test:e2e -- --workers=2`: **12 passed**,
  18.3 seconds. Both locales at 320/375/390/768/1024/1440px; keyboard skip/language,
  menu focus/close/navigation, preparation routes/404s, reduced motion and fonts.
  Actual screenshots inspected for bn desktop/mobile, en desktop and mobile menu.
- `npm.cmd run lint`, `typecheck`, `format:check`, `build` and dependency listing:
  **PASS**. `npm.cmd run test:python`: nine unchanged tests passed.
- Representative encoded cold transfer: 202,983 bytes HTML/CSS/JS + 155,976 bytes
  fonts. No throttled lab, complete accessibility or physical-device claim.
- First browser run caught off-screen mobile-dialog translation; fixed the actual
  positioning and added full viewport-bound checks, then all 12 cases passed.
  Stale generated route types and a filesystem-URL test-harness issue were also
  repaired without weakening rules or tests.
- Full audit: five high development-chain findings for the previously documented
  unpatched braces advisory; production-only audit: zero findings. Remote CI unrun.

Known limits: no screen-reader/fluent-reader/older-browser/real-device assessment,
full WCAG conformance, complete legal policies, live AI, government records,
source verification, directory functionality or backend. P03 gates remain.
No commit, push, deployment, paid service or P09 work. Stop and report P08.
