# Ask Bangladesh product requirements

Status: Phase 0 approved; Phase 1 P04-P07 and Phase 2 P08-P13 passed local checks.
See [PHASE_1_REPORT](PHASE_1_REPORT.md) and [PHASE_2_REPORT](PHASE_2_REPORT.md).
The default frontend remains a local demonstration with preparation topics. Local
database, ingestion, retrieval, grounded-answer and multilingual foundations now
exist through Phase 8; no approved real corpus or live AI is enabled. Structured
feedback intake is prepared with private storage and a closed production gate;
the default feedback form remains an unsubmitted preview. No government-service
coverage, full accessibility conformance or public launch is approved by that result.
Planning and source-check date: 2026-10-18 (Asia/Dhaka).

## Mission and product boundary

Ask Bangladesh is an independent information service that helps people understand
Bangladesh government services through plain explanations and exact official
evidence. It must never imply government ownership, endorsement, or authority to
decide eligibility. Basic browsing, search, and informational questions require
no account. The product must work for citizens who use inexpensive phones, limited
data, shared devices, Bangla, Banglish, English, or assistive technology.

The initial product is informational. It does not submit applications, take
payments, access a citizen's government account, or guarantee a service outcome.
Voice, citizen document assistance, personal accounts, and authorized transactions
are future work with separate review and explicit authorization. This boundary
does not remove these capabilities from the long-term architecture.

The proposed architecture is one Next.js App Router application/BFF on a Node.js
runtime, PostgreSQL with pgvector, private object storage, and an isolated Python
ingestion worker. Supabase is an optional deployment choice; no hosting, model,
embedding or OCR provider is approved. P16 selects Supabase Auth for staff-only
identity; no hosted project or citizen-account feature is enabled. See
[ARCHITECTURE](ARCHITECTURE.md) for components and API contracts,
[DATABASE](DATABASE.md) for entities, [SOURCE_POLICY](SOURCE_POLICY.md) for source
publication and freshness, and [AI_SYSTEM](AI_SYSTEM.md) for retrieval and answers.

## People and principal journeys

| Person / situation | Intended journey | Evidence and safety requirement |
| --- | --- | --- |
| Citizen who knows only a task, using Bangla on a phone | Open homepage without signing in; ask a question; select a service or clarify location/context; read steps; inspect citations; follow a verified official link | Do not ask for identity numbers; each actionable step has eligible evidence; a clarification must be relevant rather than a personal-data form |
| Citizen who types Banglish or mixed English | Type naturally; receive a useful answer in the selected language mode; change answer language without losing the question | Preserve meaning, official names, amounts, dates, and references across modes; a translated answer remains an explanation, not an official translation |
| Person exploring services | Browse service category and agency directory; filter/search; open detail and guidance pages; inspect last review and source limitations | Publish reviewed records only; unavailable evidence removes unsupported actionable fields instead of filling gaps |
| Person who cannot rely on an answer | Open the evidence panel, observe missing/stale/conflicting evidence, read the limits, and use a verified contact or official source if available | Never invent an alternative contact or an answer to keep the screen populated |
| Person reporting an error | Select the claim/source, choose a reason, optionally add a short comment, submit without an account | Warn against personal data; collect minimal context; return a receipt without promising resolution or emailing a third party |
| Source reviewer | Inspect candidate provenance, ownership evidence, crawl permission, document versions, extraction quality, conflicts, and freshness; publish or suspend with recorded rationale | Source ownership verification alone cannot publish; reviewers must approve current evidence and satisfy SOURCE_POLICY gates |
| Operations reviewer | Observe source failures, job queues, citation failures, costs, and correction backlog; pause expensive or unsafe paths | Privileged actions are authenticated, authorized, audited, and reversible where possible; public chat has no admin tools |

## Complete capability inventory

CAP identifiers are stable and follow the thirty items in the initiation brief.
Every acceptance statement below is a future requirement, not a test result.
The phase column gives the first substantive implementation and follow-up gate;
all capabilities are specified in Phase 0. The owning document defines the
contract; other documents must link to it rather than redefine it.

