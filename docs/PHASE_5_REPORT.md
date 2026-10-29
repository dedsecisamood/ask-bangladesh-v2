# Phase 5 — ingestion implementation and verification

Checked 2026-10-21–22, Asia/Dhaka. The owner explicitly authorized completing
P22–P28, superseding the individual P22/P23 stops. Scope is implementation and
synthetic local verification. Real source onboarding, government-site access,
live scheduling, cloud/paid services, deployment and commits are excluded.

Decision: **Phase 5 PASS in the authorized local implementation/test scope**.
P22–P28 are complete. Live source coverage and production readiness are not
claimed; the operational gates below remain. Stop before P29/Phase 6.

## Work packages and implementation

| Package | Implemented result | Local acceptance |
| --- | --- | --- |
| P22 | Preserved exact-URL permission, IP-pinned TLS, robots, SSRF/access/budget boundaries and private manifests | PASS |
| P23 | Bounded offline HTML extraction, main/article fallback, headings/lists/table rows, safe link metadata, DOM/offset provenance, Bangla/English | PASS |
| P24 | Strict pypdf text extraction, exact physical pages/optional labels, immutable original hash, active/encrypted/resource rejection | PASS |
| P25 | Conditional Poppler/Tesseract ben+eng OCR, private page image/hash, engine/model/config/confidence lineage, mandatory review | PASS |
| P26 | Conservative NFC/whitespace normalization and raw offset maps, page/section bounded passages, quality/quarantine flags | PASS |
| P27 | Private content-addressed artifacts, durable leased/fenced SQL jobs, immutable versions/passages, dedup and review-blocked indexing outbox | PASS |
| P28 | Due scheduling, change/withdrawal observations, bounded retries/dead letters/manual holds, protected pause/recovery and private aggregate monitoring | PASS |

HTML uses a bounded standard-library parser rather than adding an unmeasured
extraction framework. It never executes scripts or fetches linked resources.
Tables/complex layouts require review; generic HTML extraction quality is not
claimed. PDF uses BSD-licensed pypdf rather than selecting PyMuPDF's licensing
path. Native rendering/OCR runs only in a disposable local sandbox. PostgreSQL/
Supabase SQL migrations and pg8000 remain the sole database strategy; no new
ORM, queue service, npm package, embedding vendor or cloud provider was added.

## Evidence, storage and publication

Original SHA-256 bytes, canonical derivative JSON and OCR page images use private
provider-neutral keys. Artifacts retain tools/image/profile, raw and normalized
text/maps, source/capture URL lineage, headings, PDF physical page and optional
display label. Missing publication/effective dates remain unknown. HTML links are
untrusted metadata, not permissions or crawled destinations.

Local storage rejects traversal, symlinks/junctions and public/application roots,
uses restrictive modes, atomic publish-if-absent and verified reads. A failure
after storage but before SQL can leave private unreferenced objects. Staging-only
cleanup requires an age of at least 24 hours; immutable evidence is not purged.
Production IAM/NTFS ACL verification, retention/reference-aware garbage collection,
recovery and a safe reviewer document viewer remain operational gates.

Jobs bind exact permission/source/URL, idempotency, UUID lease token and increasing
generation. A five-minute lease is renewed every 30 seconds, with a 15-minute
attempt ceiling; one running job/source and two globally bound processing. Network
hops still serialize with P22's five-second completion spacing and rolling budgets.
Expired/revoked/paused/stolen leases cannot commit. Version/passages/outbox/event
changes commit atomically, while original bytes and historical locators stay immutable.

Every worker passage remains pending. Independent fresh-MFA human review must
acknowledge every flag and provide current proof; append-only passage decisions
preserve P15's immutable extraction fields. Reviewers cannot approve their own
source work. Source/domain/member/freshness/conflict guards still apply. Revocation
clears current evidence and cancels outbox readiness. No passage/claim public API,
admin dashboard, embedding generation or indexing consumer is added.

