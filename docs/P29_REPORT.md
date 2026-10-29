# P29 - keyword passage retrieval

Date: 2026-10-22, Asia/Dhaka. The owner supplied the P29-P34 attachment. P29's
explicit stop applies: implement keyword retrieval only, then stop before P30.
Phase 5 local prerequisites passed. No real reviewed government corpus exists;
this package verifies implementation with guarded disposable synthetic fixtures.

Status: **P29 PASS in the authorized local implementation/test scope**. The complete
SQL and application regression suites pass; actual evidence is recorded below.
Phase 6 is not complete and no embedding/provider selection is authorized here.

## Changed files and decisions

- apps/web/src/lib/retrieval/contracts.ts - strict input, passage and result
  contracts. Original text stays untouched; result fields are selected/minimal.
- apps/web/src/lib/retrieval/keyword.ts - internal server-only repository using
  the existing pooled databaseQuery connection, fixed parameterized SQL and
  sanitized invalid-input/unavailable errors. No public HTTP or chatbot route.
- apps/web/src/lib/retrieval/keyword.test.ts - 50 validation, contract, provenance,
  Unicode, literal-query and failure-handling unit cases.
- database/tests/keyword.cases.mjs - real SQL retrieval, leakage, mixed approval,
  ranking, filters, pagination and index-plan cases. The real returned JSON is
  parsed by the same TypeScript/Zod result contract as the repository.
- database/tests/core.test.mjs - registers keyword cases in the existing guarded
  disposable harness; all prior cases remain.
- database/generated.types.ts - regenerated from migrated local PostgreSQL.
- package.json - focused test:retrieval script; no dependency/version/lock change.
- AGENTS.md, PLANS.md, README.md, ARCHITECTURE, DATABASE, AI_SYSTEM, SECURITY,
  EVALUATION, ROADMAP, CODEX_PROGRESS and database/testing guides - authorization,
  contracts, limitations, actual results and checkpoint. Earlier reports remain
  historical evidence, including the Phase 5 report.

There are no new packages, services, tables, ORM, provider, model or migration
system. PostgreSQL 17.11/pgvector 0.8.2 and the existing SQL-first Supabase CLI,
Node/npm/TypeScript/Zod/Vitest stack are preserved. The public demo and Phase 4
directory name/alias search are preserved. No crawler, parser or live switch changes.

## Migrations and authorization correction

Three forward canonical files under database/supabase/migrations:

1. 20261022000100_keyword_retrieval.sql - explicit non-stemming keyword helpers,
   GIN index and bounded reviewed execute-only projection.
2. 20261022000200_keyword_eligibility_binding.sql - fixes an existing authorization
   helper's passage-ID argument collision, without relaxing any policy predicate.
3. 20261022000300_keyword_ranking_normalization.sql - applies the same canonical
   normalization to title/heading ranking signals as passage matching.

Current schema: **42 forced-RLS private tables, 28 migrations**. All changes were
applied/replayed locally only. Existing applied migrations were not edited.

The mixed-corpus test found that P27's passage_is_eligible SQL function used
`p.id=passage_id` after joining passage_reviews, whose column has the same name.
PostgreSQL bound the column rather than the requested argument. This rejected
legacy accepted records without a review row and, with a reviewed eligible row
present, could evaluate the wrong passage. The correction uses `$1` explicitly.
Tests now ensure approved, pending and unknown UUIDs cannot borrow another
record's trust. Existing review, current-version, locator, source, freshness and
conflict checks remain. All earlier SQL/ingestion regressions pass after this fix.

Fixture debugging also found missing service-source relations/review releases;
the synthetic fixtures were corrected, without changing production approval.
A canonical-accent ranking test found title/heading signal normalization differed
from passage matching; the third forward migration corrects that consistency.
Initial failed runs are not counted as passing evidence.

## Indexing, normalization and relevance

The private expression index is:
`GIN (app_private.keyword_vector(normalized_text, heading))` on existing passages.
It uses explicit PostgreSQL `simple`, avoiding English stemming/stopword behavior
being silently applied to Bangla. Actual C-locale and ordinary database probes
preserved the full Bengali word পাসপোর্ট. Unicode canonical equivalents,
combining marks, Bangla digits and mixed text are tested; no Bangla linguistic
stemmer or general cross-language quality is claimed.

Normalization is NFC, ASCII case folding, whitespace/common punctuation folding,
including Bengali sentence punctuation and common typographic quotes/dashes.
Original passage fields are not rewritten. Query operators are not accepted as
tsquery syntax: PostgreSQL parses literal lexemes, which are safely quoted into
an OR query. OR permits partial *token overlap*, not partial-word/prefix matching.
No fuzzy spelling, stemming, transliteration, digit conversion, query translation
or alias expansion occurs. Existing directory aliases remain a separate feature.
P33/P34 will evaluate whether additional lexical branches are justified.

