# Cross-application test boundary

## Phase 7 verification

`npm run test:phase7` runs provider/configuration, RAG/citation/safety, client
adapter and conversation rendering regressions with synthetic test evidence.
`npm run test:phase7:ui` uses the existing production build on a separate loopback
port with CHAT_MODE=api. It tests the real closed API and explicitly mocked valid
answer display, including Bangla, keyboard, mobile and axe checks.

`npm run validate:phase7` runs the complete Phase 6 local aggregate followed by
the API-mode browser checks. It needs the existing local Docker/Python/model-cache
prerequisites; it does not download models or call paid providers. Use npm.cmd on
Windows where PowerShell blocks npm.ps1. Test failure propagates a nonzero exit.
CI's existing unit discovery includes the new cases and the web job also runs the
API-mode suite. Hosted execution is unverified. Synthetic review/timing artifacts
are regenerated under `.cache/phase7`; they are not production quality evidence.

This directory contains end-to-end tests of the local application. Unit and React
component tests live beside their TypeScript source under `apps/web/src`;
Python tests belong to the isolated [ingestion worker](../workers/ingestion/README.md).
Use synthetic fixtures independent of government portals, paid AI APIs and real
citizen information. Product-level evaluation requirements remain in
[EVALUATION](../docs/EVALUATION.md).

## Unit and component tests

Run these commands from the repository root:

```sh
npm run test:unit
npm run test:unit:watch
npm run test:coverage
```

Vitest executes `*.test.ts` and `*.test.tsx` files. Use the configured browser-like
environment for React components and test cleanup between cases. Prefer accessible
roles and visible user behavior to implementation details. Configuration and pure
utility tests should use synthetic inputs and avoid live network requests.
Vitest uses at most two workers to keep local/CI memory use predictable.
Coverage currently measures the environment parser, locale routing, demo contract,
header navigation, footer and public shell, with 90% minimum statements,
branches, functions and lines. Extend that explicit
scope when new modules are implemented; it is not whole-platform coverage.

## Database and publication checks

`npm run test:database:guards` runs five local-only targeting/connection-failure
tests without a database. Vitest also tests pool configuration and transaction
failure paths with mocks; those are not migration/RLS evidence.
`npm run test:database` requires the real local Supabase PostgreSQL stack and
replays all fifteen canonical migrations in unique disposable databases. The 60
cases include twelve core checks, sixteen P15 provenance, history,
locator/hash/storage, review/freshness, claims/conflicts, dimension and grant/RLS
checks, five staff/session authorization checks, seven reviewed metadata tests
and ten P18 registry/lifecycle/evidence/audit/retry/risk-policy checks, plus ten
P19-P21 management/search/relation/role/link-health/integrity cases.
Evidence cases live in `database/tests/evidence.cases.mjs`, registered by
the shared core harness; no duplicate migration runner or fixture database exists.
It exits nonzero when Docker is unavailable; it does not skip or simulate those
checks. See [database workflow](../database/README.md) and
[P14 report](../docs/P14_REPORT.md) and [P15 report](../docs/P15_REPORT.md).
`npm run db:types` regenerates/formats schema types; `npm run typecheck:database`
strictly checks them. CI's database job runs real migrations/tests and generated
type validation; remote execution remains unverified. New test failures are
nonzero, including missing Docker, and are never silently skipped.

## Real Auth, HTTP and published-directory integration

