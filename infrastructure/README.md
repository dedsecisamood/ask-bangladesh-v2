# Infrastructure boundary

Hosting, cloud resources and deployment remain unconfigured. Follow
[DEPLOYMENT](../docs/DEPLOYMENT.md); concrete hosting, region, credentials, spending
and live activation require separate approval.

Phase 5 adds a local offline parser/OCR Docker recipe under
[workers/ingestion](../workers/ingestion/README.md). Run `npm run parser:build` and
`npm run test:parser` after local Docker is available. It is networkless at runtime,
unprivileged and disposable, with no host mounts or credentials. Build-time package
downloads do not enable source crawling. The durable SQL scheduler has no running
cron/daemon, controls default paused, and Python live execution defaults disabled.
The local PostgreSQL workflow remains in [database](../database/README.md).

Production still requires independent egress denial, private storage IAM/retention,
least-privilege identities, native dependency/license review, approved sources,
human reviewers and monitoring/alerts. No Google Cloud service or paid resource
was activated. See [Phase 5 evidence](../docs/PHASE_5_REPORT.md).