Changed content/redirect identity removes old current guidance before parsing.
404/410 withdraws; other failures conservatively withhold rather than renewing
freshness. A successful matched digest records acquisition checks without approving
facts or extending human/domain proof. HTTP 304 is unsupported; full bytes are
required. Default refresh targets are six hours critical/24 hours general, within
protected configurable bounds and existing seven-/30-day hard eligibility TTLs.

Transient jobs back off with jitter, stop after five attempts and honor valid
503 Retry-After up to 24 hours. No HTTP hop retries inline. Access/robots/429/TLS/
SSRF/parser failures and exhausted retries persist target holds across scheduling;
only protected fresh-MFA owner/administrator recovery clears a hold, with audit.
Three transient failures impose a 24-hour scheduling cooldown. Metrics expose
bounded state/error counts, age, due work, holds, expired leases and pending review,
not document text or credentials. No cron/daemon/exporter or alert system runs.

## Isolation, dependencies and inventory

Container: uid/gid 65532, network none, read-only root, no host mounts/secrets,
all capabilities dropped, no-new-privileges, 768 MiB memory/swap, one CPU, 32 PIDs,
128 MiB noexec tmpfs. Input is stdin; result is bounded stdout. Host kill deadline
is 300 seconds; CPU time 120 seconds, file output 16 MiB, file descriptors 128.
Input cap 5 MiB, text 250,000 characters, tree 20,000 nodes/64 depth, PDF 50 pages,
10 OCR pages, 10 million pixels/page, 60 seconds/OCR process, and 240-second
document checks. PDF stream expansion caps and 12 MB total output are additional
guards. Over-limit work fails/quarantines as a whole, never partly publishes.

The Python base is pinned to
`python:3.14.8-slim-trixie@sha256:fbecd461fc72d21b2143c6eaba25143738079154a6d0ea3da3aec724f50eed4a`.
Host Python remains 3.14.4; native dependencies are not installed on Windows.
Current verified sandbox image:
`sha256:ca36817d60b54c8a255fe1adb00b9f5244391a7a36a290ee4951bf6e9fba69ca`.
The ignored manifest binds exact image ID/recipe/source hash; changing any worker
module requires rebuilding. Native apt dependencies are resolved from Debian,
not individually pinned; rebuilds can differ, so image/tool/model lineage matters.

| Dependency | Actual installed version | Inspected license metadata |
| --- | --- | --- |
| pypdf | 6.21.1 | BSD-3-Clause |
| Pillow | 12.2.0 | MIT-CMU |
| poppler-utils | 25.03.0-5+deb13u4 | Debian copyright includes GPL-2/GPL-3 and Apache-2.0 components |
| tesseract-ocr | 5.5.0-1+b1 | Apache-2.0/MIT components |
| tesseract-ocr-ben/eng | 1:4.1.0-2 | Apache-2.0 |
| fonts-noto-core | 20201225-2 | OFL-1.1 and GPL-3+ metadata |
| pango1.0-tools | 1.56.3-1 | LGPL family plus bundled dependency/example/font license notices |

Metadata above was read from installed distribution metadata and Debian copyright
files, not a legal conclusion or complete transitive SBOM. Preserve actual notices
and review distribution obligations and a fresh vulnerability inventory before
shipping an image. There is no native vulnerability scanner result in this task.
The npm lockfile is unchanged; earlier zero-production/five-high-development-chain
advisory findings remain historical, with no fresh npm advisory run claimed here.

Bengali traineddata SHA-256:
`31163084c279aaebd376216f0c3d5c17ad4b5fee8db49dae79c20000b5de5964`;
English:
`7d4322bd2a7749724879683fc3912cb542f19906c83bcc1a52132556427170b2`.
Actual synthetic line: “বাংলাদেশ তথ্য সেবা পরীক্ষা”. Native OCR recognized it
exactly: character error rate 0.0, mean confidence 95.563. **One clean typeset
synthetic line is not a real-world Bangla/OCR benchmark or human approval.**
All OCR/critical-value/layout flags remain review-blocking.

## Files and migrations

