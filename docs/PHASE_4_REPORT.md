# Phase 4 — directory implementation and verification

Scope: the owner authorized completion of P19–P21 after P18, then explicitly
selected **implementation and tests only**. Real source research/onboarding,
reviewer provisioning, production records and source-site requests are excluded.
Stop before P22/Phase 5. **Phase 4 PASS in the explicitly authorized local
implementation/test scope. Production coverage is not claimed.**

## Implementation

- P18 preserved: private candidate registry, independently evidenced approval,
  critical-source second review, immutable history and conservative publication.
- P19: protected SQL/HTTP creation and metadata replacement for agencies,
  categories and services, bilingual translations, primary/additional categories,
  responsible/supporting agencies, approved source relations and reviewed
  bn/en/Banglish aliases. Existing FK, hierarchy and uniqueness constraints remain.
  All 16 planned categories can be represented without advertising coverage.
- Independent metadata publishing requires current evidence, fresh MFA and a
  reviewer different from creator/last editor. Edits reset draft state and revoke
  prior releases. Aliases/relationships invalidate parent revisions. Raw summaries
  and review proof remain private; public identity metadata does not authorize
  instructions, eligibility, documents, fees or deadlines.
- P20: explicit server-only DIRECTORY_MODE=published connects existing bn/en
  directory/list/detail routes to reviewed SQL projections. Default demo remains
  DB-independent. Published mode never falls back to demo when the DB fails.
  Collection/detail segments render at request time and are not publicly cached,
  avoiding stale source links and build-time mode/data capture. Unknown identities
  use not-found behavior; unavailable DB results have a distinct error state.
- Server-side literal keyword search covers reviewed names/aliases and related
  published agency/category names. NFC, whitespace and case normalization support
  approved spelling variants; no fuzzy/NLP/semantic language claim is made.
  Search text goes only in a bounded POST body, not URLs, logs, cookies, cursors
  or stored records. Cursor bindings hash filters/query and pin publication
  generation; signed pages expire and changes invalidate continuation.
- Accessible search/category/agency controls, pagination, clear empty/error states,
  safe exact external destinations and ownership timestamps use existing UI styles.
  No citizen account or AI provider is required. Official links require the
  existing document/agency/domain/source eligibility gates; no shortcut was added.
- P21: append-only source-level link-request/history and health/review flags are
  distinct from document content-hash checks and ownership/crawl permission.
  Protected request API records verification_blocked with checked_at=null and
  NETWORK_POLICY_NOT_READY. It makes no DNS/HTTP request. Review flags suppress
  public links; reachability cannot grant trust or renew content freshness.
  A bounded protected integrity function reports missing relations, inactive
  sources, orphan aliases, duplicates and link-review requirements.

## Database and API changes

Five forward canonical migrations under database/supabase/migrations:

- 20261021000400_directory_management.sql — actor/editor references, primary
  category, existing staff-audit extension, reviewed commands and alias invalidation.
- 20261021000500_directory_search.sql — bounded keyword/relationship selection.
- 20261021000600_link_health.sql — source_link_checks, private health history,
  disabled check requests, public withholding and protected integrity diagnostics.
- 20261021000700_directory_audit_outbox.sql — existing append-only staff events
  also record transactional directory/link-review outbox topics; no consumer runs.
- 20261021000800_service_relations.sql — one exact reviewed relationship query
  prevents detail associations being truncated to the first filter-options page.

Total: 33 private forced-RLS tables, 15 migrations. Supabase CLI remains the only
migration/type authority. No ORM, provider, dependency or package manager added.
New source_link_checks is necessary because existing source_checks requires a
document FK and tracks content hashes; a source-level blocked request must not
pretend to be a document/content check or refresh evidence.

Protected operations (existing online MFA/bound-session/grants/retry policy):

- POST /api/v1/admin/directory/{agencies|categories|services}
- PATCH /api/v1/admin/directory/{kind}/{uuid}
- POST /api/v1/admin/directory/{kind}/{uuid}/{publish|withdraw}
- GET /api/v1/admin/directory/integrity
- POST /api/v1/admin/sources/{uuid}/link-check
- Existing protected GET source status now includes latest 20 link checks and
  a derived private link_health object, with no actor IDs in the response.

