# P45 independent multilingual review

Status: pending. No reviewer identity, approval or result has been assigned by code.
See [evaluation methodology](EVALUATION.md) and [Phase 8 report](PHASE_8_REPORT.md).
The owner arranges qualified independent Bangla/Banglish/English reviewers able to
verify government-service claims and translation meaning. Existing independent
annotation/adjudication requirements remain applicable; one appointment does not
waive required review coverage.

## Reproducible local rehearsal

Run `npm run test:phase8`, then `npm run phase8:review`. The content-addressed export
in `.cache/phase8/review-export/<hash>/` contains outputs, expected behavior,
evidence references and blank review.json fields. Repeat exports preserve edits.
The data is fictional engineering evidence, explicitly not real government advice.
Never approve a real-corpus gate from these examples or model self-evaluation.

## Real acceptance preparation

1. Obtain approved, versioned e-passport, NID and land official documents through
   the existing registry workflow. Record ownership/publication/permission decisions,
   exact URLs, version/content hashes, locators and permitted evaluation use.
2. Freeze the development/held-out/adversarial manifests required by EVALUATION;
   separate intent families across splits. Record denominators, failures and
   language slices rather than selecting only successful outputs.
3. Confirm reviewer independence, language qualifications and approved reference.
   Annotate source meaning and response-language meaning independently; adjudicate
   disagreements with signed/date-stamped findings. Keep names/private notes private.
4. Score each dimension separately: understanding, service selection, retrieval
   relevance, response language, clarity, factual grounding, citation correctness,
   abstention, conversation consistency and privacy/security. Use pass/fail/not
   applicable plus observations, error classification and decision. Check every
   material claim, negation, condition, amount, unit, deadline and required document.
   Exact source IDs alone do not prove entailment. Never invent missing metadata.
5. Confirm language switching re-retrieves evidence; prior assistant output is not
   evidence. Include script mixing, dialect/spelling ambiguity, context reset,
   outdated/conflicting/missing sources, privacy and injection cases.
6. Apply the existing thresholds/repeated-run policy separately per language. Leave
   unmeasured dimensions pending and document coverage limits and critical failures.

## Controlled provider prerequisite

Live Gemini remains disabled. Before any live evaluation, obtain owner approval
for calls/spending, verify project/ADC, location/privacy, billing/credit eligibility
and source permissions. Use [Vertex requirements](VERTEX_AI.md), bounded requests,
token/context limits, usage monitoring and a stop budget. Local mocks provide no
evidence about real model latency, cost, language quality or prompt resistance.

## Formal evidence required

Corpus manifest/approvals and hashes; reviewer qualifications/independence;
per-case observations and adjudications; original and translated claim/evidence
mapping; separate per-language metrics with denominators; repeated authorized
provider runs; unresolved-defect register and explicit acceptance decision.
Do not fabricate identities, signatures, dates or findings. Phase 7 and Phase 8
remain formally PARTIAL until their applicable gates pass.
