# Phase 6 search and retrieval report

Updated 2026-10-23 (Asia/Dhaka). **Local implementation/test verification: PASS;
formal Phase 6 quality gate: PARTIAL.** The owner explicitly authorized P30-P34
after P29; this supersedes the earlier individual stop conditions. Stop before
Phase 7. No real source onboarding, government-site requests, paid provider calls,
deployment, commit or push is authorized or performed.

## Implementation

- P29's indexed lexical branch and existing publication controls are preserved.
- P30: offline CPU provider interface, two hash/revision-pinned multilingual q8
  candidates, real passage/query vectors, bounded batches, immutable pgvector
  persistence, profile/dimension/hash validation and explicit operator approvals.
- P31: exact filtered cosine search, bounded RRF fusion by immutable passage ID,
  explicit branch degradation and incomplete-vector coverage, final publication
  rechecks and controlled total failure. No public chatbot/evidence API is added.
- P32: bounded deterministic heading/normalized-phrase reranking and document/source
  caps. Distinct sources remain distinct; authorship and check clocks are preserved.
  Known conflicts are held, including ambiguous supported-service routing; no
  automatic legal-authority or newest-document decision is made.
- P33: reviewed database aliases, conservative Banglish spelling variants, Bangla
  case endings, bounded reviewed-name context, ambiguity/unknown states and one
  scoped/general fallback. Explicit caller filters remain binding. Identifier-like
  content/URLs are minimized before inference; this is a heuristic, not a complete
  PII detector. Original request context remains ephemeral and server-only.
- P34: separate lexical/semantic/fusion/reranking/routed synthetic comparisons,
  graded metrics, real offline inference and PostgreSQL tests, provenance bindings,
  cold/warm timing and failure regressions. Human/real-corpus gates remain explicit.
- The previously requested screenshot refresh is finished and browser-verified;
  see [FRONTEND_REFRESH_REPORT](FRONTEND_REFRESH_REPORT.md).

## Files and decisions

`apps/web/src/lib/retrieval` contains the server repositories/provider, batching,
ranking/routing contracts, metrics and unit fixtures. `packages/embeddings` contains
the isolated worker, exact model manifest and one new direct runtime dependency,
`@huggingface/transformers@4.3.1` (resolved ONNX Runtime Node 1.30.0).
`scripts/embedding-models.mjs` separates pinned artifact setup from offline inference.
Root scripts, lockfile/workspace, CI, database types/tests and documentation change.

Four forward migrations after P29:

1. `20261022000400_semantic_retrieval.sql`: private append-only profile approvals,
   two inactive compatibility identities, narrow embedder role/functions, eligible
   semantic projection, delivery recheck and reviewed routing catalogue.
2. `20261022000500_semantic_coverage.sql`: explicit eligible/indexed counts; an empty
   vector branch with missing embeddings is not a complete empty-corpus result.
3. `20261022000600_routing_conflict_holds.sql`: conflict holds across ambiguous
   reviewed service candidates without returning private evidence or review notes.
4. `20261022000700_embedding_role_guard.sql`: reject unsafe pre-existing embedder
   privileges/inherited memberships, consistent with web/staff role policy.

The schema now has 43 forced-RLS private tables and 32 migrations. PostgreSQL,
Supabase SQL migrations, pgvector 0.8.2 and the existing single database remain.
No ANN index, separate vector database, ORM, paid API or cloud service is introduced.
See [EMBEDDINGS](EMBEDDINGS.md), [DATABASE](DATABASE.md),
[ARCHITECTURE](ARCHITECTURE.md) and [SECURITY](SECURITY.md).

## Verification evidence

`npm.cmd run validate:phase6` completed successfully (exit 0). It executes the
existing complete Phase 3 validation, offline parser tests, pinned model artifact
verification and the new real-model integration suite. Actual results:

