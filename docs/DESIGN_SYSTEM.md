# Ask Bangladesh design system and experience specification

P42 preserves the approved presentation and local font assets while adding
explicit LTR UI roots, named system Bengali fallback and localized evidence
metadata/date/unknown labels. Source text retains declared language or explicit
unknown language; it is never silently translated to match the interface.
See [P42_REPORT](P42_REPORT.md) for actual verification and human-review limits.

Current presentation: the owner-requested screenshot refresh uses white/navy
canvases, emerald actions, system Latin serif and self-hosted Noto Serif Bengali.
The centered hero/question bar, outlined navigation cards and honest About status
panels follow the supplied references. Header container queries preserve enlarged
text and small-screen controls; both locales retain keyboard language/menu access.
An enum-only local theme preference overrides system light/dark, with no question
storage. Thirty token checks cover both palettes. Fonts now have a 240 KiB budget.
See [FRONTEND_REFRESH_REPORT](FRONTEND_REFRESH_REPORT.md) and [FONTS](FONTS.md).
The P08 palette/font/contrast figures below are historical implementation evidence.

Status: P08 shared design system and bn/en application shell implemented and
locally tested on 2026-10-19 (Asia/Dhaka). See [P08_REPORT](P08_REPORT.md) and
[FONTS](FONTS.md) for exact tokens, licenses, measurements, tests and limitations.
P09-P13's complete homepage/chat-demo/directory/policy frontend passed local
checks; see [PHASE_2_REPORT](PHASE_2_REPORT.md) for current behavior and measurements.
No full WCAG conformance or production readiness is claimed. Live evidence,
backend data and human/device/translation review remain later gates.

## P08 implementation choices

The authoritative implemented tokens are in
[globals.css](../apps/web/src/styles/globals.css). Warm canvas `#f7f8f4`, white
surfaces, dark text `#18372e`, muted `#56665d`, primary teal `#145c49` and restrained
secondary/accent surfaces form the light palette. Text contrast ranges from 5.24:1
for muted text on secondary to 12.12:1 for body text; white on primary is 7.90:1.
Input boundary contrast is at least 3.14:1; focus ring contrast on canvas is 6.04:1.
Fifteen automated token checks enforce the selected text/control minimums.

Typography uses local Noto Sans Bengali and Inter variable WOFF2 assets, 152.32 KiB
combined, with preserved OFL licenses, swap/preload and explicit system fallbacks.
The provisional P08 font budget is 160 KiB for these two assets. Display, page,
section, body, small, label/helper/citation and native control styles share the
central font/color/spacing conventions. Latin display tracking is scoped to English;
Bangla has no letter-spacing or case-transform rule.

Source-owned shadcn/Radix primitives, public landmarks, skip link, header/footer,
mobile navigation, language menu and honest preparation states are implemented.
The URL locale is explicit: `/` redirects to `/bn`, and `/en` is server-rendered
with English HTML language and text. Locale links preserve the supported resource
path while dropping queries/fragments; no locale cookie or private-input storage.
The new reserved `/[locale]/trust` footer destination is distinct from source policy.

Current Chromium checks passed at all six requested widths, both locales, including
keyboard focus and mobile menu behavior. Actual screenshots were inspected for
Bangla desktop/mobile, English desktop and the mobile menu. This is representative
rendering evidence, not a fluent-reader, screen-reader or real-device audit.

## Product character and hierarchy

Use a calm, readable, independent civic-information identity. The header/footer
and first question experience must state that Ask Bangladesh is independent.
Do not use government seals, official identity marks, or layouts that imply an
official portal. A short Bangla draft is "আস্ক বাংলাদেশ একটি স্বাধীন তথ্যসেবা;
এটি সরকারি সেবা নয়।" This is proposed interface copy requiring fluent-language
review, not a published statement.

Prioritize a question field, service discovery, and evidence. The page hierarchy
is a compact header, main task, supporting directory links, evidence and limits,
and a compact policy/help footer. Avoid decorative hero media, carousels, autoplay,
or visual badges that imply every displayed fact is government approved.

