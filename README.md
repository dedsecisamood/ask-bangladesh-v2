# Ask Bangladesh

Latest [pre-Phase-9 audit](docs/PRE_PHASE_9_AUDIT.md) rechecks Phases 0-8 and repairs
topic handling, bounded request reads and minimum structured correction intake.
Its clean local aggregate passes (724 unit, 156 SQL, 171 Python and 43 browser
tests plus Auth/parser/model checks); confirmed local issues are repaired.
Default demos remain honest; public generation and production feedback collection
stay closed. Local engineering and real-source/human/provider acceptance are
separate; formal Phases 6-8 remain PARTIAL. Phase 9 has not started.

Phase 8 local engineering through P45 is complete and the full local gate passes.
Formal Phase 8 remains PARTIAL on corpus, independent review and live-provider
evaluation. See the
[Phase 8 report](docs/PHASE_8_REPORT.md) and [review procedure](docs/P45_HUMAN_REVIEW.md).
`npm run test:phase8` runs multilingual engineering scenarios; `npm run phase8:review`
exports blank independent review materials. No real corpus/human/provider gate is
waived. Stop before Phase 9; formal acceptance remains pending.

Phase 8 P42 localization/rendering passes technical/local verification independently
of Phase 7's formal acceptance gates; see [P42_REPORT](docs/P42_REPORT.md) for that baseline. Live
generation stays disabled and Phase 7 remains formally PARTIAL.

**Phase 7 baseline: local software is implemented through P41; formal Phase 7
remains PARTIAL on live-provider and independent evidence/support review gates.**
See [PHASE_7_REPORT](docs/PHASE_7_REPORT.md). No live AI or public guidance is enabled.
The approved Gemini/Vertex SDK adapter is documented in
[VERTEX_AI](docs/VERTEX_AI.md); it remains disabled and uses mocks for tests.
The remaining Phase 7 claim-review adapter now reuses reviewed private records
through a restricted SQL projection. `npm run phase7:review` exports the synthetic
review package without overwriting annotations; formal
[independent human review](docs/P41_HUMAN_REVIEW.md) is still required.
`npm run test:phase7` runs deterministic mocks; `npm run test:phase7:ui` runs the
API interface after building; `npm run validate:phase7` runs the full local gate.
Default frontend stays demo. Optional server-only CHAT_MODE=api selects the
same-origin API interface with honest unavailable responses, without activating
providers, billing or source approvals. P42-P45 local work is now authorized;
formal Phase 8 acceptance remains gated.

P35 adds the validated `POST /api/v1/answers` foundation. Development accepts
bounded questions and responds honestly with unavailable; production is closed
pending admission/evidence/generation gates. The public chat UI remains a labeled
demo. See [P35_REPORT](docs/P35_REPORT.md). No live AI or history storage enabled.

An independent, Bangla-first government-service information platform for Bangladesh.
The proposed product helps citizens ask in Bangla, Banglish or English and receive
clear guidance tied to verified official evidence. It is not a government website
and does not imply government endorsement.

**Current state: Phase 6 retrieval implementation and local checks PASS; the formal
phase remains PARTIAL pending official-corpus/human relevance evaluation. See
[PHASE_6_REPORT](docs/PHASE_6_REPORT.md).**
P30-P34 add offline multilingual model evaluation, pgvector search, RRF, reranking,
conservative reviewed-alias routing and reproducible benchmarks. No live AI answers
or real government corpus are enabled. The screenshot-led frontend refresh and
light/dark themes are browser-verified; see
[FRONTEND_REFRESH_REPORT](docs/FRONTEND_REFRESH_REPORT.md).

Optional local Phase 6 commands (models are a separate free public-artifact download):

```text
npm run embedding:download
npm run embedding:verify
npm run db:start
npm run db:migrate
npm run test:retrieval
npm run test:retrieval:models
npm run validate:phase6
```

Use `npm.cmd` if PowerShell blocks `npm.ps1`. Prepare the existing Python/Docker
prerequisites before the complete validation command. Normal page rendering needs
neither model files nor database secrets. See [EMBEDDINGS](docs/EMBEDDINGS.md) for
CPU/runtime limits, pinned models, safe batches and production restrictions.

