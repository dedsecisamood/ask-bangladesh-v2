# Phase 8 - Bangla, Banglish and English

2026-10-24 follow-up: the [pre-Phase-9 audit](PRE_PHASE_9_AUDIT.md) found and fixed
a complete-question/follow-up classification gap missed by the original fixtures,
plus earlier-phase body/intake gaps. Its results supersede the earlier assertion
below that no further coding was needed. Formal corpus/human/provider gates remain.

Date: 2026-10-24 (Asia/Dhaka). Owner authorized completing P43-P45 after P42.
Stop before Phase 9. Formal Phase 7 remains PARTIAL; no external gate is waived.

## Implementation and architecture

P42's UI and local-font foundation remains intact; [P42 report](P42_REPORT.md)
records its earlier 600-unit/41-browser verification. P43 extends the existing
search-only bounded spelling lexicon and version marker; exact tokens/phrases
avoid substring substitutions and preserve negation, digits, original minimized
wording and Bangla joiners. Prototype properties cannot become accidental aliases.
No universal transliteration, guessed service mapping or live alias onboarding.
Ambiguous `jamin` is deliberately not equated with land. Colloquial aliases still
come only from the reviewed catalog; mixed-language examples use synthetic aliases.

P44 keeps the existing API/provider/RAG contracts. Explicit answer preference wins;
otherwise exact standalone language commands select bn/en/banglish. For fresh
topics, Bangla script wins mixed-script detection and bounded Banglish markers precede English hints;
unresolved input defaults to Bangla. Bounded short follow-ups inherit user language
changes; new topics use fresh detection. Only the last six supplied turns are
considered; assistant prose never provides intent/evidence. Missing topic for a
language-only request returns clarification. Unsupported phrasing may require
manual language selection; no universal language detector is claimed.

Client/API minimization now keeps case/punctuation for generation separately from
search spelling normalization. Context is freshly retrieved and supplied as JSON
data to generation. Original source text, titles, quotes, versions and numbers are
unchanged. Existing context budgets, exact independent claim/language reviews,
numeric checks, post-generation eligibility/support rechecks and citation binding
remain mandatory. Language changes cannot authorize a translated claim. Prompt
instructions require concise chosen-language output and preserving conditions.
UI warnings retain the interface translation and also show selected-answer-language
warnings when different, including Romanized Bangla tagged `bn-Latn`.