| Command/check | Result |
| --- | --- |
| `npm ls --all` | Coherent installed dependency tree |
| `npm run format:check`, `npm run lint` | PASS |
| `npm run typecheck` | Strict application and generated database types PASS |
| `npm run test:coverage` | 470 unit/component cases in 27 files PASS; existing scoped coverage configuration |
| Python `pip check`, `npm run test:python` | Dependency consistency PASS; 171 tests PASS |
| `npm run docs:check` | 13 required documents and local links PASS |
| `npm run build` | Production build PASS; 123 static pages generated |
| `npm run test:e2e` | 31 Chromium cases PASS |
| `npm run test:database:guards` | Five local-target guards PASS |
| `npm run test:database` | 135 SQL cases PASS, including 49 P29-P33 retrieval/security cases |
| `npm run test:integration` | 28 grouped real local Auth/MFA/API/browser checks PASS |
| `npm run test:parser` | 16 offline native parser/OCR/isolation checks PASS |
| `npm run embedding:verify` | Both exact pinned artifact sets PASS; no ordinary database profile activated |
| `npm run test:retrieval:models` | Three real-model/database/bounds/cancellation tests PASS |

Commands above use `npm.cmd` in this Windows environment. Detailed aggregate
output is retained locally in `.cache/phase6/validation.log`. The model suite was
also rerun successfully after the aggregate. All 23 cases per candidate reproduced
the same five-stage metrics and final routed passage-ID order, with fixed fixture
identities and the same dataset SHA-256. Latencies and memory naturally differed.
The repeat log and both JSON artifacts remain under `.cache/phase6` (ignored).

An initial combined model experiment exceeded its 180-second budget. Separate
bounded candidate tests and reuse of one offline model process replaced repeated
model startup. Benchmark review also corrected an overly broad query-vector test
cache and random fixture IDs affecting lexical ties; the final tests use exact
text/kind keys and stable identities. Earlier UI regressions and the historical
private-table count assertion were corrected before the successful aggregate.
No failed check was ignored to obtain the final result.

### Synthetic model comparison

Dataset: `tests/retrieval/benchmark.synthetic.json`, revision
`phase6-synthetic-v2-stable-ids`, SHA-256
`ca7bea7d4a2025c997f4a3ff7211266c72a2f10ee8206352b3282ef89c145e5d`.
Six fictional topic passages plus one baseline SQL fixture were embedded per
profile. Each model ran 23 query cases, including 13 positive engineering-labeled
cases and ten no-gold/unknown/ambiguous/missing-information cases. The latter do
not receive fabricated positive relevance scores. Retrieving a related topic does
not establish support for a fee, deadline or other missing fact; no answer or
claim-level abstention system is implemented in this phase.

Macro means over the 13 positive cases, at **k=3**:

| Model / stage | Recall | Precision | MRR | nDCG |
| --- | ---: | ---: | ---: | ---: |
| Keyword baseline, both models | .6154 | .4103 | .9231 | .6850 |
| E5 semantic | .9231 | .6154 | .8462 | .8389 |
| E5 fused hybrid | .8077 | .5385 | .9231 | .8091 |
| E5 reranked | .8077 | .5385 | .9231 | .8091 |
| E5 routed/context-expanded | .9231 | .6154 | 1.0000 | .9281 |
| MiniLM semantic | .7692 | .5128 | .9231 | .7681 |
| MiniLM fused hybrid | .7692 | .5128 | .9615 | .7917 |
| MiniLM reranked | .7692 | .5128 | .9615 | .7917 |
| MiniLM routed/context-expanded | .8462 | .5641 | 1.0000 | .8810 |

Routed results by query language, shown as Recall / MRR / nDCG @3:

| Language | Positive cases | E5 | MiniLM |
| --- | ---: | --- | --- |
| Bangla | 3 | .8333 / 1 / .8175 | .5000 / 1 / .6131 |
| English | 3 | 1 / 1 / 1 | 1 / 1 / 1 |
| Banglish | 3 | .8333 / 1 / .8710 | .8333 / 1 / .8710 |
| Mixed | 4 | 1 / 1 / 1 | 1 / 1 / 1 |

