# Source policy

Phase 7's [answer boundary](PHASE_7_REPORT.md) reuses this policy and the existing
restricted eligibility projection at delivery, after generation/support review.
Neither model text, a quote match nor a mock review grants official approval.
Known conflicts and changed eligibility withhold claims; publication dates remain
unknown when missing. Real independent claim applicability/entailment review is
still required. No source was onboarded or requested during this phase.

Phase 6 retrieval uses the existing publication policy for lexical, semantic,
embedding-batch and delivery boundaries. A model profile approval is a configuration
permission, not government-source verification. Metadata appearance, successful
extraction, a stored vector or a high score never grants publication eligibility.
Known service conflicts withhold affected evidence and propagate a bounded hold
flag, including ambiguous supported-service scopes. No newest-document/legal
authority decision is invented. Stale/withdrawn/pending/current-version changes
are rechecked in SQL before evidence is returned. No real source was onboarded or
government website accessed in this work. See [PHASE_6_REPORT](PHASE_6_REPORT.md).

Status: Phase 0 proposal for review. Checked 2026-10-18 (Asia/Dhaka).
No government website, service fact, fee, deadline, or source registry entry has
been approved or tested by this work. P15 implements private provenance, review,
check/conflict metadata and fail-closed SQL eligibility guards described in
[DATABASE](DATABASE.md). P18 now implements the protected registry/review workflow
with synthetic local verification only; see [P18_REPORT](P18_REPORT.md). No real
government source was reviewed or approved. Crawling, monitoring, real source
research remain separately authorized operations. Phase 5's protected document
review SQL workflow and offline processing are now implemented as described below.

## Phase 5 implemented extraction and freshness rules

P29 consumes these rules through an internal keyword projection, documented in
[P29_REPORT](P29_REPORT.md). Its `p29-eligible-v1` contract additionally withholds
versions flagged possible_personal_data, instruction_like_content, corrupt_text
or low_ocr_confidence, even if a parent review exists. Acknowledgement alone does
not clear these retrieval holds; correction requires a reviewed replacement
derivative. OCR/layout flags alone still require the existing explicit human
review. Source-link holds, ownership expiry, revoked reviewers, noncurrent versions
and unresolved related-service conflicts are not ranking penalties: they exclude
evidence. Future lexical/semantic/fusion branches must share this policy boundary.
An internal match is untrusted evidence data, not a verified actionable claim or
delivery authorization. No real source approval or coverage is implied.

[PHASE_5_REPORT](PHASE_5_REPORT.md) records local synthetic execution only. A
government-looking URL, HTTP 200, successful extraction, hash or OCR confidence
never approves facts. Domain authenticity, content authority, access/terms,
crawler permission, freshness and human publication remain distinct gates.

Snapshots/derivatives preserve bytes, source/policy/capture lineage, hashes, exact
version/profile, raw-text spans, HTML DOM/section offsets and PDF physical pages.
Displayed page labels remain unknown when absent. Publication/effective dates
remain null; neither PDF metadata nor retrieval time invents them. Links extracted
from HTML are private untrusted metadata, never discovery permissions.

OCR runs locally only where native text is sparse/corrupt. Bengali/English model
hashes, renderer/engine/config, page image hash/dimensions and confidence are saved.
Every OCR page needs explicit human review, including fees/dates/numbers and layout;
native PDF layouts and HTML tables also carry review flags. Suspected personal data
or document instructions remain quarantined. An independent reviewer must explicitly
acknowledge the complete flag set and supply current evidence; software does not
establish semantic correctness or approve its own extraction.

Changed bytes or an approved redirect to a different identity suppress prior
current evidence before parsing; failure cannot leave changed old facts live.
404/410 records withdrawal. Other fetch/parser failures conservatively record
unavailability and withhold trusted guidance; none renews freshness. Identical
validated bytes can record a matched content check after processing, without
extending human/domain approval or official dates. HTTP 304 is not implemented:
the current crawler requires full bytes and never invents a snapshot.

Default due intervals are six hours for critical and 24 hours for general sources,
configurable through protected owner/administrator SQL within one-hour to one-day/
one-week bounds. These are effort targets and do not extend the hard seven-/30-day
eligibility deadlines below. Transient work retries at most five times with
backoff/jitter and bounded 503 Retry-After (up to 24 hours); 429/access/robots/
security/parser failures quarantine for review. Three failed checks impose a
24-hour scheduling cooldown for transient retries. Failure quarantine and exhausted
retries persist a target hold until protected owner/administrator review/resume;
the scheduler cannot silently re-admit them. No scheduler is running and controls
default paused.

