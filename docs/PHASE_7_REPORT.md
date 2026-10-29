# Phase 7 AI chatbot and grounded-answer assessment

2026-10-24 follow-up: the [pre-Phase-9 audit](PRE_PHASE_9_AUDIT.md) identified and
repaired the missing minimum structured correction-intake foundation. Default
feedback remains demo-only; production intake stays closed. Earlier counts and
findings below are historical; formal corpus/human/provider gates remain open.

Updated 2026-10-23. Owner authorized completing P36-P41 after P35, superseding
individual stop conditions. **Local software implemented through P41; formal
Phase 7: PARTIAL.** No Phase 8, paid calls, real onboarding, deployment or commit.

## Owner-confirmed human/corpus requirements

The owner confirmed no independent reviewer or formally approved evaluation corpus
is currently confirmed. The owner will arrange a qualified independent reviewer
proficient in Bangla, Banglish and English. Repository inspection found only
synthetic regression/mock datasets. Ordinary local registry inspection found zero
sources, approved verifications, approved nonsynthetic documents, approved versions,
published reviewed claims or claim-evidence records. No approved, versioned corpus
was found in the inspected workspace/database; no remote system was queried.

Initial manual corpus scope is e-passport, National Identity Card and land-related
services, using officially verified/approved documents only. Explicit blockers
P41-HUMAN, P41-CORPUS and P41-QUALITY and their required evidence are recorded in
[CODEX_PROGRESS](CODEX_PROGRESS.md) and [P41_HUMAN_REVIEW](P41_HUMAN_REVIEW.md).
The owner expressly requires P41/Phase 7 to remain formally PARTIAL until the
corpus, independent human review and documented acceptance criteria actually pass.

Final verification after that clarification: `npm.cmd run validate:phase7` ran
under the native shell and **passed with exit 0**. Its log is
`.cache/phase7/p41-final-verification.log`. Totals: 584 unit/component tests,
152 SQL cases, 171 Python cases, 36 standalone browser tests, 28 Auth/API groups,
five database guards, 16 parser/OCR checks and three real offline model tests.
Types, lint, formatting, scoped coverage, dependencies, docs and build passed.
No additional application changes were required. The clean run supersedes the
earlier aggregate failures described below; their history is not erased. This is
automated/local verification PASS, not formal human/corpus acceptance PASS.

## Completion follow-up after Vertex adapter

Owner requested finishing Phase 7. The remaining reviewed-claim data adapter is
implemented in `answers/review.ts`; `answers/runtime.ts` prepares the existing RAG
composition with that adapter and a disabled provider. The public route remains
unchanged. No new claim-review authority, administrative mutation or automatic
semantic judge was added. The full local gate is rerun for this follow-up; actual
results appear in [CODEX_PROGRESS](CODEX_PROGRESS.md).

Two forward migrations add/harden a read-only `app_public.answer_support(jsonb)`
projection over existing `service_claims` and `claim_evidence`. It accepts at most
12 requests / four evidence references each / 400 KB, returns key/support/critical
booleans only, fixes search path and a three-second statement timeout, revokes
PUBLIC execution and grants only askbd_web. Private tables and notes stay private.

Support requires exact curated text/type/language, published eligible service,
current released evidence/version/hashes/quote, current independent staff reviews,
no contradictions/conflicts and no unresolved applicability conditions. Critical
claims require a separate evidence reviewer from the claim reviewer and creator.
Staff changes after review invalidate old approvals, including revoke/reactivate.
The repository verifies request fingerprints and strict complete response batches.
The RAG pipeline checks support again after evidence delivery revalidation, so
withdrawal during that window withholds the answer. Default uninjected RAG still
denies unreviewed claims; no generic paraphrase is automatically approved.

This is a conservative curated-claim adapter, not proof of semantic entailment.
Reviewed real records and independent bilingual evaluation are still absent.
The [P41 human-review worksheet](P41_HUMAN_REVIEW.md) documents required inputs;
`npm.cmd run phase7:review` preserves a hash-addressed synthetic review snapshot
without overwriting existing annotations. Its 18 cases cannot establish real-world
release quality. Formal Phase 7 stays PARTIAL until these required gates pass.

