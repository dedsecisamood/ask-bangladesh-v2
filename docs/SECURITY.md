# Security and privacy

Pre-Phase-9 audit adds structured correction intake only. It rejects free text,
citizen identifiers, contacts and arbitrary URLs; consented category/page and
optional reviewed public-record UUIDs are the only payload. A separate restricted
writer holds no raw read/mutation grants. Queue size and request byte/time/count
limits are bounded; production remains closed until ingress/distributed controls,
retention automation and operator review are approved. No personal-data retention
or production identity was enabled. Directory and staff-login body readers now
also enforce a wall-clock deadline and strict UTF-8 without hanging on cancel.

## Phase 7 local answer boundary

The completion follow-up adds the bounded reviewed-claim SQL decision projection
and server adapter. PUBLIC/anonymous roles cannot execute it or read its tables.
It requires exact reviewed claims, independent current reviewers and immutable
eligible evidence; staff changes invalidate prior approvals. RAG repeats support
checks before delivery. This is curated support reuse, not a semantic verifier;
unreviewed claims remain withheld and public generation remains closed.

The later [Vertex adapter](VERTEX_AI.md) approval covers code and mock tests only.
It defaults disabled, requires a separate trusted code authorization to run, uses
server-only ADC and pinned Google endpoints, and never enables the public route.
No credentials were created/read and no cloud model requests were made.

[PHASE_7_REPORT](PHASE_7_REPORT.md) records bounded provider/context budgets,
strict model-output schemas, deterministic citations, post-generation restricted
SQL eligibility rechecks, independent support-review requirements and withheld
claims by default. No hosted provider/credential, public generation, citizen
history database or shared response cache is active. Production admission remains
closed. Client/server minimization is heuristic; prompts and schema validation
alone do not prove prompt-injection resistance or entailment. No model tools are
provided. Distributed budgets/limits, deployment logging, qualified human review
and actual provider/privacy approval are gates, not completed controls.

## P35 public question foundation

[P35_REPORT](P35_REPORT.md) documents implemented byte/time/Unicode/schema and
development-only global admission controls. Production returns 503 without
processing the question. No forwarding header is trusted as identity. No question
logging/storage, active retrieval or provider is enabled. Deployment ingress/
distributed admission, proxy logging, complete PII and real evidence quality
remain activation gates; this foundation is not production abuse protection.

## Phase 6 local model and retrieval boundary

See [PHASE_6_REPORT](PHASE_6_REPORT.md) and [EMBEDDINGS](EMBEDDINGS.md).
The new embedder capability has no raw table/read, source approval, admin membership
or publication grant. A forward role guard rejects unsafe privilege/inheritance
configuration, matching web/staff policy. Model approvals are private, append-only,
and bound to active owner/administrator membership revisions. SQL checks current
eligibility when selecting a batch, committing vectors, retrieving either branch
and returning the final evidence set. Model scores cannot override a conflict,
expired source check, changed version, unsafe extraction flag or review hold.

The local process accepts only bounded text tasks and pinned artifact identities;
it receives no database URL, API key, browser/session token or ambient provider
credential. Remote model loading and JavaScript fetch are disabled. One active
task, two CPU threads, killable 45-second deadline and idle shutdown bound work.
The heap ceiling does not bound native memory or establish OS network/process
isolation. Native model/runtime dependency review and deployed sandbox controls
remain gates. A compromised internal embedder could poison rankings for eligible
passages; immutability/profile integrity and later claim validation are necessary
layers, not a proof that vectors entail facts.

Identifier/email/URL minimization is heuristic and precedes inference. Original
questions and query vectors remain ephemeral; no application logging/cache or raw
citizen-question table is introduced. Database/proxy parameter logging and full
privacy hardening must be verified before a public question API. All retrieved
text remains untrusted data, including strings that look like commands or URLs.
No model executes tools, fetches government pages or writes an answer in Phase 6.

## P29 internal retrieval boundary

[P29_REPORT](P29_REPORT.md) records actual verification. An execute-only reviewed
SQL projection returns eligible passage content to the server-only BFF repository;
no raw-table grants, new HTTP route, browser credential or admin capability is
introduced. SQL and Zod independently enforce query/filter/bounds. Query syntax is
literal and parameterized. Error handling suppresses SQL/connection/projection
details and never disguises outages as real empty evidence. The shared result
schema rejects unknown/private fields and invalid citations/locators/scores.