After `npm run db:start`, `npm run test:e2e:install` and `npm run build`, run
`npm run test:integration`.
It starts only the owned, digest-pinned loopback Supabase Auth runtime, creates
a guarded disposable application database, replays the canonical SQL, starts an
isolated production server on port 3200 and creates a synthetic `.invalid` staff
identity. It tests real password/TOTP/cookies/logout, private staff access and
published API filters/pagination/revocation. No government URL is contacted.
APIRequestContexts are isolated; the test app, provider identity and disposable
app database are cleaned up. The owned local Auth container remains running;
`npm run auth:stop` stops it without deleting persistent provider data.
Free ports: 3200, 54325 and 54326. Do not run auth:dev/auth:start concurrently
with this suite: the gateway port is intentionally exclusive. Real provider
behavior is distinguished from Vitest HTTP mocks and SQL-only role tests.
P18 extends the same runner with two additional real MFA reviewers and four
grouped registry checks (23 grouped checks total). It exercises independent
activation, safe retry/duplicate handling, forbidden trust fields, document-gated
public visibility, edits, suspension and rejection. Synthetic proof is labeled;
only guarded disposable fixtures create eligible document evidence. URL/contracts
and HTTP mocks add 36 Vitest cases; these do not replace real database/provider
checks. `npm run validate:p18` runs the fail-fast existing foundation/Phase 3
aggregate with the expanded suites. Its component commands are also documented
and may be executed individually when diagnosing resource limits.

P19-P21 adds five grouped checks for real independent identity publication,
multilingual keyword/alias search and cursor binding, actual mobile Chromium
bn/en published journeys/axe scans, disabled link-check requests and metadata
withdrawal. The same production server runs DIRECTORY_MODE=published, using only
guarded disposable fixtures. Browser requests are restricted to the local app;
no official link is followed externally. Missing/draft source behavior and SQL
permission failures are actual integration checks, not fake empty results.
The script selects the pinned browser in .cache/ms-playwright and closes it on
success/failure. CI's DB job installs that browser and its system dependencies.
`npm run validate:phase4` runs the expanded existing fail-fast aggregate. Results
of component commands versus aggregate execution are distinguished in
[PHASE_4_REPORT](../docs/PHASE_4_REPORT.md).

Offline link observations live in lib/registry/link-health tests; they do not
claim real DNS, connected-peer, TLS or source accessibility verification. The
actual link-check request API records blocked status and no checked timestamp.

CI's database job already builds and runs this suite and stops Auth/PostgreSQL even on
failure. Remote CI remains unverified until a hosted run exists.

## End-to-end tests (frontend)

Install dependencies and Chromium once, then build and run:

```sh
npm ci
npm run test:e2e:install
npm run build
npm run test:e2e
```

On PowerShell installations that block npm's `.ps1` shim, use `npm.cmd` and
`npx.cmd` where applicable. The browser wrapper stores binaries in the ignored
`.cache/ms-playwright` directory. Linux CI installs Chromium's operating-system
dependencies with `npm run test:e2e:install -- --with-deps`.

Playwright starts the production application at `http://127.0.0.1:3100` and stops
the server when the run finishes. Port 3100 must be free; the runner deliberately
refuses to reuse an existing server. Rebuild after application changes. No database,
government source or model credential is needed.

The 28-case Chromium frontend/shell suite checks bn/en at 320, 375, 390, 768, 1024 and 1440 CSS
pixels. It checks root redirect, server document language, disclosures, skip-link
focus, keyboard language switching, mobile dialog focus trapping/return/navigation,
complete public routes, unknown/absent-record 404s, reduced motion and local-only
asset/font requests. It also tests ephemeral home/chat handoff and refresh/clear,
directory filters, draft policies, honest feedback, no-JavaScript browsing,
200% text/narrow reflow and 22 default axe scans without rule suppression.
The constrained-network case records cold encoded transfer in
`.cache/phase2-review/performance.json`; this is a lab sample, not field metrics.
For local visual-review screenshots, set process-local `P08_SCREENSHOTS=1` before
running the suite; PNGs go to ignored `.cache/p08-review`. Set process-local
`PHASE2_SCREENSHOTS=1` for current homepage/chat/directory/guide/form PNGs in
`.cache/phase2-review`. On PowerShell use `$env:PHASE2_SCREENSHOTS='1'` before
`npm.cmd run test:e2e -- --workers=2`. Additional Firefox
and WebKit projects can be introduced when their browser coverage is authorized.
These smoke checks are not a full accessibility, font-shaping or device audit.

Failures return a nonzero exit status. Terminal output identifies the failed test;
`playwright-report/` contains an HTML report. Screenshots and traces are retained
under `test-results/` on failure. These generated files are excluded from Git.
Inspect traces locally and use synthetic data, because failure artifacts can
capture displayed content.

