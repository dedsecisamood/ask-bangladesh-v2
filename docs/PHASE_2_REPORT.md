# Phase 2 — Public frontend completion report

Date: 2026-10-19 (Asia/Dhaka). Status: **PASS for the local Phase 2 frontend**.
Authorization: the owner explicitly requested P09–P13 following P08. This batch
ends at P13. It does not implement or automatically begin P14.

## Implementation summary

The existing Next.js/npm-workspace application now contains a complete bilingual
public frontend. P08's independent teal/warm-white identity, semantic controls,
local Noto Sans Bengali/Inter fonts and shared shell were retained. No second
framework, database, AI provider, government integration or deployment was added.

- P09: full homepage with a multiline question form, five Bangla/Banglish/English
  examples, eight preparation topics (NID/passport/land first), planned workflow,
  trust explanation, directory alternative and final action.
- P10: local demonstration conversation, memory-only homepage handoff, structured
  answer/source-card contracts, answer-language controls, stop/retry/clear,
  concise live status and local-only feedback selections.
- P11: sixteen bilingual categories, service-name/alias search, combined category
  filtering, derived preparation-topic counts, service/category/agency templates.
- P12: source/guide layouts, honest empty directories, About, How It Works, Trust,
  Source Policy, draft Privacy/Terms, Accessibility, Help, local-only Feedback and
  disconnected operational Status.
- P13: route, interaction, privacy, mobile, keyboard, accessibility and performance
  regression checks; implementation defects corrected rather than suppressed.

## Work-package decision

| Package | Status | Evidence |
| --- | --- | --- |
| P08 | PASS, historical and retested | [P08_REPORT](P08_REPORT.md); shared shell retained; additional accessibility defects identified in P13 are described below |
| P09 | PASS | Localized complete homepage, suggestions, validation and private handoff pass |
| P10 | PASS | Demo chat, cancellation/retry/clear, IME/input, safe rendering and privacy pass |
| P11 | PASS | Search/filter/catalog, directory/detail routes, missing IDs and responsive checks pass |
| P12 | PASS | Information/form/source/guide contracts, draft policies and honest status pass |
| P13 | PASS, local frontend scope | 175 unit/component tests, 28 browser cases, nine Python tests and required quality/build checks pass; human/device limits remain explicit |

## Routes and data availability

All paths below exist in both `/bn` and `/en`; `/` redirects to `/bn`.

| Route | Implemented behavior |
| --- | --- |
| `/[locale]` | Complete localized homepage |
| `/[locale]/ask` | Explicit local demo, no live AI |
| `/[locale]/services`, `/[locale]/search` | Eight searchable preparation topics; search text stays in memory |
| `/[locale]/services/[slug]` | Eight allowlisted topic layouts; requirements/steps/fees/deadlines are explicitly unavailable |
| `/[locale]/categories` | Sixteen editorial categories with derived preparation counts |
| `/[locale]/categories/[slug]` | Sixteen category views, filtering, empty states and related category links |
| `/[locale]/agencies` | Honest empty verified-agency directory |
| `/[locale]/agencies/[slug]` | Agency detail resolver/template; no records approved, so no valid detail IDs; absent IDs return 404 |
| `/[locale]/sources` | Honest empty official-source directory |
| `/[locale]/sources/[id]` | Source detail resolver/template; no records approved, so no valid detail IDs; absent IDs return 404 |
| `/[locale]/guides/[slug]` | Eight preparation guide layouts; no fabricated instructions |
| `/[locale]/services/[slug]/guide` | Existing PRD route redirects to the corresponding guide; no duplicated guide content |
| `/[locale]/how-it-works`, `/about`, `/trust`, `/source-policy` | Current capabilities distinguished from future evidence workflow |
| `/[locale]/privacy`, `/terms` | Review-required drafts matching the current demo; no invented retention, hosting, vendor or legal guarantees |
| `/[locale]/accessibility`, `/help` | Interaction instructions, targets and testing limits |
| `/[locale]/feedback` | Local validation only; explicitly NOT submitted; no contact collection |
| `/[locale]/status` | Implementation status only; no live metrics, incidents or uptime claims |
| `/robots.txt`, `/sitemap.xml` | Disallow preview indexing; sitemap contains no indexable URLs |

There are no government agency, source or procedure fixtures. The eight service
entries are explicitly editorial preparation topics, not verified service records.
Source/agency templates are tested with synthetic unit-only metadata rather than
inventing live detail pages. Unknown locales, sections, nested paths and IDs return
HTTP 404. Citation pages remain Phase 5/7 work as specified in the PRD.

## Components, adapters and boundaries

Created features under `apps/web/src/features/home`, `questions`, `chat`, `catalog`
and `information`; reusable cards under `components/catalog` and
`components/evidence`. New pure contracts/adapters are `lib/catalog.ts`, `chat.ts`,
`product-copy.ts` and `information.ts`. Routes use awaited Next.js params and
allowlisted static generation. The final build prerendered 119 framework/public
pages and redirects, including machine metadata routes.