The [PRD](PRD.md) owns the route inventory and capability scope.
[ARCHITECTURE](ARCHITECTURE.md) owns route/API contracts. The UI must consume
reviewed public projections rather than raw ingestion records.

## Language, writing, and typography

Bangla (`bn`) is the default UI language. English (`en`) is optional under the
same `/[locale]` structure; `/` selects Bangla by default. The visible language
switch uses text labels such as "বাংলা" and "English", preserves the current
resource where possible, and does not depend on flags. An explicit choice takes
precedence over heuristics; do not request location for locale selection.

Banglish is an input/output language mode, not a third UI locale or route tree.
Provide an answer-language choice inside the question experience: Bangla,
Banglish, English, or match the question. Show uncertainty when transliteration
changes an important term; request clarification for ambiguity. Keep the original
query while normalizing a separate retrieval form. Official names, identifiers,
amounts, units, dates, and source locators need consistent rendering and explicit
cross-language review. Do not present machine translation as an official text.

Use Unicode text, selectable answers, semantic headings, and a Bangla-capable
font stack with a tested system fallback. Font licensing, shaping quality, and
download size require Phase 2 review before selection. Proposed tokens are a
16-18 px body size, roughly 1.6-1.8 line height for Bangla, 60-75 Latin-character
equivalent reading width, and generous spacing around conjuncts and vowel marks.
These are design starting points, not measured readability results. Do not apply
letter spacing or case transforms that damage Bangla shaping. Allow zoom and
platform text-size settings. Test mixed-script wrapping and long URLs.