New worker modules under workers/ingestion/askbd_ingestion:
extraction.py, html_extract.py, pdf_extract.py, passages.py, storage.py,
sandbox.py, sandbox_entry.py, sandbox_selftest.py, jobs.py and pipeline.py.
Existing models.py/crawler.py/registry.py gain Retry-After/serialized DB operations.
New Dockerfile/.dockerignore/requirements-sandbox.txt keep native parsing isolated.
No browser/client module or public frontend feature changes.

Seven forward migrations in database/supabase/migrations:

- 20261021001200_ingestion_jobs.sql — private controls/jobs/events/targets/outbox,
  policy-bound leases and worker capability functions.
- 20261021001300_ingestion_evidence_commit.sql — observed changes, immutable
  validated versions/passages, dedup and pending indexing.
- 20261021001400_ingestion_operations.sql — backoff/dead letters/scheduling,
  metrics and protected emergency control.
- 20261021001500_ingestion_review.sql — append-only passage review and protected
  human document approval/revocation without weakening immutable bytes.
- 20261021001600_ingestion_retry_scheduling_fix.sql — verified scheduler alias
  correction and persisted/honored Retry-After.
- 20261021001700_ingestion_manual_holds.sql — durable target holds and protected
  audited recovery; no automatic quarantine readmission.
- 20261021001800_ingestion_hold_metrics.sql — held versus runnable due counts.

Total schema: 42 forced-RLS private tables, 25 migrations, generated TypeScript.
Six new tables reuse existing sources/documents/versions/passages/verification/
checks/staff identity. [DATABASE](DATABASE.md) contains relationships and ER diagram.
Earlier applied migration history is preserved; findings use forward fixes.

Testing/config files: database/tests/ingestion.cases.mjs, crawler.cases.mjs,
evidence.cases.mjs, generated.types.ts; workers/ingestion/tests/test_extraction.py,
test_crawler.py, parser_probe.py and crawler_database_probe.py; scripts/parser.mjs,
root package.json and .github/workflows/ci.yml. CI builds/tests the offline parser
before the real SQL/Python pipeline probe; failures remain fatal. No hosted CI
run is claimed. The validate:phase5 aggregate composes existing fail-fast scripts;
the commands below were executed as components, not as a separate aggregate run.

Documentation: AGENTS.md, PLANS.md, README.md, ARCHITECTURE, DATABASE, SOURCE_POLICY,
SECURITY, DEPLOYMENT, EVALUATION, AI_SYSTEM, ROADMAP, CODEX_PROGRESS, this report,
and worker/database/infrastructure/testing guides. Historical phase reports remain.

## Verification evidence

Actual commands (npm.cmd on this Windows host):

| Command | Result |
| --- | --- |
| npm.cmd run parser:build | PASS; local pinned-image build, no live worker |
| npm.cmd run test:parser | PASS; 16 actual native parser/OCR/isolation checks |
| npm.cmd run test:python | PASS; 171 tests |
| node scripts/python.mjs -m pip check | PASS; no broken requirements |
| npm.cmd ls --all | PASS; dependency graph exit 0 |
| npm.cmd run test:database:guards | PASS; five target/connection guards |
| npm.cmd run test:database | PASS; 86 cases, including actual Python/HTML/native-PDF/Bangla-OCR-to-SQL pipeline |
| npm.cmd run db:types | PASS; actual migrated schema generation |
| npm.cmd run test:coverage | PASS; 315 tests/21 files; coverage scope is the existing selected i18n utility, not the whole product |
| npm.cmd run lint | PASS; zero warnings |
| npm.cmd run typecheck | PASS; strict web and generated database types |
| npm.cmd run format:check | PASS |
| npm.cmd run build | PASS; Next.js production build |
| npm.cmd run test:e2e -- --workers=2 | PASS; all 28 Chromium cases in the completed rerun |
| npm.cmd run test:integration | PASS; 28 real local MFA/API/published-browser grouped checks |
| npm.cmd run docs:check | PASS; structural/local-link validation only |
| Git working/staged diff --check | PASS; final documentation validation recorded in checkpoint |