## Python and CI

See the [worker instructions](../workers/ingestion/README.md) for the isolated
Python environment, pinned test dependencies and executable Pytest command.
The root `test:python` wrapper allocates an ignored `.cache/pytest-run-*` directory
for each run, keeping cache and fixture permissions isolated between execution
users. These synthetic test artifacts may be removed when no test run is active.
Crawler and extraction behavior is outside the Phase 1 foundation.

CI runs formatting, linting, TypeScript validation, unit tests, the production
build, the Chromium smoke projects and Python tests. It installs dependencies from
the lockfile and does not require production credentials. A local passing run does
not establish that the GitHub-hosted workflow has executed; actual run evidence is
recorded in the [progress checkpoint](../docs/CODEX_PROGRESS.md).

## Guidance checked

P29's focused SQL command is `npm run test:retrieval`, after local `db:migrate`.
It reuses the guarded disposable core harness, includes the real GIN plan probe
and parses real projections with the shared retrieval contract. The full
`test:database` command includes these cases and all earlier SQL/ingestion tests.
Unit/malformed-result/failure tests live under apps/web/src/lib/retrieval.
No source portal/model/network is involved in lexical matching. Node 24 may emit
a module-type detection notice when the SQL harness imports the shared .ts
contract directly; tests still fail on assertions/errors and no warning is hidden.

Phase 5 additionally requires `npm run parser:build` before `npm run test:parser`
and `npm run test:database`. Docker builds the native PDF/Bangla OCR dependencies;
runtime containers have no network, host mounts or credentials. The native self-test
checks actual synthetic HTML/PDF/Bangla OCR, locators and container restrictions.
The SQL suite replays every canonical migration in disposable local databases,
tests fenced jobs/retries/holds/review/freshness/grants and uses a temporary
least-privilege Python login for HTML/native PDF/scanned Bangla end-to-end processing.
All source HTTP is simulated; no government portal or paid API is a test dependency.

Run `npm run test:python` for offline extraction/normalization/storage/network unit
cases; `npm run test:integration` preserves real local MFA/API/published-directory
regressions. `npm run validate:phase5` composes the full existing quality/DB/Auth
gate plus parser checks after the documented prerequisites. Failures return nonzero;
do not disable deadlines or constraints to mask suspension-related interrupted runs.
CI's database job builds/tests the parser and installs worker requirements; no
hosted execution is implied by local success. The [Phase 5 report](../docs/PHASE_5_REPORT.md)
records actual commands, counts, interruptions and remaining real-corpus gates.

Checked on 2026-10-18: the installed Next.js 16.4.2 Playwright guide under
`node_modules/next/dist/docs/01-app/02-guides/testing/playwright.md`, the official
[Next.js Playwright guide](https://nextjs.org/docs/app/guides/testing/playwright),
and Playwright's [configuration](https://playwright.dev/docs/test-configuration)
and [web-server](https://playwright.dev/docs/test-webserver) references. The runner
uses the recommended production-build boundary and local managed server.


## Phase 6 retrieval checks

`npm run test:retrieval` executes the guarded local keyword/semantic/policy SQL
regressions. `npm run embedding:download` prepares two pinned public model artifact
sets; `npm run embedding:verify` checks them offline. With local Docker/PostgreSQL
ready, `npm run test:retrieval:models` runs real CPU inference, vector persistence,
separate ranking/routing comparisons and 100 complete warm internal calls per
candidate. It fails on missing prerequisites; no skipped-success mode exists.
Artifacts are under `.cache/phase6`. See [EMBEDDINGS](../docs/EMBEDDINGS.md) and
[PHASE_6_REPORT](../docs/PHASE_6_REPORT.md) for commands, exact results and limits.
Normal CI includes deterministic and SQL regressions; the model benchmark is
manual opt-in. Synthetic engineering labels never satisfy human/official-corpus
quality gates. No test contacts government websites or paid inference providers.