The P29 forward fix explicitly binds passage_is_eligible to its requested UUID;
the prior lateral column shadowing could evaluate another reviewed passage.
Mixed eligible/pending/unknown-ID tests prevent borrowing another record's trust.
Source/domain/metadata/reviewer/current-version/freshness/conflict gates remain.
Additional retrieval exclusions cover possible_personal_data,
instruction_like_content, corrupt_text and low_ocr_confidence extraction flags,
even after a parent approval. Rank cannot override these holds.

Raw original queries and normalized terms are ephemeral server request context.
No logs, analytics, persistent traces, cache or questions table is added. Before
any future public question API, apply the planned identifier minimization/redaction,
request/rate/spending controls and log-parameter suppression at application,
database/proxy and monitoring layers. No public evidence endpoint is enabled by
P29. A keyword match never grants document text instruction authority.

## P22 isolated retrieval implementation

Phase 5 extension: see [PHASE_5_REPORT](PHASE_5_REPORT.md) for executed checks.
Hostile HTML/PDF bytes enter an unprivileged networkless disposable Docker parser,
with read-only root, no host mounts/secrets, all capabilities dropped,
no-new-privileges, 768 MiB memory, one CPU, 32 PIDs and a 128 MiB noexec temporary
filesystem. Input/output, tree/decompression, text/page/pixel and killable deadlines
are independently bounded. Actual limits below supersede the earlier proposals.

The pinned Python base and Python packages plus exact built image ID/source hash
bind derivative identity. Native Debian packages follow the base distribution's
repository; rebuilds may change them. Record the resolved image, tool/model hashes
and inventory; fresh vulnerability/license review is required before production.
Tests prove the local container controls, not absence of all parser vulnerabilities.
Docker is a trusted local prerequisite, never a worker-exposed socket/API.

Only HTML/PDF is accepted. No scripts/external resource fetch, shell interpolation,
PDF decryption or active/embedded/form execution. Encrypted/active/oversized/
unextractable files fail closed. OCR and layout uncertainty remain pending human
review, including critical-number checks. Possible-identifier/instruction flags
are conservative heuristics, not a complete redactor or prompt-injection defence.
No model consumes the content and no citizen uploads exist.

Private hash-addressed storage rejects traversal/link/junction/public-output paths
and verifies reads. POSIX modes are restrictive; Windows chmod is not proof of
production NTFS ACLs. A deployed private object-store/IAM policy, retention/purge
and approved safe reviewer viewing are still required before real ingestion.
Only stale staging files have a limited cleanup helper; immutable evidence is not
automatically deleted. Job errors/events contain bounded codes, not raw documents.
Worker SQL can only commit unapproved versions; independent fresh-MFA review is
the separate publication capability. Stale leases, pause, policy changes and
adverse checks prevent trusted delivery. No live enablement is included.

See [P22_REPORT](P22_REPORT.md) for executed tests and remaining operational gates.
Only a reviewed exact-URL policy and a dedicated worker SQL capability admit a
request. Authorization precedes DNS; every hop and delivery recheck revisions.
Numeric IPv4 socket pinning, public-address checks for every DNS answer, pre-HTTP/
post-TLS peer comparison, default certificate/hostname verification and explicit
redirect validation defend the resolver/connect boundary. Environment proxies,
cookies, authentication and compressed responses are unused. IPv6 is blocked.

Byte/header/framing/redirect/time budgets bound untrusted HTTP. Header reads check
an absolute deadline between bytes so slow-drip lines cannot rely on an inactivity
timeout alone. DNS has one bounded daemon lookup slot per resolver; timeout cannot
spawn unlimited threads. Cancellation is checked before work and during reads;
connect/TLS may take up to their five-second cap to return. CAPTCHA/login markers,
authentication/rate denial and ambiguous robots rules pause for review; markers
are conservative heuristics, not proof that every possible private page is detected.
Exact URL/terms review must exclude such content before retrieval.

