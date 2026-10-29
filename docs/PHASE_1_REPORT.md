# Phase 1 foundation verification report

Report date: 2026-10-18 (Asia/Dhaka).
Status: **PASS for the local Phase 1 foundation, P04-P07.**

This report records the local development foundation, not production readiness of
the planned government-service platform. The owner approved Phase 0 and authorized
completion of P05 through P07 after the P04 foundation. Local verification is
complete. The [progress checkpoint](CODEX_PROGRESS.md) records detailed
history; the [root README](../README.md), [testing instructions](../tests/README.md)
and [Python instructions](../workers/ingestion/README.md) describe setup.

## Work-package status

| Work package | Current decision | Evidence / limits |
| --- | --- | --- |
| P04: monorepo and application | PASS for the local foundation | P06 now supplies automated browser evidence; no full device/accessibility audit |
| P05: development standards and CI | PASS | Local quality checks and workflow syntax/review passed; GitHub-hosted execution unverified |
| P06: automated testing | PASS | 41 unit/component, two Chromium and nine Python tests passed after clean install |
| P07: environment and Phase 1 verification | PASS | Environment tests, negative build, clean install, aggregate, development smoke and local scope/security review passed |

These decisions cover the development foundation. They do not approve production
release or resolve the later product gates. Stop before P08 and Phase 2.

## Implementation summary

The repository contains one Next.js App Router application under `apps/web`,
strict TypeScript, Tailwind/PostCSS and npm workspaces with one root lockfile.
Its minimal Bangla page identifies Ask Bangladesh as independent and under
development. It does not present government-service procedures or imply that the
assistant is operational. System fonts avoid external font requests.

ESLint runs directly through the root script with Next.js/TypeScript rules and
unused-variable/explicit-any checks. Prettier checks a scoped set of source and
configuration files; existing planning Markdown is excluded from automatic
formatting. Linting and type checking are independent of the production build.

Vitest, React Testing Library and jsdom provide component testing. Playwright is
configured to manage a local production server on loopback port 3100 and run
Chromium at desktop and narrow mobile viewports, with failure screenshots and
traces. The Python boundary has an isolated virtual environment, pinned Pytest
tooling and synthetic tests for the existing documentation validator. No empty
worker runtime package or ingestion behavior was invented to produce a test.

Node wrappers locate the repository-local Python executable and Playwright
installation, preserve subprocess exit statuses and keep browser/cache output
inside the workspace. The aggregate command is configured to run dependency,
formatting, lint, type, coverage, Python, documentation, build and browser checks.
Its complete clean-install rerun passed with exit zero.

Optional `APP_ORIGIN` configuration is implemented through a pure Zod parser and
a server-only adapter. The layout sets `metadataBase` only when a valid origin is
provided. A commented example requires no credentials or environment file to
render the initial page; no browser-public configuration was introduced.

## Files created and modified

P05-P07 created:

- `.github/workflows/ci.yml`, `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`
- `vitest.config.ts`, `playwright.config.ts`, `scripts/playwright.mjs`, `scripts/python.mjs`
- `apps/web/src/test-setup.ts`, `apps/web/src/app/page.test.tsx`, `tests/e2e/foundation.spec.ts`
- `workers/ingestion/pyproject.toml`, `workers/ingestion/requirements-dev.txt`,
  `workers/ingestion/tests/test_document_validation.py`
- `apps/web/.env.example`, `apps/web/src/lib/env/schema.ts`,
  `apps/web/src/lib/env/schema.test.ts`, `apps/web/src/lib/env/server.ts`
- `docs/PHASE_1_REPORT.md`

Modified the existing root/workspace package manifests and root lockfile; root
AGENTS, PLANS and README; app layout; minimal Prettier formatting in the existing
page/CSS; tests and worker READMEs; CODEX_PROGRESS and narrow specification status
headers. Specification requirements and the documentation validator were preserved.
The P04-created foundation files and reserved directories remain; their original
inventory is in CODEX_PROGRESS. Owner-provided `masterprompt.txt` was preserved.

## Selected toolchain and packages

Installed local runtimes: Node.js **24.22.0**, npm **11.19.1**, Python **3.14.4**.
The isolated Python environment bootstrapped pip **26.0.1**. MSYS2 Python on this
Windows machine uses `.venv/bin/python.exe`; standard Windows Python uses
`.venv/Scripts/python.exe`, while POSIX environments use `.venv/bin/python`.

The following exact direct pins were read from the package manifests at this
checkpoint, including the installed P07 validation dependencies. The root lockfile
owns the complete npm graph; the final clean installation passed.