Create/update fields are strict: slug, translations[{locale,name,description}],
reason; agency/category may include parent_id. Service fields additionally include
primary_category_id, category_ids, agencies[{id,relationship}], source_ids and
aliases[{alias,language}]. Slugs are stable; changing identity needs a new record.
Publish accepts revision/reason/proof using P18's method/reference/excerpt/check/
expiry schema. No client can assign actors, trust states or synthetic flags.
Mutations require UUID Idempotency-Key and expected decimal-string revision
except create. Reuse of the existing actor-bound ledger and 30-successful-new-
mutations/minute budget avoids competing retry systems. Review proof and bounded
audit context remain private. Auditors inspect; review capability is needed to write.

Public operations preserve existing collection/detail contracts, adding optional
source_ids on service metadata and service_id filtering on source collections.
POST /api/v1/search accepts locale, query (120 characters maximum), limit (1–50),
optional category/agency_id/cursor. It returns the existing directory envelope.
GET query text and unsupported fields are rejected. Service relations remain
bounded; no embeddings, passages, raw summaries or review notes are returned.
The SQL query and existing connection pool use three-second statement budgets.
Filter option lists are bounded to 50; larger catalogs need searchable selectors
later. Keyword substring scans are a baseline, not a large-corpus ranking engine.

## Network safety and operational limits

Live link checking is deliberately blocked: the architecture reserves source-web
egress to the isolated worker. No approved destination-IP-pinning, connected-peer
verification, redirect permission and infrastructure egress boundary is available
yet. The P21 prompt explicitly permits this fail-closed implementation with tested
offline behavior. No flag enables network requests in this implementation.

analyseLinkObservation is an offline evaluator for allowlisted HTTPS destinations,
DNS/connected-peer observations, redirects, TLS, response limits, HEAD/GET permission,
timeouts, DNS/connection failures and HTTP outcomes. It opens no sockets. IPv6
remains conservatively blocked, including public IPv6, until safe worker support.
Its IPv4 policy is a conservative subset, not a claim of a complete production
fetcher. It does not implement DNS resolution, HTTP retries or scheduled monitoring.
403/CAPTCHA require manual review; one 404/500/timeout is transient, repeated
failures become suspected_broken. No automatic permanent deapproval occurs.

To request a permitted check, use the protected link-check API with source ID,
current revision/reason and retry key. Inspect private source status afterward:
the result is blocked, never healthy, until separately authorized worker work.
Do not call arbitrary curl/fetch, change crawler permission or bypass restrictions.
No retention/pruning job or outbox consumer is enabled. Real operations need
reviewed retention, staffing, source access policy and Phase 5 network controls.

## Verification

Commands ran from the repository root using npm.cmd on Windows. Individual
components of validate:phase4 were executed; the aggregate alias itself was not.

| Actual command | Final result |
| --- | --- |
| npm.cmd run db:start | PASS, inspected owned loopback-only PostgreSQL |
| npm.cmd run test:database | PASS, 60/60 real SQL cases, no skips; 15 migrations replayed on independent disposable DBs |
| npm.cmd run db:types | PASS, current generated schema types |
| npm.cmd run test:coverage | PASS, 315/315 cases in 21 files |
| npm.cmd run test:integration | PASS, 28 grouped real local MFA/HTTP/API/published-Chromium checks |
| npm.cmd run test:e2e -- --workers=2 | PASS, 28/28 existing Chromium frontend regressions |
| npm.cmd run test:database:guards | PASS, 5/5 targeting/connection-failure checks |
| npm.cmd run test:python | PASS, 9/9 Python cases |
| npm.cmd run build | PASS, Next 16.4.2 production compilation/type validation and static generation; directory/home routes render dynamically |
| npm.cmd run lint | PASS, zero warnings |
| npm.cmd run typecheck | PASS, strict application and generated database types |
| npm.cmd run format:check | PASS, including YAML syntax/format validation |
| npm.cmd ls --all --parseable | PASS, existing dependency graph consistent |
| node scripts/python.mjs -m pip check | PASS, no broken requirements |
| npm.cmd run docs:check | PASS, 13 required documents and 217 local links; structural checks only |
| npm.cmd run auth:stop | PASS, owned synthetic Auth runtime stopped without deletion |
| git diff --check / git diff --cached --check | PASS using command-scoped safe.directory; no global Git settings changed |