| ID | Capability | Planned phase | Acceptance requirement | Owning document |
| --- | --- | --- | --- | --- |
| CAP-01 | Responsive Bangla-first homepage | 2; validated 11 | Bangla is the default; a signed-out visitor can ask, search, and browse at mobile widths with keyboard access and a visible independence statement | [DESIGN_SYSTEM](DESIGN_SYSTEM.md) |
| CAP-02 | Conversational assistant | 2 interface; 7 behavior | Anonymous text questions support clarification, cancellation, evidence-backed answers, safe refusal, and recoverable failure without displaying unvalidated actionable text | [AI_SYSTEM](AI_SYSTEM.md) |
| CAP-03 | Bangla, Banglish, and English | 2 UI baseline; 8 optimization | UI routes support `bn` and optional `en`; Banglish is a query/answer mode; reviewed cross-language scenarios preserve meaning and citations | [DESIGN_SYSTEM](DESIGN_SYSTEM.md) |
| CAP-04 | Government-service directory | 4 | Searchable, browsable published services link to the responsible agency and reviewed sources; no fake seed facts appear in public data | [PRD](PRD.md) |
| CAP-05 | Government agency directory | 4 | Published agency pages identify verified provenance and related services; ownership is not inferred solely from hostname | [PRD](PRD.md) |
| CAP-06 | Verified source registry | 4; operator controls 9 | Public registry exposes reviewed source metadata and honest status; private crawl configuration and restricted material are never projected | [SOURCE_POLICY](SOURCE_POLICY.md) |
| CAP-07 | Individual service detail pages | 2 shell; 4 metadata; 5 reviewed evidence | Pages distinguish evidenced requirements, eligibility, fees, steps, and limitations; unsupported actionable sections are withheld; citations remain inspectable | [PRD](PRD.md) |
| CAP-08 | Step-by-step guidance pages | 2 shell; 5 reviewed content | Each material instruction maps to current official passage evidence, with applicability and source review information; no assumed step is presented as a fact | [PRD](PRD.md) |
| CAP-09 | Hybrid keyword and semantic search | 6 | Keyword and multilingual vector retrieval are combined, evaluated against a keyword baseline, filtered for publication eligibility, and return passage-backed results | [AI_SYSTEM](AI_SYSTEM.md) |
| CAP-10 | Multilingual embeddings | 6; evaluated 8 | A separately configurable embedding interface passes Bangla/English/Banglish retrieval evaluation; model/version changes support controlled reindexing | [AI_SYSTEM](AI_SYSTEM.md) |
| CAP-11 | Retrieval-augmented generation | 7 | Generation receives only eligible retrieved evidence, handles evidence absence safely, and cannot elevate retrieved instructions into system authority | [AI_SYSTEM](AI_SYSTEM.md) |
| CAP-12 | Passage-level citations | 5 provenance; 7 delivery | Every material actionable claim resolves to a stable reviewed document version and passage locator; unresolved or ineligible citations block the affected claim | [AI_SYSTEM](AI_SYSTEM.md) |
| CAP-13 | Official-source verification | 4 | Recorded official ownership/provenance and access-policy review precede eligibility; a governmental-looking domain alone never establishes trust | [SOURCE_POLICY](SOURCE_POLICY.md) |
| CAP-14 | Source freshness monitoring | 5; operations 9 | Configurable per-source, risk-based review deadlines trigger rechecks and escalation; stale or conflicted evidence cannot support current actionable claims | [SOURCE_POLICY](SOURCE_POLICY.md) |
| CAP-15 | Government document ingestion | 5 | Allowed public documents enter a resumable, audited, idempotent pipeline with version identity, quarantine, review, and explicit publication gates | [ARCHITECTURE](ARCHITECTURE.md) |
| CAP-16 | HTML and PDF extraction | 5 | Representative allowed fixtures retain text, headings, pages/locators, provenance, and extraction quality; unsafe or unreadable inputs fail closed | [ARCHITECTURE](ARCHITECTURE.md) |
| CAP-17 | Bangla OCR when needed | 5 investigation and reviewed pipeline | OCR preserves original-page linkage and quality flags; Bangla accuracy is measured on reviewed fixtures; low-quality passages are blocked, not silently trusted | [ARCHITECTURE](ARCHITECTURE.md) |
| CAP-18 | Source conflict detection | 5 detection; 7 answer behavior | Conflicting fees, dates, requirements, or applicability enter review; affected claims are blocked pending an evidenced resolution and recorded rationale | [SOURCE_POLICY](SOURCE_POLICY.md) |
| CAP-19 | Safe uncertainty handling | 2 state design; 7 behavior | Missing, stale, inaccessible, or conflicting evidence is explained distinctly; unsupported fees, deadlines, eligibility, links, and instructions are never invented | [AI_SYSTEM](AI_SYSTEM.md) |
| CAP-20 | Feedback and corrections | 7 intake; 9 triage | Anonymous reports can reference an answer/claim/source; minimal data, abuse controls, audited review, and a correction/suspension path are present | [PRD](PRD.md) |
| CAP-21 | Administrative dashboard | 9 | Least-privilege roles can review sources, publications, jobs, conflicts, corrections, and controls; every mutation is authorized and audited | [SECURITY](SECURITY.md) |
| CAP-22 | Monitoring and analytics | 1 baseline; 9 operations; 12 production | Redacted operational metrics expose failures, freshness, quality, latency, and aggregate usage without retaining raw citizen questions by default | [DEPLOYMENT](DEPLOYMENT.md) |
| CAP-23 | API usage and spending controls | 1 configuration; 7 request budgets; 9 operations | Per-request/user-class limits, bounded work, timeouts, budget alerts, and a server-side kill switch protect costly paths; no paid action is enabled without approval | [DEPLOYMENT](DEPLOYMENT.md) |
| CAP-24 | Mobile and low-bandwidth optimization | 2; validated 11 | Core directory content remains readable with minimal JavaScript; explicit retry/error behavior and measured transfer/performance budgets cover low-end mobile conditions | [DESIGN_SYSTEM](DESIGN_SYSTEM.md) |
| CAP-25 | Privacy-first operation | Every relevant phase; integrated audit 10 | Anonymous core use, minimal collection, redaction, bounded retention, restricted access, and tested deletion apply to the first relevant data flow | [SECURITY](SECURITY.md) |
| CAP-26 | Accessibility | 2 onward; integrated audit 10 | Proposed WCAG 2.2 AA target is evaluated with automated checks plus keyboard, screen-reader, Bangla reading, reflow, and complete-process manual review | [DESIGN_SYSTEM](DESIGN_SYSTEM.md) |
| CAP-27 | Voice questions and audio answers | Future | Separate approval covers consent, microphone controls, transcription confirmation, text fallback, language quality, privacy, spending, and grounded audio output | [PRD](PRD.md) |
| CAP-28 | Public-document understanding | Future | Separately approved public-document uploads use isolation, limits, scanning, retention/deletion, source-quality warnings, and no automatic trust or publication | [SECURITY](SECURITY.md) |
| CAP-29 | Optional authenticated user features | Future | Optional accounts can add explicitly approved saved items/history with deletion/export controls; signing in never gates basic informational questions | [SECURITY](SECURITY.md) |
| CAP-30 | Government-authorized transactions | Future | A separate threat model, written authorization, verified API contract, legal/privacy review, explicit user confirmation, audit, and recovery exist before any transaction | [ARCHITECTURE](ARCHITECTURE.md) |