**Historical P29 checkpoint:**
P29 adds an internal indexed evidence-passage repository with approval filtering,
Unicode-safe literal keyword matching and exact provenance. It adds no public
chatbot endpoint or model. See [P29_REPORT](docs/P29_REPORT.md). Its earlier stop
before P30 was superseded by the owner's explicit request to finish Phase 6.
The isolated worker now supports bounded HTML/PDF extraction, conditional local
Bangla OCR, private immutable snapshots/passages, durable jobs and freshness
observations. Live crawling and scheduling remain disabled. See the
[Phase 5 report](docs/PHASE_5_REPORT.md) for actual verification and remaining gates,
and the [worker setup](workers/ingestion/README.md). The public frontend is preserved.
The owner explicitly excluded real source onboarding. No real government records
or live link checks are claimed. See [PHASE_4_REPORT](docs/PHASE_4_REPORT.md).
The bilingual homepage, local chat demonstration, searchable preparation topics,
category/detail/guide templates and trust/information pages are implemented.
The default frontend remains a clearly labeled demo; explicit published mode
connects public directory routes to reviewed database projections. Protected
source/directory management and private link-review history are implemented.
Live AI, verified government-source records, live ingestion, real
feedback processing and deployment are not connected. No government procedures, fees,
deadlines or candidate source URLs are invented.
Actual results belong in [PHASE_2_REPORT](docs/PHASE_2_REPORT.md) and
[CODEX_PROGRESS](docs/CODEX_PROGRESS.md), with historical
[P08_REPORT](docs/P08_REPORT.md) and [PHASE_1_REPORT](docs/PHASE_1_REPORT.md).
The protected source-registry workflow now supports private candidates, independent
evidenced approval/activation, rejection/suspension, safe retries and immutable
audit history. It fetches no submitted URL. See [P18_REPORT](docs/P18_REPORT.md).
Phase 4 historical checks passed: 315 unit/component cases, 60 database cases, 28 real
Auth/HTTP checks, five local guards, 28 Chromium cases and nine Python cases,
plus strict types, lint, formatting and production build. Automated axe scans
passed; full accessibility conformance, human translation/device review and remote
GitHub CI remain unverified. Historical owner-authorized npm audits confirm five high
development-chain findings and zero production findings. Tooling remediation
remains open; no automatic downgrade or dependency change was applied.

**P14 and P15 passed locally:** PostgreSQL 17.11/pgvector 0.8.2, 24 private tables,
generated schema types and 28 passing real core/evidence tests. Local database
startup binds only to 127.0.0.1:54322. The public frontend remains DB-independent.
The frontend still needs no database credentials. See [P14_REPORT](docs/P14_REPORT.md)
and [P15_REPORT](docs/P15_REPORT.md), plus [local database setup](database/README.md).
P16/P17 now add local Supabase staff MFA, protected administration foundations,
reviewed metadata projections and read-only APIs. Current verification belongs in
[PHASE_3_REPORT](docs/PHASE_3_REPORT.md). P18's workflow is implemented; no real
source has been onboarded or approved. P19-P21 complete the approved local Phase 4
implementation/test scope. The owner authorized completing P22–P28; stop before P29.

## Required software and dependency boundaries

Use **Node.js 24.22.0 LTS**, **npm 11.19.1** and **Python 3.14.4** for the current
local foundation toolchain. Python is needed for the isolated Pytest suite and
documentation checks; the web page itself does not require Python. The application
uses strict TypeScript **6.0.3**. Exact JavaScript dependencies are recorded in the
single root `package-lock.json`; Python test dependencies are pinned separately in
`workers/ingestion/requirements-dev.txt`.

The repository records Node in `.node-version` and npm in the root `package.json`.
Use npm workspaces and install from the repository root. Do not add a nested npm
lockfile or another package manager. No database, cloud account, government-system
access or paid API is needed. A fresh setup needs access to public package
registries and Playwright's Chromium download; the tests use local or synthetic
inputs and do not call government portals or paid models.

On Windows, if PowerShell blocks `npm.ps1`, use `npm.cmd` for every npm command,
for example `npm.cmd ci`. This does not require changing execution policy or
installing packages globally.

## Local setup

Run commands from the repository root:

```text
npm ci
python -m venv .venv
```

On a standard Windows Python installation, install the Python test dependencies:

```powershell
.venv\Scripts\python.exe -m pip install --cache-dir .cache/pip --requirement workers/ingestion/requirements-dev.txt
```

