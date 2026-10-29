# Phase 7 independent acceptance review

Status: pending. No independent reviewer, approved official corpus, live Gemini
outputs or completed human labels are available. Software tests do not fill these
gaps. Do not mark formal Phase 7 PASS or enable public procedural guidance.

Owner clarification: the project owner will arrange an independent reviewer
proficient in Bangla, Banglish and English, with enough government-service knowledge
to assess evidence against official sources. No identity or completed review has
been supplied. This is a pending owner action, not reviewer appointment evidence.

Repository/registry inspection on 2026-10-23 found no approved versioned corpus:
the versioned retrieval dataset is explicitly synthetic and regression-only;
the 18-case P41 artifact is deterministic-mock engineering evidence with human
review pending. Read-only counts in the ordinary loopback registry were zero for
sources, approved verifications, approved nonsynthetic documents, approved versions,
published reviewed claims and claim-evidence mappings. Ingestion remained paused.
This conclusion covers the inspected workspace/local database, not an unseen
remote account or a corpus the owner may possess elsewhere.

Inspected versioned dataset: `tests/retrieval/benchmark.synthetic.json`, revision
`phase6-synthetic-v2-stable-ids`, SHA-256
`ca7bea7d4a2025c997f4a3ff7211266c72a2f10ee8206352b3282ef89c145e5d`.
Its review label explicitly says synthetic engineering labels, not human
adjudication. The P41 artifact revision `p41-synthetic-v1` reports 18/18 specified
mock expectations passing, `human_review.status=pending`, `reviewer=null` and
`production_targets=NOT_EVALUATED`. Neither artifact is an approved real corpus.

The owner requested completion of Phase 7 after the Vertex adapter. Local code,
mock integration and verification are authorized; paid/live calls, real onboarding,
deployment and Phase 8 remain excluded. [EVALUATION](EVALUATION.md) owns the actual
held-out corpus, denominator, repeat-run and quality requirements.

## Reviewable engineering artifact

Run `npm.cmd run test:phase7`, then `npm.cmd run phase7:review`. The exporter
preserves the current 18-case synthetic artifact under a SHA-256 directory in
`.cache/phase7/review-export/`, together with a pending-review worksheet. Existing
exports and annotations are never overwritten. The artifact contains questions,
fixture evidence/version IDs, mock output, claim/citation mappings, expectations
and outcomes. All evidence is fictional, not official government guidance.

These examples can be inspected for software behavior, but cannot establish real
grounding, translation quality, routing or abstention thresholds. Local generated
cache artifacts are not committed and should be copied to an approved private
review location before real annotation. Never add citizen conversations or private
documents to the repository.

## Formal review inputs still needed

1. Name an independent Bangla/Banglish/English reviewer and an adjudicator for disagreements.
   Authors of the answer or source record must not approve their own work.
2. Identify the already-approved, permitted, held-out official evidence corpus for
   e-passport, NID and land topics. Record access restrictions; no live collection
   is implied by this worksheet. Unknown government facts remain unknown.
3. Complete source/document/passage publication and claim review through the
   established private workflow. Verify reviewer status, exact versions, dates,
   applicability and freshness; include conflicting and deliberately missing facts.
4. Obtain explicit authorization before any hosted-model evaluation. Check the
   project, ADC identity/IAM, location/retention, billing/credit eligibility and
   bounded evaluation budget first. No paid request has been made here.
5. Freeze dataset/model/configuration hashes and capture each output's evidence,
   exact claim-to-passage mapping, citations, abstentions, warnings and usage.

## Human worksheet and decision

Retain the existing EVALUATION requirements: 300 held-out instances (100 per
language), with 180 answerable and 120 non-answerable cases, plus the separate
120-scenario adversarial set. The plan calls for two independent annotations per
answerable case and adjudication of disagreements. One planned reviewer is not
evidence that this coverage is fulfilled; the owner must arrange the required
independent review coverage. Preserve source/intent-family split isolation and
the specified three repeated runs; do not substitute the 18 synthetic cases or
silently relax these requirements. These are existing planned criteria, not
completed evaluation results or authorization for paid executions.

For each material claim record: case ID, language, claim text/type, cited passage
and document version, support/contradiction/insufficient label, applicability and
freshness findings, citation correctness, critical fee/deadline errors, reviewer,
review date and notes. Score citation integrity separately from semantic support.
Also label the expected service route and expected abstention for each question.

Report dataset sizes, denominators, exclusions, disagreements and adjudications.
Measure the proposed 95% supported-claim, 90% routing and 90% abstention thresholds;
require no known fabricated fees/deadlines and no unresolved critical failures.
Publish no invented scores. Independent human judgment must not be replaced by an
LLM label, substring check, model confidence or synthetic expected outcome.

If required evidence/review is absent, record PARTIAL and the missing inputs.
If thresholds fail, remediate within Phase 7 and rerun the relevant evaluations.
If all required criteria pass, update [PHASE_7_REPORT](PHASE_7_REPORT.md) and the
[checkpoint](CODEX_PROGRESS.md). Public release still requires its separate gates;
do not begin Phase 8 automatically.