The DB role cannot read raw tables or publish evidence. Per-hop reservations are
durable, globally serialized, expire after 60 seconds and include abandoned work
in budgets. Private manifests contain no response body/cookies/header dump/raw
exception. Safe database errors suppress returned bytes. SQL/driver credentials
stay outside the frontend and dataclass repr. Remote DB TLS cannot silently
downgrade; plaintext is allowed only in explicitly named disposable loopback tests.

No independent infrastructure egress firewall is provisioned or verified. Runtime
defaults to DISABLED and no live CLI, web trigger, scheduler or environment-enable
switch exists. Deployment must prove independent destination denials before
explicit live authorization. Python unit simulations and real PostgreSQL tests
do not establish production network enforcement or current government permissions.

Status: Phase 0 product security design, 2026-10-18 (Asia/Dhaka). Phase 1
configuration boundaries, local secret checks and remaining tooling risks are
recorded in [PHASE_1_REPORT](PHASE_1_REPORT.md). Future provider/access controls,
penetration tests and compliance certification are not implemented by that
foundation. Security starts with each relevant implementation phase; Phase 10 is
the integrated audit. See [ROADMAP](ROADMAP.md).

## P19-P21 directory controls

P19-P21 implementation/test scope and evidence are in
[PHASE_4_REPORT](PHASE_4_REPORT.md). Agency/category/service writes repeat online
MFA/binding/capability checks in HTTP and SQL; publication additionally verifies
independent creator/last-editor separation, current proof and fresh session.
Aliases/relationships invalidate old releases. No write API accepts roles, actors,
publication flags or synthetic-to-real promotion. Audit/outbox/retry records commit
atomically with updates. SQL identifiers come only from a fixed three-kind allowlist;
all user values are parameters. All 33 private tables have forced RLS and separate
grants; runtime roles cannot inspect raw review notes or write raw records.

Public search has strict same-origin JSON/body/query/limit validation and existing
DB connection/query timeouts. Search is POST and has no cookie, persistent query
record, raw-query cursor, analytics or logging addition. Rendered text uses React
escaping; exact official links are revalidated HTTPS and no-referrer with
noopener/noreferrer. Unavailable DB is distinct from an authentic empty list.
Published routes render without public caching so withdrawal is checked on every
new request; a previously open browser page is not remotely erased.

P21 makes no network request: the BFF has no source fetcher. Protected link-check
requests record blocked status, no checked timestamp, and a review flag. Private
history/integrity checks cannot claim ownership, content freshness or crawler
permission. Offline evaluator tests unsafe URLs, private/IPv6 addresses, mixed/
changed DNS peer observations, every redirect, TLS/size bounds, timeouts, access
restrictions and repeated failures. It is not a tested live resolver/transport.
IPv6, unapproved redirects and unknown GET permission remain blocked. Worker
network pinning and independent infrastructure egress restrictions are still
required before separately authorized live checks. No real source was contacted.

## P18 registry controls

P18 implements protected candidate/review commands; actual evidence and residual
limits are in [P18_REPORT](P18_REPORT.md). Owner/administrator/source_reviewer
may create/edit/submit/review; auditor can inspect selected records only. Every
command verifies an online MFA identity, bound session and active membership;
SQL repeats authorization and locks membership/source rows before mutation.
Approval and activation additionally require a session opened within five minutes.
Creator, last editor and submitter cannot approve/activate. Critical sources and
previously critical sources require a second independent activation reviewer.
Clients cannot supply actors, trusted statuses, releases or crawler permissions.

Mutations require configured Origin/Host, non-cross-site requests, strict JSON
at most 16 KiB, UUID idempotency key and optimistic source revision. Identical
24-hour retries replay a committed result; changed or expired keys conflict.
SQL serializes a budget of 30 new successful mutations per actor per minute;
this supplements session/edge controls, not a full internet-wide DoS defense.
Failed commands roll back before sanitized errors. State, immutable actor-bound
audit/outbox event and retry response commit in one transaction.

All 33 private tables enforce RLS with separate restrictive grants. The registry
functions use fixed search_path and explicit staff EXECUTE grants; no runtime
role gets raw-table writes. URLs are canonicalized and unsafe local/IP/credential
forms rejected without fetching or DNS lookup. Syntax checks do not establish
ownership or replace future worker DNS/IP/redirect/permission defenses. Proof
excerpts and submitted URLs are private; public projections expose neither.
Manual evidence can still be dishonest: independent accountable staff and real
source review are required before onboarding. No real source was approved here.