SQL coverage includes reproducible empty-database migration replay, RLS/grants,
claims/lineage, stale-fence rejection, dedup/history, private pending output,
human approval/revocation/flag acknowledgement, changed/withdrawn evidence,
five-attempt dead letters, 503 delay, scheduler holds, fresh-MFA controls and role
denial. The real temporary least-privilege Python login runs HTML/native PDF/
scanned Bangla through simulated HTTP, actual Docker parsing, private storage and
PostgreSQL; no government network is contacted.

Confirmed defects corrected during verification: a scheduler SQL alias/record
collision; append-only human review needed for immutable P15 passages; and durable
quarantine across later scheduler admission. Two synthetic-session test fixtures
were corrected to obey unique-token and lifetime constraints, without weakening
production controls. Interrupted runs returned nonzero: Chromium reported
ERR_NETWORK_IO_SUSPENDED and wall-clock timeouts, the adapter timed out and Auth
verification failed. These runs are not counted as passing. Completed final reruns
returned exit 0 for all 86 database, 28 browser and 28 integration cases.

ESLint/TypeScript/Prettier cover the configured JS/TS/configuration scope. Python
is behavior-tested by Pytest/native probes; no standalone Python static checker
or formatter is configured. Workflow YAML is parsed by Prettier and reviewed;
no GitHub-hosted execution or deployment result is claimed.

Limited credential review compared four local development credential values and
private-key headers against 241 repository text files: zero matches. All 14
pre-existing staged entries remain; no staging/history operation was performed.
The ordinary database has 42/42 forced-RLS private tables, zero sources/policies/
retrievals/jobs and paused controls. One positively identified synthetic Auth user
left by an interrupted run was removed through the guarded local provider API;
no real identity was touched. The owned Auth test container is stopped. Final
disposable resource cleanup is recorded in the checkpoint. This limited scan
is not a complete secret/security audit.

## Remaining operational gates and boundary

No government website was accessed or ownership/access/crawler permission verified.
No real source, agency, official procedure, fee, deadline or reusable claim was
invented/onboarded. Ordinary public demo/published empty states stay honest.
All source HTTP in tests is injected simulation; parser/OCR/DB/Auth are real local
tools where stated. Browser automation is not manual visual or accessibility QA.

Production still needs approved exact sources/terms/contact identity, independently
enforced egress denial, private storage IAM/retention/recovery, dedicated identities,
safe human review tooling/staffing, real permitted multilingual extraction/critical-
field evaluation, dependency/license/advisory review, hosted CI, alerting and live
activation approval. The limited identifier/instruction flags do not replace
complete privacy redaction or prompt-injection testing. Windows mode bits do not
certify ACL protection. No production security/cost/load benchmark is claimed.

No live crawler/scheduler, paid OCR/AI, embedding generation, hybrid retrieval,
RAG/chatbot, cloud bucket, production deployment or full dashboard is implemented
or enabled. Controls are paused and Python network_ready defaults false. Preserve
all pre-existing staged work; no staging, commit, push or deployment is authorized.

Recommended next package after local completion and explicit authorization:
P29 readiness/keyword retrieval. Live evidence requires separate source onboarding
and operational approval. Do not begin Phase 6 automatically.

## Technical references actually accessed

Checked 2026-10-21:
[Python HTMLParser](https://docs.python.org/3.14/library/html.parser.html),
[pypdf text/memory guidance](https://pypdf.readthedocs.io/en/stable/user/extract-text.html),
[pypdf license FAQ](https://pypdf.readthedocs.io/en/stable/meta/faq.html),
[pypdf 6.21.1 metadata](https://pypi.org/pypi/pypdf/6.21.1/json),
[Pillow 12.2.0 metadata](https://pypi.org/pypi/pillow/12.2.0/json),
[Tesseract command-line/TSV](https://tesseract-ocr.github.io/tessdoc/Command-Line-Usage.html),
[Tesseract language data](https://tesseract-ocr.github.io/tessdoc/Data-Files.html),
[Docker resource controls](https://docs.docker.com/engine/containers/resource_constraints/),
[PostgreSQL 17 queue locking](https://www.postgresql.org/docs/17/sql-select.html).
These are technical primary references, not government-source verification.