### Follow-up verification decision

All available component checks passed after remediation: **584 unit/component
tests, 152 SQL cases, 171 Python cases, 32 default and four API-mode Chromium
cases, 28 real local Auth/API groups, five guards, 16 native parser/OCR checks
and three actual offline embedding/SQL tests**. Scoped function coverage is 93.1%
with unchanged thresholds. Strict types, lint, formatting, dependency tree,
production build and documentation checks pass. Fresh production npm audit:
zero reported vulnerabilities, exit 0; this is not a complete security assessment.

Both aggregate attempts and failures are retained: the PowerShell run reported
all checks passing but returned wrapper status 1 after stderr warnings; the
native confirmation exposed one cold-network frontend timeout. The test waited
for networkidle after initial page/font loading. It now checks the visible h1
after load/fonts-ready, keeping the same local-origin, two-font and 300 KiB byte
assertions. The entire default browser suite then passed 32/32, native exit 0,
with no skips, increased timeout or relaxed transfer threshold. The final API UI
confirmation passed 4/4, native exit 0. No aggregate exit-0 result is invented.
[Playwright's API guidance](https://playwright.dev/docs/api/class-page#page-wait-for-load-state)
(checked 2026-10-23) discourages networkidle as a readiness test.

Final local state: 34 migrations / 43 forced-RLS tables, zero ordinary documents,
claims, vectors, Auth users and disposable DBs. Ingestion paused; owned Auth
stopped and existing PostgreSQL retained. All 14 original staged entries preserved.
No paid calls, source onboarding, public activation, commit, push or deployment.

P35-P40 software implementation and local checks: PASS. P41 engineering test/
review preparation is complete; **P41 and formal Phase 7 remain PARTIAL** because
independent official-corpus/human quality review and approved live-provider
verification are unavailable. The owner has been asked for a reviewer and approved
corpus. No automatic Phase 8 advancement.

## Implemented software

Provider-adapter follow-up: the owner approved Gemini through Vertex AI for
implementation and mock tests only. The official SDK adapter now exists; see
[VERTEX_AI](VERTEX_AI.md) for current configuration, verification and gates.
Historical aggregate results below predate this SDK addition. Live configuration,
billing/credit eligibility and live quality remain unverified; public generation
stays closed. Formal Phase 7 remains PARTIAL on support/human and release gates.

| Package | Implementation / local tests | Formal outstanding evidence |
| --- | --- | --- |
| P35 | PASS: strict public question foundation preserved and extended | Distributed ingress/admission remains a production gate |
| P36 | PASS locally: bounded provider/configuration/transport interface, mock, prompt assembly and approved Vertex Gemini SDK adapter | Live project/ADC/billing and provider quality unverified; no paid usage |
| P37 | PASS in synthetic scope: modular structured retrieval/generation/validation orchestration | Real-model grounded-answer quality unmeasured |
| P38 | PASS locally: deterministic citations, reviewed-claim SQL adapter, delivery-time support recheck and fail-closed tests | Real approved claim/support data and human entailment evaluation pending |
| P39 | PASS in synthetic scope: abstention, partial answers, conflict/temporal/numerical safeguards | Real government examples and bilingual review pending |
| P40 | PASS in local API/mock scope: existing UI, ephemeral context, cancellation, reset and warnings | Public generation intentionally disabled; no live-provider journey |
| P41 | Synthetic evaluation, adversarial regressions, local HTTP/UI checks and final audit | PARTIAL: production targets and required independent human review not evaluated |

Changed source groups: `lib/answers/{contracts,provider,prompt,citations,service,client}`
and their tests; P35 question contracts/handler; existing chat/conversation/composer
components; server-only environment configuration/layout; Phase 7 Playwright config
and four browser/HTTP tests; package scripts and CI. The subsequent adapter adds
only the official Google Gen AI SDK dependency. The completion follow-up adds two
forward support-projection migrations; no ORM, new tables, credentials or external
infrastructure added.

### Provider, prompt and budgets

Provider selection is disabled by default. The generic configured transport is a
trusted server injection port, not a claim that a hosted protocol adapter exists.
Gemini through Vertex AI is now approved for adapter implementation only; no live
key, ADC lookup or external model request is enabled by the application.
`readProviderConfiguration` validates optional AI_PROVIDER/AI_MODEL, timeout,
context byte, output token and local daily reservation settings. Environment mode
`mock` is rejected; test mocks are explicit code injection only. Missing transport
remains unavailable. No secrets enter client modules, prompts or usage snapshots.

One provider operation can run at a time. Defaults: five-second provider deadline,
16,000 UTF-8 context bytes, 1,024 output tokens, 100,000 local daily reservation
units. Hard policy maxima are validated. There are no automatic retries/corrective
generation loops. Reservation is conservatively input bytes plus max output tokens,
never refunded after failed/unknown usage; it is not currency or a verified
tokenizer/cost estimate. Reported usage is validated but still provider accounting.
The 100-entry volatile diagnostic buffer holds model/counts/duration/category only.
A constant-memory total also counts attempts and reserved units; configuration
is frozen after validation. No raw prompt or question enters these metrics.
A timed-out noncooperative transport keeps its concurrency slot until it settles.
Durable distributed budgets, verified pricing and actual provider billing remain
activation gates; no production cost or paid latency measurement is invented.

Prompt system instructions are separate from JSON-encoded untrusted question and
evidence data. No tools, credentials or prior assistant claims are supplied. Up to
eight whole eligible passages are selected within the byte budget; oversized
passages are skipped, not silently rewritten or assigned altered locators. A model
can select only supplied passage IDs and verbatim support quotes. Model-generated
URLs, titles, pages and extra fields are rejected. Prompts alone are not a proof
against prompt injection; independent output/support controls remain necessary.

### Retrieval, claims and citations

RAG reuses existing Phase 6 routed retrieval and restricted SQL delivery recheck,
not another search implementation. Maximum 12 generated claims, four evidence
references each, 20 retrieval candidates, eight prompt passages. The existing
256-code-point/32-token retrieval input bound remains; an overly long expanded
question asks for clarification rather than silently discarding requested scope.

Only prior user intent may help a conservative follow-up pattern. Each follow-up
retrieves and validates anew; previous assistant prose never becomes evidence.
Ambiguous routing and known conflicts withhold guidance. Complete retrieval,
support or delivery-policy outages return unavailable, not an authentic empty
result. Provider/JSON/schema failures have safe structured outcomes.

The model supplies claims and quote/ID references only. IDs and quotes must match
the supplied context; numerical strings must occur explicitly in quoted evidence.
Neither check proves entailment. `SupportReview` is a separate trusted server
capability keyed to exact claim text/type/language, quote, immutable passage/
version/hash/locator identity. **Its default denies every claim.** Tests inject
explicit synthetic approvals, never human review. All claims need support; detected
fees/deadlines/eligibility/documents/procedures/numerical claims also need the
critical decision. A supported topical passage alone cannot grant that decision.

The existing private service_claims/claim_evidence system remains the owner of
real review records. No competing approval database is introduced. Connecting
this narrow support capability to actual independently reviewed records, including
reviewer revocation and applicability checks, is pending. No automatic semantic
judge, production support approvals or qualified-human conclusions are claimed.

After generation/support validation, all used IDs are rechecked together through
the existing restricted PostgreSQL projection. Missing/revoked evidence, changed
publication generation, version/hash/text/locator/URL substitutions or conflict
holds suppress the bundle. The delivery-check timestamp must be within five
seconds (not a five-second source expiration policy). Actual source freshness,
reviewer/access/quality eligibility remains SQL/SOURCE_POLICY's responsibility.
Future effective dates and expired evidence also suppress delivery. Retrieval,
publication, review and checked dates remain distinct; unknown publication date
stays null with a warning. No newest-source-wins rule or invented PDF anchor.

Citation IDs are deterministic from immutable evidence identity. Titles, URLs,
agency IDs, text, hashes, versions and locators come from the current server
projection, not model JSON. Agency names are null because the current passage
projection does not provide reviewed labels; no guessed name or private lookup is
used. All model prose is treated as material claims; no uncited free-form summary
can slip around validation. Partially approved claims are clearly partial. If any
binding/quote is malformed, the whole candidate is withheld rather than patched
with substitute evidence.

### API and conversation integration

The approved `/api/v1/answers` endpoint remains the only question endpoint.
P40 extends P35 with at most six strict user/assistant history items and 8,000
aggregate Unicode code points, 2,000 per item. The streamed body ceiling is now
40 KiB for Unicode history, body deadline two seconds, overall API deadline 20
seconds, RAG deadline 15 seconds. This supersedes P35's earlier 16 KiB/two-second
whole-request policy; other validation/admission protections remain. Timed-out
noncooperative injected work cannot immediately reclaim a concurrency slot.
Basic auto-language handling recognizes conservative Banglish markers such as
kivabe/korbo/lagbe; explicit preferences always win. This is not a general
Banglish quality classifier or the later Phase 8 optimization.

**Production still returns POLICY_UNAVAILABLE before processing.** No live
retriever/generator is wired into the public handler. `CHAT_MODE=api` selects only
the same-origin interface; it cannot activate a provider, approvals or generation.
Default remains the explicitly labeled demo. Select mode when building/restarting;
static pages can contain build-time settings. The API path was tested on dynamic
assistant pages. Page rendering needs no database/model credentials.

The existing conversation components are reused. Browser requests omit credentials,
use no-store and minimize identifier-like strings/URLs on client and server. Only
bounded user context is transmitted; no cookie/session ID, previous assistant
claims, shared conversation cache or persistent history is introduced. The
heuristic is not comprehensive PII detection. Reset cancels the active request and
clears turns/retry/context; 30 minutes idle also clears memory. Same-tick duplicate
submission, stale completion and unbounded context growth are guarded. API timeout
is 22 seconds; response reading is capped at 256,000 bytes with strict schemas.

API answers use the existing layout with plain escaped text, step blocks,
prominent localized warnings, exact source links and page/verification metadata.
Citation anchors include request IDs to avoid duplicate IDs across turns. Links
do not send a referrer. No unsanitized HTML, Markdown execution or generated URL
is used. Existing local feedback remains clearly unsubmitted; no duplicate feedback
backend or automatic conversation collection was added.

## Evaluation and verification

Reproducible commands: `npm run test:phase7`, `npm run test:phase7:ui` (after build),
and `npm run validate:phase7`. On this Windows setup use `npm.cmd`.
The aggregate runs existing full Phase 6 regression plus API-mode UI tests.
**`npm.cmd run validate:phase7` completed with exit 0.** Final actual evidence:

| Command/check | Result |
| --- | --- |
| `npm ls --all` | Dependency graph PASS; no new dependency |
| `npm run format:check`, `npm run lint` | PASS |
| `npm run typecheck` | Strict app and generated database types PASS |
| `npm run test:coverage` | 545 tests / 32 files PASS; existing scoped function coverage 93.1%, unchanged 90% gate |
| Python pip consistency / `npm run test:python` | PASS / 171 tests PASS |
| `npm run docs:check` | 13 required documents and local links PASS |
| `npm run build` | PASS; 124 static pages |
| `npm run test:e2e` | 32 default Chromium cases PASS |
| `npm run test:database:guards` | Five guards PASS |
| `npm run test:database` | 135 real SQL cases PASS |
| `npm run test:integration` | 28 grouped local Auth/MFA/API/browser checks PASS |
| `npm run test:parser` | 16 native offline parser/OCR/isolation checks PASS |
| `npm run embedding:verify`, `npm run test:retrieval:models` | Pinned files PASS; three actual offline embedding/SQL tests PASS |
| `npm run test:phase7:ui` | Four additional API-mode browser/HTTP cases PASS |

The final aggregate log is `.cache/phase7/validation.log`. Earlier scoped checks
(including targeted 72 cases before three additional cases) also ran; final
counts supersede them. Coverage percentages concern the existing configured scope,
not the whole application or semantic safety. Browser checks
include real closed-API responses, client redaction/reset, Bangla keyboard input,
mobile no-overflow and axe checks, plus mocked supported-step/citation display.
Real browser tests use the actual Next server; mocked answer delivery is labeled.

The versioned engineering fixture is in `answers/service.test.ts`, revision
p41-synthetic-v1. It writes `.cache/phase7/evaluation.json`, a review package with
questions, evidence DTO/IDs, generated mock answer, claim/citation mappings,
expected outcome, timing and explicitly pending reviewer observations. Nine
positive cases (three topics by three language modes) and nine unsafe/unanswerable
scenarios passed their specified structural expectations. The nine positives
reuse one fictional claim and mocked routing/support; they are correlated and
do not measure real service routing or translation quality. No real fee or deadline
is present. These are 18 synthetic checks, not 18 independent human validations.
Copy the generated package to a stable review location before annotation; test
reruns replace the cache artifact. No reviewer result has been entered.

Proposed release targets (95% grounding, no fabricated critical facts, 90% routing
and abstention) remain **NOT EVALUATED** on the required real/human-held-out set.
Nine expected abstentions succeeding does not establish 90% real-world abstention.
Citation integrity was tested independently of plausible answer text; actual
semantic quality and calibrated confidence are not inferred from schema validity.

Local HTTP probe: 30 sequential closed-policy POSTs and eight concurrent closed
POSTs, all 503. `.cache/phase7/http-timing.json` records actual p50/p95 and samples.
Final run: p50 9.62 ms, p95 17.02 ms; eight concurrent requests completed in 51.05
ms total. The 18 mock pipeline cases measured p50 2.08 ms / p95 10.78 ms.
These measure the loopback unavailable path only, not generation/retrieval latency,
public capacity or load resilience. Mock pipeline timings are in evaluation.json;
reported mock provider durations are not actual LLM latency. Phase 6 native model
tests remain separately identified. No unsupported operating-cost estimate.

Initial defects corrected: demo adapter unnecessarily received question text
(restored its prior privacy boundary); strict mock function/readonly fixture types;
backend outages distinguished from insufficient evidence; held concurrency slots
for timed-out noncooperative work. No failing check is intentionally ignored.
The first aggregate stopped at scoped function coverage 89.65% despite all unit
tests passing. A long-API-answer retention check restored 93.1%; no threshold or
test-discovery weakening was used. The complete aggregate then passed.

## Final security and cleanup inspection

Ordinary database: 43 forced-RLS private tables, 32 migrations; zero source
documents, vectors, profile approvals or Auth users. Ingestion remains paused.
Zero disposable databases or temporary model roles remain. Owned Auth is stopped;
original PostgreSQL remains running. A limited scan of 313 reviewable text files
for the actual local database password and private-key blocks found zero matches;
this is not comprehensive secret detection. All 14 original staged entries remain.
No commit, push or history change. Final documentation/whitespace checks pass.

## Open-defect / gate register

1. Gemini/Vertex protocol adapter is now implemented and mock-tested; project,
   privacy/ADC/billing/credits and explicitly budgeted live verification remain
   absent. See [VERTEX_AI](VERTEX_AI.md). No claim of live-provider acceptance.
2. Phase 6 real-corpus relevance and Phase 7 independent bilingual grounding review
   remain pending. Existing EVALUATION's held-out/repetition requirements stand.
3. Support-review record adapter is now implemented and locally tested. Approved
   real claim/evidence review records remain absent; nonempty applicability is
   withheld until explicitly matched. Agency name remains null when no trusted
   label is supplied. This is conservative safety, not automatic entailment.
4. Distributed edge limits/budgets, ingress logging/retention and deployed isolation
   remain unverified. Local counters are not production abuse/cost protection.
5. Human/device/translation review, prompt-injection evaluation against a real model,
   representative load, provider performance and GitHub-hosted CI remain unverified.

There is no known unresolved local failing check after final verification.
None of the gates may be bypassed to label this
phase production-ready. Git's original staged work must remain preserved; no
commit/push or public release is made. Next action is provider/support/corpus
review and remediation of these gates, **not automatic Phase 8**.
