# P22 — secure government-source retrieval boundary

Updated: 2026-10-21 (Asia/Dhaka). **PASS for local implementation and deterministic
verification.** Live collection is disabled; this is not Phase 5 completion or
production network approval. Stop before P23.

## Implemented

The owner supplied P22 after Phase 4 passed its authorized implementation/test
scope. The attachment includes an incomplete P23 outline, which was not executed.
Inspected AGENTS, PLANS, PRD/architecture/source/security/database/roadmap contracts,
the Phase 4 report/checkpoint, registry SQL/review permissions, current migrations,
Python tooling, tests, CI and Git status. Existing web functionality is preserved.

The new askbd_ingestion package separates source policy, strict URL/DNS validation,
pinned HTTPS, conservative robots, response validation, structured errors,
deadline/cancellation, typed results and private metadata persistence. It fetches
one explicitly requested document, not a recursive site. No link discovery,
HTML/PDF extraction, OCR, embedding, AI, scheduler, storage upload or deployment.

SQLRegistry uses a dedicated pg8000 DB-API connection and fixed parameterized SQL
calls. No browser/BFF URL proxy was added. Existing source approval and a separate
fresh-MFA, independently evidenced exact-URL permission are both required.
Policy binds source/domain/reviewer revisions and expiry. Creators cannot grant
their own permission; revoked/changed/expired records fail closed. A protected SQL
review call reuses actor-bound idempotency and mutation-budget records and writes
staff audit; it does not create a new authentication provider or dashboard.

The worker resolves all candidate addresses once per connection, rejects unsafe/
mixed/IPv6 answers, connects a numeric IPv4 socket and checks its peer before HTTP
and after TLS. Default certificate hostname validation and original-host SNI remain
enabled. No proxy, cookie, government credential or independent client DNS lookup.
Redirects repeat exact scope and permission checks; cross-host/downgrade/off-scope
redirects are rejected. Cloud metadata/private/link-local/loopback/reserved/
multicast/shared addresses and Azure's platform VIP are blocked.

Limits: one global request lease, five-second minimum gap, rolling 24-hour maximum
100 requests/source including robots/redirects/errors/abandoned attempts; review
can lower byte/redirect/request limits. Default body cap 5 MiB, robots 512,000
bytes, headers 32 KiB with 8 KiB line cap, three redirects default/five hard cap,
30-second document deadline, five-second connect/TLS caps and half-second stream
I/O timeout. Header parsing checks deadlines between bytes to bound slow-drip
responses. Compression, malformed/ambiguous framing and MIME/signature mismatches
are rejected. Errors/cancellation never return partial bodies as documents.

Robots is fetched anew per document through the same transport. Separate terms
permission remains mandatory even for robots 404/410. A conservative parser honors
all groups' simple disallows, and pauses for unsupported wildcard/precedence/rate
syntax, ambiguous content, redirects, restrictions and failures. This deliberately
over-restricts retrieval and is not full RFC matching. Login/CAPTCHA markers and
HTTP access/rate denial pause for review; marker heuristics cannot prove that all
private/authentication content is detected. Exact URL review remains essential.

Retrieved bodies stay bounded, ephemeral and untrusted for later quarantine/
processing. Private manifests record per-hop requested/final URL, source/policy,
attempt/completion/success timestamps, status, MIME, bytes, hash, bounded cache
validators and sanitized errors. Completed manifests and review policies are
immutable. Preflight denials return a safe result without persisting an unsafe URL.
No successful fetch changes document approval, source_checks or evidence freshness.

## Files and dependencies

New worker files: askbd_ingestion/{__init__,models,network,transport,robots,crawler,
registry,database}.py; tests/test_crawler.py; tests/crawler_database_probe.py;
requirements.txt. Updated pyproject.toml, requirements-dev.txt and worker README.

Three canonical forward migrations:

- database/supabase/migrations/20261021000900_crawler_boundary.sql
- database/supabase/migrations/20261021001000_crawler_admission_hardening.sql
- database/supabase/migrations/20261021001100_crawler_completion_spacing.sql

They add crawl_policies, crawl_retrievals, crawl_network_state and a NOLOGIN,
least-privilege askbd_worker role. Total: **36 forced-RLS private tables and 18
migrations**. Existing SQL-first/Supabase migration authority is unchanged.
Updated generated.types.ts, core/evidence DB tests and new crawler.cases.mjs.
CI's database job now installs the isolated Python requirements for the real
adapter probe; the existing Python job runs the crawler cases automatically.
Instructions/plans, README, architecture/database/security/source/roadmap docs and
the development checkpoint were updated. Existing Phase 1–4 reports are intact.

Installed in the existing .venv: pg8000 1.31.5, python-dateutil 2.9.0.post0,
scramp 1.4.17, asn1crypto 1.5.1, six 1.17.0. Exact pins are in requirements.txt,
included by requirements-dev.txt. pg8000 supplies a small pure-Python PostgreSQL
client compatible with this MSYS2 host, which lacks libpq/native psycopg wheels;
it is not a new ORM, provider or migration system. No npm package/version or
package-lock change. Existing Pytest tooling remains pinned and working.

## Executed verification

All commands ran from the repository root. Windows uses npm.cmd. The local Docker
operation required the ordinary Windows process context outside the restricted
sandbox; no network/DNS setting, global tool or cloud resource was changed.

