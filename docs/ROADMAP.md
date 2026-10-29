# Ask Bangladesh phased roadmap

Current 2026-10-24 checkpoint: authorized local engineering through P45/Phase 8
is implemented. The [pre-Phase-9 audit](PRE_PHASE_9_AUDIT.md) repaired confirmed
local gaps and passes the full local gate. Formal Phases 6-8 still require approved official evidence,
independent evaluation and controlled provider verification. No Phase 9, onboarding,
paid calls or deployment is authorized. Historical authorizations below retain their
original boundaries; latest instructions/checkpoint take precedence.

Status: the owner approved Phase 0 and authorized the Phase 1 foundation P04-P07
on 2026-10-18. P04-P07 passed local foundation verification; actual results belong in
[PHASE_1_REPORT](PHASE_1_REPORT.md). P08 was authorized on 2026-10-19 and passed
local shell checks; see [P08_REPORT](P08_REPORT.md). The owner then authorized
P09-P13, which passed local frontend verification; see
[PHASE_2_REPORT](PHASE_2_REPORT.md). The owner then supplied the complete Phase 3
package; P14 passed real local database and quality verification after runtime
remediation, then the explicitly authorized P15 passed private evidence-model
verification. See [P14_REPORT](P14_REPORT.md) and [P15_REPORT](P15_REPORT.md).
On 2026-10-20 the owner authorized finishing P16/P17. Both passed local Phase 3
verification; see [PHASE_3_REPORT](PHASE_3_REPORT.md). On 2026-10-21 the owner
authorized P18, which passed local registry/review verification; see
[P18_REPORT](P18_REPORT.md). The owner subsequently authorized finishing P19-P21
and explicitly selected implementation/tests only. Those now pass locally; see
[PHASE_4_REPORT](PHASE_4_REPORT.md). The owner subsequently authorized P22's secure
retrieval implementation and then explicitly authorized all P23–P28 work. See
[P22_REPORT](P22_REPORT.md) and [PHASE_5_REPORT](PHASE_5_REPORT.md). Stop before P29.
Real source onboarding,
live checks and production approval remain separate gates. Planning date:
2026-10-18 (Asia/Dhaka). Later acceptance targets remain unmeasured requirements.
Approval does not mark the P02 audit's deferred P03 findings as implemented.

## Execution and authorization rules

Complete one explicitly authorized phase at a time. Before each phase, inspect
the repository and working tree, read [AGENTS](../AGENTS.md) and
[PLANS](../PLANS.md), write a scoped plan and acceptance criteria, identify
dependencies and approvals, and preserve unrelated work. At the end, report actual
changes, commands and results, manual review, unresolved risks, costs, and the
concrete next task. Stop. A successful check or an attractive proposal does not
authorize the next phase. Record a Git checkpoint only when a usable repository
exists and the staged list has been reviewed for secrets and phase scope.

Security, privacy, accessibility, evidence, and cost controls apply from the first
phase containing the relevant data or action. Phase 10 is an integrated audit,
not permission to defer those controls. Phase 9 provides full operator tooling;
earlier phases must have a restricted, audited review mechanism before anything
can publish. Avoid unaudited one-off database edits as a substitute for review.

Deployment, provisioning, paid operations, external transactions, government
authentication, and third-party messages require explicit applicable authorization.
A phase authorization does not silently approve spending or production deployment.
No step may bypass authentication, CAPTCHAs, robots/access rules, or restrictions.

## Phase 0: Project specifications and architecture

Authorized scope: inspect the repository and create the requested planning files
plus a dependency-free documentation validator. Produce the full product scope,
sitemap, architecture, API contracts, entity model, ingestion/retrieval design,
source policy, experience system, security, evaluation and deployment proposals.
Use official technical documentation to verify changing stack assumptions and
record check dates and uncertainties. No government facts are approved in this
phase. No application scaffold, dependencies, migrations, provisioned services,
deployment or paid external calls are permitted.