Set the document language to its UI locale and mark language changes in source
quotes or answer blocks when appropriate. W3C's guidance explains how language
declarations support language-aware processing. See
[Declaring language in HTML](https://www.w3.org/International/questions/qa-html-language-declarations)
(checked 2026-10-18). Do not claim Banglish has its own supported screen-reader
pronunciation; evaluate real users and provide a script alternative.

Use short sentences and everyday Bangla; preserve legal/official terms alongside
plain explanations when needed. Dates must be unambiguous and visibly indicate
the relevant timezone if time matters. UI examples are illustrative and must not
invent an actual service fee, deadline, requirement, official contact, or URL.

## Proposed visual tokens

| Token family | Proposal | Verification required in Phase 2 |
| --- | --- | --- |
| Background and text | Warm neutral background, white content surfaces, dark neutral text | Measure contrast in every state, including muted labels |
| Primary action | A restrained teal/green accent with readable text | Must not mimic an official seal; measure contrast and focus visibility |
| Evidence/status | Distinct icon, words and border for current evidence, warning, unavailable and conflict | Meaning must survive grayscale and color-vision differences |
| Spacing | 4 px base; 8/12/16/24/32 px rhythm as starting tokens | Bangla line height, target separation and density on mobile |
| Radius and depth | Small consistent radii and minimal shadow | Keep boundary cues visible in high contrast modes |
| Motion | Minimal, brief state transitions; honor reduced motion | No motion required to understand progress or outcomes |
| Controls | Prefer at least 44 x 44 CSS px touch area | Keyboard focus, label, disabled/error states and small-screen layout |

Exact color values were fixed and measured in P08; the proposal table above
describes the same intended token families. Tailwind CSS and
shadcn/ui are proposed implementation tools, not proof that a component is
accessible. Document component behavior before styling; avoid a custom control
when a semantic native element meets the need.

Tailwind 4's modern-browser floor is a material device-coverage constraint;
[ARCHITECTURE](ARCHITECTURE.md) records its official compatibility evidence.
Phase 1 must decide supported browser versions using expected citizen devices;
Phase 2 must test the agreed fallback/styling approach. Low-end-device and older-
browser compatibility are unverified until measured. Choose a maintained styling
alternative if the agreed browser population requires it.

## Components and required states

| Component | Required behavior and states |
| --- | --- |
| Application shell | Skip link, labeled navigation, current page, explicit locale switch, independence statement and policy/help links; mobile menu preserves focus |
| Question composer | Persistent label; multi-line input; answer-language mode; send/stop; character/size constraints; no identity-number prompts; local draft handling limited by privacy policy |
| Answer | Plain answer and ordered steps only when supported; claim-adjacent citation links; limits; regenerate/retry only as an explicit bounded action; no unvalidated actionable token stream |
| Clarification | One understandable question with why it matters, optional suggested choices and free text; no request for full personal records |
| Citation control and evidence panel | Keyboard-operable numbered links; publisher/title; version and passage/page locator; actual official URL; separate publication/check/review dates; escape and focus return if modal |
| Service and agency cards | Descriptive heading/link, scope and status; no truncated critical fee/eligibility claims; cards remain understandable without icons |
| Search/filter controls | Labeled input and filters, visible current filters, clear/reset action, result count and keyboard-accessible pagination; no infinite scrolling requirement |
| Source status | Specific words for candidate/private, verified provenance, active evidence, suspended and retired; no generic approval badge; status dates explain what was checked |
| Guidance list | Semantically ordered steps; adjacent evidence; optional print view with limitations and source dates; no task completion or eligibility promise |
| Feedback form | Claim/source context, reason, optional short comment, warning against personal data, submit confirmation, recoverable failure and abuse protection |
| Admin table and review form | Labeled columns, filters, keyboard navigation, explicit destructive/review actions, reason entry, progress and audit context; private content never leaks into public previews |
| System messages | Loading, no results, offline/network failure, rate limit, budget pause, unavailable evidence and incident states use clear text and recovery actions |

Layout sketches for Phase 2 are: homepage with one primary question task and
compact service categories; service detail with evidence-backed sections and a
source rail that becomes inline on mobile; answer view with steps and inline
citations; admin review with a source/evidence comparison and explicit decision
panel. Desktop may use two columns, but reading order must remain coherent in
the document and on a small screen.

## Honest evidence and failure behavior

[SOURCE_POLICY](SOURCE_POLICY.md) owns evidence eligibility, status transitions,
freshness and conflict rules; [AI_SYSTEM](AI_SYSTEM.md) owns answer behavior.
The interface must keep their distinctions visible:

| Situation | UX requirement |
| --- | --- |
| Current eligible evidence supports the claim | Show the answer with its exact passage citation and applicable limits |
| Question is ambiguous | Ask a relevant clarification before making an actionable claim |
| No eligible evidence | State that current official evidence is insufficient; avoid guessing or synthesizing an official link |
| Evidence is stale | Withhold affected current actionable claims; explain that the source needs rechecking |
| Official passages conflict | Show a conflict limitation; do not choose whichever passage best fits the answer |
| Source cannot be reached | Say that a new check was unsuccessful; never claim the site was tested successfully; apply existing freshness rules to older reviewed evidence |
| Provider, network, or budget fails | Keep reviewed information readable only while current eligibility can be confirmed; explain the temporary failure and offer a bounded retry |
| A source is suspended during answer generation | Revalidate before delivery and withhold invalidated claims; a cached answer is not exempt |
| Policy/database eligibility checks fail | Suppress actionable guidance and factual answers; show safe independent product/help content and an unavailable state |

The evidence panel must not conflate official publisher ownership, document
review, and present-day claim applicability. A generic "verified" label cannot
stand in for these facts. Timestamps, labels, and unavailable states need fluent
Bangla review. Warn that copied or printed information can age; include review
dates and canonical source references, without copying personal question text
into a public URL.

## Mobile, low bandwidth, and resilience

Design mobile first, beginning at 320 CSS px without horizontal page scrolling.
Keep the question action and service titles reachable without oversized hero
content. The mobile keyboard must not hide the composer, primary action, error
message, or keyboard focus. Reserve space for fonts and loading status to reduce
layout shifts. Avoid mandatory animation, large illustration, and embedded PDFs.

Directories, service details, policy pages, and source metadata should render
useful server-generated HTML with minimal client code. Chat needs interactive
JavaScript, but its failure should leave ordinary directory navigation usable.
PDF, OCR, voice assets, and future upload interfaces load only on a relevant
explicit action. Citation previews must be usable without downloading an entire
government PDF.

Keep search and question text out of URLs, history, referrers and ordinary logs.
The search page holds text transiently and follows the POST contract in
[ARCHITECTURE](ARCHITECTURE.md); browser autocomplete and draft restoration need
privacy review. A copied directory-filter URL must not carry a citizen question.

The initial proposed lab transfer budget is at most 300 KiB compressed for a
core page's HTML, CSS and JavaScript, excluding separately measured fonts and
user-triggered documents. The Bangla font budget must be approved in Phase 2
after readability/shaping tests; do not silently exclude it from reported totals.
This budget is a planning target, not a measured result or an approved release
threshold. [EVALUATION](EVALUATION.md) owns the final measurement scenarios and
release gates. Record device, browser, network/CPU profile, cache state, transferred
bytes including fonts, and observed latency. Validate with both laboratory
throttling and representative devices when available.

Do not promise offline government guidance. A future cache/service-worker design
needs explicit evidence-age display and eligibility revalidation; expired or
revoked actionable guidance must not remain silently authoritative. Do not
persist anonymous conversations on a shared device by default. The design of
retry/restore must respect the privacy retention rules in
[SECURITY](SECURITY.md).

## Accessibility acceptance target

The proposed target is WCAG 2.2 Level AA for complete relevant user journeys.
This is a design target, not a conformance claim. The current W3C Recommendation
defines testable accessibility requirements and the AA criteria concerning focus,
target size and accessible authentication. See
[WCAG 2.2](https://www.w3.org/TR/WCAG22/) (checked 2026-10-18).

Required verification includes semantic headings/landmarks and labels; text and
non-text contrast; visible, unobscured focus; keyboard-only completion; no focus
traps; screen-reader reading order; input errors associated with their fields;
status announcements; text resizing; reflow at 400% zoom; reduced motion;
high-contrast modes; and text alternatives. Use 200% text-resize checks as well.
Prefer 44 CSS px controls as a product goal; assess actual WCAG criteria and
exceptions in the audit rather than equating one size with full conformance.

For chat, announce a concise loading/completion status through an appropriate
live region. Do not make a screen reader announce every generated token. Preserve
focus during an answer, keep stop/retry accessible, and provide ordinary
headings/links to revisit evidence. No actionable answer should stream before
citation validation. Dialogs, menus and evidence drawers need predictable focus
entry, escape behavior and return. An inline evidence view is preferred where a
modal adds no value.

Bangla and mixed-script testing requires human review with relevant assistive
technology; automated checks do not establish pronunciation, comprehension, or
conformance. Admin workflows are also in scope. Future microphone features need
text equivalents and explicit recording controls; future authentication must
consider accessible sign-in and recovery. See [EVALUATION](EVALUATION.md) for the
test matrix and [SECURITY](SECURITY.md) for access boundaries.

## Phase 2 deliverables and remaining decisions

After explicit Phase 2 authorization, build the route shells, component inventory,
state catalogue, locale message structure, evidence panel, and responsive layouts
using conspicuously fictional fixtures. Review contrast and font shaping before
freezing tokens. Exercise the anonymous ask-to-evidence journey with keyboard,
mobile viewport, screen reader, slow network, and provider unavailable states.
Live sources and generated government instructions remain gated by later phases.

Unresolved decisions are supported browsers and styling fallback, the Bangla
font/license, exact palette, professional
translation review, representative device/network profiles, font transfer budget,
and English launch scope. P08-P13 implement the shared shell and full public
frontend in explicit demonstration scope. Live product features and public release
retain their respective authorization and validation gates.