Unchanged reacquisition reuses immutable bytes/profile, while changed extraction
profiles create new derivatives requiring review. Historical snapshots/locators
remain immutable. Append-only human passage decisions avoid rewriting extraction
quality. Review revocation removes current evidence and cancels indexing readiness.
Phase 6 will implement indexing/retrieval; there is no automatic outbox consumer.

## Ownership and contract boundaries

P19-P21 adds independently evidenced identity-metadata publishing, approved service
relationships and public DB-backed directory mode; see [PHASE_4_REPORT](PHASE_4_REPORT.md).
The owner explicitly excluded real onboarding in this task. No real government
record or live check is implied by positive disposable-fixture tests. P18 approval
and all document-version/publication/freshness gates remain intact.

P21 link requests are blocked until approved isolated-worker network controls
exist; they have a request time but no actual checked time. Private health history
uses not_checked, healthy, redirected, temporarily_unavailable, suspected_broken,
confirmed_broken, verification_blocked and manual_review_required. The current API
can only record blocked requests. Offline observations/classification are tests,
not real verification. Three transient failures flag review; a single 403/CAPTCHA
requires access review rather than a permanent broken label. Link health never
approves ownership/content, renews freshness or grants crawler permission. Review
flags withhold public links without rewriting the original approval audit.

P17 now exposes a reviewed identity-metadata projection only. Release records
require independent active staff creator/reviewer, current revisions and expiry;
raw publication labels cannot alone produce public rows. Public source summaries
also require eligible current document evidence, but explicitly remain
`metadata_only` with `evidence_eligible:false` because they are not a claim/citation
delivery interface. No government source has been approved. P18 implements the
protected audited onboarding/review workflow; no direct-production-SQL shortcut,
automated fetch or crawler permission is authorized by that workflow.

Implemented review states are draft, pending_review, approved, rejected and
suspended, independent of operational candidate/verified/active/suspended/retired.
Approval requires current ownership and authority excerpts/references/methods,
check and expiry times (at most 90 days), content-use evidence and a separately
recorded availability assertion. It does not infer a publication date. Activation
requires accessible evidence within seven days for critical or 30 days for general
sources, current approvals and fresh MFA. Creator/editor/submitter cannot review
their own work. Critical sources need a different second reviewer for activation;
once critical, downgrading the risk label cannot remove this requirement.
Descriptive edits reset trust; rejected/suspended sources need resubmission and
fresh approval. Retired identities are not resurrected. URL identity changes need
a separate candidate, preserving history. Every change appends a private audit
event and transactional outbox record. No outbox consumer is running.

Registry approval does not approve document content or grant crawler permission.
No HTTP/DNS check occurs on submission. Reviewers must obtain independent evidence
outside this implementation before real onboarding. Stored proof and availability
remain staff assertions. An activated registry row alone remains publicly absent
without P17's separately eligible current document and reviewed agency/domain.
The initial path scope is not a crawler allowlist; future ingestion requires an
explicitly reviewed path/redirect/permission and destination-IP policy.

This document owns source verification, publication eligibility, freshness,
withdrawal, and conflict rules. [DATABASE](DATABASE.md) owns entity definitions;
[ARCHITECTURE](ARCHITECTURE.md) owns API contracts and component boundaries;
[AI_SYSTEM](AI_SYSTEM.md) owns retrieval and answer behavior. The same eligibility
policy applies to directories, curated guides, search results, chatbot answers,
citations, caches, exports, and future audio. A government-looking hostname or a
high retrieval score is never sufficient evidence.

The proposed trust owner is accountable for these rules. Source editors collect
evidence; reviewers approve ownership and document publication. Operations can
suspend a source immediately. Named people, coverage, and response schedules must
be assigned before a pilot; these role names do not claim a staffed service.

## Official-source verification

1. Create a private candidate with a discovered URL, discovery provenance, claimed
   agency, purpose, language, jurisdiction, and proposed risk class. Do not ask a
   language model to invent or complete a government URL.
2. Verify official ownership using independent, current evidence: links from an
   already verified parent agency, official published contact/domain information,
   or an independently corroborated ownership record. Preserve the evidence URL,
   exact passage or record, check time, reviewer, and reasoning. Circular links
   between unverified sites do not establish ownership.