| Package | Version | Purpose |
| --- | --- | --- |
| next | 16.4.2 | App Router application and local server |
| react, react-dom | 19.3.1 each | Rendering |
| zod | 4.6.7 | Explicit-input environment validation |
| server-only | 0.0.1 | Prevent client imports of the environment adapter |
| typescript | 6.0.3 | Strict compiler checks compatible with lint tooling |
| tailwindcss, @tailwindcss/postcss | 4.3.3 each | Foundation CSS compilation |
| postcss | 8.5.30 | CSS processing |
| @types/node | 24.19.2 | Node runtime types |
| @types/react, @types/react-dom | 19.3.0 each | React types |
| eslint | 10.13.0 | Direct lint execution |
| eslint-config-next | 16.4.2 | Next.js and TypeScript lint rules |
| eslint-config-prettier | 10.1.8 | Disable conflicting formatting rules |
| prettier | 3.9.10 | Scoped formatting |
| vitest, @vitest/coverage-v8 | 5.0.5 each | Unit/component execution and coverage |
| @vitejs/plugin-react | 6.1.2 | React test transformation |
| jsdom | 30.1.3 | Browser-like component test environment |
| @testing-library/react | 16.3.3 | Component queries and interaction support |
| @testing-library/dom | 10.4.2 | DOM testing peer dependency |
| @testing-library/jest-dom | 7.0.1 | Readable DOM assertions |
| @playwright/test | 1.64.1 | Local Chromium smoke automation |
| pytest | 9.1.1 | Isolated Python test runner |
| colorama | 0.4.6, Windows only | Pytest terminal dependency |
| iniconfig | 2.3.1 | Pytest configuration dependency |
| packaging | 26.3 | Pytest version handling dependency |
| pluggy | 1.7.0 | Pytest plugin dependency |
| Pygments | 2.21.0 | Pytest diagnostic formatting dependency |