NFC remains based on [Unicode UAX #15](https://www.unicode.org/reports/tr15/)
(official specification checked 2026-10-24); canonical normalization does not
establish translation or language quality. No new libraries or cloud services.

## Files and decisions

- Existing retrieval query, question contracts/handler, answer client/service/prompt
  and grounded-answer renderer/tests updated.
- Added `questions/language.ts`, focused language tests, versioned synthetic cases
  and `phase8.evaluation.test.ts` under the existing web library.
- Extended existing API-mode browser tests rather than creating a competing UI.
- Added `scripts/phase8-review.mjs`, package scripts and CI review export.
- Updated AGENTS, PLANS, README, AI_SYSTEM, EVALUATION and CODEX_PROGRESS.

No schema/provider/dependency/font-asset replacement, migration, credentials, raw
chat database, extra cache or second retrieval subsystem. Existing working tree
and staged files are preserved. Public generation and Vertex remain disabled.

## P45 methodology and review materials

`npm run test:phase8` runs versioned `p45-synthetic-v1` engineering scenarios and
writes `.cache/phase8/evaluation.json`. There are 31 routing/language cases plus
30 mocked RAG scenarios (ten each for bn/en/banglish): supported, missing evidence,
conflict, stale generation, absent independent support, unsupported fee/deadline,
injection, provider failure and language follow-up. Outputs, expected language,
evidence IDs and citations are reviewable. The artifact hashes fixture inputs and
records normalization revision. Failed assertions prevent the validation command
from passing; review export also rejects incomplete dimensions/case counts.

Routing and language selection have separate denominators. Mock RAG assertions
check selected language, answer/abstention outcome, citation identity, unchanged
evidence and minimized prompt/retrieval data; they do not measure live translation
or real retrieval relevance. No combined multilingual accuracy score is reported.
Real factual grounding, retrieval relevance, clarity and fidelity remain null.

`npm run phase8:review` exports a content-hashed snapshot and blank per-case rubric
without overwriting annotations. Review procedure: [Phase 8 human review](P45_HUMAN_REVIEW.md).
This synthetic export is a rehearsal, not a replacement for official-corpus review.

## Actual verification

Initial focused command: PASS 84 tests in three files (language/client/RAG).
`test:phase8`: PASS 105 tests in two files; the updated cases also pass in the
complete coverage run. Final `npm.cmd run validate:phase8`: **PASS, exit 0**.
Log: `.cache/phase8/final-validation-native.log`.

| Executed command (nested by the aggregate where applicable) | Actual result |
| --- | --- |
| `npm ls --all`, `format:check`, `lint`, `typecheck` | PASS, no new dependencies or weakened checks |
| `test:coverage` | PASS 707 tests / 38 files; scoped functions 93.1% |
| Python dependency check and `test:python` | PASS; 171 Python tests |
| `docs:check` | PASS 13 required documents and 301 local links; structural checks only |
| `build` | PASS 124 static pages |
| `test:e2e` | PASS 36 Chromium tests, 1.3 minutes; cleanup completed |
| `test:database:guards` | PASS 5 guards |
| `test:database` | PASS 152 disposable SQL tests |
| `test:integration` | PASS 28 real loopback Auth/API groups, including protected MFA flows and directory browser checks |
| `test:parser` | PASS 16 isolated parser/OCR checks |
| `embedding:verify` | PASS both cached candidate artifact sets; no profile activated |
| `test:retrieval:models` | PASS 3 actual offline CPU/PostgreSQL tests on synthetic fixtures |
| `test:phase7:ui` | PASS 6 Chromium cases, 20.7 seconds, including new language-switch/reset/privacy assertions |
| `phase8:review` | PASS 61-case content-hashed export with blank human findings |

The focused browser assertion compares NFC-normalized history, matching the
existing Unicode request contract; it does not require noncanonical input bytes
to survive unchanged. No source quote or evidence offset is rewritten.

The first `validate:phase8` run passed formatting, lint, types, 707 unit/component
tests (38 files), scoped coverage (93.1% functions), 171 Python tests, docs, build
and all 36 frontend assertions. Playwright then timed out at the unchanged
300-second teardown limit; the aggregate exited 1. Only the verified orphaned
port-3100 test server tree was stopped (three processes). No assertion/timeout was
relaxed. The complete command passed on repetition with native local permissions
for browser cleanup/Docker; initial failure stays in `final-validation.log`.

Synthetic evaluation measured routing 31/31 and language selection 31/31; slices
are bn 11/11, en 9/9, banglish 11/11, with mixed script included in bn. Mock RAG
contracts are 30/30 (10 per language), safe abstention 24/24, citation binding 6/6,
follow-ups 3/3, unsupported fees/deadlines 6/6 and identifier minimization 30/30.
These overlap by design and are separate test dimensions, not 61 independent
real-world accuracy trials or evidence that production targets were reached.
Frozen fixture-input SHA-256:
`f00137ff279009892a4b1e63f7c13e613dac04adba530f298add75d59d4868ed`.
Hosted CI, real-device/screen-reader speech checks, independent human assessments,
approved real-corpus retrieval and live Gemini evaluation were NOT executed.

### Open acceptance gates

| Gate | Evidence still required |
| --- | --- |
| P45-CORPUS | Approved, permitted official corpus with frozen manifests, provenance, hashes and source/version approvals |
| P45-HUMAN | Independent qualified multilingual reviewers, signed per-case findings and adjudication |
| P45-QUALITY | Held-out/repeated/per-language real retrieval, grounding, usefulness and fidelity evaluation under EVALUATION |
| LIVE-PROVIDER | Verified project/ADC, location/privacy, billing/credit eligibility and explicit controlled-call approval |

No formal gate is closed by a mock response or generated blank worksheet. Existing
P41 blockers remain intact; no Phase 9 implementation has begun.

## Security, limits and acceptance

No live government requests, paid calls, billing changes, remote operations,
deployment, commit or push. No new personal-data persistence or provider logging.
Heuristic redaction remains incomplete; meaningful personal prose can still be
sensitive, so live privacy review is required. Prompt wording and mock adversarial
checks do not prove live model resistance or semantic entailment.

No newly approved official corpus, independent multilingual reviewer or human
results were supplied. Versioned repository evaluation fixtures inspected remain
synthetic. Fresh read-only inspection of the verified local Docker registry on
2026-10-24 found 0 sources, 0 source documents, 0 document versions and 0 service
claims. The initial sandboxed read could not access Docker; the authorized local
read succeeded with appropriate tool permissions. No private records were printed. This
task does not approve records or automatically collect sources. Formal P41 gates
and the same corpus/human/live-provider dependencies remain open.

| Package | Engineering status | Formal limits |
| --- | --- | --- |
| P42 | PASS locally; existing foundation preserved and regressions rerun | Independent language/accessibility review remains pending |
| P43 | PASS locally; bounded spelling/routing cases verified | No production multilingual retrieval accuracy established |
| P44 | PASS locally; mocked evidence-bound language/follow-up behavior and browser integration verified | Real model fidelity and usefulness unmeasured |
| P45 | Technical infrastructure and automated checks complete; formal PARTIAL | Corpus, independent review and real-provider evidence absent |

**Formal Phase 8: PARTIAL** pending approved
versioned corpus, independent multilingual evaluation and controlled authorized
provider verification. No production multilingual accuracy claim. Next manual work
is preparing approved evidence and independent review; no automatic Phase 9.

The bounded lexicon and commands do not cover every dialect, spelling or language
switch phrasing. UI copy/Banglish warnings have engineering checks, not independent
linguistic signoff. Real-device and assistive-technology evaluation remains pending.
Phase 7 stays formally PARTIAL. All authorized local Phase 8 engineering is done;
no further coding step can substitute for the listed acceptance evidence.
