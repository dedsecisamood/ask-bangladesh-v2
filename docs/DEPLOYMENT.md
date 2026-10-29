# Deployment and operations

Phase 7 adds local provider/answer ports and an opt-in API interface; see
[PHASE_7_REPORT](PHASE_7_REPORT.md). Set CHAT_MODE when building/restarting;
static routes may retain build-time settings. It never activates generation.
Production answers return 503 until a reviewed activation change establishes
trusted ingress/distributed admission, durable spending controls, approved hosted
protocol/credentials, support review and corpus quality. No Redis, new service,
cloud resource or deployment was introduced. The later approved
[Vertex adapter](VERTEX_AI.md) adds the Google Gen AI SDK only; no live activation.
The Phase 7 completion follow-up adds two local forward migrations for bounded
curated-claim support decisions. No public generation or administrative write
endpoint is enabled. [Human review](P41_HUMAN_REVIEW.md) remains an acceptance gate.

Phase 6 adds an optional local CPU model process; no service is deployed.
The public frontend still renders without model files or database credentials.
Free artifact setup and offline benchmark commands are in [EMBEDDINGS](EMBEDDINGS.md).
Normal CI runs deterministic/SQL regressions; heavyweight model download/evaluation
is manual opt-in. Hosted execution remains unverified. Production must choose and
review an isolated private worker, native memory/egress controls, capacity and
model/corpus approvals before connecting public questions. This local subprocess
adapter is not evidence of serverless deployment compatibility. No Google Cloud
resource, billable API, remote database migration or production identity was created.

Status: Phase 0 proposal, 2026-10-18 (Asia/Dhaka). Nothing is provisioned, deployed,
paid for, or load-tested. Explicit authorization is required for deployment, paid
operations and external transactional integrations. Completing a phase never
authorizes the next; [ROADMAP](ROADMAP.md) defines the gates.

## Initial operating shape

Phase 5 now implements local durable jobs, extraction/OCR and private storage;
see [PHASE_5_REPORT](PHASE_5_REPORT.md) and
[worker setup](../workers/ingestion/README.md). No worker service, cron, cloud
bucket, firewall or paid resource was deployed. Build the local sandbox with
`npm run parser:build`, then verify it with `npm run test:parser`; source documents
are never downloaded by those commands. Build-time public package downloads are
separate from the runtime container, which has network none and no host mounts.

Before any live activation: approve exact sources/terms/contact identity, deploy
independent SSRF egress denial, provision a dedicated restricted worker login,
private storage/IAM and recovery/retention, resolve native dependency inventory
and advisory review, evaluate real permitted multilingual documents with human
reviewers, define monitoring/alerts/operator response, then obtain owner approval.
Do not use a development Docker daemon or migration-owner connection as runtime
infrastructure. SQL controls remain paused and Python network_ready defaults false.

Operational calls are documented SQL capabilities, not public endpoints. Fresh
bound MFA owner/administrator `app_staff.set_ingestion_state` changes pause/check
intervals and appends audit; authorized inspect capability can call ingestion_status.
Use existing online authentication/session binding first. Worker metrics expose
state/error counts, due jobs, oldest-ready age, expired leases, open source circuits
and pending index review, with no raw text. No alert exporter/on-call system is
connected. After a pause, in-flight parsing may finish locally but cannot commit
under a failed live lease. Never bypass the gates with direct production table edits.

P16/P17 select Supabase Auth for the locally tested staff identity foundation;
this does not provision or approve a hosted project. See
[PHASE_3_REPORT](PHASE_3_REPORT.md). Deployments must supply separate restricted
askbd_web/askbd_staff database connections, a publishable/anon Auth key (never
service-role), the approved Auth URL, exact HTTPS APP_ORIGIN and random
CURSOR_SIGNING_KEY. Keys stay server-side. Do not use the local Docker secrets,
local Auth admin helper, HTTP gateway or migration-owner account in production.

Configure provider signup off, individual staff identities, MFA, recovery and
session policy before hosted access. Protect the public BFF from direct runtime
credential access. The existing frontend demo still builds and renders with all
Auth/DB settings absent. Public APIs then fail unavailable; they never fabricate
an empty directory during configuration/database failure. Remote CI and hosted
identity/TLS/recovery/backup exercises are unverified until executed.

Use one Next.js App Router application and BFF on the Node.js runtime, PostgreSQL
with pgvector, private object storage, and a separately isolated Python ingestion
worker. Supabase is an option for database/storage/admin identity, not an approved
provider. Keep model and embedding interfaces separate and configurable. The BFF
does not run long ingestion/OCR tasks or fetch arbitrary source URLs.

