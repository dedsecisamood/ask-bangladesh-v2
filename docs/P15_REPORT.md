# P15 - Document provenance and evidence foundation

Date: 2026-10-19, Asia/Dhaka. **P15 PASS for the private local data foundation.**
P14 passed first; its actual runtime investigation and twelve core tests are in
[P14_REPORT](P14_REPORT.md). Stop after P15. P16/P17 and full Phase 3 completion
are not claimed.

## Implementation and files

Two forward SQL migrations add fourteen private tables to the ten core tables:

- `20261019000200_evidence_foundation.sql`: sources, service_sources,
  source_documents, document_versions, passages, source_verifications,
  source_checks, embedding_profiles, passage_embeddings, service_claims,
  claim_evidence, source_conflicts, conflict_evidence and evidence_review_events.
- `20261019000300_evidence_review_hardening.sql`: independent document risk,
  current document-review expiry, adverse-event tie ordering, service-bound claim
  support/contradiction checks, immutable conflict scope and fuller review events.

Created `database/tests/evidence.cases.mjs` and this report. Updated the existing
core harness, real generated schema types, local database wrappers, package scripts,
CI, README, database boundary READMEs, AGENTS/PLANS, DATABASE, ARCHITECTURE,
AI_SYSTEM, SOURCE_POLICY, SECURITY, ROADMAP, testing docs and progress checkpoint.
The P14 runtime repair is part of this authorized continuation; frontend source
functionality and owner-provided masterprompt.txt remain intact.

No new npm dependency or ORM was added in P15. The existing pg/Supabase CLI
lockfile remains authoritative; pgcrypto and pgvector **0.8.2** are enabled from
the existing PostgreSQL **17.11** container image. No extension binary was fetched
from an unreviewed source. P14's exact image digest is documented in its report.

## Evidence architecture

Agency/domain composite references preserve provenance through source, logical
document, immutable version and immutable passage, then reviewed claim mappings.
The [DATABASE](DATABASE.md) ERD and table descriptions are the canonical contract.
Snapshot hashes are bounded SHA-256 hex; passage hashes are generated from actual
stored text. `(document, hash, extraction_profile)` identifies derivatives so OCR,
normalizer or chunking changes cannot overwrite cited text under an existing ID.
Supersession preserves the older version and only references earlier versions of
the same document. Foreign keys and delete guards preserve history.

Official publication, effective interval, retrieval, review, expiry and application
release are different timestamps. Unknown dates/pages remain NULL. PDF locators
use physical one-based pages plus optional displayed labels; HTML uses preserved
text offsets/section metadata. Offsets are Unicode code points, end exclusive.
No actual PDF parsing, OCR or artifact/page accuracy claim is made.

Provider-neutral backend/key pairs prepare private snapshot storage without
bucket creation, uploads, provider SDKs, signed URLs or cloud activation. Detailed
extraction/redirect manifests need validation by later ingestion adapters.

Independent source authenticity, content-use authority, crawl permission,
document approval, extraction quality, human review, freshness and selection are
not collapsed into one verified flag. A successful HTTP status alone cannot renew
content checks. Match records bind the exact document/version/hash/URL; 304 needs
a prior matching check. Latest failures fail closed in this initial implementation.
Source/document critical risk takes the shorter seven-day TTL; general risk has
30 days, ownership review at most 90 days. A review timestamp is not a content check.

Claims are reusable curated statements, not citizen questions or generated chat
logs. Exact support/contradiction/context references do not automatically mark a
claim reviewed. Publication requires current service-bound reviewed support and
independent editor/reviewer identities; contradictions and open conflicts block
it. Conflict resolution needs competing passage references and human metadata;
there is no automatic newest-wins rule. Review changes append private events.

## Embedding strategy

Profiles preserve provider/model/revision, dimensions, metric, normalization and
tokenizer compatibility without selecting or approving a provider/model. Generic
pgvector storage plus a composite profile/dimension FK and vector_dims checks
supports 1-16000 dimensions; nonfinite components are rejected by pgvector.
Different model profiles coexist without truncation. Vector content/profile
bindings are immutable; indexing status can change. Rows are inserted only when
an actual vector exists; no placeholder NULL vector is a completed embedding.

No embeddings were generated, and no production vector row or model approval was
seeded. Tiny numeric vectors occur only in rolled-back integrity tests. Phase 6
must select/evaluate a multilingual model and profile-specific retrieval/indexing.
HNSW vector indexing's 2000-dimension limit differs from storage's 16000 limit;
halfvec/typed expression or per-profile partition strategies require evaluation.
There is no similarity query, ANN index or active-profile switch in P15.

## Commands and actual results