Acceptance: all thirteen requested planning files exist; CAP-01 through CAP-30
map to owners, phases and acceptance requirements; local documentation links and
structure pass the offline validator; cross-document contradictions, trust
boundaries and unverified assumptions are reviewed. The report distinguishes
executable documentation checks from manual semantic review and future tests.

Validation: run `python scripts/validate_docs.py` or
`py -3 scripts/validate_docs.py`. The command validates structure and local links
only. Record the actual command and result in [PLANS](../PLANS.md); it cannot
prove application behavior, government accuracy, source accessibility, security,
or successful integration.

Stop gate: present the architecture and plan for user review. Do not create
application code until the user explicitly authorizes Phase 1.

## Phase 1: Repository and development infrastructure

Entry: explicit Phase 1 authorization after architecture review; resolve material
stack and licensing decisions before installing affected dependencies.

Work: establish or inspect Git; create the single Next.js App Router/TypeScript
application and isolated Python worker development foundation; pin compatible
maintained toolchains and dependencies; configure formatting, lint/type checks,
test commands, example environment variables, CI, secret scanning, and local
dependency boundaries. Set up Vitest, Playwright and Pytest where they exercise
planned behavior. Keep model/embedding interfaces separate. Document local
PostgreSQL/pgvector/private-storage options without provisioning remote services.
Proposed stack details and alternatives are in
[ARCHITECTURE](ARCHITECTURE.md).

Resolve the public supported-browser population and Tailwind 4 compatibility
trade-off before committing to styling tools; define Phase 2 fallback checks.
Resolve PyMuPDF's AGPL/commercial licensing gate or choose an approved alternative
before adopting that dependency. No exact package version is selected by this
roadmap; Phase 1 must recheck maintained compatible versions.

Acceptance: a new developer can follow documented setup; deterministic local
commands run successfully; app and worker boundaries are explicit; no secret,
government seed fact, or live paid request is committed; CI can fail correctly on
an intentional temporary check failure that is then removed. Dependency/license
and runtime compatibility decisions are recorded. Tests at this point cover the
development harness, not future government guidance.

Stop gate: report the exact setup/check results and remaining infrastructure
risks. Request explicit Phase 2 authorization; no cloud provisioning or deployment
is implied.

## Phase 2: Complete frontend interface and design system

Entry: approved Phase 1 outcome and explicit Phase 2 authorization.

Work: implement the complete public route shells from [PRD](PRD.md), navigation,
Bangla-first locale infrastructure, reusable components, evidence panels, all
answer/failure states, responsive layouts, policy/help pages and clearly fictional
fixtures. Provide optional English translations only after review. Banglish is a
query/answer mode. Reserve admin/future sitemap contracts without activating
unauthorized integrations. Apply [DESIGN_SYSTEM](DESIGN_SYSTEM.md).

Acceptance: signed-out browsing and the prototype ask-to-evidence journey work;
all public route shells and meaningful loading/empty/error states are reviewable;
mobile, keyboard, screen-reader and reflow checks have recorded results; initial
transfer/font budgets are measured and settled; independent branding is clear.
No fictional fixture can be mistaken for verified government requirements.

Stop gate: user reviews the interface and accessibility issues; explicit Phase 3
authorization is required for data implementation.

## Phase 3: Database schema and data models

Entry: approved interface/data needs and explicit Phase 3 authorization.

Work: implement the [DATABASE](DATABASE.md) entity contracts, stable source URL
identity, immutable document versions, passage locators, claim/citation links,
reviewed public projections, source lifecycle, audit and privacy controls.
Implement migrations only now, with constraints, roles, backup/restore design and
rollback strategy. Test pgvector extension/version and model dimensionality
assumptions locally. No real citizen data or restricted document is needed.

Acceptance: migrations apply and can be safely rolled forward/back according to
their documented constraints; data integrity, authorization boundaries,
publication gates, provenance and deletion/retention behavior have meaningful
tests. Public roles cannot read raw ingestion/private objects. Stable IDs survive
metadata updates and version changes.

Stop gate: review schema and actual migration tests; obtain explicit Phase 4
authorization before onboarding official sources.