## Proposed sitemap

This is the complete planned route inventory, not an assertion that routes exist.
`[locale]` permits `bn` and `en`; `/` selects Bangla by default. English may be
released only when its translations and evidence UX meet the same quality gate.
Banglish is not a third translated route tree. Stable resource IDs must survive
title/slug changes and locale changes; URL and API semantics belong to
[ARCHITECTURE](ARCHITECTURE.md). Public content comes from reviewed projections.

| Planned route | Purpose and required states | First implementation |
| --- | --- | --- |
| `/` | Select Bangla by default; honor an explicit locale choice without mandatory geolocation | 2 |
| `/[locale]` | Homepage, question box, service discovery, independent-service statement | 2 |
| `/[locale]/ask` | Anonymous question/answer session, language mode, cited evidence, clarification, stop/retry | 2 shell; 7 functional |
| `/[locale]/search` | Query, category/agency filters, keyword-only fallback, empty/stale/failed states | 2 shell; 6 retrieval |
| `/[locale]/services` | Published service directory and category filters | 2 shell; 4 content |
| `/[locale]/categories` and `/[locale]/categories/[slug]` | Editorial taxonomy, filters, derived preparation counts and honest empty states | 2 UI; 4 verified service relations |
| `/[locale]/guides/[slug]` | Primary P12 guide template, with unsupported guidance withheld | 2 shell; 5 reviewed content |
| `/[locale]/services/[slug]` | Service overview, applicability, evidenced facts, agency, sources, review status | 2 shell; 4 metadata; 5 reviewed facts |
| `/[locale]/services/[slug]/guide` | Redirect to the primary guide template; later evidence-linked guidance | 2 shell; 5 reviewed content |
| `/[locale]/agencies` | Published agency directory | 2 shell; 4 content |
| `/[locale]/agencies/[slug]` | Verified agency metadata, related services and sources | 2 shell; 4 content |
| `/[locale]/sources` | Public reviewed registry, status and policy explanation | 2 shell; 4 content |
| `/[locale]/sources/[sourceId]` | Verified provenance, status, review dates, accessible official links, current limitations | 2 shell; 4 content |
| `/[locale]/citations/[citationId]` | Public citation landing page for eligible reviewed evidence metadata, document version and passage locator; withdrawn evidence is unavailable; no raw private storage URL | 5 provenance shell; answer links 7 |
| `/[locale]/feedback` | Local-only validation demo; later anonymous correction report and actual receipt | 2 demo; 7 intake |
| `/[locale]/about` | Mission, independence, coverage limits, operating transparency | 2 |
| `/[locale]/trust` | Trust/transparency overview, distinct from detailed source policy | 2 |
| `/[locale]/how-it-works` | Evidence, uncertainty, language modes and AI limitations in plain language | 2 |
| `/[locale]/source-policy` | Public explanation of verification, review, freshness and corrections | 2 |
| `/[locale]/help` | Navigation and access help; no invented helpline or contact details | 2 |
| `/[locale]/privacy` | Actual data flow, retention and user choices, reviewed before collection | 2 |
| `/[locale]/terms` | Independent informational-service terms, reviewed before public use | 2 |
| `/[locale]/accessibility` | Target, known limitations, accessible feedback mechanism | 2 |
| `/[locale]/status` | Implementation status without invented metrics; later sanitized live availability/incidents | 2 shell; 9 monitoring |
| `/admin/sign-in` | Privileged operator authentication; no public account requirement | 9 |
| `/admin` | Protected operations summary | 9 |
| `/admin/sources` and `/admin/sources/[sourceId]` | Candidate review, provenance, access policy, status and freshness configuration | 9 |
| `/admin/services` and `/admin/services/[serviceId]` | Review public service projections and guidance | 9 |
| `/admin/agencies` and `/admin/agencies/[agencyId]` | Review agency projections and provenance | 9 |
| `/admin/ingestion` and `/admin/ingestion/[jobId]` | Queue, extraction quality, bounded retry, quarantine and job history | 9 |
| `/admin/documents/[versionId]` | Protected original/extracted evidence comparison, locators and publication review | 9 |
| `/admin/conflicts` and `/admin/conflicts/[conflictId]` | Conflicting evidence, affected claims and recorded resolution | 9 |
| `/admin/feedback` and `/admin/feedback/[feedbackId]` | Minimal correction intake, triage and resolution | 9 |
| `/admin/evaluations` | Versioned evaluation results and release gate review | 9 |
| `/admin/usage` | Aggregate cost, budgets, limits and kill switches | 9 |
| `/admin/health` | Freshness, ingestion, retrieval and provider incidents | 9 |
| `/admin/audit` | Restricted immutable audit view with redaction | 9 |
| `/admin/settings` | Approved operational policy and role controls with audit | 9 |
| `/[locale]/voice` | Disabled future voice experience with text fallback | Future; hidden until approved |
| `/[locale]/documents` and `/[locale]/documents/[documentId]` | Future private ephemeral document assistance; not a public document index | Future; hidden until approved |
| `/[locale]/sign-in`, `/[locale]/account`, `/[locale]/account/saved`, `/[locale]/account/history`, `/[locale]/account/privacy` | Future optional account and user-controlled saved data | Future; hidden until approved |
| `/[locale]/transactions`, `/[locale]/transactions/[integrationId]`, `/[locale]/transactions/[integrationId]/review`, `/[locale]/transactions/[integrationId]/receipt` | Future authorized integrations with explicit review and outcome status | Future; hidden until approved |
| `/robots.txt` | Machine indexing guidance consistent with public/private policy; never an access-control substitute | 2 |
| `/sitemap.xml` | Index only reviewed, currently published public pages suitable for indexing; no private or personal routes | 2 shell; 4 eligible URLs |

