# Local embeddings and retrieval operations

Phase 6 implementation, checked during the 2026-10-22/23 local run. This is a
free CPU evaluation/development adapter, not a deployed service or approved real
government corpus. See [PHASE_6_REPORT](PHASE_6_REPORT.md) for actual findings.

## Runtime and model identity

`packages/embeddings` is an npm workspace with exactly pinned
`@huggingface/transformers@4.3.1`; the lockfile resolves ONNX Runtime Node 1.30.0.
The server-only TypeScript provider exchanges bounded JSON lines with one local
Node child process. Model code is never downloaded/executed. Inference permits
only local artifacts; remote loading/cache writes and `fetch` are disabled.

| Candidate | Pinned conversion revision | Dimensions | Input ceiling | Upstream license |
| --- | --- | --- | --- | --- |
| `Xenova/multilingual-e5-small` | `761b726dd34fb83930e26aab4e9ac3899aa1fa78` | 384 | 512 tokens including prefix/special tokens | MIT |
| `Xenova/paraphrase-multilingual-MiniLM-L12-v2` | `2c4055b12046f11709e9df2c122e59ffbdc2f900` | 384 | 128 tokens including special tokens | Apache 2.0 |

Both use quantized q8 ONNX weights, attention-mask mean pooling and L2-normalized
vectors. E5 uses `query: ` and `passage: ` prefixes, including for Bangla. MiniLM
uses no prefix. NFC preparation, prefix/token limits, tokenizer digest, runtime,
pooling and model revisions form an immutable compatibility protocol. Do not
silently change it or compare vectors across profiles, even at equal dimensions.

The [manifest](../packages/embeddings/models.json) pins exact file sizes, weight/
tokenizer SHA-256 and Git blob identities for small configuration files. Downloads
are restricted to pinned public Hugging Face artifacts and approved HTTPS CDN
redirects, with byte/hash limits and no credentials. They send no project text.
Runtime verifies artifacts again before loading. Weights remain in ignored
`.cache/embedding-models`, outside source control and browser assets.

## Reproduce locally

Use the repository's documented Node/npm versions and existing Docker setup:

```text
npm ci
npm run embedding:download
npm run embedding:verify
npm run db:start
npm run db:migrate
npm run test:retrieval
npm run test:retrieval:models
```

Windows PowerShell may require `npm.cmd`. `ONNXRUNTIME_NODE_INSTALL=skip` skips
nonbundled accelerator downloads; CPU binaries are bundled. CI sets this variable.
No model files are downloaded during normal application rendering or builds.
Missing artifacts make the optional model test fail, never silently skip.

The real-model benchmark creates only generated disposable local databases and
temporary least-privilege login roles, using existing guards. It removes them on
completion. Synthetic approval states exist only there, never as real onboarding.
Detailed results are in `.cache/phase6/benchmark.json`; source questions/labels are
the explicitly synthetic [regression set](../tests/retrieval/benchmark.synthetic.json).

Normal unit/SQL checks run in existing CI jobs. Downloading models and rerunning
the heavyweight benchmark is a manual `workflow_dispatch` boolean input; no remote
workflow was triggered or verified by this implementation.

## Admission, storage and recovery

One process/model and one active inference per application process are admitted;
there is no queue or automatic retry. Other requests receive a capacity failure.
The worker uses two CPU threads, a 384 MiB JavaScript heap ceiling, 45-second
request deadline, 30-second idle shutdown, 64 KiB input and 1 MB output bounds.
Native ONNX memory is additional; these are not OS-level memory isolation claims.
Cancellation kills the process. No query, query vector or citizen record is
persisted. The only reuse is loaded model weights and a single request's vector
promise across its bounded scoped/general fallback.

Passage batches contain at most eight records, default two, and at most 2,048
tokens. A passage over its model's token limit fails explicitly; it is not silently
truncated. Rechunking requires reviewed new passage/version identity, or a newly
evaluated compatible model profile. No infinite retry or automatic production
re-embedding loop exists. An unsuccessful batch commits no partial vectors.

`embedEligibleBatch` takes a provider and an `EmbeddingStore` capability.
`createEmbeddingStore` validates a server-only dedicated `askbd_embedder`
PostgreSQL configuration, verifies remote TLS and bounds its pool to one.
It is not used by public render requests and requires no new public environment
variable. The role cannot read raw tables, assign approvals or publish documents.
Only capped eligible-batch and hash-bound idempotent commit functions are granted.

All SQL model profiles start disabled. A trusted active owner/administrator must
append a private `embedding_profile_approvals` record before use; the insert binds
their current membership revision. Revocation/role revision or a later disable
record invalidates it. Ordinary development has no such approvals or real vectors.
Production credentials/identities and model activation need a separately reviewed
provisioning decision; no default account or password is supplied.

Model migration means a new immutable profile, explicit approval, bounded new
vectors and evaluation, then explicit caller configuration. Preserve old profile
vectors for rollback. New dimensions do not require replacing the flexible
pgvector schema. No ANN index is introduced: exact cosine search filters the
eligible set first and reports missing-vector coverage separately.

## Technical sources inspected

- [E5 author's model card](https://huggingface.co/intfloat/multilingual-e5-small/raw/main/README.md),
  retrieved as raw Markdown; the normal web rendering was inaccessible. It documents
  multilingual coverage, 512-token truncation behavior, prefixes and MIT metadata.
- [MiniLM author's model card](https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2)
  documents 384-dimensional mean pooling, 128-token sentence-transformer configuration
  and Apache 2.0 metadata. Its broad multilingual label is not proof of Bangla quality.
- [Pinned E5 conversion](https://huggingface.co/Xenova/multilingual-e5-small/tree/761b726dd34fb83930e26aab4e9ac3899aa1fa78)
  and [pinned MiniLM conversion](https://huggingface.co/Xenova/paraphrase-multilingual-MiniLM-L12-v2/tree/2c4055b12046f11709e9df2c122e59ffbdc2f900):
  API artifact metadata and exact files were actually retrieved and verified.
- [Transformers.js source](https://github.com/huggingface/transformers.js): the
  installed pinned package's env, feature-extraction and ONNX source was inspected
  for offline controls, pooling and CPU session options. The requested web Node
  guide and one raw guide URL were unavailable; no successful guide access is claimed.
- [pgvector official README](https://github.com/pgvector/pgvector#filtering),
  [GitHub workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onworkflow_dispatchinputs).
  The database extension remains pinned at 0.8.2; current upstream documentation
  does not authorize an extension upgrade.

These are technical references, not government sources or legal review.