Version `p29-keyword-v1` uses these explicit signals:

| Signal | Weight and purpose |
| --- | --- |
| Unique query-token coverage in passage/heading vector | 0.70; primary evidence relevance |
| Complete normalized phrase in passage body | 0.15; proximity/order preference |
| Heading token coverage | 0.10; section context |
| Document-title token coverage | 0.05; smaller document context |

Round the weighted sum to six decimals, then order descending score, ascending
passage UUID. Scores in [0,1] are rank signals, not probabilities or claim truth.
Weights are a documented initial heuristic, not tuned/human-evaluated optimums.
Service names/aliases do not independently nominate unrelated passages.

## Internal contract and privacy

`retrieveKeywordPassages(input)` accepts:

- query: nonempty, well-formed Unicode, at most 256 codepoints/512 UTF-16 units,
  no prohibited controls, 1-32 application word groups;
- locale: bn/en, default bn;
- limit: integer 1-50, default 10; offset: integer 0-500, default 0;
- optional service_id, owning agency_id, source_id UUIDs and passage language.

SQL independently caps query characters/bytes, unique lexemes (64), locale,
filter language and result window. Unsupported caller options are rejected;
there is no include-unapproved flag or arbitrary sort/SQL fragment. No complete
corpus is loaded into application memory. SQL ranking remains a small-corpus
baseline; common high-frequency queries need representative P34 workload tests.
The existing connection pool enforces query/connection budgets; failures are
unavailable errors, never authentic-looking empty results.

Result items preserve exact passage/document/version/source/agency UUIDs, stored
canonical document URL/title, original text, language, section/heading, physical
PDF page/known page label, raw character offsets, passage/version hashes,
extraction profile, known official dates, separate ownership verification,
document review and content-check timestamps, score and component signals.
`content_trust` is always `untrusted_data`. No fabricated citation/anchor is made.
Unknown official dates and page labels stay null. Private proof/reviewer identity,
review notes, storage references, embeddings and unrestricted locator JSON are
excluded. Available selected page/section/character locators remain stable.

Envelope metadata includes normalization/lexemes, limits, offset/next_offset,
has_more, pagination_capped, publication generation, evaluation clock and fixed
rank/policy revisions. The next offset stops at 500; the terminal page contains
at most 50 items. This is not a frozen corpus snapshot: changes may shift pages;
every call rechecks eligibility. A future delivery step must revalidate evidence.

Original query text is retained separately in ephemeral server request context
for traceability. No raw questions are stored, logged, cached across requests or
sent to a model/provider. Reusable passage objects contain no citizen query.
Future public APIs must add their separate privacy/identifier and abuse controls;
P29 has no public evidence endpoint. No account is added for ordinary visitors.

## Eligibility and security

Only askbd_web can execute the narrow app_public.keyword_search projection.
Anonymous/authenticated/staff/worker roles and browser components cannot read
raw passages or call private helpers. No elevated application credentials are
introduced. The security-definer function fixes search_path to pg_catalog.

The query requires current eligible passage/version, reviewed source metadata,
active document reviewer, source/domain/agency trust, ownership/review expiry,
fresh matching content checks, current version and known required locators.
It also blocks possible_personal_data, instruction_like_content, corrupt_text
and low_ocr_confidence version flags, and unresolved associated-service conflicts.
Optional service filtering requires a reviewed published relationship. Source
link-review holds and source/identity/reviewer changes remain live exclusions.
Ranking cannot override these predicates. No stored source/site was researched
or approved by a positive synthetic test.

Input and result validation errors are sanitized without exposing raw SQL,
connection strings, credentials, citizen questions or private administrative
fields. Exact evidence text is data, never executable instructions. The existing
publication/delivery security policy remains required for future model integration.

## Actual verification

| Command | Observed result |
| --- | --- |
| npm.cmd run db:migrate | PASS; guarded local forward migrations |
| npm.cmd run test:retrieval | PASS: 27/27 final focused retrieval cases |
| npm.cmd run test:database | PASS: 113/113; 27 new P29 cases plus all prior database/actual offline Python parser pipeline cases |
| npm.cmd run db:types | PASS; generated from migrated PostgreSQL |
| npm.cmd run test:unit | PASS: 365/365 in 22 files, including 50 new retrieval cases |
| npm.cmd run test:unit -- apps/web/src/lib/retrieval/keyword.test.ts | PASS: 50/50 focused unit cases |
| npm.cmd run test:python | PASS: 171/171 |
| npm.cmd run test:database:guards | PASS: five local target/connection guards |
| npm.cmd run lint | PASS; no lint warnings |
| npm.cmd run typecheck | PASS; strict web/generated DB types |
| npm.cmd run format:check | PASS |
| npm.cmd run build | PASS; production build |
| npm.cmd run test:e2e -- --workers=2 | PASS: 28/28 Chromium frontend cases |
| npm.cmd run test:integration | PASS: 28 real local MFA/API/published-browser grouped checks |
| npm.cmd run docs:check | PASS; local structure/links only |
| git diff --check and git diff --cached --check, with repository safe.directory | PASS; no whitespace errors |