## Boundary and threat model

P16/P17 local implementation and real allow/deny evidence are in
[PHASE_3_REPORT](PHASE_3_REPORT.md) and [P16_REPORT](P16_REPORT.md). Supabase Auth
is selected for staff; no production identity is provisioned. Staff uses online
user validation, verified AAL2 claims and a random HttpOnly BFF binding stored as
a SHA-256 hash. Credentials/tokens are never returned through public APIs. Every
protected operation rechecks private active membership, role/revision and session
expiry (30 minutes idle, 12 hours absolute). Role changes invalidate sessions;
logout commits local revocation before provider signout. Form POSTs require the
configured Origin and Host, reject cross-site requests and duplicate/oversized
bodies, and use a DB-enforced global 30-attempt/minute authentication budget.

HTTPS staff cookies are Secure, HttpOnly, SameSite=Strict, host-only with __Host-
names. Plain HTTP staff testing is loopback-only. Authentication runs entirely
in Route Handlers, which can persist refresh cookies; no browser Auth SDK or
client session storage is used and no page-only authorization shortcut exists.
Responses are private/no-store; redirects are fixed internal paths. There is no
public signup, default account or role-assignment endpoint.

Current four-role mapping: owner (inspect/review/operate/manage_roles),
administrator (inspect/review/operate), source_reviewer (inspect/review), auditor
(inspect). These consolidate the earlier proposed capability inventory below;
billing/operator expansion is future scoped work. Only inspection/session
operations existed in P16/P17; P18 adds the scoped review commands above.
First staff provisioning/recovery requires trusted
offline operator access, independent identity confirmation and owner approval;
production provisioning/recovery exercises remain unverified release gates.

All 33 raw tables have forced RLS and independent grants. Public web connections
can call only the bounded reviewed-directory function; private staff connections
can call narrow authorization/inspection/registry functions. Definer functions
have fixed pg_catalog search_path, fully qualified objects, no dynamic user SQL and explicit
EXECUTE grants. No runtime role owns tables or has BYPASSRLS. Metadata release
reviews must be current and independently attributable before public selection.

Ask Bangladesh is independent of government. Basic informational questions and
correction submission do not require accounts. The initial service informs; it
does not log in to government systems, submit applications, verify citizen
identity, accept payments, or perform government transactions. Future audio,
public uploads, accounts, and authorized integrations each need a separate
threat/privacy review and explicit phase authorization.

Assets include citizen questions in transit/memory, official evidence lineage,
publication decisions, source integrity, administrative identities, credentials,
usage budgets, and service availability. Threat actors include anonymous abusers,
compromised official hosts, malicious document authors, stolen admin sessions,
misconfigured service roles, compromised dependencies/providers, and insiders.

| Boundary | Main threat | Required design control |
| --- | --- | --- |
| Browser to Next.js BFF | Abuse, XSS, CSRF, authorization bypass | Strict schemas/size limits, output escaping, CSP, rate limits, server authorization |
| BFF to database/storage | Excess privilege, direct raw-data exposure | Dedicated least-privilege roles; reviewed projections; private buckets; grants and RLS |
| Worker to Internet | SSRF, DNS rebinding, hostile redirects | Approved source scope, controlled egress, connection-time IP checks, per-hop validation |
| Untrusted HTML/PDF to parser/OCR | Code execution, archive/decompression bombs | Quarantine, patched sandbox, CPU/memory/time/size limits, no parser network |
| Passages to model | Prompt injection, exfiltration, fabricated instructions | Data/instruction separation, no tools/secrets, evidence-only output checks |
| Admin to publication | Account takeover, destructive changes | MFA, RBAC, reauthentication, second review, immutable audit |
| BFF/worker to paid provider | Budget races, repeated uncertain calls | Atomic cost reservation, hard ceilings, retry accounting, fail closed |

The component/data contracts live in [ARCHITECTURE](ARCHITECTURE.md) and
[DATABASE](DATABASE.md). Publication and freshness policy belongs to
[SOURCE_POLICY](SOURCE_POLICY.md). Security filters never transform a withheld
source into publication-eligible evidence.