On Linux or macOS, use `.venv/bin/python` instead. This development machine uses
MSYS2 Python, which creates `.venv/bin/python.exe` on Windows. Use that executable
instead of `.venv\Scripts\python.exe` when applicable. No virtual-environment
activation or global Python package installation is needed. The root `test:python`
script locates the configured project environment and fails if it is missing.

Install the Chromium test browser once:

```text
npm run test:e2e:install
```

Linux CI additionally installs Chromium's operating-system dependencies. Follow
the configured CI command for that environment; local application tests do not
require production credentials.

## Environment configuration

The foundation page needs no environment file or secret. For optional local
configuration, copy `apps/web/.env.example` to `apps/web/.env.local` and edit only
supported settings. Next.js reads environment files from the web application
directory. Real environment files, local logs and generated artifacts are ignored
by Git; the example remains trackable.

`APP_ORIGIN` is optional server-only configuration for Next.js `metadataBase`.
Use an HTTPS origin; HTTP is allowed only for the exact loopback hosts accepted
by the validator during local development. For example,
`http://127.0.0.1:3000` is a local origin. Do not include credentials, a non-root
path, query parameters or a fragment. Invalid configuration produces a sanitized
configuration error. Static page metadata is evaluated during the build, so
rebuild after changing this setting.

No public environment variable, AI credential or database URL is required by the
frontend demo. Optional P16/P17 server settings are documented in the example;
staff sign-in requires APP_ORIGIN, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and
ADMIN_DATABASE_URL (dedicated askbd_staff). Public APIs require DATABASE_URL
(askbd_web); issuing pagination cursors requires CURSOR_SIGNING_KEY (32–64 random
bytes as lowercase hex). Never supply a postgres/service-role credential.
Application configuration must not be imported through browser-shared
modules. `NEXT_TELEMETRY_DISABLED=1` may be set for Next.js tooling; it is not an
application feature flag.

## Development and verification commands

Start the local development server:

```text
npm run dev
```

Open `http://127.0.0.1:3000`; it redirects to `/bn`. `/en` provides the English
interface. The complete demo homepage/public experiences are implemented. Run `dev`
and `start` separately; both default to port 3000.

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the exact npm dependency graph from the root lockfile |
| `npm run dev` | Start the web workspace development server on loopback port 3000 |
| `npm run lint` | Run ESLint directly with Next.js and TypeScript rules |
| `npm run format:check` | Check formatting of the scoped source and configuration files |
| `npm run format` | Apply formatting within that same scope |
| `npm run typecheck` | Generate route types and run strict TypeScript validation |
| `npm run typecheck:database` | Strictly check generated database schema types |
| `npm run test:unit` | Run Vitest unit and React component tests once |
| `npm run test:unit:watch` | Watch unit and component tests during development |
| `npm run test:coverage` | Run the unit/component suite with coverage reporting |
| `npm run test:e2e:install` | Install the pinned Playwright Chromium browser |
| `npm run test:e2e` | Run frontend Chromium regression and axe accessibility tests against an existing production build |
| `npm run test:python` | Run the isolated offline Pytest suite |
| `npm run test:database:guards` | Run local target/connection-failure guards without Docker |
| `npm run db:start` / `db:stop` / `db:status` | Manage only the inspected local Supabase PostgreSQL project; requires Docker |
| `npm run db:migrate` | Apply versioned SQL to the inspected local container through Supabase CLI; requires Docker |
| `npm run test:database` | Run real database/job/provenance/permission and offline Python pipeline tests in disposable databases; build the parser first |
| `npm run test:retrieval` | Run focused P29 disposable SQL and shared contract tests; apply local migrations first |
| `npm run parser:build` | Build the local PDF/Bangla OCR sandbox image; requires Docker and build-time package access |
| `npm run test:parser` | Run native synthetic extraction/OCR and networkless sandbox checks |
| `npm run validate:phase5` | Full fail-fast quality/database/auth/parser gate; requires the local DB, parser image, Python and Chromium |
| `npm run db:types` | Generate and format schema types from the inspected local database |
| `npm run validate:p14` | Run existing quality checks, local guards and required real DB tests; requires a running local Docker engine |
| `npm run validate:p15` | Run the same complete gate with the current P15 evidence suite |
| `npm run build` | Create the web workspace production build |
| `npm run start` | Serve an existing production build on loopback port 3000 |
| `npm run validate` | Run the required aggregate foundation checks and fail on errors |
| `npm run auth:start` | Start local Auth and a foreground loopback gateway with random local credentials |
| `npm run auth:dev` | Start local Auth and the web dev server with settings injected in memory |
| `npm run auth:stop` | Stop the owned Auth container; Ctrl+C stops the foreground gateway |
| `npm run test:integration` | Real local MFA/HTTP/API checks; requires a build, Docker and free ports 3200/54325/54326 |
| `npm run validate:phase3` | Foundation checks plus real DB/identity/API tests; run `db:start` first |
| `npm run validate:p18` | Same fail-fast aggregate with the current registry suites; P18's component execution evidence is in its report |
| `npm run validate:phase4` | Same fail-fast aggregate with the expanded directory/health/browser integration; component execution evidence is in the Phase 4 report |

