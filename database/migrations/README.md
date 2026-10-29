# Database migrations boundary

The sole executable migration tree is [../supabase/migrations](../supabase/migrations/),
owned by the pinned Supabase CLI (`--workdir database`). This directory remains a
pointer to preserve the original monorepo boundary; do not add a second runner
or duplicate SQL here. See [DATABASE](../../docs/DATABASE.md) and
[local workflow](../README.md). P14 and P15 migrations were applied and replayed
successfully against disposable local PostgreSQL 17.11 databases.