## Phase 4: Official government-source directory

Entry: explicit Phase 4 authorization; decide a bounded initial corpus and assign
source reviewers before collecting or publishing live records.

Work: implement source, service and agency directories and their public projections;
review official ownership/provenance, access policy and source risk using
[SOURCE_POLICY](SOURCE_POLICY.md). Create the minimum restricted audited review
workflow needed for source onboarding. Record accessible and inaccessible checks
honestly. Approve only actual verified URLs; do not synthesize plausible URLs.

Acceptance: each published record has traceable review evidence and appropriate
status; `candidate -> verified -> active` is enforced with suspended/retired
behavior; verified ownership alone cannot publish evidence; rejected/inaccessible
candidates remain non-actionable. Signed-out users can inspect the bounded
coverage and sources without seeing private configuration. No fee, deadline,
eligibility or instruction appears without qualifying evidence.

This phase delivers reviewed directory metadata and provenance. Actionable
service detail sections and guidance remain unavailable until the reviewed
document-version/passage workflow in Phase 5 supplies eligible evidence. Any
metadata still needing that workflow stays private; the phase order does not
permit a publication shortcut.

Stop gate: review coverage, source staffing and unresolved provenance; obtain
explicit Phase 5 authorization. Source approval is not crawler permission.

## Phase 5: Crawler, ingestion, HTML/PDF extraction and document processing

Current local implementation/test decision: **P22-P28 PASS**; see
[PHASE_5_REPORT](PHASE_5_REPORT.md). The owner authorized the entire phase,
with synthetic/offline verification and no live source onboarding/collection.
Live coverage, representative human-reviewed extraction quality and production
operations remain gates. At that Phase 5 checkpoint Phase 6/P29 was not started;
later Phase 6-8 local work and formal limits are recorded in their reports.

Entry: explicit Phase 5 authorization; approved sources and permitted retrieval
rules; explicit budgets/approvals before hosted OCR or paid processing.

Work: build bounded isolated worker jobs for allowed public HTML/PDF retrieval,
extraction, change detection, provenance, Bangla OCR evaluation when needed,
quarantine, quality review, passage segmentation and publication. Enforce URL,
redirect, network, file-size, parser and resource limits; no authenticated access,
CAPTCHA solving or instruction execution. Add configurable risk-based freshness
schedules, conflict flags and review queues. The ingestion design belongs to
[ARCHITECTURE](ARCHITECTURE.md), with publication rules in
[SOURCE_POLICY](SOURCE_POLICY.md).

Acceptance: reviewed fixtures and permitted source samples demonstrate stable
versions and locators, idempotent retries, parser isolation, error states, Bangla
extraction/OCR quality flags and rejection of unsafe/low-quality content. Review
staff can suspend/revoke evidence. Failed fetching is recorded as no newly
verified evidence; stale/conflicted claims stay blocked. Tests distinguish local
fixtures from actual website access.

Stop gate: report measured extraction quality, source access results, OCR/license
decisions and operating costs; obtain explicit Phase 6 authorization.

## Phase 6: Hybrid retrieval and multilingual search

On 2026-10-22 the owner supplied P29-P34. P29 was implemented and locally verified
under its explicit stop before P30; see [P29_REPORT](P29_REPORT.md). Phase 6 remains
in progress, with no real corpus, embeddings, model choice, hybrid fusion or P30
  implementation implied by that historical checkpoint. The owner subsequently
  explicitly requested finishing Phase 6, authorizing P30-P34 together. Their local
  implementation/evaluation and remaining official-corpus/human gates are in
  [PHASE_6_REPORT](PHASE_6_REPORT.md). Stop before Phase 7.

Entry: explicit Phase 6 authorization; reviewed eligible corpus; separate approval
before paid embedding calls.

Work: implement normalized keyword retrieval, multilingual embeddings, metadata
filters and hybrid ranking through provider interfaces; add controlled indexing,
model-version migration, stable passage results, bounded queries and cache
invalidation. Filter publication eligibility at retrieval and again before
delivery. Use [AI_SYSTEM](AI_SYSTEM.md) and [EVALUATION](EVALUATION.md).

