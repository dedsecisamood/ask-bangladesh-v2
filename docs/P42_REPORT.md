# P42 - Bangla interface localization and rendering

Date: 2026-10-24 (Asia/Dhaka). Authorized scope: P42 only. The owner's attached
Phase 8 prompt permits independent engineering while Phase 7 remains formally
PARTIAL. That explicit instruction supersedes the earlier stop-before-Phase-8
boundary for P42; it does not waive any corpus, human review or provider gate.

## A. Work package summary

Improve the existing Bangla/English interface without replacing its routing,
design, fonts, chat or evidence architecture. P43-P45 are assessed below, not
implemented. P42 technical verification is recorded below; Phase 8 is incomplete.

## B. Repository findings and Phase 8 assessment

The app already has `/bn` and `/en`, Bangla default entry, complete shell/product
copy, localized information/directory/chat states, accessible language controls,
local variable fonts and responsive light/dark layouts. Locale lives in the URL;
switching drops private query/fragment text and needs no registration, cookie or
new browser storage. Existing unit/browser checks are preserved.

Gaps confirmed: raw evidence language/type codes and ISO dates reached the UI;
source text inherited the UI language when its own language was different or
unknown; warning copy used an unrestricted key map. Root writing direction was
implicit and system Bengali font fallback was not named explicitly.

| Package | Existing foundation | Phase 8 work status |
| --- | --- | --- |
| P42 | Bilingual shell, typography, page copy and preference links | Implemented in this task; verification below |
| P43 | Phase 6 bounded token variants, reviewed aliases and ambiguity routing | Not started; broader variants/mixed queries require separate authorization |
| P44 | Phase 7 preference enum, basic language selection, bounded conversation and citations | Not started; language-change follow-ups and real generation quality remain future work |
| P45 | Existing synthetic retrieval/P41 fixtures, metrics and review export | Not started; approved corpus, multilingual human labels and live evaluation remain unavailable |

No approved corpus or independent review has been supplied since the P41
[inspection/checkpoint](CODEX_PROGRESS.md). This task does not onboard sources.

## C. Files changed

Added:

- `apps/web/src/lib/i18n/evidence.ts` and its unit tests.
- `apps/web/src/components/evidence/source-card.test.tsx`.
- `tests/e2e/localization.spec.ts`.
- This report.

Modified:

- Evidence source-card and grounded-answer presentation.
- Catalog source-detail heading and corresponding regression tests.
- Locale/entry HTML layouts and shared CSS font fallback.
- Existing Phase 7 browser test, extended to both UI locales.
- Frontend route-inventory test, separated by locale after a timeout.
- AGENTS, PLANS, README, DESIGN_SYSTEM, FONTS and CODEX_PROGRESS documentation.

No packages, lockfile, migrations, API/provider/retrieval implementations or font
assets were changed for P42. Existing staged work is preserved; no commit/push.

## D. Implementation

- Localized Bangla/English names for declared evidence language and document type,
  including mixed/Banglish and explicit unknown fallback. Prototype/unknown codes
  cannot accidentally become translated labels.
- Localized known page numbers. IDs, original titles, URLs and passage text remain
  unchanged; neither publication eligibility nor source authority is inferred.
- Display valid original dates with locale formatting; date-only input stays a
  date, timestamps show explicit UTC. Missing/malformed/impossible dates remain
  unknown. Formatting unavailability retains a validated original date rather
  than inventing one. Grounded citations retain original datetime attributes.
- Tag known source language accurately (`bn`, `en`, `bn-Latn`). Unknown/mixed
  language is explicitly unknown instead of inheriting a guessed UI language.
  Citation metadata lacks a source-language field, so its title/passage language
  remains unknown; answer block language continues using the existing contract.
- Set both UI roots explicitly LTR. Preserve automatic direction on source text.
  Add local Nirmala UI/Vrinda fallback after existing serif faces; no font download.
- Require every validated warning key to have nonempty bn/en copy. Unknown runtime
  keys fail safely to unavailable text. Test dictionary/product-copy parity;
  unsupported interface locale remains fail-closed, not a silent route fallback.

## E. Technical decisions

