# AI system and evidence delivery

The Phase 7 completion follow-up implements `reviewPublishedClaims` over a narrow
SQL projection and prepares disabled server composition in `answers/runtime.ts`.
Only exact published curated claims with current independent human reviews and
eligible evidence can pass; arbitrary paraphrases and unresolved applicability
remain withheld. Support is checked again after delivery revalidation. No model
can approve its own claim. See [P41 human review](P41_HUMAN_REVIEW.md) for formal
evaluation still required; the public handler does not compose live generation.

Phase 7 local orchestration and its deliberately closed public generation boundary
are described in [PHASE_7_REPORT](PHASE_7_REPORT.md). Provider/mocks, structured
claims, bounded untrusted context, deterministic delivery-time citations and a
separate deny-by-default support-review capability exist. The approved
[Vertex adapter](VERTEX_AI.md) remains disabled; no hosted model call
or real semantic-support review is enabled. A valid citation ID/quote is not proof
of entailment; automatic/real-world answer quality remains unmeasured.

Current Phase 6 implementation is documented in [PHASE_6_REPORT](PHASE_6_REPORT.md).
Two free local embedding candidates have actual CPU/SQL test evidence; no external
model provider, real corpus or answer generator is enabled. The Phase 0 design
below remains a baseline for future answering and production gates.

## Implemented P30-P34 retrieval behavior

Approved eligible passages and queries use immutable compatible local profiles;
model/tokenizer/pooling/prefix/dimension versions cannot be mixed. Unavailable or
incomplete semantic retrieval leaves an explicitly degraded lexical branch if its
policy checks work. A final database/policy failure returns no evidence bundle.

RRF uses `sum(weight/(60+rank))`, default branch weights one. The bounded baseline
reranker uses 0.85 normalized RRF + 0.10 unique heading-token coverage + 0.05
normalized full-phrase match. Default diversity caps are three passages per version
and six per source. These are reproducible heuristics, not calibrated probabilities.
Dates do not receive an automatic newest-wins boost. Eligibility establishes an
approved source relationship; it does not establish claim entailment or legal priority.

P33 uses reviewed database names/aliases and bounded spelling/case-ending rules.
For an unambiguous service, its reviewed name may be appended once as query context,
within existing input bounds. Original/minimized/context variants stay distinct.
Multiple matches remain ambiguous. A scoped empty result permits one general
fallback unless a caller explicitly fixed the service or a conflict is held.
Only that request's same query vector is reused; no citizen query cache is added.
Known conflicts are held even across ambiguous supported services. No LLM resolves
the conflict or generates an answer in Phase 6. Retrieval text remains untrusted data.

P15 now implements private source/version/passage, verification/check, claim,
conflict and embedding-compatibility storage; see [DATABASE](DATABASE.md) and
[P15_REPORT](P15_REPORT.md). PostgreSQL pgvector 0.8.2 is available locally; this
does not select an embedding vendor/model or implement retrieval/generation.
No corpus, government source or reusable verified claim was created. Private SQL
eligibility helpers are structural/freshness guards, not semantic entailment
validators or public answer endpoints. They must be rechecked at retrieval and
delivery when those features are authorized.

P16/P17 add staff identity and a directory metadata API, not retrieval, claim
delivery or answer generation. Public source metadata deliberately carries
`evidence_eligible:false`; clients cannot convert it into a supported instruction.
No public passage/citation or raw document text endpoint exists. See
[PHASE_3_REPORT](PHASE_3_REPORT.md).

## Ownership and invariant

Phase 5 supplies private immutable captured versions/passages, locators, raw/NFC
maps, OCR/tool lineage and a review-blocked indexing outbox. See
[PHASE_5_REPORT](PHASE_5_REPORT.md). No passage is automatically accepted and no
embedding/search/RAG/model is called. Extraction success and aggregate job metrics
are not claim validation. Future retrieval must recheck the existing current
version, append-only human passage decisions, freshness, conflicts and revocations
at retrieval and delivery; outbox readiness alone cannot authorize an answer.