3. Check the destination, exact host, TLS result, redirect chain, advertised
   service responsibility, reuse conditions, and public accessibility. TLS proves
   a connection to a host, not agency ownership or factual correctness. A
   governmental suffix alone does not approve a source; official third-party
   hosting needs explicit ownership and scope evidence.
4. Record allowed hosts and path scope, approved redirects, risk/freshness policy,
   robots outcome, rate limits, publication restrictions, and any uncertainty.
   Stop on a CAPTCHA, authentication, access denial, suspected compromise, or
   unclear permission. Record the limitation rather than claiming a successful
   check. No government login, automated CAPTCHA solving, or access bypass.
5. A reviewer approves the ownership record. A second reviewer must approve a
   critical source's initial activation and material changes. Review evidence
   expires after a proposed maximum of 90 days; ownership, host, or redirect
   changes require earlier review. A shorter interval may be assigned by risk.

Verification establishes ownership within an approved scope. It does not certify
every page, approve a service fact, confer government endorsement, or authorize
transactions. Ask Bangladesh remains an independent information service.

## Source and document lifecycle

| Source state | Meaning | Public/actionable use |
| --- | --- | --- |
| Candidate | Discovered, ownership unproven | Private review only |
| Verified | Ownership evidence approved and within its review period | No actionable publication until activation and document review |
| Active | Verified owner plus approved scope and monitoring policy | Only separately eligible document versions and passages |
| Suspended | Trust, permission, compromise, ownership expiry, or unresolved concern | Excluded from new actionable output immediately |
| Retired | Deliberately discontinued or replaced | Historical provenance only; no new actionable output |

The normal transition is candidate to verified to active. A suspended source can
return through verification and activation review; retirement is retained in the
audit history. Do not delete a record to hide a mistake or reuse its identity for
a different host. Public registry entries show only reviewed safe fields, with
their status and dates; private notes, raw snapshots, and reviewer identities do
not leak through the directory.

Document processing has separate capture, extraction, review, approval,
publication, supersession, withdrawal and quarantine stages. The canonical stored
review states and selected publication pointer belong in [DATABASE](DATABASE.md);
these stage descriptions do not introduce competing state enums.
New bytes, a changed parser, a corrected OCR transcription, or changed passage
boundaries create a new immutable version/derivative, never an in-place rewrite
of the version cited by an old answer. Approval and publication are distinct.

## Publication eligibility

A material actionable claim includes a required step, document, eligibility
condition, fee, payment channel, deadline, processing time, office destination,
contact, exception, or instruction likely to affect a citizen's action. Every
such claim must map to a reviewed passage supporting the exact scope and wording.
Translations and summaries preserve conditions, units, dates, and uncertainty.

At initial launch, fee, deadline and eligibility assertions must additionally
resolve to reviewed `service_claims` with exact eligible `claim_evidence` mappings
defined in [DATABASE](DATABASE.md). A model cannot introduce or calculate a new
critical value from loosely related passages. Omit it or abstain when no reviewed
claim exists. Other material instructions still require exact passage support.

At both retrieval and final delivery, require all of the following:

- The source is active, within its approved host/path scope, and has unexpired
  ownership verification with no trust or access restriction that forbids use.
- The document version is reviewed, published, current for the relevant service,
  jurisdiction, audience, language, and effective interval. Its snapshot and
  extraction lineage are intact and its referenced passage locators resolve.
- Its content check remains within the assigned risk TTL. A successful fetch is
  not itself a document review. An effective date does not prove freshness.
- The supporting passage actually entails the claim, and all material qualifiers
  are represented. Citation existence alone does not prove entailment.
- There is no unresolved material conflict, withdrawal, changed-content hold,
  quarantine, or superseding version affecting the claim.
- The public projection, cache entry, and answer reference the current policy
  generation and remain eligible at the time of delivery.

If a dependency fails, suppress the affected claim. Provide a clear uncertainty
message and eligible official navigation where available; do not fill gaps from
model memory or silently fall back to stale evidence. Independently supported
unaffected claims may remain, with their own citations. Human approval cannot
override an expired clock or an unresolved material conflict without new evidence.

## Freshness policy and clock semantics

