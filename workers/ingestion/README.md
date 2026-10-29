# Ingestion worker boundary

P22–P28 implement isolated retrieval, offline HTML/PDF extraction, conditional
Bangla OCR, immutable private artifacts/passages and durable jobs. See
[ARCHITECTURE](../../docs/ARCHITECTURE.md) and
[PHASE_5_REPORT](../../docs/PHASE_5_REPORT.md). Live execution defaults disabled;
no daemon/cron, recursive discovery or deployed worker exists. Government retrieval
requires source-specific permission and separately verified isolated egress.
Importing the package starts no network I/O.

## Offline parser and pipeline setup

Keep the Python environment below for the small database client/tests. Native
PDF/OCR dependencies run only in a local Docker image; no host installation is
needed. After installing npm/Python dependencies and starting Docker:

```text
npm run parser:build
npm run test:parser
npm run db:start
npm run test:database
npm run db:types
npm run test:python
```

`parser:build` downloads the pinned Python base, pypdf 6.21.1/Pillow 12.2.0 and
Debian Poppler/Tesseract/Bengali language/font packages. It starts no worker and
fetches no source. The local ignored manifest binds exact image ID to the recipe
and package source hash; rebuild after changing any askbd_ingestion Python module.
Native apt packages can change on rebuild; exact image/tool/model lineage is kept.
`test:parser` runs actual native synthetic PDF/Bangla OCR and container control
checks. It reports one synthetic line's error rate, not real document accuracy.

At runtime ParserSandbox allows only extract/selftest/fixture operations, passes
bytes through stdin, and uses no network, host mounts or secrets. The unprivileged
container has a read-only root, bounded tmpfs/CPU/memory/PIDs/input/output and a
kill deadline. Active/encrypted/oversized/unextractable PDFs fail closed. HTML
scripts/external resources never execute. Unknown official dates/page labels stay
unknown. Private derivatives retain raw text, NFC offset maps, physical pages,
sections and OCR image/tool/model metadata. OCR/layout/table/identifier/instruction
flags require independent review; heuristics do not prove privacy or correctness.

`PrivateStore` is a local content-addressed adapter, not a deployed cloud bucket.
Use a dedicated private root outside public/app/package paths, with restricted
OS ACLs. It validates immutable SHA-256 keys and rejects links/traversal. Stale
`.askbd-*` staging files can be swept after at least 24 hours; immutable evidence
is retained. Failed SQL commits may leave private unreferenced artifacts. Approved
retention/reference-aware purge, deployed storage IAM/backup and a safe human
document-viewing workflow remain operational gates. Do not expose this root over HTTP.

`IngestionWorker.run_once()` uses fixed SQL capabilities and a fenced job; by
default it returns disabled before DB/DNS access. There is no live CLI or environment
toggle. Tests alone explicitly compose simulated transport with real parser/SQL.
Five-minute leases/30-second heartbeats, current permission checks, per-source/global
concurrency, bounded retries and an indexing outbox survive restart without worker
publication. Success is still private; no embeddings or search consumer exists.

SQL controls start paused. Fresh bound-MFA owner/administrator set_ingestion_state
can change pause/check intervals; ingestion_status returns metadata-only metrics.
Security/access/parser quarantine and exhausted retries persist a target hold across
scheduling. Only protected owner/administrator resume_ingestion_target can clear
that hold after review; it appends an audit and does not bypass permission/approval.
No new HTTP/admin dashboard is implemented. Never directly update production
tables or use migration-owner credentials as an operational shortcut.

The askbd_ingestion package separates models/errors, registry SQL, connection
management, URL/DNS checks, pinned HTTPS transport, conservative robots rules and
one-document retrieval. Later extractors consume Retrieval.body as hostile bytes
and Manifest as provenance; neither a digest nor HTTP 200 makes evidence approved.
Bodies stay bounded and enter only private storage/isolated parsing, never a public path.

Use DatabaseSettings and worker_registry only with an explicit dedicated worker
login. Password repr is redacted; no web/admin key fallback exists. Remote
PostgreSQL requires certificate/hostname-verified TLS and three-second connection/
SQL timeouts. The helper rejects elevated login privileges and SET ROLEs to the
NOLOGIN askbd_worker capability. Owner-controlled provisioning must grant only
that role to a dedicated login with INHERIT FALSE, SET TRUE; production secrets
and provisioning are outside P22. Plaintext is allowed only for explicitly named
disposable test databases at 127.0.0.1:54322. Never use an ordinary/remote database
as a disposable target. Do not share a connection between unrelated jobs; each
job's heartbeat/crawl calls share a serialized RLock on that connection.