Acceptance: versioned Bangla/English/Banglish retrieval fixtures compare keyword,
vector and hybrid results; relevance and latency are measured; irrelevant,
unpublished, suspended, expired and conflicting material cannot become eligible
by ranking highly. A vector-provider failure has a safe keyword-only search
fallback when eligible evidence exists. Reindexing does not mix incompatible
embedding dimensions or silently change published provenance.

Stop gate: review evaluation data, recall gaps and costs; obtain explicit Phase 7
authorization. Retrieval quality alone does not approve generated answers.

## Phase 7: Grounded AI chatbot and citation validation

Entry: explicit Phase 7 authorization; retrieval gate reviewed; paid model and
usage budgets approved separately before live calls.

Work: implement anonymous text conversations, clarification, evidence-constrained
generation, structured claims/citations, claim validation, final delivery
eligibility check, uncertainty states, feedback intake, rate limits, cancellation
and bounded spending. Treat source text as untrusted data; no model tool may
perform government transactions or privileged administration. Avoid displaying
actionable streaming text before validation.

Acceptance: [EVALUATION](EVALUATION.md) gates are measured on a versioned suite;
unsupported fees, deadlines, eligibility, instructions and URLs are blocked;
citations resolve to eligible current passages; prompt injection, stale/conflict,
provider failure, budget pause and source revocation tests have recorded results.
Basic use requires no account. Redaction/retention controls apply from the first
request, and minimal anonymous correction intake reaches a protected review queue.

Stop gate: report failures and model cost/quality evidence; obtain explicit Phase 8
authorization. Passing a demo does not authorize public beta.

## Phase 8: Bangla/Banglish/English optimization

Entry: explicit Phase 8 authorization and a reviewed baseline answer system.

Work: evaluate normalization, transliteration, mixed-script ambiguity, answer
language choice, Bangla terminology, multilingual retrieval and translation
fidelity with fluent reviewers. Improve language quality without relaxing
evidence or altering official facts. Optional English UI release remains a product
decision; Banglish does not create a new route tree.

Acceptance: reviewed scenarios cover spelling variants, script mixing, ambiguous
names, numbers, dates, requirements and citation parity; important ambiguity leads
to clarification; meaning and provenance survive language changes. Record measured
results and unresolved dialect/accessibility limitations; do not claim universal
language support.

Stop gate: review language and coverage limits; obtain explicit Phase 9
authorization.

## Phase 9: Administrative dashboard and operational controls

Entry: explicit Phase 9 authorization; operator roles, access policy and reviewer
account provisioning approved as applicable.

Work: complete protected admin routes for sources, services/agencies, ingestion,
document review, conflicts, feedback, evaluations, usage, health, settings and
audits. Add freshness/escalation workflows, redacted analytics, budget alerts,
kill switches, source suspension/revalidation and auditable role-specific actions.
Retain server-side controls even if the dashboard fails.

Acceptance: authorization and audit tests cover each mutation and object scope;
operators can resolve a correction and suspend affected claims without unsafe
database edits; cost/freshness/provider alerts are exercised; secrets/raw citizen
queries do not enter dashboards. Keyboard and screen-reader review covers the
admin complete processes. Production alert delivery/messages still require
applicable authorization.

Stop gate: review operator readiness and access; obtain explicit Phase 10
authorization.

## Phase 10: Security, privacy, testing and reliability

Entry: explicit Phase 10 authorization; integrated system and prior-phase evidence
available. This audit supplements controls already implemented.

Work: perform the integrated threat-model, authorization, SSRF, parser isolation,
prompt injection, citation, privacy, deletion, abuse, dependency/license,
accessibility, mobile performance and reliability review in
[SECURITY](SECURITY.md) and [EVALUATION](EVALUATION.md). Exercise outage degradation,
budget stops, cache revocation, backup/restore, rollback and incident playbooks.
Use synthetic or specifically authorized evaluation data.