Formatting excludes the existing Markdown planning documents, Python files and
generated output. Linting runs independently of the production build. Next.js
regenerates ignored `next-env.d.ts` and route types during development, type
checking and builds. The web-scoped `AGENTS.md` contains framework-generated
guidance; root project rules still apply.

For an end-to-end run after application changes:

```text
npm run build
npm run test:e2e
```

Playwright manages a separate production server on `http://127.0.0.1:3100`; keep
port 3100 free. It checks both locales at six widths, complete frontend journeys,
privacy, keyboard/reflow, accessibility and constrained-network transfer.
Failure screenshots, traces and the HTML report remain local in ignored
output directories. Full browser, assistive-technology and real-device coverage
remain later review gates. See [testing instructions](tests/README.md) for test
locations, failure reports and CI differences, and the
[worker instructions](workers/ingestion/README.md) for the direct Pytest command.

The aggregate command requires installed npm dependencies, the isolated Python
environment and Chromium. It must return nonzero if a required check fails. It
does not make government-source verification or product-quality claims.

## Continuous integration

The GitHub Actions workflow is configured for pull requests and pushes to `main`.
It uses official actions pinned by commit, read-only repository permissions, a
lockfile installation, formatting, linting, strict type checking, unit tests,
the production build, Chromium smoke tests and Python checks. It does not deploy
or require production secrets. Local execution and workflow syntax validation
are separate from GitHub-hosted execution: **remote CI remains unverified** until
an actual workflow run is recorded in the progress checkpoint.

## Repository structure

```text
apps/web/                  Next.js App Router application and BFF
  src/app/                 Localized bn/en public routes, guide redirect, robots/sitemap
  src/components/          Shared primitives, navigation, service/source cards and footer
  src/features/            Homepage, transient chat, directory and information interfaces
  src/lib/                 Small application utilities and configuration boundaries
  src/styles/              Design tokens and licensed local Bangla/Latin fonts
  public/                  Public static assets only
workers/ingestion/         Isolated Python testing foundation; no ingestion runtime
packages/shared/           Reserved shared-contract boundary; no package yet
database/supabase/         Local CLI config and the sole versioned SQL migration tree
database/migrations/       Pointer to the canonical Supabase migration tree
database/seeds/            Disposable-test-only synthetic fixtures, never auto-seeded
database/tests/            Real PostgreSQL migration and integrity tests
tests/                     Frontend browser/axe regression tests and testing instructions
scripts/                   Offline validation and development command helpers
.github/workflows/         Foundation checks; no deployment automation
infrastructure/            Reserved infrastructure documentation/configuration
docs/                      Product, architecture, policies and progress
```

The root workspace recognizes `apps/*` and `packages/*`; the only current npm
workspace package is `@ask-bangladesh/web`. Shared modules, components and features
are introduced when real code needs them. The Python worker is separate from the
web runtime and is not an npm workspace. Database boundary READMEs do not imply
that migrations or reviewed seed data exist.

## Foundation constraints

The complete homepage uses the P08 shell. `/` selects `/bn`; `/en` provides English.
Questions navigate to the local chat demonstration through React memory; question
text is never placed in the navigation URL. Refresh or language switching loses
the session. Clear conversation also clears the unsent composer draft. Language
links preserve known resources and discard queries/fragments; no language cookie,
localStorage or sessionStorage is used. Unknown paths/locales/IDs return 404.
The sixteen categories and eight preparation topics are editorial discovery
content, not verified government-service records. Agencies/sources are empty
until reviewed records exist. Privacy and Terms are review-required drafts.
Feedback validates locally and explicitly says it was not submitted; Status
describes implementation without live monitoring or invented uptime.
Noto Sans Bengali and Inter are self-hosted through Next's local font loader with
system fallbacks; see [font licenses and payloads](docs/FONTS.md). The public demo
does not fetch remote fonts or government data at runtime. Optional staff access
contacts only the configured Auth provider and restricted application database.
Live AI is unavailable and no government-service guidance is presented.
The test foundation verifies implemented development behavior, not future RAG,
OCR, source freshness or factual accuracy.