[ARCHITECTURE](ARCHITECTURE.md) owns public API contracts;
[DATABASE](DATABASE.md) owns entity definitions and identifier relationships;
[SOURCE_POLICY](SOURCE_POLICY.md) owns official verification, freshness, conflict,
publication, and suspension rules. This document owns retrieval and answer
behavior. [SECURITY](SECURITY.md) owns security and retention boundaries, and
[EVALUATION](EVALUATION.md) owns measurable release gates. Their requirements apply
from the first relevant phase in [ROADMAP](ROADMAP.md).

Every material actionable statement, including a fee, deadline, eligibility rule,
required document, procedure, exception, or application destination, must be
supported by exact, eligible official passage evidence. A relevant page or a
plausible model completion is insufficient. Failure to establish support means
omit the statement and explain the evidence gap. This is a proposed enforceable
contract, not a claim that automated semantic verification is infallible.

The assistant provides independent information and navigation. It does not make
government decisions, determine a person's legal eligibility, submit applications,
authenticate to government services, make payments, or promise an outcome. Basic
questions do not require an account. The model receives no browsing, SQL, shell,
transaction, or administrative tools in the initial design.

## Language and normalization

Phase 8 local implementation uses the existing bounded query lexicon with revision
`p43-bounded-v1`; it does not infer service aliases or transliterate arbitrary
words. Search normalization is separate from minimized generation wording. Exact
standalone language commands and bounded prior-user topic/language are supported;
fresh topics use detection, unresolved auto language defaults to Bangla. Explicit
answer preference wins. Retrieved source wording and exact language-specific claim
review are unchanged. Warnings preserve UI language and add answer-language copy
when different. See [Phase 8 report](PHASE_8_REPORT.md) for tested limits and formal
corpus/human/provider gates. No live model is enabled by language improvements.

Bangla (`bn`) is the default UI locale; English (`en`) is optional. Banglish is a
query and answer mode, not a third UI route tree. The user can select
`answer_language=auto|bn|en|banglish`; an explicit choice wins over detection.
In auto mode prefer the detected query language, and use Bangla for unresolved
ambiguity. Ask a short clarification when ambiguity would change a material rule.
Do not infer nationality, location, identity, or eligibility from language.

Proposed processing rules:

1. Keep a transient original query for the active request only. The API caps a
   question at 2,000 Unicode code points and history at six `user|assistant`
   messages, with 8,000 total code points including the question. Treat history as untrusted user
   content; a previous answer is not new evidence.
