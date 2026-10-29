# P08 — Design system and application shell

Date: 2026-10-19 (Asia/Dhaka). Status: **P08 PASS for the local shell.**
Scope: P08 only, following Phase 1's recorded local PASS. Stop before P09.

## Implementation

One existing Next.js application now has a Bangla-first public shell: independent
wordmark, header, desktop navigation, accessible mobile dialog, language menu,
skip link, main landmark, footer and bilingual independence disclosure. The small
welcome screen identifies unavailable features; it is not the P09 homepage.

Shared source-owned shadcn/Radix primitives include Button, Input, Textarea, Card,
Badge, Separator, Dialog, DropdownMenu, Skeleton, Alert, Container, SectionHeading,
PageState and PageLoading. Native elements remain native. Dialog/menu behavior
comes from Radix. No tooltip or animation framework was needed. The shadcn MIT
notice is retained beside the adapted components.

## Design decisions

| Token | Selected value / behavior |
| --- | --- |
| Canvas / surface | `#f7f8f4` / `#ffffff` |
| Main text / muted text | `#18372e` / `#56665d` |
| Primary / on-primary | `#145c49` / `#ffffff` |
| Secondary / accent | `#eaf0e5` / `#e4efc9` |
| Border / input boundary | `#d2dcd1` / `#7e9184` |
| Focus / destructive | `#166b52` / `#a32e38` |
| Warning text / surface | `#765017` / `#fff8e9` |
| Typography | Local Noto Sans Bengali + Inter, system fallbacks; normal variable weights 100–900; 16px body, generous Bangla line-height; display/page/section/body/small/label/helper/citation/control variants |
| Spacing / radius | 4px base; named spacing rhythm; 6/8/12/16/24px radius scale |
| Layout | 75rem maximum container, 42rem reading width; mobile-first; Tailwind breakpoints 640/768/1024/1280px |
| Controls / focus | At least 44px primary controls; visible 2px focus outline; explicit current location; modal focus trap and return |
| Motion | No required decorative animation; reduced-motion override |

Tokens live in `apps/web/src/styles/globals.css`. The static favicon uses the
same independent speech-mark identity. No government seal, flag emblem, official
approval badge, stock imagery or fabricated statistics were introduced.

Measured normal-text contrast: body 12.12:1; muted on canvas 5.70:1, on white
6.08:1 and on secondary 5.24:1; primary button 7.90:1; secondary 8.92:1;
destructive 6.99:1; warning 6.78:1. Input boundaries measure 3.14:1 on canvas;
focus ring 6.04:1. Fifteen automated checks enforce the relevant minimum ratios.
These measurements do not constitute WCAG conformance.

Two variable WOFF2 assets total **155,976 bytes (152.32 KiB)**. They are served
locally through `next/font/local` with swap and preloads. No browser request goes
to a font provider. The asset versions, original OFL licenses, glyph/integrity
checks, hashes and fallback limits are in [FONTS](FONTS.md). A provisional shell
font budget of 160 KiB covers these two current assets; the complete Phase 2
transfer/readability budget and real-device assessment remain P13 gates.

## Localization and routes

Typed dictionaries support `bn` and `en`; Banglish is not a third UI locale.
`/` redirects to `/bn`. Root layouts beneath `[locale]` provide server-rendered
HTML language, fonts and translated metadata. Both locale roots are statically
generated. An entry route group handles the redirect/fallback without forcing a
Bangla HTML language on English pages. No proxy or localization package is needed.

Language links preserve an explicitly supported section and discard query/hash
text. The explicit URL selects the language; no cookie, localStorage, sessionStorage
or automatic location/language detection is used. A language switch performs a
fresh document navigation; private drafts are not persisted by this shell.

The allowlisted preparation destinations, in both locales, are `services`, `ask`,
`how-it-works`, `about`, `sources`, `trust`, `privacy`, `terms`, `accessibility`,
`feedback` and `source-policy`. They contain a title, explicit unavailable state
and home link only. The attachment's `/trust` destination is recorded as a reserved
P12 route, distinct from `/source-policy`. Unknown sections/locales return 404.
No arbitrary path receives a successful generic placeholder page.

All development pages remain noindex/nofollow. Optional server-only APP_ORIGIN
validation is preserved. No accounts, backend, AI, database, ingestion, government
records, question composer, feedback processing or deployment was added.

## Dependencies and files

Added exact web-workspace runtime dependencies: `@radix-ui/react-dialog@1.3.1`,
`@radix-ui/react-dropdown-menu@2.2.1`, `@radix-ui/react-slot@1.5.0`,
`class-variance-authority@0.7.1`, `clsx@2.1.1`, `tailwind-merge@3.7.0` and
`lucide-react@1.59.0`. npm added 43 packages; the single root lockfile remains.
Fonts were extracted from pinned Fontsource 5.3.0 archives, not installed as
runtime packages. No framework/runtime/package-manager upgrade or monorepo
orchestrator was introduced. Radix React 19 peers and Tailwind compatibility were
verified before installation. Existing narrow ESLint compatibility overrides remain.