Acceptance: required release gates have actual results and unresolved findings
have owners/severity; critical release blockers are resolved; restore and rollback
are demonstrated in the approved environment; sensitive-data handling and access
are reviewed. Document residual risk and do not label the platform secure merely
because scanners pass.

Stop gate: user reviews integrated findings and beta plan; explicit Phase 11
authorization is required. Any new paid/external infrastructure needs separate
approval.

## Phase 11: Real-user evaluation and controlled public beta

Entry: explicit Phase 11 authorization; approved beta corpus, hosting/exposure and
spending, informed research process, support/reviewer capacity and tested rollback.
If beta requires external hosting, approve that limited deployment explicitly;
Phase 12 remains the general production release gate.

Work: conduct bounded evaluation with representative Bangla/Banglish/English,
mobile/low-bandwidth and assistive-technology users. Explain independence, coverage
and AI limitations. Observe task completion and evidence comprehension with
minimal consented data; monitor unsafe claims, correction handling, service
failures and cost. Beta access never requires an account for basic information.

Acceptance: [EVALUATION](EVALUATION.md) criteria and documented user findings are
reviewed; feedback/corrections and incident response work in the beta setting;
coverage claims match approved sources; measured spend stays within approved
limits. Any release blocker pauses the affected path or beta. Publish only
aggregate findings authorized for sharing.

Stop gate: user reviews beta evidence and residual risks; explicit Phase 12 and
production deployment authorization are required.

## Phase 12: Production deployment and monitoring

Entry: explicit Phase 12 authorization plus approval for the concrete production
deployment, provider/region choices, spend, domains/secrets, operator roles and
release plan. Deployment must follow a reviewable artifact and actual checks.

Work: apply [DEPLOYMENT](DEPLOYMENT.md): least-privilege runtime configuration,
private storage, approved migrations, backups, health/readiness, observability,
budget controls, source freshness, gradual rollout and rollback. Verify public
independence/privacy/coverage notices and publish only reviewed projections.

Acceptance: a signed-off release has actual smoke, citation, accessibility,
operational and rollback evidence; alerts and on-call/reviewer ownership exist;
budgets and kill switches are exercised; monitored production source changes
trigger revalidation. State known limitations and the supported coverage. Do not
claim deployment occurred unless the authorized deployment actually succeeded.

Stop gate: hand over the operating runbook and report measured production checks.
Further product scope, provider changes, paid expansion or integrations require
their own scoped authorization.

## Future phases: Separately scoped capabilities and expansion

These items are architectural reservations, with no automatic implementation
order or authority to activate routes:

| Future capability | Required gate before implementation or activation |
| --- | --- |
| Voice questions and audio answers (CAP-27) | Explicit scope, consent, language evaluation, accessible text fallback, grounded audio, retention and provider/spend approval |
| Public-document assistance (CAP-28) | Explicit upload scope; public/unrestricted content rules; malware/parser isolation; file limits; private ephemeral storage, deletion and evidence-origin warnings |
| Optional accounts and saved features (CAP-29) | Explicit feature/data scope; authentication/accessibility/privacy review; deletion/export; continued anonymous basic use |
| Expanded government coverage | Source-by-source provenance/access review, reviewer capacity, evaluation and risk-specific freshness; no bulk trust from domain patterns |
| Authorized government transactions (CAP-30) | Written government authorization; verified API and legal/privacy review; user confirmation; separate credentials and isolation; audit, reversibility/reconciliation and deployment/spend approval |

Every future scope must name its acceptance tests, rollback and stop gate before
work begins. No future route or interface is an approval to ingest a restricted
document, authenticate to a government service, send a third-party message, or
perform a transaction.

## First implementation task after Phase 0 review

The concrete first Phase 1 task is to verify current supported toolchain versions
and relevant licenses, record the decisions, then create the minimal local Next.js
and isolated Python-worker foundation with pinned dependencies, example
configuration and runnable checks. Before that task starts, the user must approve
the architecture and explicitly authorize Phase 1. No remote service or paid API
is needed for that first task.
