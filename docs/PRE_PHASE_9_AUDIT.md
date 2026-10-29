# Pre-Phase-9 audit and remediation

Date: 2026-10-24 (Asia/Dhaka). Owner asked to recheck Phases 0-8 and finish
confirmed issues. Stop before Phase 9. No public release, paid calls, production
identities, source onboarding, remote DB operations, commit or push authorized.

## Answer to the completion question

All earlier local/demo implementation claims must be read in their stated scope.
**Everything before Phase 9 is not formally accepted.** Phases 6-8 still lack the
approved official corpus, independent human findings and controlled real-provider
evidence required by their acceptance criteria. An empty ordinary registry and
passing synthetic tests do not prove government coverage or answer accuracy.

| Phase | Local engineering scope | Remaining limits |
| --- | --- | --- |
| 0 | Approved architecture/specifications and offline structural validator | Historical P03 operational/trust gates remain feature/release gates, not an assertion of production completeness |
| 1 | App/toolchain/environment/tests/local CI checks implemented | Hosted CI execution and production infrastructure unverified |
| 2 | Complete bilingual demo/public route shells and responsive/accessibility automation | Independent translation, real-device and assistive-technology review pending; no live coverage |
| 3 | SQL migrations, provenance, RLS, MFA/staff foundation and repositories implemented | Production identity, storage IAM, restore/recovery and hosted deployment unverified |
| 4 | Reviewed registry/directory workflow, metadata projections/search and offline health checks implemented | Owner selected implementation/tests only; real source onboarding/coverage absent |
| 5 | Isolated crawler/parser/OCR, immutable versions/passages, queues and freshness controls implemented locally | Live permission/egress/representative extraction review and deployed operations pending |
| 6 | Keyword/semantic/hybrid/routing and offline model benchmarks implemented | Formal PARTIAL: approved held-out official corpus and independent relevance labels absent |
| 7 | Closed question/RAG/provider/citation/uncertainty/conversation foundations implemented; minimal feedback gap repaired here | Formal PARTIAL: corpus/support/human/real-provider gates remain; production generation/intake closed |
| 8 | Bilingual UI, bounded Banglish, language/follow-up behavior, synthetic evaluation and blank review export implemented | Formal PARTIAL: independent multilingual fidelity/usefulness and official-corpus/provider evidence absent |

This audit does not equate automation with human review or grant Phase 9 approval.
Historical reports and their earlier failures/counts remain preserved.

## Inspection performed

Read instructions, plan/roadmap, progress and Phase 1-8 reports; cross-checked PRD
capabilities, architecture/API, database, source, security, deployment and evaluation
requirements. Inspected public/admin handlers, permissions and generated types,
source/publication projections, worker URL/DNS/robots/storage/parser boundaries,
retrieval/ranking, provider composition, citation/support checks, language/context,
feedback UI and configured tests/CI. The complete local gate covers all these
implemented layers, using synthetic/disposable fixtures and cached models.

## Confirmed issues and fixes

1. **Topic/follow-up confusion (Phase 8):** prefix matching treated complete questions
   such as `What is NID?` as follow-ups. It could carry a different service/language,
   or discard that question when resolving a later language-only request. Matching
   now accepts bounded standalone follow-up phrases; full questions establish a
   fresh topic. Tests cover topic change and subsequent Bangla language switching.
2. **Unbounded request duration (Phases 3/4):** admin URL-encoded forms and directory
   POST search limited bytes but could wait forever for unfinished input. They now
   share a 4,096-byte, 2-second body reader with strict UTF-8, cancellation/deadline
   cleanup and safe 408/413/400 failures. Never-ending cancellation is not awaited.
3. **Missing Phase 7 correction intake:** CAP-20, roadmap and architecture required
   minimal anonymous intake; the existing form was honestly a local-only preview.
   Added `POST /api/v1/feedback`, strict structured-only schemas, rate/concurrency/
   body/origin/type controls, opaque 202 receipts, private pending queue and a
   bilingual structured UI in the existing API mode. Default demo preview remains.
   No free text, contact details, IP, citizen IDs or chat content is accepted/stored.
   Optional published service/source references are rechecked in SQL; draft/private
   records cannot be attached. Feedback cannot change source trust or publish data.
4. **Permission separation:** the feedback writer is askbd_feedback with a separate
   FEEDBACK_DATABASE_URL; the existing askbd_web reader cannot enqueue. No runtime
   role can read/update the raw queue. Forced RLS, restrictive function grants and
   security-definer search path are explicit. A forward migration separates roles
   without modifying applied migration history. Queue capacity is serialized and
   capped at 10,000 records; expired metadata is purged on admission. Scheduled purge
   and operator triage remain activation/Phase 9 operations, not running services.
5. **Stale overview text:** PRD/roadmap/API prose still described databases and later
   APIs as nonexistent. Updated current summaries while preserving dated history.

The new POST handler is **always closed in production**. CHAT_MODE=api selects the
structured UI, not permission to collect production reports. No live user collection
or persistent personal-data flow was enabled. Rich optional text, contact collection,
answer-history storage and full feedback triage are outside this minimal repair.

## Changed areas