These proposed defaults are review targets, not statements about how frequently
Bangladesh agencies update information. The trust owner may shorten them per
source/document. A longer interval requires documented risk evidence and review
before changing policy; it never extends expired evidence retroactively.

| Risk class | Example content type | Maximum content-check age | Proposed scheduler target |
| --- | --- | --- | --- |
| Critical | Fees, deadlines, eligibility, required documents, application/payment steps | 7 days | Recheck daily where permitted |
| General | Agency description, explanatory background, stable navigation | 30 days | Recheck weekly where permitted |
| Ownership verification | Agency control and approved source scope | 90 days | Review before expiry and on anomalies |

A mixed passage/document inherits the shorter applicable TTL. A critical source
can have a shorter interval for a changing notice or deadline. The scheduler is
an effort target; late jobs never extend eligibility. Maintain separate times:

| Time | Meaning | Can renew content freshness? |
| --- | --- | --- |
| Fetch attempted at | A request was tried, including errors | No |
| Snapshot fetched at | Specific response bytes were acquired | Only after validation against the reviewed version |
| Content last checked at | Validated evidence that the reviewed digest is still current at the approved URL/redirect chain | Yes, under the rules below |
| Reviewed/published at | Human approval and release decisions | No, unless accompanied by a valid content check |
| Official effective from/to | When the agency says a rule applies | No |
| Next check due / expires at | Scheduling and hard eligibility deadline | Determined by content check, policy, effective interval, and ownership expiry |

Store instants in UTC. Show clearly labeled last content check, applicable
effective date, and warning dates in Asia/Dhaka, with locale-appropriate Bangla or
English formatting. Do not label a fetch attempt as "verified today." A missing
official effective date stays unknown; do not infer it from download time, a
file name, HTTP Last-Modified, or PDF metadata.

A valid HTTP 200 response with the identical digest may renew a content check
only after verifying expected MIME type, approved origin/redirect chain, and
absence of an error/login/CAPTCHA page. HTTP 304 is meaningful only when tied to a
previously reviewed digest and its saved validators, approved exact URL and
redirect chain, and still-valid ownership scope. It cannot approve a new document
or compensate for missing bytes. Preserve the 304 check event without inventing
a new snapshot. Validator anomalies trigger a full permitted fetch/review.

A changed digest opens a review hold for affected claims immediately. Diff the
content, preserve both versions, and require review before publishing changed
facts. Do not continue serving an old version merely because its old TTL has not
elapsed. A parser can identify likely cosmetic changes, but it cannot approve
material changes autonomously in the initial design.

Timeouts, 429s, 5xx, denied access, and failed extraction never renew freshness.
Respect Retry-After and back off. A transient failure may leave previously checked
evidence eligible only until its existing deadline if no trust/withdrawal concern
exists; show the last successful content check. 404/410, explicit withdrawal,
ownership anomaly, or confirmed compromise immediately suppress affected claims.
Expired information is excluded from actionable output even if no replacement
exists. A source directory may retain an informational stale entry with a clear
warning and last check date; it must not present stale steps or facts as current.

## Stable URL, snapshot, and passage evidence

Preserve the requested URL, normalized identity, approved canonical URL, final
URL, and every redirect as separate provenance. Normalize only rules proved safe
for that source: lowercase hostname, remove fragments for fetch identity, and
remove individually approved tracking parameters. Do not blindly drop query
parameters, reorder semantic parameters, decode path separators, or merge pages
by title. A canonical-link tag is untrusted input, not permission to fetch or merge.

The private immutable capture includes response digest, bytes, media type,
request/check time, relevant nonsecret headers, final origin, redirect record,
source identity, and acquisition method. Never retain authorization headers,
cookies, or credentials. Repeated identical bytes may share a content-addressed
object, while each fetch/check event remains separately auditable. Protect bytes
with write-once application semantics and integrity checks, not a promise that
ordinary storage is inherently immutable.

Preserve original bytes and an extraction manifest: parser/OCR and normalization
versions, language, quality flags, text digest, and parent snapshot. HTML passages
need a versioned text range, heading context, quoted excerpt/digest, and a stable
within-snapshot locator; a live DOM selector alone is insufficient. PDF passages
need physical page index plus displayed page label where present, excerpt/digest,
and coordinates when reliable. OCR adds page image linkage, engine/traineddata
version, and reviewed transcription. Locators are immutable within a version;
reprocessing produces new ones and an explicit lineage relation.