Created: `components/ui/*`, `components/layout/*`, `components/foundation/*`,
`lib/i18n/*`, `lib/utils.ts`, `lib/site-metadata.ts`, `styles/fonts.ts`, licensed `styles/fonts/*`,
`styles/tokens.test.ts`, localized/entry route files, `public/icon.svg`,
`apps/web/components.json`, `tests/e2e/shell.spec.ts`, `docs/FONTS.md` and this report.

Modified: global styles, web package manifest/root lockfile, Vitest and Playwright
configurations, current plan/authorization/progress/setup/design documentation.
The P04 root page/layout/test were replaced by their localized counterparts; the
old two-case browser smoke was replaced by the fuller shell suite. Environment
tests, Python tests, Phase 1 report and owner `masterprompt.txt` were preserved.

## Verification evidence

| Command / check | Actual result |
| --- | --- |
| Public `npm.cmd view ...` compatibility queries | PASS; exact versions and React peers checked |
| `npm.cmd install --workspace @ask-bangladesh/web --save-exact ...` | PASS; seven direct dependencies above, 43 packages added |
| `npm.cmd run format` / `npm.cmd run format:check` | PASS |
| `npm.cmd run lint` | PASS after changing a primitive's test link to Next Link |
| `npm.cmd run typecheck` | PASS after removing only stale generated Next development route types from the prior route structure |
| `npm.cmd run build` | PASS; localized roots and preparation pages statically generated; no external font build request |
| `npm.cmd run test:coverage` | PASS: 120 tests, five files; 100% statements/branches/functions/lines across six explicitly selected behavior modules; 90% gates unchanged |
| `npm.cmd run test:python` | PASS: nine unchanged offline tests |
| `npm.cmd ls --depth=0` | PASS; selected dependency pins present |
| `P08_SCREENSHOTS=1 npm.cmd run test:e2e -- --workers=2` (process-local variable on PowerShell) | PASS: 12 tests in 18.3 seconds after the positioning fix; bn/en at all six requested widths, keyboard, privacy, navigation/404 and reduced motion |
| Visual inspection | Actual PNGs inspected: bn desktop 1440px, bn mobile 320/390px, en desktop 1440px and corrected 320px mobile menu |
| Final public dependency audits | Full audit: five high development-chain findings rooted in the previously recorded unpatched braces advisory; production-only: zero findings |
| `npm.cmd run docs:check` | PASS: 13 required documents and 167 local links |
| `git diff --check` / `git diff --cached --check` | PASS; the pre-existing 14 staged entries were preserved |
| Final local hygiene review | No matches in a limited credential-pattern scan of 97 tracked/unignored text files; not proof of secret absence. Local preview ports 3000 and 3100 were closed after verification |

The first contrast test used a browser-transformed import URL for a filesystem
read; the root-relative source path corrected the test harness. Strict checking,
contrast limits, assertions and failure exit status were preserved. The mobile
position failure generated real screenshots/traces and was fixed in the component;
the test now additionally checks that its full rectangle stays inside the viewport.

## Accessibility, performance and limits

The suite covers both locales at 320/375/390/768/1024/1440px, skip-link focus,
keyboard language selection, resource/privacy preservation, footer navigation,
preparation/404 states, menu focus trapping/return and reduced motion. Screenshots
are captured under ignored `.cache/p08-review` for actual visual inspection.

An observed cold production page transferred 202,983 encoded bytes for HTML/CSS/JS
and 155,976 for fonts (two local font requests), approximately 350.55 KiB combined.
This is one local Chromium run without CPU/network throttling, not a Lighthouse,
Core Web Vitals or real-device result. The core portion is below the existing
proposed 300 KiB budget excluding fonts. No tracking or external asset request was
observed in that browser scenario.

Manual screen-reader testing, fluent-reader review, complete WCAG 2.2 AA audit,
400% desktop zoom/200% text resize, older browsers and representative low-end
devices remain unverified. Modern browser floor remains Chrome/Edge111+, Safari
16.4+, Firefox128+; only current Chromium was executed here. Future full pages,
privacy/legal policy review and P03 evidence/data contracts remain later gates.
Remote GitHub Actions has not been run or claimed successful.

## Technical references

Checked 2026-10-19: [Next locale routing](https://nextjs.org/docs/app/guides/internationalization),
[root layouts](https://nextjs.org/docs/app/api-reference/file-conventions/layout),
[font optimization](https://nextjs.org/docs/app/getting-started/fonts),
[shadcn Tailwind 4/React 19](https://ui.shadcn.com/docs/tailwind-v4),
[Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog),
[shadcn MIT license](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md),
[W3C text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
and [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
Installed Next.js documentation was read before route/font/error implementation.

## P08 decision

**PASS.** The shared shell, localized navigation, primitives, representative Bangla
rendering, contrast, responsive/keyboard checks, type/lint/format checks and build
passed. Phase 2 as a whole is not complete. Recommend P09, the complete homepage;
do not start it automatically. No commit, push, deployment or paid service occurred.