Tailwind CSS 4 sets the provisional foundation browser floor: Chrome/Edge 111,
Safari 16.4 and Firefox 128. This is a styling compatibility baseline, not a claim
that all those browsers or low-cost devices have been tested. Human review of
the actual public device population, Bangla shaping, assistive technology and
suitable fallbacks remains necessary before a public release. PDF/OCR dependency
licensing, future native-library compatibility and production hosting remain open.

## Read and review

| File | Purpose |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Instructions, authorization boundary and engineering trust rules |
| [PLANS.md](PLANS.md) | Current scoped plan, actual validation and unresolved decisions |
| [CODEX_PROGRESS](docs/CODEX_PROGRESS.md) | Actual work-package status, commands and verification limitations |
| [PHASE_2_REPORT](docs/PHASE_2_REPORT.md) | Complete frontend routes, verified behavior, measurements and remaining limits |
| [PRD](docs/PRD.md) | Mission, personas, complete sitemap, all thirty capabilities and acceptance |
| [ARCHITECTURE](docs/ARCHITECTURE.md) | Components, decisions, stack evidence, API contracts and extension seams |
| [DATABASE](docs/DATABASE.md) | Entities, lineage, publication transactions, roles, retention and indexes |
| [DESIGN_SYSTEM](docs/DESIGN_SYSTEM.md) | Bangla-first responsive interface, trust states, accessibility and performance |
| [SOURCE_POLICY](docs/SOURCE_POLICY.md) | Official verification, exact citations, freshness, conflicts and withdrawal |
| [SECURITY](docs/SECURITY.md) | Threat model, access boundaries, privacy, retention and incident response |
| [AI_SYSTEM](docs/AI_SYSTEM.md) | Multilingual hybrid retrieval, grounded generation and citation validation |
| [EVALUATION](docs/EVALUATION.md) | Test strategy, proposed release gates, datasets and measurement definitions |
| [DEPLOYMENT](docs/DEPLOYMENT.md) | Proposed environments, costs, provisioning gates, backup and rollback |
| [ROADMAP](docs/ROADMAP.md) | Phase 0 through 12 and future phases, deliverables and explicit stop gates |

## Proposed architecture

Start with one Next.js/TypeScript web application and server API, PostgreSQL with
pgvector for evidence and hybrid search, private snapshot storage, and a separate
Python ingestion worker. Supabase is optional. Generation and embedding providers
are separately configurable and unselected. This limits operating complexity while
preserving evidence lineage and room to scale.

Official technical documentation was checked on 2026-10-18; references and caveats
are recorded beside decisions in the documents. Documentation compatibility is not
a successful integration test. Material open choices include older-device browser
coverage, PDF extraction licensing, database/extension availability, model quality,
hosting region, processor privacy terms, launch coverage, staffing and budgets.

Basic informational questions require no account. Every material actionable claim
must have current, applicable official passage evidence. Stale, conflicting or
unsupported details are withheld; the product must explain uncertainty clearly.
Retrieved documents and model output never acquire instruction authority.

## Validate the planning package

With Python 3.10+ already installed, the original dependency-free validator can be
run separately from the application tooling:

```text
python scripts/validate_docs.py
```

On Windows, `py -3 scripts/validate_docs.py` is equivalent when the Python launcher
is available. No package installation, network call, model call or paid service is
required. The validator checks required files, UTF-8, local Markdown file links,
heading presence, capability IDs and phase coverage. It does not verify external
URLs, service facts, semantic completeness, accessibility, security or a running app.

## Phase boundary

Phase 1 P04-P07 and Phase 2 P08-P13 are complete locally. Stop after P13.
The full P14 prompt is now available and its authored foundation is PARTIAL.
P14/P15 are locally complete. Next: P16 administrator authentication, separately authorized.
Do not commit, push, deploy, provision services or enable paid operations as part
of this foundation. Outstanding audit findings remain gates before their affected
data, evidence or public-answer features; Phase 0 approval does not mark them
fixed. See [the Phase 1 gate](docs/ROADMAP.md).