## HTTP and browser controls

Require TLS in deployed environments. Use secure, HttpOnly, SameSite cookies for
administrative sessions; validate origin/CSRF tokens for mutations. Check server
session validity and required role on every privileged handler and server action.
Hiding a button or protecting only a layout is not authorization. Validate all
identifiers, enumerations, lengths, content types, and pagination before database
or model use; use parameterized queries and explicitly allowed sort/filter keys.

Render answer text as escaped content or a strict sanitized subset of Markdown.
Reject active HTML, scripts, embedded frames, model-created event handlers, unsafe
URL schemes, and arbitrary remote images. Link targets come from reviewed source
records, not model output. No user/retrieved HTML is passed unsanitized into the
DOM. CSP, MIME sniffing protection, restrictive frame policy, referrer policy,
and explicit CORS allowlists must be specified and tested when headers exist.
Do not place queries in URLs, analytics events, exception messages, or referers.

Return errors without stack traces, SQL, secrets, personal text, or provider
payloads. Use a random request identifier, which is not a stored transcript key.
Bound request body, query length, response length, concurrency, and time. Proposed
initial anonymous limit: 10 answer attempts per minute per short-lived rate token,
with stricter global/provider concurrency caps approved before enablement.
Tune for shared mobile/NAT networks and provide a clear retry state. Abuse
controls must not quietly create persistent cross-site identifiers.

## SSRF and collection safety

Only the worker fetcher has source-web egress. BFF requests cannot accept a URL and
proxy it. Source submissions are private candidates and never cause immediate
arbitrary fetches. Parsing and OCR subprocesses have no Internet access. Provider
egress is separately restricted to approved model/embedding endpoints.

The proposed fetcher must:

1. Parse URLs with one defined parser; allow HTTPS only, default port 443, no
   embedded credentials, fragments as fetch inputs, IP-literal destinations,
   ambiguous numeric addresses, or unapproved hosts/paths. A necessary HTTP-only
   source remains a documented blocked candidate until an explicit exception is
   reviewed. Do not lower transport protection silently.
2. Match exact approved hostnames, not suffix substrings; normalize IDNA safely
   and retain original input for review. Resolve A and AAAA records using a
   controlled resolver. Reject if any candidate address is nonpublic: loopback,
   private, link-local/metadata, multicast, reserved, unspecified, or IPv4-mapped
   equivalents. Cover IPv6 and unusual encodings with tests.
3. Bind each connection to a validated resolved address while keeping TLS SNI and
   certificate hostname validation. Confirm the connected peer IP is permitted.
   Do not resolve again through an uncontrolled client path between validation
   and connect. Revalidate DNS for each new connection; isolate DNS/HTTP proxy
   behavior to prevent rebinding and time-of-check/time-of-use escapes.
4. Disable automatic redirects; allow at most five explicitly inspected hops.
   Validate scheme, scope, DNS, peer, TLS and robots/permission rules on each hop.
   New hosts, off-scope paths, HTTPS downgrades, or changed approved chains pause
   for review. No credentials/cookies flow across origins; the initial fetcher
   holds no government credentials at all.
5. Apply network egress denial independently of application validation: block
   private networks, cloud metadata, control planes, database and storage admin
   endpoints. Explicitly disable environment proxy fallback or use only a
   reviewed egress proxy that enforces the same destination rules.
6. Bound connect time (proposed 5 seconds), entire request (30 seconds), redirects,
   compressed and decompressed bytes, and concurrent requests. Recheck bytes
   during streaming, not solely Content-Length. Do not let a partial response or
   error page become reviewed evidence.

These are acceptance requirements, not a claim that an ordinary HTTP library
provides all of them. Host allowlisting alone cannot prevent SSRF. The design
draws on [OWASP SSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html),
checked 2026-10-18; implementation must prove redirects and connection-time
resolution behavior in the chosen worker stack.

## Hostile HTML, PDFs, extraction, and OCR

Treat even verified official documents as hostile parser inputs. Quarantine bytes
in private storage, validate media type with signatures as well as headers, reject
executables and unsupported containers, and record the exact digest before any
extraction. Initially accept scoped public HTML/PDF only. No embedded attachment
execution, JavaScript, macros, XML external entities, shell evaluation, arbitrary
external resources, or remote font/image loads. Do not crack protected PDFs or
ignore access restrictions. Do not trust filenames for paths or permissions.