The catalog adapter centralizes categories, names, aliases and records. Preparation
records are typed separately from reviewed-backend records. Draft, pending,
verified metadata, outdated and unavailable have distinct bilingual labels;
verified metadata does not imply actionable evidence eligibility. A future API
adapter must supply reviewed projections and server-side validation; these UI
types and link checks do not implement publication authorization.

The conversation provider persists across same-locale navigation, entirely in
React memory. Homepage submission invokes it before navigating to the constant
`/[locale]/ask` URL. Refresh and full-document locale changes lose that memory.
Clear removes messages, feedback state and the unsent composer draft. Six recent
questions are retained within an 8,000-code-point message-content budget. This
demo cap is not the future API's six-message history contract; that adapter must
build and validate its own bounded request. Individual questions allow 2,000
Unicode code points. No private input is placed in URLs, browser storage or logs.

The deterministic demo adapter receives locale/language/AbortSignal, never question
text. Its 200ms delay demonstrates loading only, not actual retrieval or AI work.
Auto uses the UI language and says so; explicit Bangla, English and a fixed
Banglish demonstration response are supported. No semantic language understanding
is claimed. Cancellation/clear ignores late completion; failures expose sanitized
text and an explicit retry. No raw HTML/Markdown or untrusted external URLs are
rendered. Source links require reviewed-backend metadata, verified ownership,
current evidence eligibility and a safe HTTPS URL; no PDF fragment is invented.
Only supplied positive PDF page numbers and dates are displayed.

Language switching preserves known resource IDs and strips query/hash input.
Server components render static content; interactive islands handle questions,
chat, menus, filtering and feedback. Static topic/policy navigation remains useful
without JavaScript; a noscript notice identifies controls that require it.

## Dependencies and changed files

Added only `@axe-core/playwright@4.14.0` as a root development dependency after
checking its Node/Playwright compatibility. npm added one package. Runtime UI
dependencies and licensed font assets from P08 were retained unchanged. One root
npm lockfile and the existing CI quality scripts remain authoritative.

New/modified application files: localized homepage/section/detail routes, guide
redirect, robots/sitemap metadata, locale layout/provider, shared brand/header/footer,
service/source cards, feature modules, typed catalog/chat/information/copy modules,
locale route/dictionary modules and centralized CSS. The superseded P08 minimal
welcome/preparation components were removed. Existing shell tests were adapted
to the completed pages; no working test suite was discarded.

Tests: new catalog/chat unit tests, question/chat and directory/information
component tests, expanded shell browser tests and `tests/e2e/frontend.spec.ts`.
Updated Vitest's explicit coverage target from the removed welcome module to
the demo contract module; retained 90% thresholds and the other five modules.
Documentation changes include AGENTS, PLANS, README, PRD, architecture/design/
roadmap headers, test instructions, progress and this report. Phase 1 and P08
reports remain historical evidence. Owner masterprompt and staged index remain
outside this task's mutations.

## Verification evidence

| Command | Actual result |
| --- | --- |
| `npm.cmd view @axe-core/playwright version peerDependencies engines --json` | PASS: version 4.14.0; Node >=22.12.0 and Playwright peer compatible with this checkout |
| `npm.cmd install --save-dev --save-exact @axe-core/playwright@4.14.0 --fetch-retries=0 --fetch-timeout=30000` | PASS; one development package added |
| `npm.cmd run format`, `npm.cmd run format:check` | PASS |
| `npm.cmd run lint` | PASS |
| `NEXT_TELEMETRY_DISABLED=1 npm.cmd run typecheck` | PASS: `next typegen && tsc --noEmit` |
| `npm.cmd run test:coverage` | PASS: 175 tests in nine files; six selected modules: 97.70% statements, 100% branches, 92.85% functions, 97.61% lines; not whole-app coverage |
| `npm.cmd run test:python` | PASS: nine unchanged offline tests |
| `node scripts/python.mjs -m pip check` | PASS; no broken requirements |
| `npm.cmd ls --all --parseable` | PASS |
| `NEXT_TELEMETRY_DISABLED=1 npm.cmd run build` | PASS: compile, strict TypeScript and 119 prerendered pages/redirects |
| `PHASE2_SCREENSHOTS=1 npm.cmd run test:e2e -- --workers=2` | PASS: 28 cases, 1.1 minutes; six widths, both locales and 22 default axe scans including mobile dialogs |
| `npm.cmd audit --json` | Exit 1: five high development-chain findings from the pre-existing braces advisory; no critical findings |
| `npm.cmd audit --omit=dev --json` | PASS, exit 0: zero production findings |
| `npm.cmd run docs:check` | PASS: 13 required documents, 172 local links, capability/phase structure |
| `git diff --check`, `git diff --cached --check` | PASS; 14 pre-existing staged entries preserved |
| Local credential-pattern scan | No high-confidence pattern matches in 121 tracked/unignored text files; a limited scan, not proof of secret absence |
| Focused screenshot refresh at 390/1440px | Two representative reflow cases passed after moving screenshot capture to page-top; no application change |