Start with durable PostgreSQL jobs, leases, retries and an outbox/publication
mechanism; do not add Redis or a second application API by default. Node 24 LTS
is the proposed maintained runtime family, subject to a fresh compatibility and
support check when Phase 1 pins dependencies. Framework minimum runtime support
is not a maintenance guarantee. Python release, container images, Postgres/
pgvector extension versions, tooling pins and hosting topology remain unselected.
Canonical decisions and API/job contracts are in [ARCHITECTURE](ARCHITECTURE.md).

Current technical evidence for Python, extractors, OCR and their licensing is
recorded with exact primary links in [SOURCE_POLICY](SOURCE_POLICY.md). In
particular, [Trafilatura installation](https://trafilatura.readthedocs.io/en/stable/installation.html)
documents Python 3.10+; this is a compatibility floor, not the eventual maintained
runtime pin. [PyMuPDF licensing](https://pymupdf.io/licensing) and the
[pypdf license FAQ](https://pypdf.readthedocs.io/en/stable/meta/faq.html) identify
the PDF licensing tradeoff. References were checked 2026-10-18; no integration
or license-compliance conclusion is claimed.

## Environment isolation

| Environment | Permitted data and behavior | Required isolation |
| --- | --- | --- |
| Local development | Synthetic fixtures and approved public evidence only; provider adapters stubbed by default | Developer-local secrets; no production credentials or copied citizen data |
| CI and previews | Synthetic/deidentified fixtures; no paid/provider network calls by default | Read-only/minimal CI permissions, ephemeral DB/storage if later authorized, no production secrets |
| Staging | Production-like configuration with approved test sources; all external spending separately capped | Separate database/project, storage, auth, keys, budgets, jobs and hostnames; authenticated access and no indexing |
| Production | Only reviewed eligible projections and explicitly approved personal-data classes | Separate service identities, projects/buckets, network boundaries, backups and incident access |

Do not rely on a database schema or environment variable alone to separate staging
from production. Deny cross-environment credentials and storage access. No real
citizen questions in staging/CI. Preview deployments cannot inherit production
secrets or call paid providers. Staging crawls must not double load on official
sites: use approved fixtures unless live checks are separately scheduled and
authorized within the source limits.

Choose hosting only after reviewing geographic placement, data-transfer/provider
retention, Node runtime support, private worker egress/isolation, pgvector and
Postgres compatibility, connection limits/pooling, object storage permissions,
backup coverage, cancellation behavior, and measured budget. No particular region,
free tier, price, availability SLA, or vendor contract is assumed.

## Build and release controls

Phase 1 should create reproducible lockfiles and development tooling only after
architecture review. Later pipelines must record source revision, toolchain,
dependency/license inventory, migrations, configuration revision, corpus/policy
generation, model/embedding configuration and evaluation report. Keep build-time
public variables separate from runtime secrets. Publish no secrets in source maps,
artifacts, browser bundles, containers or logs.

Proposed release sequence, to be executed only in the authorized phase:

1. Review changed files and phase scope; run type/lint/unit/integration and relevant
   browser/accessibility/security tests required by [EVALUATION](EVALUATION.md).
2. Scan dependencies/secrets/licenses and verify maintained runtime versions.
   Obtain a clear decision on PyMuPDF before adoption: its AGPLv3/commercial
   licensing is material; isolation is not a substitute for review. Evaluate
   pypdf for text PDFs and a separately licensed renderer if an alternative is
   needed; measure extraction/locator/OCR quality rather than assuming parity.
3. Rehearse migrations and restore against an isolated staging copy of approved
   nonpersonal data. Confirm backup manifest, schema compatibility, budget
   controls, authorization denials and source eligibility invalidation.
4. Prepare the exact build/configuration, impact, price estimate, owner, rollback
   revision, health checks and current evidence/evaluation report for review.
   Obtain explicit deployment/paid-operation authorization before changing live
   services. An earlier approval covering the exact action remains valid.
5. Deploy a limited rollout; keep old compatible code available, observe errors,
   latency, budget reservations and grounding/citation signals. Expand only while
   approved thresholds pass. Revert or disable the affected feature on failure.

Deployments require least-privilege CI identities, protected approvals for
production changes, secrets supplied at runtime, and append-only release audit.
Avoid destructive migrations: use expand, dual-compatible code, backfill and
later contract steps, with backup and rollback implications reviewed. A rollback
of code does not automatically roll back data. Never run migrations from every
request or start multiple uncoordinated migrators.

## Durable worker operations

The database holds authoritative job state. Workers claim available work in short
transactions, use leases and a monotonic lease/fencing token, heartbeat long jobs,
and acknowledge only under the matching live token. Long parsing/fetching occurs
outside the claim transaction. A stale worker must not publish or overwrite a
newer attempt after losing its lease. Proposed defaults: 5-minute lease,
30-second heartbeat, bounded to stage deadlines in [SECURITY](SECURITY.md).

Use idempotency keys from operation, document/source identity and version. Writes
are transactional or content-addressed; retries cannot duplicate publication,
usage charges or source activations. Retry transient failures with exponential
backoff and jitter, honor Retry-After, and stop after five attempts before a dead
letter review. Permission/security failures and uncertain paid requests do not
blindly retry. Record metadata only, no citizen text in job payloads or errors.

Set per-source and global concurrency; keep the source crawl limits from
[SOURCE_POLICY](SOURCE_POLICY.md). Schedule fairness prevents one large source
from starving rechecks. Report oldest job age, expired leases, dead letters,
freshness deadlines, parser failures and worker saturation. Deleting/requeuing a
job is an audited operator action and cannot approve its output.

Publish reviewed revisions atomically. A publication outbox/generation update
drives projection and cache invalidation; if an update is delayed, final delivery
still checks current eligibility. Release corpus/index changes with versioned
manifests so a partially built index cannot become active. Rebuild embeddings in
parallel versioned indexes, test coverage/recall, then switch atomically; keep
vendor/model/dimension metadata so incompatible vectors cannot mix.

PostgreSQL documents `SKIP LOCKED` as useful for queue-like consumers rather than
general consistent reads; see [SELECT](https://www.postgresql.org/docs/current/sql-select.html),
checked 2026-10-18. This supports the initial queue proposal; leases, fencing,
idempotency and recovery are now locally implemented/tested in Phase 5. Reconsider a
dedicated queue only after measured contention, backlog or fan-out demonstrates
need; do not claim the initial system has been load-tested.

## Spending controls and graceful degradation

There is no approved operating budget or paid provider. Paid features remain off
until a budget owner approves provider, price schedule/currency, per-call maximum,
daily and monthly global limits, staging limits, concurrency and alert contacts.
Missing or stale price data or an unavailable budget store disables paid calls.
Free-tier availability is not permission to create a billable account or service.

The proposed mandatory cost ledger uses the [DATABASE](DATABASE.md) entities and
[ARCHITECTURE](ARCHITECTURE.md) API contracts:

1. Before every model, embedding, speech, batch or paid retry call, calculate a
   conservative upper bound from capped input/output tokens or units, current
   approved pricing, and required overhead. Reject requests without a bounded
   maximum. Do not depend on the model to obey a token limit.
2. Atomically reserve that maximum against both daily and monthly environment/
   provider/global budgets, counting actual spend plus every open reservation.
   Use a transaction/locking rule preventing concurrent overspend. Deny if any
   ceiling would be exceeded or if the ledger cannot be reached. Reserve first,
   call second; a UI meter alone is not a hard cap.
3. Give the reservation an idempotency key and provider attempt identity. Record
   provider request ID/status and settle from actual verified usage; release only
   the proven unused amount. Price revision and currency remain attached.
4. A timeout, client disconnect, lost response, or reservation lease expiry does
   not prove the provider did no work. Keep the conservative charge/reservation
   until reconciled or conservatively settled to its maximum; never automatically
   release it and issue a free retry. A retried uncertain attempt needs its own
   reservation unless the provider's documented idempotency proves no extra charge.
5. Reconcile provider usage/bills with the ledger daily where supported. Alert on
   mismatch; disable that provider if charging cannot be bounded. Only an audited
   approved budget change can raise a ceiling; workers and anonymous callers
   cannot change it. Budget reset boundaries use explicit UTC periods, while UI
   dates/times display Asia/Dhaka and name the reset timezone.

Proposed alerts occur at 50%, 80%, and 95% of approved daily/monthly ceilings;
100% denies new paid work. Initial maximum cost per answer, actual budget amounts,
provider concurrency, and currency conversion cushion remain approval gates,
not invented estimates. Cloud hosting, storage, egress, OCR CPU, backups and
observability need their own quota/retention/concurrency limits and approved
provider budget controls; the model ledger cannot guarantee a hard cap on an
unbounded infrastructure bill. Disable autoscale beyond the approved maximum.

When generation is disabled, exhausted, timed out, or ungrounded, serve eligible
curated guidance and keyword/search navigation with honest status. Do not present
an old answer as current to avoid a paid call. Source outages cannot be solved
with model-memory facts. Keep the independence notice, basic directory and help
states accessible even when paid generation is unavailable. No transactional
fallback is permitted.

## Monitoring, objectives, and on-call readiness

Proposed beta objectives are hypotheses until measured: 99.5% monthly public
information availability, 95th percentile cached directory response within one
second, and a completed or clearly failed answer by a proposed hard deadline of
20 seconds. The distinct validated-answer latency benchmark and completion-rate
release gates are canonical in [EVALUATION](EVALUATION.md). Measure at
the BFF and separately on representative Bangladeshi mobile connections; do not
declare a client experience from server timing alone. Accessibility and low-
bandwidth acceptance are in [DESIGN_SYSTEM](DESIGN_SYSTEM.md) and
[EVALUATION](EVALUATION.md). These targets must not weaken evidence checks.

Monitor success/error/abstention counts, latency, source age, expired evidence
suppression, unresolved conflicts, citation failures, generation/provider errors,
queue age, lease/retry/dead-letter counts, storage/DB growth, RLS denials, admin
changes, deletion lag, backup age, restore drill status, and cost reservations.
Only structured nonidentifying telemetry is retained under
[SECURITY](SECURITY.md). No prompts, completions, page bodies or raw citizen
queries in traces or alerts. Alerts need a named owner and an authorized channel;
none is configured in Phase 0.

Before beta, define staffing hours, severity response times, contacts, escalation,
maintenance policy, public status language and incident communications approval.
A proposed critical alert target is acknowledgement within 30 minutes during
declared pilot coverage. If that coverage cannot be staffed, constrain beta hours
and published expectations; do not imply 24-hour operations.

## Backup, restore, and rollback

Proposed beta recovery objectives: recovery point at most 24 hours and service
recovery within 8 hours. These are acceptance targets, not achieved guarantees.
Capture encrypted database backups at least daily with a 30-day rolling retention
window, and separately preserve private object bytes plus a digest/version
manifest aligned to the database snapshot. Store recovery copies in a separate
failure boundary with restricted credentials. PITR may be evaluated if an approved
plan and budget need it; it is not assumed available for free.

If Supabase is chosen, database backups do not include Storage object bytes; see
[official backup guidance](https://supabase.com/docs/guides/platform/backups),
checked 2026-10-18. The older attempted `/docs/guides/database/backups` route could
not be read during research; the official platform guide was located instead.
Neither backup scheduling nor restore is tested in Phase 0.

Rehearse recovery before beta and quarterly thereafter, after major data changes,
or after a backup pipeline change. Restore into an isolated environment with all
public egress, schedulers, notifications and paid features disabled. Restore
schema, data, object versions and configuration compatible with the chosen
revision; recover secrets through a separate secure procedure, never in a backup
manifest. Validate object digests, passage locators, references, roles/RLS, counts,
publication state, and deletion tombstones; reapply withdrawals and deletions made
after the backup. Recheck current source freshness against the real current clock
before allowing answers. A restored historical published flag cannot revive
expired or withdrawn claims. Record measured RPO/RTO and discrepancies.

Application rollback selects a previous compatible immutable build/configuration,
with a staging rehearsal and monitored canary. Index rollback changes the active
manifest only after current eligibility checks. Database rollback is a separate
reviewed recovery decision, preferring a forward correction over destructive
downgrades. Verify schema compatibility before reverting code. Keep prior known-
good release IDs and a rehearsed manual disable path independent of the failing
feature. No rollback may bypass [SOURCE_POLICY](SOURCE_POLICY.md).

## Incident response

| Incident | Immediate containment | Recovery evidence |
| --- | --- | --- |
| Wrong critical guidance, source compromise or unresolved conflict | Suspend affected source/version/claims, bump publication generation, block stale cached delivery | Reviewed official replacement, impact review and trust-owner reapproval |
| Prompt injection or suspected parser exploit | Quarantine bytes, stop affected job/image/version, disable unsafe worker egress | Patched sandbox and regression tests against the preserved minimized sample |
| Credential exposure or account takeover | Revoke/rotate secrets and sessions, restrict admin operations, preserve audit metadata | Scope analysis, fresh least-privilege credentials and verified recovery |
| Provider outage or runaway costs | Disable provider/paid jobs, preserve uncertain reservations, use curated/search fallback | Reconciliation, approved limits and monitored recovery |
| Data loss or deletion failure | Stop affected writes/publication and isolate recovery environment | Restore manifest checks, tombstones reapplied and measured recovery objectives |

The incident lead records detection, impact, containment, owners, timeline,
evidence, correction and follow-up actions without saving raw citizen text. Apply
the incident-data retention schedule in [SECURITY](SECURITY.md). A source incident
is a trust problem even if infrastructure is healthy. A budget incident is not
solved by deleting ledger entries. Communication to third parties requires an
authorized channel and explicit authorization; review applicable notification
requirements before launch without inventing a legal deadline here.

## Go-live blockers and next task

Block public launch until official source coverage/ownership and publication
reviews exist, privacy/provider retention and region are approved, maintainers
are assigned, budgets and kill switches are verified, mandatory evaluation gates
pass, restore/rollback and deletion are rehearsed, and monitoring/escalation are
operational. Phase 10 is not permission to defer security checks until then.

The next task after explicit Phase 1 authorization is a reproducible local
development foundation with freshly verified maintained toolchain pins and CI
using synthetic fixtures. Provisioning services, live crawling, migration of real
data, paid API calls, and deployment remain outside that first foundation task
unless separately authorized. Stop at Phase 0 now.