All public routes need localized not-found, service unavailable, empty, loading,
and safe error states as appropriate. Private/admin routes are excluded from
public indexing and protected on the server; absence from navigation is not access
control. Anonymous conversation identifiers and personal input must not appear in
shareable URLs or search indexes. A public answer-sharing route is deliberately
unapproved because it creates privacy, stale-evidence, and deletion obligations.
API paths and machine endpoints are defined only in [ARCHITECTURE](ARCHITECTURE.md).
Service/agency slugs resolve stable underlying IDs, with reviewed redirects when
slugs change. Search text is transient browser state and is submitted through the
architecture's POST search contract; it is not put in the page URL, browser
history, referrer, analytics or access logs. Only nonidentifying directory filters
may appear in shareable URLs. Document/publication policy still applies when a
citizen opens a previously copied citation link.
Machine health endpoints follow [ARCHITECTURE](ARCHITECTURE.md) and reveal only
minimal liveness/readiness; they are not citizen navigation. Admin, staging,
preview, future private/account/document/transaction pages and session-bearing
content must be excluded from indexing. Anonymous ask/search pages and citation
landing pages are `noindex` and absent from the sitemap by default; never index
citizen questions, answer/session identifiers, private document IDs or search
query strings. Revisit citation indexing only after its retention, withdrawal and
privacy behavior is explicitly reviewed. Robots rules and indexing headers do not
replace authentication or publication checks.