Implemented Phase 5 ceilings are 5 MiB input, 250,000 extracted characters,
20,000 nodes/64 levels, 50 PDF pages, 10 million pixels per image/page, at most
10 OCR pages, 60 seconds per OCR process, 240-second document checks and a
300-second host kill deadline. Container CPU time is capped at 120 seconds;
memory is 768 MiB. PDF stream expansion caps are 10 MB per stream/20 MB cumulative
page content; the sandbox remains the final memory guard. Output is at most
12 MB. Exceeding any ceiling fails/quarantines the whole capture; no partial
publication. These conservative measured-fixture settings replace the larger
Phase 0 proposals; real corpus tuning requires explicit review.

Run parsing/rendering/OCR as unprivileged disposable processes or containers with
a read-only root, restricted temporary workspace, no shell command construction,
no mounted application secrets, no network, process limits, and killable deadlines.
Pass subprocess argument arrays; never interpolate document text into commands.
Mount only the required input and an output directory. Delete temporary working
files after the job, with a daily sweeper as backup. Use patched pinned tools and
a software/license inventory; separate dependency scanning from security testing.
File scanning adds a layer where available and is not proof of document safety.
The [OWASP file handling guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
was checked 2026-10-18; applying its principles to ingestion is a project design
choice. Future citizen uploads require additional consent, abuse, deletion, and
restricted-document controls before the feature is enabled.

## Prompt injection and grounded answers

User text, source text, OCR, metadata, links, and tool results are data with no
authority over system policy. Keep retrieved passages in structured delimited
fields with source/version identifiers. Never concatenate a document into the
instruction channel. The answer model has no database mutation, unrestricted web,
email, filesystem, shell, secret-reading, or government transaction tools. It sees
only the minimum eligible passage text and minimized query context.

Screen suspicious document instructions, hidden text and metadata during review;
quarantine clear attempts and preserve an audit reason. Filters and prompt wording
are layers, not a guarantee. Validate model output against an explicit response
schema and allowed passage IDs. Verify claim support and publication eligibility
after generation and before delivery. Remove ungrounded claims or abstain; never
execute suggested actions. Citation URLs are resolved server-side from records.
Disallow arbitrary external image/link fetches that could exfiltrate user text.

Test indirect multilingual injection, transliteration, encoded payloads, poisoned
metadata, instruction text in OCR, citation substitution, and fabricated support.
See [AI_SYSTEM](AI_SYSTEM.md) and [EVALUATION](EVALUATION.md). The
[OWASP prompt injection guidance](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html),
checked 2026-10-18, identifies retrieval poisoning as a threat; this design does
not claim prompts or a classifier can make an LLM immune.

## Administrative identity, RBAC, and database isolation

Require individual administrator accounts, MFA, verified recovery procedures, and
short sessions. Proposed admin session limits: 30 minutes idle and 12 hours
absolute; reauthenticate for role changes, source activation, secret operations,
bulk withdrawal, exports, or deployment. No shared accounts. Prefer phishing-
resistant MFA if the chosen identity provider supports the required flow; provider
selection and recovery testing remain gates. Keep break-glass access separate,
time-limited, dual-approved, and audited; test recovery before launch.

| Proposed role | Allowed responsibility | Must not do alone |
| --- | --- | --- |
| Source editor | Propose candidates, extraction corrections and fact mappings | Approve own critical publication or grant roles |
| Reviewer | Verify ownership and approve eligible content | Override missing evidence, expired freshness or unresolved conflict |
| Operator | Observe jobs, stop ingestion/generation, suspend unsafe output | Invent source facts or silently approve content |
| Security administrator | Manage access, incident response, credential lifecycle | Use role management as an unlogged publication bypass |
| Billing operator | Set approved budgets and reconcile usage | Change provider secrets or expand limits without authorization |

Use separate runtime database roles for public BFF reads, feedback writes,
worker ingestion, publication, and migrations. Keep the browser away from raw
ingestion/admin schemas. Public reads reach reviewed projections through the BFF;
tables, functions, views, and storage policies default to deny. Anonymous access
to information is an application capability, not permission to query raw tables.

Enable and test RLS on exposed tables; restrict grants independently. Nonowner
runtime roles must not have BYPASSRLS or inherit powerful roles. Account-specific
future rows require ownership checks in both API and RLS. Review view security
semantics and function ownership/search_path; expose no security-definer function
without explicit narrow purpose and allow/deny tests. Migration/owner credentials
are never runtime credentials. Database authorization and BFF authorization are
both required, including for admin mutations and object downloads.

If Supabase is selected, secret/service-role credentials bypass RLS and stay
server-only; they are not safe public BFF credentials merely because RLS exists.
Prefer restricted database roles for runtime tasks. Keep storage private and
return only authorized, short-lived signed links for explicitly approved assets;
raw ingestion objects never become public bucket contents. These constraints are
supported by [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
and [storage access control](https://supabase.com/docs/guides/storage/security/access-control),
checked 2026-10-18. P14 now contains local Supabase configuration and private
schema controls; see [P14_REPORT](P14_REPORT.md). No hosted project is created;
real core authorization tests pass on the inspected loopback-only PostgreSQL
container. Local credentials are random and only read from the owned container
in memory; migration CLI arguments contain no password. Public access stays denied.

Store secrets in the chosen secret manager, with separate environments and
rotation/revocation procedures. Never commit secrets, place them in public
environment variables, log them, expose them to models, or include them in error
reports. Secret scanning and a reviewed staged-file list are required before
commits; no actual secret scan result is claimed in this Phase 0 document.

## Personal data and proposed retention schedule

Privacy owner: the designated security/privacy lead; operations executes deletion
and verifies it. Product/trust owners approve their data purposes. Named owners,
provider contracts, hosting region, applicable Bangladesh requirements, and a
privacy notice must be reviewed before any real-user pilot. This document does
not assert legal compliance or a statutory retention obligation.

| Data class | Proposed default and TTL | Accountable owner |
| --- | --- | --- |
| Raw questions, answers and conversation transcripts | Never persist by default in database, logs, analytics or shared caches; in-memory active context only, expire after 30 minutes idle or session end | Privacy lead / BFF owner |
| Anonymous-access rate-limit material | Short-lived pseudonymous keyed token from network signal, volatile store only; max 24 hours, rotate/destroy key daily; no permanent user ID | Security lead |
| Raw IP at edge infrastructure | Disable retention where possible; if unavoidable, at most 24 hours and restricted access; incident escalation may hold relevant records at most 7 days with reason | Operations / privacy lead |
| Opt-in correction/feedback free text | Minimize/redact before storage; delete 90 days after submission unless converted to a nonidentifying content issue | Trust owner |
| Optional feedback contact | Collect only with explicit consent for the correction; delete 30 days after closure or 90 days after submission, whichever is earlier | Trust owner / privacy lead |
| Operational traces and application errors | Structured metadata only, no payloads/query text/complete URLs with sensitive parameters; 30 days | Operations |
| Answer provenance bundle | `answer_runs`, structural `answer_claims` and evidence-only `answer_citations`, with no question/history/generated prose or stable citizen ID; expire together 30 days after answer creation; citation lookup may then return 410 | BFF owner / trust owner |
| Admin audit events | Actor ID, action, record IDs, reason and times; no document/query bodies; 365 days then delete or nonidentifying aggregate | Security lead |
| Staff identity and role mappings | Active staff only; revoke immediately on departure, delete personal identity mapping 365 days after deactivation and role history 365 days after revocation; retain only nonidentifying actor references afterward | Security administrator |
| Usage and billing records | Counts, model/pricing revision, reservation/provider request IDs and cost, no query or answer; 365 days | Billing operator |
| Aggregate analytics | Daily nonidentifying counts/latency/locale/topic buckets; suppress small buckets below 20 and discard identifiers before aggregate write; 13 months | Product / privacy lead |
| Public-source snapshots and extracted evidence | Current while published and eligible; unpublished/quarantined or stale-current artifacts have a 30-day review limit from capture/quarantine/staleness, then become withdrawn unless full review and freshness requirements are satisfied; superseded/withdrawn artifacts delete 180 days after supersession/withdrawal or last active evidence reference expires, whichever is later; privacy/access removal can require earlier deletion | Trust owner / privacy lead |
| Evaluation examples | Synthetic examples contain no citizen data; consented redacted examples, if separately approved, expire after 180 days and require renewed consent/review before extension; no automatic harvesting from questions | Evaluation owner / privacy lead |
| User-study recruitment and consent | Optional participant contact deletes 30 days after study completion; consent records and pseudonymized task notes expire 90 days after completion; no recordings by default, and any separately approved recording expires within 30 days | Research owner / privacy lead |
| Security incident evidence | Minimized case records; delete 90 days after incident closure unless a documented, time-bounded hold is approved; review holds every 30 days | Security lead |
| Backups | Encrypted rolling 30 days; excluded from ordinary access; deletions expire with rotation and tombstones are reapplied on restore | Operations / privacy lead |
| Future account profile/preferences | Feature disabled initially; proposed delete after 24 months inactivity with 30 days notice, or on deletion request within 30 days; no history unless separately opted in and given a shorter explicit TTL | Product / privacy lead |
| Future uploaded documents / voice | Feature disabled; proposed transient processing only, original bytes/audio deleted within 1 hour of completion or 24 hours of a failed job; transcript follows no-persistence default | Product / privacy lead |

The answer provenance bundle cannot reconstruct or fully audit the wording shown
without saved prose. Record that limitation; richer audit capture needs separate
opt-in privacy approval. Contact collection is disabled at launch under the API
contract; its TTL above is a proposal for a future explicitly enabled opt-in.
Feedback consent is not consent to save the surrounding conversation. Warn users
not to send NID/passport numbers, bank data, passwords, medical records or private
documents; no such fields are required. Redact obvious identifiers before sending
the minimized request to a provider, and avoid promising perfect detection. Do
not retain irreversible query hashes: they can still expose predictable queries.
No session replay, advertising trackers, fingerprinting, or per-user behavior
profiles in the initial design. Aggregation must not preserve sensitive rare-topic
records or stable identifiers.

A keyed network token is pseudonymous, not a guarantee of anonymity or
nonreversibility, especially if its key is compromised. Shared NAT/mobile networks
also group unrelated people; use minimum necessary network precision, short TTLs
and adjustable fair limits rather than persistent identity. Incidental personal
data in public-source captures is quarantined and removed within 30 days unless
a specifically approved minimized evidence purpose and TTL applies. Personal
data removal and access restrictions take priority over ordinary audit retention.

Every new retained field needs a purpose, owner, TTL, access policy, deletion
mechanism, backup treatment, and privacy review. Unknown classes default to no
retention. Deletion jobs run daily with overdue deletion alerts; a request for
removal is handled without requiring additional unnecessary identity data. Public
evidence immutability never overrides a valid privacy removal: revoke publication,
delete restricted bytes where required, and retain only safe tombstone metadata.

Hosted LLM, embedding, speech, analytics and observability vendors are unapproved.
Before enabling each, verify retention duration, training/use policy, configurable
logging, subprocessor/region behavior, deletion, and contract suitability using
that vendor's current documentation. Ask Bangladesh requires no training use and
no persistent prompt/output retention by default; any unavoidable provider abuse
retention needs an explicit approved exception with exact TTL and notice. Unknown
or unsuitable provider retention blocks real-user enablement. Local no-storage
policy alone cannot establish that a provider stores nothing.

## Incidents and verification gates

Allow separate kill switches for generation, paid providers, ingestion, a source,
a document, and publication. A trust incident can require withdrawal without
shutting down static independent-information pages. Stop unsafe delivery, revoke
affected generations, rotate credentials if relevant, preserve minimized evidence,
assess scope, correct from reviewed official evidence, and require reapproval.
Operational response, backup/restore and rollback are in [DEPLOYMENT](DEPLOYMENT.md).
Do not send incident messages to third parties without authorization; notification
obligations and contacts must be reviewed before launch.

Required future checks include API/role/RLS allow and deny cases; credential and
cookie handling; SSRF redirect/DNS tests; hostile PDF/OCR limits; prompt-injection
tests; deletion and backup restore; budget concurrency; and accessibility of rate
limits, error and consent states. Tests run when those components exist; see
[EVALUATION](EVALUATION.md). Phase 0 documentation validation checks none of them.
