# Gemini through Vertex AI: disabled provider adapter

Owner approval on 2026-10-23 covers adapter implementation and mock testing only.
No Cloud project, identity, API, billing account or paid model call was activated.
This updates the earlier Phase 7 statement that no hosted vendor was selected.
The phase remains PARTIAL on live configuration, independent support review and
human/official-corpus quality gates. Stop after this adapter task.

## Implementation and configuration

`apps/web/src/lib/answers/vertex.ts` implements the existing `ProviderTransport`
through Google's official `@google/genai` 2.31.0, pinned in the web workspace and
root lockfile. Its Node >=20 requirement fits this repository's Node 24 runtime.
No competing SDK, infrastructure, migration or provider is added. The dependency
installation used `--ignore-scripts --no-audit --no-fund`; npm reported a transitive
`node-domexception` deprecation. That warning is not an audit result.

Server-only `createVertexProvider()` defaults disabled. Environment settings
alone cannot activate it: future trusted composition would have to supply
`{liveApproved: true}` after explicit authorization and project/billing/privacy
checks. This parameter is a code composition boundary, not evidence that billing
has been verified. The public answers route does not import or compose the adapter.
`AI_PROVIDER=disabled` remains the example default. `configured` and explicit
deterministic test mocks are preserved; no environment-selected mock is allowed.

Future configuration requires `AI_PROVIDER=vertex`, an explicit `AI_MODEL`,
`GOOGLE_CLOUD_PROJECT` and `GOOGLE_CLOUD_LOCATION`. Suggested model is
`gemini-3.8-flash`; reviewed alternative is `gemini-3.7-flash`, with an earlier
announced retirement. Only these stable IDs and `global`, `us`, `eu` locations
are accepted. Model and location selection are trusted server settings, never
citizen request fields. Availability in the owner's project is NOT verified.
Recheck lifecycle and region before activation. Global is not a residency promise.

Existing settings govern timeout (default 5s; maximum 15s), context (16,000 bytes;
maximum 32,000), output (1,024 tokens; maximum 2,048) and daily local reservations
(100,000 units). These conservative process-local reservations are not a durable
currency budget. Prices, credit applicability and production cost are unmeasured.

## Security and behavior

The Node SDK is initialized lazily in Vertex mode with API v1 and explicit project
and location. It uses ADC with the Cloud Platform OAuth scope; IAM still controls
actual permissions. API-key/Express fallback is rejected. Endpoints are fixed to
the corresponding Google `aiplatform.googleapis.com` host, overriding optional
SDK endpoint environment settings. No credentials are embedded or loaded by the
disabled application. Future deployment should use a dedicated least-privilege
attached identity or workload identity; no downloaded service-account key is
needed for this implementation. ADC setup/login is deliberately not executed.

Trusted system instructions remain separate from JSON-encoded untrusted evidence
and question data. Requests use JSON response mode and LOW thinking, no supplied
tools, no function execution, no files, grounding calls, chat history or caches.
SDK retry attempts are one (zero retries). Abort signals and HTTP timeouts work
with the existing provider deadline/concurrency/reservation policy. Timeout is
not proof that remote work or charges were cancelled.

Only a single complete STOP candidate with final text is accepted. Safety blocks,
truncation, missing usage, tool/non-text output and inconsistent token totals are
withheld. Opaque thought signatures are discarded. Reasoning and other output
tokens count toward the existing cap via total minus prompt usage. SDK failures
become safe existing errors; neither questions, prompts, credential details nor
raw SDK errors enter usage events. The bounded usage buffer records only model,
token counts, duration and category. RAG schema/citation validation and independent
support checks still apply; JSON mode is not semantic validation or proof against
prompt injection. The adapter cannot approve evidence or publish guidance.

## Authoritative references checked 2026-10-23

- [Official Google JavaScript SDK](https://github.com/googleapis/js-genai): supported
  SDK, Node prerequisites and Vertex/ADC initialization. Installed types confirm
  `vertexai` remains supported alongside the newer `enterprise` spelling.
- [Gemini 3.8 Flash model](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-8-flash):
  GA, explicit model ID, global/us/eu availability. Google now labels these pages
  Gemini Enterprise Agent Platform; this adapter still targets the Vertex API.
- [Flash developer guide](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/guides/gemini-3-8-flash):
  LOW thinking is supported; MINIMAL is not. No deprecated sampling parameters
  or candidate-count override is sent.
- [Model lifecycle](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/model-versions):
  3.8 Flash retirement September 2, 2027 or later; 3.7 Flash January 28, 2027.
  The old 2.5 Flash date has passed, so it is not the configured example.
- [SDK generation configuration](https://googleapis.github.io/js-genai/release_docs/interfaces/types.GenerateContentConfig.html)
  and [retry configuration](https://googleapis.github.io/js-genai/release_docs/interfaces/types.HttpRetryOptions.html):
  cancellation, timeout and attempts semantics.
- [Application Default Credentials](https://docs.cloud.google.com/docs/authentication/application-default-credentials):
  environment/local credential/attached identity lookup. No lookup was performed
  by the disabled adapter during verification.

## Verification

Adapter tests mock the entire Google SDK: no authentication or model networking.
Tests cover disabled/no-credential startup, explicit server configuration, stable
model/region restrictions, endpoint/auth/request mapping, usage including thinking,
malformed/blocked/truncated responses, safe errors, zero retries, deadlines,
noncooperative concurrency and budgets. Full results are recorded in the current
[development checkpoint](CODEX_PROGRESS.md). Earlier complete Phase 7 aggregate
results remain historical in [PHASE_7_REPORT](PHASE_7_REPORT.md).

Remaining activation work: verify project/API availability, ADC IAM, credit/billing
eligibility, retention/region/privacy, durable spending/admission limits and owner
live-call approval. Then evaluate actual model output against approved official
evidence and independent human support review. No later work package is started.