Environment values above are process-local PowerShell assignments, not POSIX
commands to paste verbatim into PowerShell. No test failure was ignored. The
initial build failed when Next telemetry attempted a sandbox-disallowed user
configuration write; process-local telemetry disabling resolved it. A subsequent
build found unsupported `exact` in a Testing Library role matcher; removing that
test-only option fixed strict typing. No compiler/lint/security rule was weakened.

The first full browser run had 21 passes and six failures: three ambiguous test
selectors (framework route announcer/footer headings), two axe scans finding
visible-label/accessibility-name mismatches, and enlarged-text overflow. The
selectors were scoped to main content; brand naming now uses its natural content,
the language control includes its visible language, and header/composer intrinsic
sizing was corrected. A focused rerun passed the three functional checks and
isolated the remaining brand and selector-width defects, which were then fixed.
These failed runs returned nonzero status and retained screenshots/traces.

## Accessibility and visual review

All final browser checks passed. Browser checks cover both locales at 320/375/390/768/1024/
1440px; long mixed-script chat text, forms, directories, guides and source states;
keyboard skip link, dialogs/Escape/focus return; reduced motion; 200% root text
resizing and narrow 320px reflow. The text-resize test also checks the combined
200%-text/320px scenario, a stronger stress case than plain 400%-equivalent reflow.
This is CSS reflow emulation, not manual browser zoom or OS keyboard testing.

Actual PNGs were inspected for English homepage at 1440px, Bangla homepage at
320px, Bangla directory at 320px, Bangla long-message chat at 390px and English
feedback at 1440px. Representative samples show no visible clipping or horizontal
overflow. The chat capture was refreshed at page-top to remove an off-viewport
fixed skip-link artifact from the browser's full-page screenshot. Current visual
evidence is under ignored `.cache/phase2-review`; it contains synthetic input only.

Default axe scans cover ten representative routes per locale, including answered
chat and invalid feedback states, plus mobile dialogs. No exclusions or rule
suppression are configured. Automated scans and screenshots do not establish full
WCAG 2.2 AA conformance. Human screen-reader, fluent Bangla/translation review,
real mobile keyboard/low-end device, older-browser and Firefox/WebKit work remains
unverified. These remain product-release gates, not claims of deployed safety.

## Performance and privacy review

The final lab scenario uses current Chromium, 390x844,
cold cache, 150ms network latency, 1.6Mbps download/750Kbps upload and 4x CPU
slowdown against the local production server. It measures encoded HTML/CSS/JS
and fonts separately, with an enforced 300 KiB core-transfer planning budget.
The two fonts remain 155,976 bytes, within P08's provisional 160 KiB font budget.
No Lighthouse score, field Core Web Vitals or real-device latency is claimed.

Observed encoded transfer: **219,214 bytes HTML/CSS/JS (214.08 KiB)** plus
**155,976 font bytes (152.32 KiB)**, **375,190 bytes total (366.40 KiB)**.
DOMContentLoaded was 619ms and load 3,614ms in this single local lab run.
The 300 KiB core and 160 KiB font budgets passed; these are frontend lab gates,
not guarantees about low-end phones or production latency. No external asset or
analytics requests occurred in the measured scenario.

No real government website was accessed or approved for this work. No crawler,
model, database, authentication, admin, production monitoring, external analytics,
voice, upload or government transaction was enabled. The app requires no secret
credentials to render. Privacy/Terms drafts explicitly leave production vendors,
regions, retention, legal terms and review undecided. Automatic personal-data
redaction is not implemented; visible warnings ask users to omit identifiers.

Remote GitHub Actions execution remains unverified. CI runs the existing quality,
unit, production-build and complete Chromium suite; the new axe checks are part
of that suite. Python CI is unchanged. No deployment job or credentials were added.

The five high full-audit findings are the pre-existing development-only chain
`eslint-config-next -> @next/eslint-plugin-next -> fast-glob -> micromatch -> braces`.
The reported issue is stack exhaustion on deeply nested glob patterns. This task
adds no externally supplied glob input; npm's proposed major downgrade to Next 14
lint configuration was not applied. A compatible upstream fix remains necessary.

## Final decision and next task

**PASS for the local frontend foundation.** P08–P13 are complete within the
explicit demonstration/content limitations. Phase 3 database foundation can begin
after owner review and the complete P14 instructions are available; no claim of
production launch readiness or full accessibility conformance is made.
Do not begin Phase 3 automatically.
P14's supplied text is incomplete after `verification_metho_`; obtain its remainder
before database implementation. P03 evidence/API/security contracts remain gates
for their relevant future features. No commit, push, deployment or paid operation.

## Technical references

Installed Next.js 16.4 documentation was read for server/client boundaries,
dynamic params, static generation, loading/error conventions and robots/sitemaps.
Checked 2026-10-19: [Next layouts/pages](https://nextjs.org/docs/app/getting-started/layouts-and-pages),
[React context](https://react.dev/reference/react/useContext) and
[Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing).
The Playwright documentation recommends combining automated checks with manual
assessment; the limitations above preserve that distinction.
