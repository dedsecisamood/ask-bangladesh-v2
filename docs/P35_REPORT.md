# P35 secure question API foundation

Implemented 2026-10-23. **PASS in the local foundation scope.** Stop before P36.
Phase 6's independent real-corpus quality gate remains PARTIAL.

## Changes and contracts

Added `POST /api/v1/answers`, `lib/questions/contracts.ts`, `lib/questions/http.ts`,
18 unit cases and a production HTTP Playwright case. No new dependencies, database
migrations, logs, history storage, retrieval calls or model calls are introduced.

Uses the approved answer route, existing Zod and existing Phase 6 minimizer/types.
Request: required question, optional answer_language (`auto|bn|en|banglish`) and
optional UUID conversation_id. Unknown fields, history and privileged filters are
rejected. Conversation ID is validated but unused, not a session capability.
History is deferred to P40. Auto detects Bangla script; otherwise English, without
pretending Latin text proves Banglish. Explicit Banglish preference is supported.

NFC/trim preserve Bangla joiners, case and spelling. Reject invalid controls,
directional overrides and lone surrogates. Limit: 2,000 normalized Unicode code
points, preliminary 8,000 UTF-16 units. Streamed fatal UTF-8 JSON reading caps
actual bytes at 16,384 regardless of Content-Length. Two-second deadline bounds
reading; cancellation closes the reader. Only application/json with optional
UTF-8 charset is supported. Compressed content, query parameters and cross-origin
browser requests are rejected.

Responses preserve request_id, status, language, blocks, citations, reason_codes,
with warning/error fields. All content is empty and unavailable; no source or
government guidance can be invented. Codes: 400 invalid input, 413 oversized, 415
media, 403 origin, 429 admission, 408 deadline/cancel, 503 unavailable. UUID request
IDs are server-generated and repeated in X-Request-ID; no-store/nosniff apply.
429/503 include Retry-After. No account or cookies required. No raw input is logged,
persisted or reflected. Existing heuristic minimization removes identifier-like
strings and URLs before the optional internal test retrieval capability; it is
not complete PII detection. The deployed route enables no retriever.

QuestionRetriever reuses the existing routed-retrieval result type. Its inputs
are only minimized text, locale and AbortSignal, with no client-controlled models,
trust settings or privileged filters. No competing retrieval implementation.

## Abuse controls and production limitations

Development: constant-memory global process bucket, 30 requests/minute including
malformed requests, at most two active requests. Bounds can be injected server-side
and must be positive safe integers. Forwarded headers, cookies, user agents and
conversation IDs are never treated as trustworthy identities.

Production returns 503 POLICY_UNAVAILABLE before body reading. Distributed rate
limits, trusted ingress/network limits, proxy/framework logging and activation
policy remain required before exposure. Process limits reset on restart and are
not cross-instance protection. No Redis or paid service added. Future adapters
must honor AbortSignal: a deadline cannot kill arbitrary noncooperative work.
Client-side minimization, full PII assurance, live model/corpus and citation gates
are not claimed. Frontend chat remains the labeled demo.

## Executed verification

- `npm.cmd run test:unit -- apps/web/src/lib/questions/http.test.ts`: 18 PASS,
  including languages, validation, normalization, malformed JSON/media/size/origin,
  spoof-resistant global admission/reset, production closure, minimization/logging,
  retrieval failure sanitization and timeout cancellation.
- `npm.cmd run test:unit`: 488 PASS in 28 files.
- `npm.cmd run typecheck`: strict web/generated database types PASS.
- Scoped ESLint and Prettier on new files: PASS.
- `npm.cmd run build`: PASS; answers route included, 124 static pages generated.
- Five real HTTP development cases PASS: valid Banglish 503, missing question 400,
  unsupported filter 400, text/plain 415, oversized body 413, safe empty envelopes.
- `npm.cmd run test:e2e -- tests/e2e/questions.spec.ts`: production HTTP test checks
  anonymous 503, policy closure despite spoofed forwarding, correlation/no-store,
  no question reflection, empty content and GET 405. Final result in checkpoint.

Hosted CI was not executed; existing unit/e2e discovery includes new tests. No
SQL/Python/model-suite rerun for this API-only change; Phase 6 evidence is historical.
No paid/provider/government requests, deployment, commit, push or real identities.

## Technical sources

Checked 2026-10-23: [Next Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route)
and [Node Web Streams](https://nodejs.org/api/webstreams.html), covering Request/
Response methods and reader cancellation. Actual compatibility exercised on Node
24.22.0 / Next 16.4.2. Unversioned Node docs render a later release; no upgrade made.

Next: review P35, then explicitly authorize P36. Do not claim Phase 7 is complete.