P04 initially selected TypeScript 7.0.2. P05 corrected this to 6.0.3 because
typescript-eslint needs the JavaScript compiler API unavailable in the selected
TypeScript 7 package. Strict compiler settings were preserved; the recorded P04
package table is historical rather than the current dependency authority.
See the [typescript-eslint supported range](https://typescript-eslint.io/users/dependency-versions/)
and [Microsoft's TypeScript 7 transition guidance](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).

Three dependency overrides are narrowly nested under `eslint-config-next@16.4.2`
and exact versions of its import, React and JSX accessibility plugins. They align
those plugins' peer declarations with ESLint 10.13.0 using Next 16.4.2's supplied
compatibility wrappers. Actual linting and dependency checks passed after this
change. No `legacy-peer-deps`, force installation, edited `node_modules` or disabled
compiler rule was used. Recheck this compatibility decision on future upgrades.
References checked 2026-10-18: [Next ESLint configuration](https://nextjs.org/docs/app/api-reference/config/eslint),
[Next's ESLint 10 compatibility implementation](https://github.com/vercel/next.js/blob/v16.4.2/packages/eslint-config-next/src/rule-context.ts)
and [npm dependency overrides](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#overrides).

## Verification evidence

The following are executed local results, with their limits. The final aggregate
ran against the completed configuration after a clean locked dependency install.

| Command or check | Recorded result |
| --- | --- |
| P04 `npm.cmd ci --offline` | PASS from populated cache; a fresh setup needs registry access |
| P04 `npm.cmd run dev` and production `start` HTTP checks | PASS for server startup, Bangla HTML, disclosures and compiled responsive CSS; no P04 browser inspection |
| P05 `npm.cmd run format:check` | PASS locally |
| P05 `npm.cmd run lint` | PASS locally, independent of build |
| P05 `npm.cmd run typecheck` | PASS with strict settings and TypeScript 6.0.3 |
| P05 `npm.cmd run build` | PASS locally |
| `npm.cmd run test:coverage` | PASS; 41 tests in two files: 39 environment cases and two foundation component tests |
| V8 coverage for the configured page/schema scope | 100%: statements 17/17, branches 14/14, functions 4/4 and lines 17/17; excludes server adapter, layout and future features |
| `npm.cmd run test:e2e` | PASS; two Chromium desktop/mobile smoke cases in 14.5 seconds with scoped browser/process execution permission; mobile viewport 320 pixels |
| `C:/msys64/mingw64/bin/python.exe -m venv .venv` | PASS; isolated project environment created |
| `.venv/bin/python.exe -m pip --isolated install --index-url https://pypi.org/simple --cache-dir .cache/pip --disable-pip-version-check --requirement workers/ingestion/requirements-dev.txt` | PASS after scoped registry access; initial sandbox sockets were blocked |
| `.venv/bin/python.exe -m pip --isolated install --no-index --cache-dir .cache/pip --disable-pip-version-check --requirement workers/ingestion/requirements-dev.txt` | PASS; all final Python pins satisfied without another download |
| `.venv/bin/python.exe -m pip check` | PASS; no broken Python requirements |
| `.venv/bin/python.exe -m pytest -c workers/ingestion/pyproject.toml --basetemp=.cache/pytest-tmp` | PASS; nine tests, final recorded run 1.27 seconds |
| Temporary intentional Pytest assertion failure | Expected exit status 1 observed; ignored probe removed afterward |
| `.venv/bin/python.exe -B scripts/validate_docs.py` after README update | PASS; 13 documents, 151 local links, all capability IDs/phases; structural scope only |
| Scoped `git diff --check` for Python files and README | PASS; existing Git line-ending normalization warning is not a test failure |
| Final `npm.cmd ci --offline` | PASS; 448 packages installed, 450 audited from populated cache; no peer-resolution failure. Offline audit output is not the current public advisory result |
| Final `npm.cmd run validate` | PASS, exit 0: full dependency listing, format, lint, strict types, coverage, pip consistency, Python, docs, build and browser checks |
| Final unit/component and coverage within `validate` | PASS; 41 tests, two files, 100% of the explicitly measured page/schema scope; 90% gates enforced |
| Final `npm.cmd run test:python` within `validate` | PASS; nine tests in 0.84 seconds, isolated per-run cache and temporary fixtures |
| Final `npm.cmd run test:e2e` within `validate` | PASS; two cases, desktop and 320-pixel Chromium, 9.3 seconds |
| Production build with synthetic invalid `APP_ORIGIN` | Expected exit 1 and sanitized configuration error; the supplied value did not appear in captured output |
| Intentional Vitest, Playwright and ESLint negative probes | Expected exit 1 with actual failed assertions/rule diagnostics, including React list-key and ARIA rules; temporary probes removed |
| Final `npm.cmd audit --json` | Exit 1: five high development dependency-chain findings, one root braces advisory; documented below |
| Final `npm.cmd audit --omit=dev --json` | PASS, exit 0; zero production findings |
| Tracked/unignored text-file credential-pattern review | PASS: 55 files, zero known-pattern matches; values were never printed; limited scan, not proof of absence |
| Environment ignore rules | PASS: app .env.local ignored; .env.example trackable |
| CI syntax and reference review | PASS: Prettier YAML parse, full-SHA/action/script/security inspection; remote execution unverified |
| Final root `npm run dev` through the ignored `.cache/p07-dev-smoke.cjs` harness | PASS, exit 0; no APP_ORIGIN, credentials or local env files. HTTP 200, Bangla page/notices, noindex/nofollow and compiled Tailwind CSS verified; owned server stopped and port 3000 confirmed closed |
| Final `npm.cmd run docs:check` after status reconciliation | PASS; 13 required documents, 158 local file links, capability/phase coverage; structural checks only |
| Final `git diff --check` and `git diff --cached --check` | PASS; original fourteen staged entries preserved; all task changes remain uncommitted |
| Local verification server cleanup | PASS; ports 3000 and 3100 confirmed closed |

The Python tests cover valid synthetic plans, missing files, invalid UTF-8,
missing/escaping links including encoded traversal, fenced examples, missing
capability coverage and phase-number boundaries. They do not assert that worker
security, extraction or ingestion exists.

The first default-sandbox Playwright attempt hung without a result. Its owned
wrapper process tree was stopped; a run with scoped browser/process permission
then executed and passed both cases. A 180-second global deadline now bounds the
suite. The hanging attempt is not counted as a pass, and no skipped-test count
was used to satisfy acceptance.

An earlier typecheck could not resolve jest-dom matcher types; locating the test
setup under the web source tree fixed discovery without weakening TypeScript.
A Vite ESM warning was resolved by declaring the root package's module type.
These repaired attempts precede the recorded passing checks.

The first final offline install was interrupted before completion; the subsequent
scoped normal-user run completed successfully. The first aggregate attempt exposed
Prettier traversing a private generated cache; explicit source/configuration globs
fixed this. A subsequent run correctly failed on a Python cache permission collision;
the root runner now allocates a fresh workspace-local directory per test run.
Warnings remain errors and test assertions were preserved. The final aggregate
passed after both repairs. Retained synthetic cache directories are ignored and
can be removed when no tests are active. A NO_COLOR/FORCE_COLOR warning in captured
Playwright stderr is nonblocking; the observed process exit was zero.

## CI configuration and execution status

The configured GitHub Actions workflow has separate web and Python jobs. It uses
official checkout/setup/artifact actions pinned by full commit, `contents: read`,
no persisted checkout credentials, bounded job timeouts and no deployment steps.
Web checks use the root npm lockfile; Python creates an isolated environment and
uses the pinned test requirements. Chromium system dependencies are installed in
Linux CI. Test failures are not ignored; failure artifacts have bounded retention.

**No GitHub-hosted workflow run has been observed.** Local passes and inspection
of the workflow are not evidence that the remote runner succeeds. YAML syntax,
action references and local equivalent commands passed inspection/execution.

## Security review and unresolved risks

The most recent recorded audit reported zero production dependency findings and
five high findings across the development dependency chain rooted in
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
The advisory page was accessed on 2026-10-18 and lists no patched release for the
affected braces stack-exhaustion issue. Repository-controlled glob patterns are
used by the current tools; this limits the present input surface but does not
remove the dependency finding. No force fix, framework downgrade or advisory
suppression was applied. The final public audit reproduced the finding; retain
this open tooling risk until an evaluated fix exists. An audit with zero
production findings is not a security certification.

No real credential, citizen query, government record or restricted document was
intentionally introduced. Real environment files, virtual environments, package
caches, Next output and test artifacts are ignored. The final known-pattern scan
and ignore checks passed as recorded above; they do not constitute a full secret
scanner or penetration test. The preexisting fourteen-file staged index remains
in place; no files were staged by this work.

P07's implemented configuration boundary is optional `APP_ORIGIN`, validated with
explicit inputs and sanitized errors, read only through a server-only adapter and
used for metadata. HTTPS is required except exact local loopback HTTP origins;
credentials, non-root paths, queries and fragments are rejected. The 39 passing
environment tests exercise valid/invalid values and sanitized errors. No unused
future database/model credentials or public variables were added. Static metadata
can capture the value at build time; changing it requires rebuilding. Official
[Next environment guidance](https://nextjs.org/docs/app/guides/environment-variables)
and [Zod APIs](https://zod.dev/api) were checked on 2026-10-18.

## Architecture consistency and scope

The foundation follows the approved separation: one web/BFF runtime, a reserved
isolated Python worker, and future database/shared/infrastructure boundaries.
There is no new monorepo orchestrator, additional web framework or runtime service.
Python development tooling does not establish compatibility of future native PDF
or OCR dependencies; their license, version and sandbox checks remain separate.

No government website was crawled, authenticated to or approved during Phase 1.
There are no seeded government facts, AI calls, embeddings, RAG, chat API,
database connection/migration, authentication or admin features. No infrastructure
was provisioned, no deployment or purchase occurred, and no commit or push was
made. Preexisting owner work and the existing staged index must remain intact.

Outstanding P03 findings remain feature gates: actionable-claim/scope/revision
contracts, independent citation lifecycle, durable revocation/deletion/spending
recovery, redaction egress, distributed rate limits, staff capabilities,
feedback/retry/multiturn behavior and OCR derivative identity. Local foundation
approval does not resolve those design gaps.

No complete accessibility audit, screen-reader/Bangla shaping review, real-device
study, multilingual answer evaluation, OCR evaluation, source verification or
production performance measurement has occurred. The passing Chromium smoke cases
establish only their asserted page, disclosure, runtime-error and overflow behavior
at the two tested viewports, rather than complete browser/device coverage.

## Remaining limitations

- Remote GitHub Actions has not run; no push or commit was authorized.
- The unpatched development-only glob advisory remains open; no current runtime
  production finding was reported. Recheck before upgrades or dynamic glob inputs.
- TypeScript checks cover the web workspace, including its unit tests. Root tool
  configuration/E2E TypeScript is linted and executed by its tools but does not
  yet have a separate compiler project.
- A fresh machine needs public package/browser downloads. This Windows sandbox
  required scoped process permission for Chromium and some registry operations.
- Broader browser, device, font-shaping and accessibility work belongs to Phase 2;
  future PDF/OCR dependency compatibility, P03 contracts and production controls
  remain gates before their respective features.

## Phase 1 decision

**PASS for Phase 1's local development foundation.** P04-P07 are complete against
their scoped acceptance checks. No critical foundation requirement remains blocked.
The unresolved development dependency advisory and unexecuted remote CI are
explicit limitations, not claims of a clean security audit or production readiness.

Phase 2 is technically ready for its scoped UI/UX planning, with the documented
browser/device and P03 feature gates preserved. Recommended next work package:
**P08**, after owner review/authorization. No Phase 2 work, commit, push or
deployment is performed by this completion.