SQLRegistry calls app_worker.crawl_policy/reserve_retrieval/finish_retrieval with
bound parameters. No worker can nominate/approve sources or publish guidance.
Existing active registry sources still need a distinct exact-URL permission:
app_staff.approve_crawl_policy(subject, session, token_hash, source_id,
expected_revision, urls, proof, user_agent, request_key, limits). Existing online
MFA/bound-session validation is required before this protected SQL call; no new
HTTP route was introduced. The proof follows the existing method/evidence_ref/
excerpt/checked_at/expires_at contract. Limits may lower max_bytes (1–5,242,880),
max_redirects (0–5) and daily_requests (1–100). Every robots/redirect/error hop
counts, so one document normally needs at least two requests. User-agent/contact
identity must be reviewed; no production contact URL has been invented.

Crawler requires an explicit registry and transport. network_ready defaults to
false and fetch returns DISABLED without DNS or DB access. Future composition
may supply PinnedHTTPS only after the deployment's independent egress denial is
verified and the owner authorizes live collection. There is no environment toggle
or public arbitrary-URL proxy. Source/domain/reviewer changes invalidate policies.

Current conservative limits: exact same-host HTTPS URLs, port 443 only, no query,
percent encoding, Unicode URL, IP literal, dot segment or unreviewed redirect;
IPv6 and mixed DNS answers blocked; one global in-flight hop, five-second gap after completion,
30-second document deadline, 5 MiB body and 512,000-byte robots caps. Compression
is rejected. Robots is fetched for every document; only simple directives are
supported, all groups' disallows are honored, and complex/ambiguous rules pause
for review. 404/410 robots does not replace separate terms/scope permission.
Cancellation interrupts checks/streaming; connect/TLS return within five seconds.
HTTP hops are never retried inline. The durable job layer retries only bounded
transient failures; 503 Retry-After is honored and access/security/parser failures
stay held for manual review. Per-hop private manifests record
outcomes; preflight denials return a sanitized Manifest with no raw unsafe URL.

Use Python 3.14 in an isolated root `.venv`. From the repository root on Windows:

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install --cache-dir .cache/pip --requirement workers/ingestion/requirements-dev.txt
.venv\Scripts\python.exe -m pytest -c workers/ingestion/pyproject.toml --basetemp=.cache/pytest-tmp
```

POSIX environments use `.venv/bin/python` for the last two commands. MSYS2 Python
on Windows also creates `.venv/bin/python.exe`; use that executable when applicable.
No activation or global package installation is necessary. Local caches and test
artifacts are ignored by Git. The CI workflow uses the same config and test suite
with Python 3.14.

After setup, `npm run test:python` is the portable root command. It runs the same
suite with a fresh `.cache/pytest-run-*` directory for fixtures and cache, avoiding
permission collisions when local checks use different execution accounts. CI
uses the direct Python command above in its fresh single-user workspace.

The original foundation tests exercise the existing offline documentation validator with
synthetic temporary files: valid plans, missing documents, invalid UTF-8, broken
or escaping links, fenced examples, missing capabilities and phase boundaries.
P22 additionally tests URL/IP/redirect/DNS rebinding/peer restrictions, framing,
slow-drip deadlines, MIME/signatures, robots/access denials, budgets, cancellation,
safe errors, metadata and DB configuration. All HTTP/socket behavior is simulated.
`npm run test:database` also replays canonical SQL and runs a real Python adapter
probe against a guarded disposable PostgreSQL database with a temporary dedicated
login and simulated HTTP. That command requires Node dependencies, the Python
requirements above, `npm run parser:build` and `npm run db:start`. It exercises the
real HTML/native-PDF/Bangla-OCR pipeline too. No government website is a test input.
Tests live under `tests/test_*.py`; future worker tests should remain isolated,
deterministic and free of paid APIs, live portals and citizen information.

Pytest prints failed assertions and exits nonzero on failure. Run the full suite
before reporting success; collecting tests is not an execution result. Runtime
pins and measured outcomes belong in [CODEX_PROGRESS](../../docs/CODEX_PROGRESS.md).

Runtime: pg8000 1.31.5 plus pinned python-dateutil/scramp/asn1crypto/six in
requirements.txt. This small pure-Python client works with MSYS2 Python 3.14
without native libpq or unsupported binary wheels. It is not an ORM or migration
system. requirements-dev.txt includes runtime and the existing pinned Pytest set;
the commands above install both. No npm package/version or lockfile changed.

Technical references checked 2026-10-18 (foundation) and 2026-10-21 (P22):
[Python HTTPS](https://docs.python.org/3.14/library/http.client.html),
[TLS](https://docs.python.org/3.14/library/ssl.html),
[pg8000 DB-API/TLS](https://pypi.org/project/pg8000/1.31.5/),
[RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html),
[OWASP SSRF](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html),
[Pytest setup](https://docs.pytest.org/en/stable/getting-started.html),
[Pytest configuration](https://docs.pytest.org/en/stable/reference/customize.html),
[Pytest package metadata](https://pypi.org/project/pytest/9.1.1/) and
[Python virtual environments](https://docs.python.org/3.14/library/venv.html).
These sources document the tools; execution evidence is recorded separately.