2. Build a versioned NFC-normalized search representation, with whitespace and
   punctuation normalization recorded separately from display text. NFC is a
   defined Unicode normalization form; using it here is a project proposal.
   Preserve original source text and locator offsets rather than rewriting
   evidence. [Unicode normalization specification](https://unicode.org/reports/tr15/).
3. Keep Bangla letters, vowel marks, conjuncts, and meaningful joiners. Do not
   indiscriminately remove combining marks or apply English stemming to Bangla.
   Test zero-width and OCR artifacts with reviewed fixtures before transformation.
4. Add a search-only Bangla-to-ASCII digit representation and reviewed alias
   variants; keep the original number, unit, date, and script for citation and
   validation. Never infer an unreadable digit, calendar conversion, or currency.
5. Detect Bangla, Latin, and mixed script as hints. For Banglish, use a bounded,
   reviewed service/agency alias lexicon and optional transliteration candidates.
   Keep the original query in every retrieval branch; transliteration is not a
   factual source. Ambiguous transliterations must not silently select a service.
6. Permit bounded cross-language query expansion only after evaluation. Generated
   expansions cannot add fees, dates, eligibility, source URLs, or asserted facts.
   No external translation service is selected. Output translation must preserve
   negation, units, conditions, names, and exceptions and undergo the same evidence
   checks as the original-language answer.

The PostgreSQL `simple` dictionary lowercases tokens and supports stop-word
handling; that does not establish Bangla linguistic quality. Start with a tested
non-stemming configuration and explicit aliases. Do not assume a built-in Bangla
stemmer. English-specific stemming is an optional separate branch, subject to
evaluation. [PostgreSQL dictionaries](https://www.postgresql.org/docs/current/textsearch-dictionaries.html).

`pg_trgm` supports trigram similarity and ignores non-word characters when
building trigrams. Its usefulness for Bangla combining marks, mixed script,
misspellings, very short queries, and database locale settings must be measured;
it is not a promised Bangla tokenizer. [PostgreSQL pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html).

## Provider-independent capabilities

Maintain separate generation and embedding interfaces. An embedding provider is
not implicitly the generation provider. Do not select a model from a marketing
language label alone. Evaluate Bangla, Banglish, English, code switching, numeral
preservation, and evidence entailment before approval.

| Interface | Proposed required behavior |
| --- | --- |
| Generator | Accept bounded instruction, query/history, and evidence bundles; return a bounded structured candidate plus usage metadata; support timeout/cancellation; no tool execution |
| Embedder | Accept bounded query or passage batches under a named embedding profile; return validated finite vectors, dimension, and usage metadata |
| Configuration | Server-only provider endpoint allowlist, secret reference, model revision, region/retention policy, context/output limits, timeout, and approved pricing version |
| Capability handling | Record supported structured-output and usage capabilities; always validate locally; never assume every provider implements the same API or guarantees |
| Audit metadata | Store prompt/normalization/retrieval/validation/profile versions, evidence IDs, duration, outcome, reason codes, usage and reservation IDs; exclude raw questions by default |

`embedding_profiles` define provider/model revision, dimensions, distance metric,
normalization compatibility as specified by DATABASE; profile/vendor approval and
active selection remain Phase 6 gates, not implied by a profile row. The
document extraction profile binds parser, normalizer, OCR, and chunking revisions.
Record language evaluation results with the approved profile. `passage_embeddings` bind one profile to one
immutable passage. Query and passage vectors must use a compatible profile;
never compare different vector spaces or silently truncate dimensions.

Model/profile changes require a separate evaluation and index build, followed by
an explicit active-profile switch. Preserve the prior profile for rollback;
invalidate dependent caches. No automatic fallback to an unapproved provider,
region, model, or data-retention policy. Dimension/index support must be checked
against the pinned database extension and hosting service before selection.

## Eligible retrieval and hybrid ranking

P29 implements the lexical branch only; see [P29_REPORT](P29_REPORT.md) and
[ARCHITECTURE](ARCHITECTURE.md) for input/output. SQL `simple` literal lexemes use
an OR candidate query over a GIN passage/heading vector. No citizen query is
accepted as tsquery operators. Exact tokens are intentional: partial words,
typos, English/Bangla stemming, transliteration, digit conversion and alias
expansion are not implemented. Existing directory aliases stay separate.

Version `p29-keyword-v1` scores 0.70 times unique query-token coverage, plus 0.15
for a complete normalized phrase in passage text, 0.10 times heading coverage
and 0.05 times document-title coverage, rounded to six decimals. These weights
prioritize evidence-text coverage and phrase proximity, with smaller contextual
signals. They are a documented starting heuristic, not measured optimal weights.
Scores in [0,1] are ordering signals, never truth probabilities. Equal scores use
passage UUID order. Locale gates reviewed source/service metadata, while optional
passage language is a separate filter; no implicit cross-language translation.

The repository returns original query context only in memory and stable evidence
IDs, score signals, generation, evaluation clock and policy/rank versions for
future fusion. It performs no fusion, embeddings, reranking, answer generation or
claim extraction. Before future delivery, recheck current eligibility; a previous
keyword match alone cannot authorize a citation or government instruction.

Source lifecycle is `candidate -> verified -> active`, with `suspended` and
`retired` states governed by SOURCE_POLICY. Verification alone does not publish a
source. Only reviewed public projections are queryable by the public retrieval
role; raw extraction, candidate sources, quarantined content, and private worker
tables are excluded.

For each request, derive the candidate eligibility predicate from SOURCE_POLICY:
active verified source, approved canonical URL identity, reviewed current document
version, approved extraction quality, valid publication/effective interval, fresh
verification/check evidence, public visibility, no changed-content review hold or
access restriction, and no unresolved conflict for the relevant claim. Bind request
time and publication-policy version. Apply this
predicate to every lexical, trigram, vector, alias, and fallback query before
candidate results enter fusion or model context. Future-dated or superseded rules
cannot be used as current guidance.

Proposed initial pipeline:

1. Resolve possible service, agency, and jurisdiction filters conservatively;
   retain ambiguity rather than guessing. Filter within eligible projections.
2. Retrieve bounded lexical candidates using PostgreSQL full-text matching and
   trigram/alias candidates. Retrieve semantic candidates from the same eligible
   passage universe with the active embedding profile.
3. Deduplicate by passage/version identity and combine lexical, trigram, and
   vector ranks using reciprocal rank fusion: `sum(w_branch / (k + rank_branch))`.
   Missing branches contribute zero. Branch weights, `k`, candidate counts, and
   acceptance cutoffs are versioned tuning proposals; choose them on development
   data, never the held-out set. Scores are ordering signals, not truth or model
   confidence percentages.
4. Retain distinct sources and relevant exceptions; do not let many overlapping
   chunks from one page crowd out a conflicting passage. Include adjoining
   context only when its own eligibility and stable locator are established.
5. Recheck eligibility for selected evidence before building the evidence bundle.
   If support for a requested material claim is absent, abstain for that claim.

pgvector supports exact and approximate search and documents hybrid use with
PostgreSQL text search and rank fusion. Approximate indexes trade recall for
speed and can filter after index scanning. Therefore a SQL predicate is not a
promise of physical prefiltering. Propose exact search over an eligible filtered
set first. Introduce ANN only after selective-filter recall and leakage tests;
evaluate filtered indexes/partitioning or bounded iterative scans when justified.
Never broaden eligibility to fill a result limit.
[pgvector official README](https://github.com/pgvector/pgvector#filtering),
[hybrid search](https://github.com/pgvector/pgvector#hybrid-search).

Low similarity, missing embeddings, or conflicting evidence are not reasons to
ask the generator to answer from memory. Preserve a lexical-only search mode if
embedding service fails; label incomplete retrieval and only answer if the
remaining evidence passes the normal checks.

## Passage evidence and deterministic citations

Passage IDs bind to immutable `document_versions`; locators and extraction maps
are defined in DATABASE. For HTML, retain a stable heading/element locator and
text offset/hash. For PDF, retain page and extracted-text/bounding-region
coordinates as available. The ingestion review must establish that the cited
span is readable in the retained artifact. OCR confidence alone cannot approve a
fee, date, identifier, or eligibility word; uncertain critical text is quarantined
pending visual review. Chunk boundaries must preserve table headers, footnotes,
units, conditions, and exceptions.

Evidence bundles contain immutable IDs, exact passage text, verified metadata,
locator, source-check time, and applicable conditions. Public citation metadata
comes from the reviewed projection. The generator may reference only opaque
evidence IDs provided for this request. It cannot choose or construct citation
URLs, titles, checked-at timestamps, or locators.

The server resolves a validated passage ID through its document version and
approved source URL binding and produces globally unique UUID citation IDs for
the public citation endpoint. Model evidence IDs and local block IDs never become
public URL identifiers. A URL merely mentioned in
a passage is not an approved destination. Redirects or destinations require the
SOURCE_POLICY review process; anchors are added only when verified from stored
locators. If the exact passage locator cannot be exposed on the live site, show
the verified document URL with page/section and checked date, without inventing a
deep link. Source check time is not the legal effective date.

Map each `answer_claims` record to supporting `answer_citations` and the
`claim_evidence` relationship where the claim is curated. Multiple assertions in
one block require evidence for each assertion; otherwise split the block or
remove the unsupported assertion. Persist structural claim-validation and
citation metadata only, with no generated prose, question, or history by default.
These records cannot reconstruct or fully audit the exact wording the citizen
saw; disclose that limitation. SECURITY owns the proposed retention schedule.

## Structured answer and delivery pipeline

The API is specified in ARCHITECTURE. Internally use these proposed stages:

1. Enforce request limits, abuse controls, transient redaction, and language
   selection. Ask for only the non-identifying detail necessary to disambiguate.
2. Reserve the worst-case bounded cost atomically before each paid operation.
   Retrieve eligible evidence and stop early when insufficient or conflicting.
3. Ask the generator for atomic claims, supporting evidence IDs/spans, conditions,
   answer language, requested-scope coverage, and proposed abstention reasons.
   Use a versioned schema; reject unknown evidence references and oversized data.
4. Validate schema and identifiers deterministically. Check exact source span
   presence, URL bindings, material numerals/units/dates/negations, conditions,
   freshness, conflict status, and safe rendering. Verify that each material
   claim is entailed by the cited passage, not merely topically similar. A second
   model is advisory and can share failure modes; high-risk categories need
   curated claim/evidence constraints and human-reviewed release fixtures.
5. Reject unsupported claims. At most one bounded regeneration with explicit
   failures is proposed; it needs a remaining reservation and time allowance.
   Revalidate the complete candidate. Never repair a fee or deadline by guessing.
6. Immediately before publication, re-read eligibility and policy/invalidation
   state for all cited versions and claim groups. If suspension, expiry,
   conflict, or a version switch occurred, discard affected claims and recompute
   status. Use a fresh short transaction/time basis; do not hold a database
   transaction across provider calls or reuse a request-start freshness result.
   If a coherent safe subset cannot stand alone, abstain entirely.
7. Construct citation metadata and the public response deterministically. Record
   non-sensitive `answer_runs` metadata and settle usage. Return only validated
   blocks. Do not stream unvalidated factual tokens; progress states may stream.

PostgreSQL transaction timestamps remain fixed at transaction start; current-wall
time functions have different semantics. The fresh delivery check must use an
explicitly chosen time basis and short transaction, with expiration-race tests.
[PostgreSQL current date/time](https://www.postgresql.org/docs/current/functions-datetime.html#FUNCTIONS-DATETIME-CURRENT).

There is no complete deterministic proof of natural-language entailment in this
plan. Before a generator is approved, evaluation must show required performance;
for initial-launch fees, deadlines, and eligibility assertions require reviewed
structured `service_claims`, eligible `claim_evidence`, and constrained rendering.
If those curated atoms are absent, omit the critical assertion even if an LLM
finds a plausible passage. Other evidence-backed procedural claims still need
the full validation pipeline. An automated validator failure never results in publishing the
unvalidated draft. No answer may assert that a check was performed unless its
check record actually exists.

| Public status | Proposed behavior |
| --- | --- |
| `answered` | Requested material scope is supported and validated; exact citations accompany claims |
| `partial` | A coherent independent subset is supported; explicitly identify omitted scope without hinting at an unsupported value |
| `abstained` | No safe supported answer, or necessary clarification/conflict resolution remains; use a localized explanation |
| `unavailable` | Required infrastructure, reservation, or approved provider is unavailable; do not imply a source fact |

Use stable reason codes, including `insufficient_evidence`, `stale_evidence`,
`source_conflict`, `budget_exhausted`, and `provider_unavailable`, as defined by
ARCHITECTURE. Do not display a model confidence percentage. Abstention can include
official navigation only when that exact destination remains verified and
eligible. An unresolved conflict suppresses the affected claim rather than
selecting whichever page ranks higher or appears newer. Conditions and authority
resolution follow SOURCE_POLICY; the model cannot resolve the conflict itself.

## Injection, privacy, and trust boundaries

Treat query text, optional history, HTML/PDF/OCR content, metadata, and model
output as untrusted data. Prompts in an official-looking document have no system
authority. Mark and separate evidence from trusted instructions, while recognizing
that labels alone do not enforce isolation. Enforce permissions and all tool
boundaries outside the model; validate rendered output. These controls follow the
defense-in-depth direction in the
[OWASP prompt injection guidance](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html).

The answering process cannot fetch URLs found in a question or document, reveal
secrets, change source approval, bypass authentication/CAPTCHA, call government
transactions, or publish ingestion output. Prepared retrieval queries accept
bounded values, never model-written SQL. Render plain escaped text and server
citations; reject executable markup, remote images, or arbitrary generated links.
Source poisoning remains possible even with an official hostname; source review,
version change detection, revocation, and conflict review stay outside the model.

Do not request national IDs, passwords, financial details, or private documents for
basic informational guidance. Redaction before a provider call reduces exposure
but is imperfect; apply minimization and approved provider terms. No raw query,
history, embedding of a private query, provider request body, or personal detail
is retained in logs by default. Feedback is separately consented and redacted.
Evidence tracing uses IDs rather than query contents. See SECURITY for retention,
consent, access control, future upload isolation, and incident handling.

## Spending, cache invalidation, and failure modes

`usage_reservations` and `usage_events` are defined in DATABASE. Proposed control:
admit a call only when an atomic reservation fits request/session and global
daily/monthly budgets. Reserve bounded input/output tokens plus embedding,
validation, and allowed retry costs using an approved pricing revision; reconcile
actual usage once. Idempotency and concurrency controls prevent duplicate charges.
On unknown provider usage retain a conservative reservation until reconciliation;
do not prematurely release it to admit more work. Unknown pricing, disabled
budgets, or an unavailable budget store disables paid calls.

All limits require owner approval before paid use. This document authorizes no
paid call. Apply timeouts, bounded retries with backoff, queue/concurrency limits,
circuit breakers, and administrator kill switches. Retry only transient failures
within the existing total cost/time allowance; no unlimited cascade of models.
Keep a cheap status explanation and reviewed directory navigation available when
possible. Do not convert a safety abstention into a paid retry loop.

Propose caching public source projections and eligible evidence bundles first.
Avoid shared caches of citizen-specific questions/answers. Any future public
answer cache key includes language, normalized intent, policy, prompt, model,
retrieval and profile versions, evidence version IDs, and publication epoch;
cache hits still recheck eligibility at delivery. Expiry/suspension/conflict
invalidates affected entries. If current eligibility cannot be established,
suppress the cached answer even during an outage.

| Failure | Safe proposed mode |
| --- | --- |
| Generator unavailable or budget exhausted | Reviewed service/search projections with current evidence and localized unavailable message; no free-form completion |
| Embedder unavailable/profile migration incomplete | Eligible lexical search; disclose retrieval degradation; normal claim validation still applies |
| Database/policy check unavailable | No evidence-dependent answer or stale cache replay; static independent-site explanation only |
| Government source inaccessible | Follow SOURCE_POLICY freshness/suspension rules; last success is not a new check |
| Suspicious/low-quality extraction or unclear OCR | Quarantine affected passage/claim and request review; abstain where necessary |
| New unresolved conflict or revoked source | Suppress affected claims and invalidate caches before further delivery |

## Unresolved decisions and next work

All candidate counts, chunk sizes, embedding dimensions, model choices,
transliteration behavior, cost/latency limits, provider privacy terms, and semantic
validation methods remain unmeasured proposals. Technical links above were read
on 2026-10-18; compatibility does not establish quality or a tested integration.
No multilingual performance or prompt-injection immunity is claimed.

After Phase 0 review and explicit phase authorization, establish versioned
synthetic fixtures and a small reviewed official evidence corpus before choosing
models or tuning retrieval. Implement only the next authorized roadmap phase;
do not start a chatbot, ingestion worker, database, or paid evaluation now.