- Questions language helper and regression tests.
- Shared body reader/tests, directory search and admin form readers/tests.
- Feedback contracts, restricted connection/repository, handler, route and tests.
- Structured feedback UI/tests and existing information/section route integration.
- Two additive migrations: `20261024000100_structured_feedback.sql` and
  `20261024000200_feedback_role.sql`; generated types, SQL cases and RLS table count.
- Optional server-only feedback connection example; audit/current architecture,
  database, security, roadmap, PRD, README/plan/progress documentation.

No new dependency, migration framework, provider, model activation or cloud service.
No Phase 9 dashboard, review mutation API or production account provisioning.

## Actual checks and failure history

- Focused language/body/feedback/directory checks: PASS 72 tests in five files.
- Types: initial new test used global RequestInit where NextRequest narrows signal;
  corrected its explicit constructor-parameter type, then typecheck PASS.
- Local database first could not start because Docker Desktop was stopped; started
  the installed local engine/container without reset, then migration/type generation
  succeeded. No unavailable migration was marked successful.
- First new SQL run: two test-role setup failures, because the migration account
  could not SET ROLE to the noninherited writer/embedder. Disposable transactional
  SET-only grants now mirror existing role-test helpers and roll back. Production
  grants/role attributes were not weakened. Failure log retained in
  `.cache/pre-phase9/database.log`.
- Fresh authorized `npm.cmd audit --json`: **zero vulnerabilities across all
  severities**, `.cache/pre-phase9/npm-audit.json`. No dependency update required.
- Limited worktree secret comparison: 341 reviewable text files, zero matches for
  the actual local DB secret/private-key blocks; not comprehensive secret detection.
- First full aggregate passed 724 unit/component tests, 156 SQL tests, 171 Python
  tests, 36 frontend cases, 28 real local Auth/API groups, 16 parser/OCR checks and
  three real offline model tests. New feedback browser locator matched both the
  expected alert and Next's route announcer; aggregate exit 1, six API UI cases
  passed. Corrected locator to match the intended feedback alert. UI rerun PASS
  seven cases, exit 0, unchanged assertions/timeouts; `.cache/pre-phase9/ui-recheck.log`.
- Clean final native `npm.cmd run validate:phase8`: **PASS, exit 0**,
  `.cache/pre-phase9/final-validation.log`. Initial aggregate failure remains
  preserved in `full-validation.log`; it is not represented as passing.

| Final aggregate component | Actual result |
| --- | --- |
| Dependency tree, format, lint and TypeScript/database types | PASS |
| Unit/component coverage | 724 tests / 42 files PASS; configured scoped function coverage 93.1% |
| Python dependency check / tests | PASS; 171 tests |
| Production build and default frontend suite | PASS; 36 Chromium cases |
| Database operation guards / disposable SQL | 5 guards / 156 SQL cases PASS |
| Actual local Auth/MFA/API/browser integration | 28 groups PASS |
| Isolated native parser/OCR | 16 checks PASS |
| Cached embedding artifacts / actual CPU/PostgreSQL tests | Both candidate sets verified / 3 tests PASS; no model activated |
| API-mode UI, feedback closed gate, privacy and accessibility | 7 Chromium cases PASS (43 browser cases across the two suites) |
| Multilingual review export | 61 synthetic cases; human fields remain blank |

Post-run read-only local state: 44/44 private tables enforce RLS, 36 migrations
applied, zero sources/documents/feedback and zero disposable test databases.
askbd_feedback has no login, can execute intake and cannot read the queue;
askbd_web cannot execute intake. State evidence: `.cache/pre-phase9/state.json`.
Final documentation check PASS (13 required documents, 303 local links), formatting
PASS and working/staged whitespace checks PASS. All 14 original staged entries
are preserved; no staging, commit or history change was performed.

## Independent acceptance and operational gates

Approved source/corpus manifests, ownership/permission approvals, frozen splits,
independent qualified multilingual annotations/adjudications and repeated real
quality metrics remain necessary under EVALUATION. Blank exports are not completed
reviews. Owner has not supplied new reviewer/corpus approval evidence in this task.
Vertex project/ADC, location/privacy, credit/billing eligibility, budgets and explicit
live-call approval remain required; the adapter/public generation stay disabled.

Before actual public use also verify hosted CI, ingress/distributed abuse and cost
limits, deployment logging/retention, scheduled deletion, storage/egress isolation,
operational staffing, human/device/accessibility review and release authorization.
These are documented operational/release gates, not silently completed by local tests.

## Technical references checked

Checked 2026-10-24: installed Next.js 16.4.2 route-handler guide;
[PostgreSQL 17 function security](https://www.postgresql.org/docs/17/sql-createfunction.html)
and [role/object grants](https://www.postgresql.org/docs/17/sql-grant.html).
Explicit search paths and revoked public execution preserve privileged boundaries;
test-role switching does not imply production role membership.

## Decision

Local audit/remediation decision: **PASS within authorized local engineering scope**.
No known local failing check remains after the clean final run. Formal pre-Phase-9
acceptance remains **PARTIAL**, because earlier real-content/human/provider gates
cannot be fabricated or waived. Do not begin Phase 9 or enable live functionality
automatically. Next manual work is approved corpus preparation and independent
review, followed by explicitly authorized controlled provider evaluation.