| Command/check | Result |
| --- | --- |
| `npm.cmd run db:start`, `db:status`, `db:migrate` | PASS against guarded loopback-only local PostgreSQL; real CLI migration history |
| `npm.cmd run test:database` | PASS: 28 tests, 0 skipped; 12 core + 16 evidence cases; independent full migration replay |
| `npm.cmd run db:types` | PASS: real schema types generated and formatted |
| `npm.cmd run typecheck` / `typecheck:database` | PASS: strict web and generated-schema checks |
| `npm.cmd run test:database:guards` | PASS: 5 targeting/connection-failure cases |
| `npm.cmd run test:unit` / `test:coverage` | PASS: 195 tests across 11 files; existing selected-module coverage gates pass (97.70% statements, 100% branches, 92.85% functions, 97.61% lines); not SQL coverage |
| `npm.cmd run lint`, `format:check` | PASS; SQL syntax/behavior verified by real replay, not a pretend SQL linter |
| `NEXT_TELEMETRY_DISABLED=1 npm.cmd run build` | PASS: 119 prerendered public/framework routes, no DB credentials needed by the frontend |
| `npm.cmd run test:e2e -- --workers=2` | PASS: all 28 Chromium/frontend/axe cases, exit 0, 56.2 seconds on the clean rerun |
| `npm.cmd run test:python` | PASS: 9 offline cases |
| `npm.cmd audit --json` | Exit 1: 5 existing high dev-chain findings, 0 critical; no unrelated forced update |
| `npm.cmd audit --omit=dev --json` | PASS: 0 production dependency findings |
| Local source/claim/embedding row counts | All zero; synthetic rows lived only in disposable transactions/databases |
| Remaining `askbd_p14_test_*` databases | Zero after tests |
| Local stop/start/migrate/status cycle | PASS: retained data/credentials, idempotent migration, no reset |
| Generated schema hash before/after regeneration | Identical; reproducible formatted output |
| `npm.cmd ls --all --parseable` | PASS: consistent locked workspace dependency graph |
| CI YAML parsing | PASS using the existing Prettier YAML parser; job semantics manually reviewed, no new dependency |
| `npm.cmd run docs:check` | PASS: 13 required docs, 194 local links; structural checks only |
| `git diff --check`, `git diff --cached --check` | PASS; 14 pre-existing staged entries preserved |
| Credential scan | No high-confidence pattern or actual local password match in 141 tracked/unignored nonbinary files; limited scan, not proof of absence |

`validate:p15` aliases the existing full aggregate plus the current real DB suite;
individual component commands above were executed, not a claimed aggregate run.
CI's database job uses the same startup/migration/tests and now regenerates and
strictly checks schema types. Actions remain least-privilege and pinned; no remote
GitHub Actions run is claimed. The local database remains ready on loopback;
the browser test server closed normally. No global Git configuration was changed;
the elevated read-only scan used a command-scoped trust setting for this workspace.

Initial failures were real and corrected: the embedding-dimension test first hit
a duplicate PK before reaching its intended FK; it now uses an independent
passage and separately tests vector/profile dimensions. A stricter RLS test needed
temporary parent-row lock privilege before it could reach the actual row-policy
denial; all grants are rolled back. The first browser command passed 28 assertions
but failed teardown because Windows sandbox denied taskkill. Only its verified
port-3100 test server was terminated; the unchanged suite then passed outside that
process sandbox with clean teardown. Failing commands were not marked passing.

## Security, limitations and next package

All 24 raw tables have enabled/forced RLS and no PUBLIC/API-role grants. Actual
anonymous SELECT remains empty even with temporary schema/table grants; attempted
INSERT produces a row-policy denial. Nonadministrator API roles cannot execute
private eligibility helpers or approve records. Review notes and snapshot keys
remain private. No SQL-definer bypass, public browser DB credential, anonymous
write endpoint, real government source or fabricated verified claim was introduced.

Private predicates validate structural/status/time eligibility. They cannot prove
semantic entailment, jurisdiction/audience/language applicability, reviewer
identity or actual artifact readability. No positive public release was enabled;
release/revocation/context/concurrency cases are required before a publisher or
public evidence projection exists. P16 must bind reviewer UUIDs to trusted staff
membership and least-privilege operations. P17 must implement safe repositories,
context-aware publication filtering and public projections. Database owners can
disable triggers; normal-write immutability is not protection against a malicious
owner. Privacy/retention purge needs a narrow reviewed maintenance procedure.

No crawler, extraction, OCR, real embedding generation, hybrid retrieval, RAG,
chat backend, full admin dashboard, remote identity, hosted storage, cloud resource,
deployment, commit or push was performed. Phase 3 remains incomplete until P16
and P17 pass. Recommended next work package: **P16**, separately authorized.

Primary references checked 2026-10-19:
[pgvector 0.8.2 storage/index constraints](https://github.com/pgvector/pgvector/blob/v0.8.2/README.md),
[PostgreSQL 17 constraints](https://www.postgresql.org/docs/17/ddl-constraints.html),
[Supabase SQL migrations](https://supabase.com/docs/guides/local-development/cli-workflows).