Citations use only registry-backed official URLs and stored passage/version IDs.
They display title, agency, relevant page/section, effective date if known, and
last content check, using only reviewed metadata supplied by the citation/source
contracts in [ARCHITECTURE](ARCHITECTURE.md). Private object URLs and internal notes are never public
citations. A source being official does not prove permission to republish its
entire document: preserve the minimum supporting excerpt and review reuse terms.
Historical citations retain an unavailable/superseded status rather than silently
pointing to different evidence. Public serving of archived bytes needs a separate
rights/privacy decision; private audit retention is not automatic publication.

## Ingestion and review

Use the isolated Python worker and durable job protocol in
[ARCHITECTURE](ARCHITECTURE.md), with controls in [SECURITY](SECURITY.md).
Discovery creates candidates; it never recursively authorizes newly found hosts.
Fetch only public, approved scoped resources. Record inaccessible sources and
the cause. A link to a restricted document does not authorize its acquisition.

Proposed pipeline: scope/permission check, controlled fetch, quarantine, digest and
MIME validation, extraction, language/encoding checks, text quality review,
document classification/effective-date review, passage generation, conflict
analysis, human approval, embedding/index preparation, and atomic publication.
Keep raw ingestion tables and objects private. Only a reviewed projection is
queryable by the public BFF. Failed or partial stages cannot publish themselves.

Unpublished/quarantined or stale-current captures have a proposed 30-day review
limit; if required review and freshness requirements are not both satisfied by
then, withdraw them and
apply the superseded/withdrawn evidence deletion schedule. Current stale versions
cannot remain indefinitely simply because no newer version exists. Privacy or
access removal can require earlier deletion. The canonical retention schedule
and owners are in [SECURITY](SECURITY.md).

For HTML, preserve headings, lists, table headers, footnotes, and linked-form
context. Trafilatura is a candidate extractor, not an authority classifier. Do
not execute scripts or follow embedded instructions. Initially defer sources
requiring a browser render until a separately reviewed isolation approach exists.

For text PDFs, compare extraction against rendered samples and preserve page
boundaries. PyMuPDF remains conditional on license review; pypdf is a candidate
for text-bearing PDFs, with measured layout/locator quality required. For scans,
use a separately licensed renderer and Tesseract Bengali (`ben`) and English
(`eng`) traineddata as candidates. Language support does not establish usable
accuracy. OCR numbers, negations, dates, fees, table relationships, and required
documents require visual human review against the page before actionable use.
Low confidence, garbled Bangla, missing pages, or uncertain tables block publication.
Do not silently correct an official value using model guesses.

## Robots, access, and respectful collection

P22's implementation is opt-in and has no live-approved records. See
[P22_REPORT](P22_REPORT.md). An active registry record alone does not authorize
retrieval. Fresh independent staff review must record exact same-host HTTPS
document and redirect URLs, permission/terms evidence and expiry. /robots.txt
retrieval is explicitly part of that permission decision, even when outside the
document path. No subdomain wildcard, query string, arbitrary citizen URL,
authenticated endpoint or inferred government API is admitted.

Each document fetch retrieves robots again through the pinned transport. A 404/410
means no stated robot restriction, while all separate approval gates still apply.
401/403/407/429, failures, redirects and non-text robots responses pause collection.
The implemented parser deliberately supports a conservative subset: union all
groups' simple disallow prefixes; allow rules never override them. Wildcards,
percent/anchor syntax, request-rate extensions, malformed UTF-8 or crawl-delay
above five seconds block for review. This over-restriction is not claimed as full
RFC 9309 matching. Sitemap directives do not trigger discovery or requests.

The global one-hop lease/five-second spacing after completion is stricter than
per-host concurrency; slow responses cannot consume the spacing window.
Maximum 100 requests per source over any rolling 24 hours includes robots and all
redirect/failed/abandoned hops. Review may lower request/size/redirect limits;
required delays beyond the supported policy remain blocked. Default byte cap is
5 MiB, robots cap 512,000 bytes, redirects default three/hard maximum five.
The document deadline is 30 seconds, connect/TLS caps five seconds, and stream
I/O timeout half a second. No automatic HTTP retry. An inactive scheduler cannot
revive expired policy. No successful fetch itself approves a document, updates
freshness checks or makes guidance publishable.