Reuse the existing dictionaries/product copy and browser Intl implementation.
No translation framework, persistence or duplicate language pipeline is added.
Warning translation completeness is enforced by TypeScript and runtime tests.
Existing legal/privacy/independence wording and demo limitations are preserved.

Source language is metadata, not a guess from script. The
[HTML language specification](https://html.spec.whatwg.org/multipage/dom.html#attr-lang)
(checked 2026-10-24) defines an empty language tag as unknown and omitted language
as inherited. Installed Next.js 16.4.2 internationalization/local-font guides were
reviewed; existing route and self-hosted font architecture is retained.

## F. Actual verification

| Command / check | Result |
| --- | --- |
| `npm.cmd run test:unit` | PASS: 600 tests / 36 files; 16 new P42 cases |
| `npm.cmd run test:coverage` | PASS: same 600 tests; scoped function coverage 93.1%, existing thresholds unchanged |
| `npm.cmd run typecheck` | PASS: web and database types |
| `npm.cmd run lint` | PASS, zero warnings |
| `npm.cmd run format:check` | Initial new browser file needed formatting; corrected and final check PASS |
| `npm.cmd run build` | PASS, production build / 124 static pages |
| `npm.cmd run test:e2e` | PASS: 36 Chromium tests, 2.2 minutes |
| `npm.cmd run test:phase7:ui` | PASS: 5 API-mode Chromium tests, 18 seconds; combined browser command exit 0 |
| `npm.cmd run docs:check` | PASS: 13 required documents, 296 local file links; structural validation only |
| Final lint/format verification | PASS, combined documentation/lint/format command exit 0 |
| Git working/staged diff validation | PASS: no whitespace errors; 14 original staged files preserved |
| Agent visual inspection | Local mobile bn/en and blocked-font snapshots generated under `.cache/p42`; representative images inspected |

Logs: `.cache/phase7/p42-*.log`. The first browser run passed all three new P42
checks and 34/35 overall. A pre-existing test batched the complete bn/en route
inventory into one 30-second test and timed out disposing a response. It now has
one case per locale, preserving all paths, redirects, 404 assertions and the
30-second per-case timeout. No retry, skip or assertion/asset-budget relaxation.

Checks cover mixed Bangla/English text, conjunct examples, long wrapping, keyboard
switching, URL preference after reload, dropping private queries, empty storage,
explicit language/direction, local-font failure, metadata/date/unknown handling,
warning-copy coverage, source links, both themes and automated axe checks.

Full SQL/Auth/Python/parser/offline-model aggregate was NOT rerun for these
frontend-only changes. The earlier Phase 7 aggregate remains historical evidence;
all unit P35-P41 regressions and the relevant Phase 7 UI checks are included here.
Hosted CI, live Gemini and real official-corpus evaluation were NOT executed.

## G. Security and privacy

No provider activation, paid calls, government-site collection or remote writes.
No raw question storage, new locale persistence, credentials, model HTML or
model-generated URLs. Plain JSX escaping and trusted citation contracts remain.
Synthetic browser input/snapshots contain no real citizen data. Sources retain
their existing trust gates; showing a language/date never approves a source.

## H. Known limitations

Translation parity/nonempty checks do not prove translation accuracy. Agent visual
inspection/axe/keyboard tests are not independent multilingual human review,
screen-reader speech validation, full WCAG certification or real-device testing.
Known source languages come from metadata; absent metadata remains unknown.
No new government coverage or real multilingual AI quality is demonstrated.

## I. External dependencies

Phase 7's owner-arranged independent reviewers, approved versioned official corpus,
real-corpus evaluation and controlled live-provider verification remain pending.
Phase 8 formal acceptance also needs the applicable independent multilingual
evaluation. Existing budgets/cloud/approval restrictions remain unchanged.

## J. Acceptance status

P42 technical implementation and local verification: **PASS**. Phase 8
remains PARTIAL/incomplete because P43-P45 are not authorized/executed and required
external acceptance evidence remains absent. Phase 7 remains formally PARTIAL.

## K. Recommended next step

Stop after P42. P43 may begin only after explicit owner authorization; reuse the
existing Phase 6 normalization/routing boundary. Do not start P44/P45 or Phase 9,
enable live Gemini, consume credits, onboard sources or deploy automatically.