The final full SQL run used a C-locale disposable database. Its 1,600-row selective
`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` probe selected passages_keyword_gin;
server execution was **0.302 ms** for that raw selective index probe. This is not
the complete policy/repository/network latency or a production benchmark. The
same fixture then exercised the approved retrieval projection with correct result
identity, parsed through the shared contract. No forced index planner flag was used.

Node 24 emits a module-type detection notice when the SQL harness imports the
shared .ts contract from the Next workspace; it does not affect correctness.
No warning suppression or unrelated application package-module change was made.
Remote GitHub Actions was not run. Existing CI already runs the full registered
SQL and web unit suites, so it automatically includes the new cases; no deployment
automation or production secrets were added.

Final limited credential comparison: **249 repository text files**, four actual
local development credential values/private-key header checks, **zero matches**.
All 14 pre-existing staged entries remain; no staging, commit or history changes.
The ordinary database has zero sources/policies/retrievals/jobs, paused controls,
42 forced-RLS tables and all 28 migrations. Cleanup verified zero disposable DBs,
temporary worker logins, synthetic Auth users and parser containers. The owned
Auth test container is stopped; unrelated services/volumes and credentials remain.
This is a limited local scan, not a complete secret/security certification.

## Acceptance decision

| P29 criterion | Decision and evidence |
| --- | --- |
| Keyword retrieval over eligible passages | PASS; real PostgreSQL with guarded approved-state fixtures |
| Bangla/English Unicode integrity | PASS; combining marks, canonical equivalents, digits, mixed text and punctuation |
| Exact provenance | PASS; source/document/version/passage IDs, URLs, locators, hashes and independent clocks |
| Unapproved/invalid evidence excluded | PASS; mixed-corpus UUID binding, review/quality/current-version/source/reviewer/freshness/conflict cases |
| Input/injection/permission protection | PASS; SQL plus application validation, parameterized queries, denied runtime roles/raw access |
| Appropriate indexing | PASS; actual selective GIN plan on 1,600 synthetic passages |
| Future hybrid interface | PASS; stable identities, explicit normalized score signals and rank/policy revisions |
| Automated checks | PASS; 113 SQL, 365 unit, 171 Python, 27 focused SQL, 28 browser, 28 integration and five guards |

**P29 PASS locally. Phase 6 remains incomplete.** This decision does not approve
real source coverage, model/provider selection, production deployment or P30.

## Limitations, remaining risks and next step

There are zero real approved government-source records. Actual source coverage,
human relevance labels, Bangla/Banglish linguistic quality, recall, large-corpus
latency/load and production query plans remain unmeasured. The synthetic test
can verify index use and policy behavior, not real service accuracy or legal
authority. P34 is the later retrieval evaluation gate. No government site or paid
service was contacted; official technical documentation is listed below.

Large common-token OR queries can create many SQL candidates; bounded output and
existing DB statement budgets are safeguards, not a scalability certification.
Offset pages may shift after publication changes. No prefix/fuzzy/stemmed/cross-
language matching or alias expansion is promised. No public search UI, hybrid
fusion, embeddings, reranker, AI answer, citation endpoint or cache was added.

Production still requires all Phase 5 source/egress/private-storage/review/retention
gates, parameter-log suppression and future public-request privacy/abuse controls.
Historical native/npm dependency advisory and license gates remain unchanged;
no dependency audit or new production security certification is claimed here.
No secrets, real identities, cloud resources, paid call, deployment or commit.
The 14 pre-existing staged entries must remain intact.

Recommended next package: P30 readiness and explicit model evaluation/provider
approval planning, only after P29 passes and the owner authorizes it. Do not
begin embeddings or the other attached work packages automatically.

## Technical evidence checked 2026-10-22

PostgreSQL's [text-search controls](https://www.postgresql.org/docs/17/textsearch-controls.html)
and [functions/operators](https://www.postgresql.org/docs/17/functions-textsearch.html)
inform explicit literal lexemes/non-stemming matching;
[GIN guidance](https://www.postgresql.org/docs/17/textsearch-indexes.html) supports
the chosen index type. [pg_trgm](https://www.postgresql.org/docs/17/pgtrgm.html)
was evaluated as an option and deferred pending multilingual measurements.
The installed Next.js 16.4.2 data-security guide under
node_modules/next/dist/docs/01-app/02-guides/data-security.md was read for its
server-only DAL/minimal-DTO boundary. These technical references do not verify
any government source or factual service guidance.