Honor robots rules, site terms, explicit restrictions, and source-specific limits.
The Robots Exclusion Protocol is not access authorization; see
[RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html) (checked 2026-10-18).
Proposed crawler policy is deliberately conservative: use a descriptive identity
with an approved contact page once one exists; one in-flight request per host;
at least five seconds between requests; and at most 100 documents per source per
day initially, unless a lower source limit applies. No contact URL is invented here.

Refresh robots within 24 hours before collection. A verified 404/410 for robots
means no stated robots rule, but the separate scope/terms approval is still
required. 401/403, 429, unreachable robots, ambiguous parsing, or unsafe redirects
pause collection for review or backoff; they do not authorize access. Follow
robots redirects only through the same network safety checks, up to five hops;
an unapproved destination pauses the job. These stricter choices are project
policy. Do not scrape search snippets or unofficial mirrors to bypass restrictions.

## Conflicts, corrections, and withdrawal

Compare normalized claims within the same service, jurisdiction, population,
effective interval, and condition set. Different scopes are not automatically a
conflict. Use deterministic checks for changed fees/dates/requirements and model
signals only as review aids. A later fetch timestamp alone cannot choose a winner.

On a material conflict, record both exact passages/versions, affected claim keys,
scope, first detection, owner, and status. Suppress the disputed actionable claim
and show uncertainty. Resolve only with explicit official supersession, a scoped
explanation backed by official evidence, or verified authoritative clarification.
Document reviewer reasoning and retained competing evidence. Do not assume that
an FAQ outranks a notice, that a parent agency always outranks the responsible
office, or that the more convenient number is correct. If evidence remains
ambiguous, keep the claim withheld and offer eligible official navigation.

Feedback is a signal, never publication evidence. Accept account-free correction
reports with passage/service references and minimal optional free text. Warn
against personal data; follow the retention policy in [SECURITY](SECURITY.md).
Triage critical alleged harm or compromise first; pause affected publication when
credible. Validate against official passages, create a new reviewed version or
claim revision, record the decision, and close the report without publicly
exposing the reporter. Notifications to people require a separately authorized
channel; submission does not authorize unrelated messages.

Suspension, expiry, conflict, or withdrawal increments the publication generation,
invalidates related curated pages, search projections, and answer caches, and
causes delivery-time eligibility checks to reject prior references. A rollback
may restore software or a projection only when current eligibility still passes;
it must never reactivate withdrawn evidence. See [DEPLOYMENT](DEPLOYMENT.md).

## Technical evidence and unresolved decisions

The following official project documents were checked on 2026-10-18. They support
technology selection, not a tested ingestion integration or an approved source.

| Evidence | Observed constraint and proposed response |
| --- | --- |
| [Trafilatura installation](https://trafilatura.readthedocs.io/en/stable/installation.html) and [project license](https://github.com/adbar/trafilatura) | Current installation guidance requires Python 3.10+; current package is Apache-2.0, with older pre-1.8 releases under GPLv3+. Select and lock a maintained release with transitive license review later. |
| [PyMuPDF licensing](https://pymupdf.io/licensing) | AGPLv3/commercial licensing is a material product decision. Resolve obligations or select an evaluated alternative before use; worker isolation is not a license waiver. No commercial purchase is authorized. |
| [pypdf license FAQ](https://pypdf.readthedocs.io/en/stable/meta/faq.html) and [text extraction](https://pypdf.readthedocs.io/en/stable/user/extract-text.html) | BSD-3-Clause text-PDF alternative candidate; no OCR, complex layout/coordinates and parsing memory need testing. A renderer for scans remains a separate selection. |
| [Tesseract installation](https://tesseract-ocr.github.io/tessdoc/Installation.html) and [language data](https://tesseract-ocr.github.io/tessdoc/Data-Files-in-different-versions.html) | Engine and language data are separate dependencies; Bengali `ben` is listed. Test real permitted Bangla scans before choosing traineddata, preprocessing, and quality thresholds. |

Open gates: identify real official candidates and ownership evidence in Phase 4;
approve reuse/retention rules, staffing and coverage; choose PDF licensing/renderer;
measure Bangla extraction and OCR; approve risk-specific TTL changes. No government
URL registry is seeded by this document. Acceptance requires executable denial,
freshness, conflict, lineage, and citation tests in the relevant phases, specified
in [EVALUATION](EVALUATION.md), not a declaration that these controls already work.