Existing selected-module coverage gates pass: statements 97.70%, branches 100%,
functions 92.85%, lines 97.61%. This is not whole-platform coverage. Fifty-two new
unit/component cases cover new contracts/HTTP, UI behavior, mode/cursor semantics
and 36 offline link observations. Ten new real SQL cases cover P19-P21. Positive
real API search checks include seven English/Bangla/Banglish/name/related-term
queries plus unsupported/malicious queries, combined filters and cursor mismatch.
These are synthetic deterministic fixtures, not measured real-world routing or
comprehensive Banglish-language quality.

Real Chromium visited mobile bn/en details, category/agency journeys, homepage
directory navigation, POST search and localized not-found state. Three axe scans
of published journeys found no violations. The existing 28-case suite additionally
covers both locales, six viewport widths, keyboard/mobile dialog navigation,
no-JavaScript readability, text resize/reflow and constrained local transfer.
Generated mobile search/not-found screenshots were opened and visually inspected.
This is not a human screen-reader/device/conformance audit.

Failed attempts were corrected rather than labeled passing: two new HTTP tests
omitted their Host header; initial lint rejected JSX construction inside try/catch,
so loaders now catch data failures before rendering. The old real permission test
revoked a retired query function; it now revokes the current search function and
verifies sanitized 503s. The auditor fixture reused a unique binding hash, then
lacked a disposable SET ROLE grant; both fixtures were corrected without relaxing
application permissions. A non-waiting browser not-found assertion raced rendering;
the final test waits for visible content. Review also fixed exact service relations
beyond option-page limits, metadata/page request-scoped deduplication and repeated
agency presentation across roles. All final relevant runs pass.

No production records, government sites, paid APIs or remote CI are test inputs.
Fixtures simulate publication only inside guarded disposable databases. Credential
comparison scanned 210 tracked/unignored text files against four actual local
credential values and private-key headers: no matches. This is a limited scan,
not an exhaustive secret scanner. The 14 owner-staged entries are preserved.
Cleanup confirmed zero ordinary sources/memberships/releases/link checks,
disposable databases and synthetic provider identities. Test processes stopped;
the owned Auth container was stopped without data deletion.

## Changed files

Directory management/search/mode modules and HTTP/contract tests; published catalog
server/client components and tests; existing section/detail route integration;
protected directory/link-check and public POST search route handlers; offline
link-health evaluator/tests; five SQL migrations; generated types; phase4 SQL
cases; extended real MFA/browser integration helpers; development scripts and
environment example; CI installs the pinned browser for real directory integration;
README/instructions/progress and relevant specifications.
Existing source ownership/provenance and frontend demo implementations are retained.

Main code locations: apps/web/src/lib/directory/{manage,search-contract,mode}.ts,
directory/phase4-http.test.ts and mode.test.ts; updated directory contracts,
repository, HTTP and cursor modules; features/catalog/published-pages.tsx,
published-search.tsx and published.test.tsx; registry/link-health.ts and its tests.
Six new route handlers live beneath api/v1/admin/directory, the explicit source
link-check path, and api/v1/search. Existing locale/home/section/detail pages
select the configured mode. Database cases live in database/tests/phase4.cases.mjs,
registered by core.test.mjs; the table-count check and generated.types.ts changed.
scripts/phase4-integration.mjs extends the existing phase3/registry runners.
package.json adds validate:phase4; package-lock.json and all versions are unchanged.

## References checked

2026-10-21: installed Next.js 16.4.2 fetching-data, page/searchParams and route
documentation; [PostgreSQL string normalization/functions](https://www.postgresql.org/docs/17/functions-string.html);
[OWASP SSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html).
No government website was accessed or represented as verified.

## Decision and release gates

| Work package | Decision |
| --- | --- |
| P18 registry/review | PASS, preserved and regression-tested |
| P19 directory data management | PASS locally |
| P20 published directory/search/links | PASS locally |
| P21 offline health/history/integrity/audit | PASS locally using the prompt's explicit fail-closed live-check allowance |

**Phase 4: PASS for the authorized implementation/test scope.** All mandatory
local implementation criteria passed. This excludes live onboarding and production
release, as explicitly selected by the owner. Real coverage remains empty: no agency, source
or service has been researched, approved or published by this work. Production
identity/recovery/TLS, remote CI, human device/screen-reader/translation review and
the existing five high development-tooling advisories remain separate gates.
The last owner-authorized npm audit found zero production findings; package
versions remain unchanged. No crawling, OCR, ingestion, retrieval, AI generation,
full admin dashboard, cloud service, deployment, commit or push is included.
Phase 5 must be separately authorized; no automatic continuation.