E5 is the stronger candidate on this tiny synthetic set, not an approved production
model. Reranking did not improve these aggregate metrics, and uncontextualized
fusion reduced E5 recall versus semantic-only retrieval. Retain separate branches
and evaluate weights/reranking on independent labels before selecting a production
configuration. Neither model is automatically activated.

Repeat-run timings on Windows, Node 24.22.0, Intel i5-10310U, eight logical CPUs,
approximately 12 GB RAM: E5 cold routed pipeline 5,729 ms; 100 complete warm
internal retrieval calls p50 129 ms / p95 296 ms. MiniLM cold 3,452 ms; 100 warm
calls p50 109 ms / p95 155 ms. Sampled worker RSS peaked around 575 / 574 MiB.
These are sequential local function calls including SQL and inference, not HTTP
load tests, representative corpus throughput, process-memory hard limits or
production latency guarantees. Cold startup is a deployment constraint.

Production dependency advisory check: `npm.cmd audit --omit=dev --json` executed
using the owner's existing metadata-submission authorization: **zero findings**.
This is advisory coverage, not proof that all native/model code is vulnerability-free.
Hosted CI has not run. CI retains unit/SQL checks and offers a manual opt-in model
download/benchmark; it activates no deployment and needs no production secrets.

### Security review and cleanup

Post-test inspection confirmed 43/43 private tables enforce RLS and 32 applied
migrations. The ordinary local database contains zero source documents, vectors
and embedding-profile approvals; ingestion remains paused. Zero disposable test
databases and temporary Phase 6 model roles remain. Owned local Auth is stopped;
only the original local PostgreSQL container remains running.

A limited scan of 293 nonignored reviewable text files for the actual local
database password and private-key blocks found zero matches. This is not a
complete secret-detection or native-code audit. Git's 14 original staged entries
were preserved; no commit or history change was made. Final documentation/local
link and working/staged whitespace checks pass. No real government collection,
production identity, paid model call or remote infrastructure was used.

## Work-package status

| Package | Local implementation/tests | Remaining acceptance evidence |
| --- | --- | --- |
| P29 | PASS, preserved | Representative official corpus quality remains unmeasured |
| P30 | PASS | Final model selection requires independent real-corpus evaluation |
| P31 | PASS | Real multilingual hybrid ranking quality remains unmeasured |
| P32 | PASS | Weights/diversity/reranking require representative human labels |
| P33 | PASS | Human Banglish and ambiguous-intent validation remains |
| P34 | PARTIAL | Tooling and local regressions PASS; real-corpus, held-out human relevance gate not executed |

## Limits and formal gate

The synthetic corpus simulates approval states only in guarded disposable local
databases. It contains no actual government procedure or real official approval.
Engineering relevance labels are not independent human adjudication. The current
small-sample @3 metrics cannot satisfy EVALUATION's real-corpus @20 or release
targets. Source coverage, official factual accuracy, claim entailment, jurisdiction,
Banglish generalization and representative load remain unverified.

Native model memory is outside the JavaScript heap cap. The adapter is a local
development/evaluation worker; deployed isolation, native dependency review and
capacity planning remain required. Oversized passages fail instead of truncating;
they require reviewed rechunking or a new evaluated profile. Reranking and source
caps are baseline heuristics, not calibrated confidence or a quality guarantee.

The ordinary development database has no real source onboarding or approved
embedding profile. The public chat remains a clearly labeled local demo. No LLM,
answer generation, citation entailment validator, new public question API,
production crawler/scheduler, paid/cloud resources or deployment was implemented.

Formal Phase 6 decision: **PARTIAL** until an authorized, independently
reviewed official corpus and held-out relevance evaluation establish the documented
quality gate. Completing local software/tests does not substitute for that evidence.
Recommended next action: review this implementation and prepare authorized source
onboarding/human retrieval labels. Do not automatically begin P35/Phase 7.