## Content and evidence experience

A service detail page has a plain-language title, verified responsible agency,
applicability, an overview, evidence-backed requirements/fees/deadlines where
available, steps, official links, last reviewed information, sources, and an error
report action. Empty actionable fields say that current evidence is unavailable;
an empty field must never imply that no fee or requirement exists.

An answer groups understandable steps with claim-adjacent citations. A source
panel identifies the official publisher, document title, stable version and
passage/page locator, verified official URL, relevant dates, and review/freshness
status. Source publication date, retrieval/check date, and reviewer date must be
distinguished; a successful fetch is not proof of current applicability. The
canonical eligibility rules belong to [SOURCE_POLICY](SOURCE_POLICY.md).

The source lifecycle is `candidate -> verified -> active`, with `suspended` and
`retired` states. Ownership verification does not itself permit publication.
Current reviewed document versions must pass freshness and conflict gates;
eligibility is rechecked at retrieval and delivery. A failed or inaccessible
recheck supplies no newly verified evidence. Stale or unresolved conflicting
material cannot support a current actionable claim. Configure freshness by
source and risk, not one invented universal TTL.

The UI distinguishes an evidenced answer, a clarification request, insufficient
evidence, stale evidence, conflicting sources, a temporarily inaccessible source,
and system/rate-limit failures. It must not show a green universal "verified
answer" badge or an uncalibrated confidence percentage. When only some claims
can be supported, show eligible information with precise limits and withhold the
unsupported action. An official external link is labeled clearly and never
generated from the model's memory.

## Launch proposal and decision register

Launch scope is intentionally undecided. Before selecting a beta corpus, the
product owner must approve a small service/agency set based on public need,
verified accessible evidence, review capacity, Bangla coverage, and the risk of
harm from errors. No specific government service, agency, fee, deadline, URL, or
jurisdiction is verified by this document. Mock content in future interface work
must be visibly fictional and must not resemble approved service guidance.

| Decision needed | Proposed approach | Decision gate / owner |
| --- | --- | --- |
| Beta coverage and exclusions | Small reviewed corpus; publish a coverage list and abstain outside it | Before live source onboarding; product owner and source reviewers |
| English release scope | Bangla first; English only with reviewed translations and evidence parity | Phase 2 design review, finalized before beta |
| Model, embedding and OCR vendors | Separate interfaces; choose by multilingual quality, privacy, cost and licensing | Relevant Phase 5-8 authorization; architecture/security owner |
| Hosting and data region | Compare affordable managed PostgreSQL/private-storage options; Supabase remains optional | Before provisioning; architecture/privacy owner |
| Freshness and correction staffing | Risk-based source schedules, accountable review and incident coverage | Before approved corpus publication; source owner |
| Operational spend and service objectives | Explicit budget and measurable release targets | [DEPLOYMENT](DEPLOYMENT.md) and [EVALUATION](EVALUATION.md), before paid work/beta |
| Personal accounts, voice, uploads, transactions | Separate future scope and consent/threat review | Explicit future phase authorization |

## Acceptance and measurement

Phase 0 acceptance is a complete, internally consistent, reviewable specification
and an offline documentation check. No behavioral, accessibility, security,
performance, source, or production claim can be marked passed in Phase 0.

Future release decisions use [EVALUATION](EVALUATION.md) as the authoritative test
and quality gate plan. It must measure passage retrieval and claim support,
unsafe unsupported answers, stale/conflict handling, cross-language quality,
citizen task completion, accessibility, mobile performance, cost, and privacy.
User research must include Bangla readers, Banglish users, low-bandwidth/mobile
users, and people using assistive technology. Aggregate metrics are preferred;
raw citizen conversations are not routine analytics.

## Risks and next task

Major product risks are official sites being inaccessible or inconsistent,
outdated instructions, weak Bangla extraction/OCR, translation errors, false
trust from polished UI, uncovered services, reviewer workload, and privacy leakage
on shared devices. The response to missing evidence is a clear limitation and
bounded coverage, not relaxed evidence requirements. Accessibility and privacy
start in the first relevant phase, not at the Phase 10 integrated audit.

After architecture review and explicit Phase 1 authorization, the next task is
the development foundation described in [ROADMAP](ROADMAP.md). Stop after Phase 0
until that authorization is given.