| Actual command/check | Result |
| --- | --- |
| node scripts/python.mjs -m pip install --cache-dir .cache/pip --only-binary=:all: pg8000==1.31.5 | PASS, five small isolated runtime packages installed |
| node scripts/python.mjs -m pip install --cache-dir .cache/pip --requirement workers/ingestion/requirements-dev.txt | PASS, all pinned requirements satisfied |
| node scripts/python.mjs -m pip check | PASS, no broken requirements |
| npm.cmd run test:python | PASS, 127 total cases: 118 crawler/config/security and nine existing documentation cases |
| npm.cmd run db:start | PASS, existing owned loopback-only PostgreSQL |
| npm.cmd run test:database | PASS, 70 cases, no skips; two independent disposable migration replays |
| npm.cmd run db:types | PASS, generated schema refreshed from real migrated PostgreSQL |
| npm.cmd run test:database:guards | PASS, five local-targeting/failure checks |
| npm.cmd run test:unit | PASS, 315 cases across 21 files |
| npm.cmd run test:e2e -- --workers=2 | PASS, 28 existing Chromium regressions, including automated accessibility journeys |
| npm.cmd run format:check | PASS, existing configured JS/TS/JSON/YAML scope |
| npm.cmd run lint | PASS, zero warnings |
| npm.cmd run typecheck | PASS, strict application and generated schema types |
| npm.cmd run build | PASS, production Next.js compilation/types/121 generated pages |
| npm.cmd run docs:check | PASS, 13 required documents and 226 local file links; structural checks only |
| git diff --check and git diff --cached --check | PASS, command-scoped safe.directory; existing LF/CRLF notices only |

Limited credential comparison checked 226 tracked/unignored repository text files
against the actual local PostgreSQL password and private-key headers: zero matches.
This is not an exhaustive secret scan. Fourteen pre-existing staged entries remain;
no new staging was performed. Ordinary local sources/policies/retrievals, leftover
disposable DBs and temporary worker logins were each verified as zero. The owned
loopback PostgreSQL runtime remains available; no reset or volume deletion ran.

Ten new real SQL cases cover independent approval, retries, revocation, durable
admission, lower reviewed limits, rolling budgets, manifests and denied access.
The real Python probe creates a generated dedicated LOGIN role, grants only SET
to askbd_worker, executes policy/robots/document admission and records two manifests
with simulated HTTP, verifies raw staff-table denial, closes connections and drops
the login. All fixture records are confined to guarded disposable databases.
No production identities or real source permissions are created.

Failed attempts were corrected and rerun: an initial test decorator syntax error
and Mock context fixture were fixed; the old table-count assertion was updated.
Real SQL found a reservation local-variable binding bug. Because that migration
had already been applied locally, a forward migration fixes it and adds reviewed
lower limits and completed-manifest preservation. A fixture initially masked the
underlying SQL exception during RESET ROLE; a savepoint now preserves diagnostics.
All final relevant tests pass. These failures also demonstrate nonzero test exits.

Final timing review found that slow DNS/HTTP could consume reservation-based
spacing. The third forward migration enforces five seconds after completion as
well, and samples admission time after locking; a real SQL regression assertion
checks that completion cannot exhaust the spacing window. This makes the rate
policy more conservative without increasing concurrency or adding HTTP retries.

Python has no configured standalone linter/static type checker; Pytest imports/
executes the package and checks its behavior. ESLint/TypeScript results apply to
the existing JS/TS scope. No new unsupported claim of Python static analysis.
Remote GitHub Actions was not run; hosted CI remains unverified. No new full
MFA/HTTP integration run is claimed; existing SQL authorization and browser/unit
regressions were rerun. Browser tests are execution evidence, not manual visual QA.

## Limits and operational gates

No government website was accessed. No real agency, service, source or official
URL was approved by this task. E-passport, NID and land/land-tax remain priorities
for separately reviewed onboarding, not permission to fetch candidate portals.

No production egress firewall/pinned resolver deployment, real contact identity,
live scheduler, source-specific permission research or production credential
provisioning exists. Crawler defaults to DISABLED and there is no runtime enable
environment switch or live command. Independent infrastructure egress denial and
explicit owner authorization are required before any live composition. Unit
transport simulations do not prove a deployed firewall or live TLS reachability.

Unsupported URL encodings, IPv6, cross-host redirects, compression and complex
robots rules remain blocked. A stuck OS DNS call retains its single resolver slot
until it returns; it cannot create unbounded threads, but process restart may be
needed operationally. Per-hop lease expiration handles crash admission, without
retry/scheduler orchestration (P28). Cancellations may wait for a bounded connect/
TLS operation. No parser sandbox/storage persistence is claimed; those later
components must preserve quarantine/evidence boundaries before processing bytes.

P21 BFF link checks remain blocked. Returning a hash does not publish, renew or
validate government facts. Existing Phase 4 development-tool advisory findings
remain historical; no new npm advisory run or automatic dependency downgrade.
No commit, push, deployment, billable service or Phase 5 follow-on work occurred.

Response size describes the available retained response body, not total wire
transfer. A transport failure discards partial bytes; zero retained size does not
claim that no bytes traveled. Per-hop manifests and the returned logical manifest
are distinct; later orchestration must persist full snapshot/job lineage.

## Primary references checked 2026-10-21

[Python http.client](https://docs.python.org/3.14/library/http.client.html),
[Python ssl](https://docs.python.org/3.14/library/ssl.html),
[Python robotparser](https://docs.python.org/3.14/library/urllib.robotparser.html),
[RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html),
[OWASP SSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html),
[pg8000 DB-API/TLS/package](https://pypi.org/project/pg8000/1.31.5/).
Psycopg documentation/package metadata was also considered; no psycopg package was
installed. Primary documentation is compatibility evidence; executable results
above are separate. No source-site verification is inferred from documentation.

## Decision

P22: **PASS in the authorized local implementation/test scope**. Approved-source
admission, SSRF/redirect defenses, budgets, metadata, predictable errors and
automated tests are implemented and verified without unauthorized live crawling.
Phase 5 remains incomplete. Recommended next work package: a separately authorized,
complete **P23 — HTML extraction**, consuming these untrusted bounded results.
