# P16 — Staff authentication and database authorization

Date: 2026-10-20, Asia/Dhaka. **P16 PASS locally.** Final Phase 3 regression
evidence is recorded in [PHASE_3_REPORT](PHASE_3_REPORT.md), including the expanded
227 unit/component and 19 real Auth/HTTP/API checks.

Supabase Auth is selected for staff identity. The official SDK 2.118.0 and SSR
cookie adapter 0.12.7 are server-only. `/admin` and `/api/v1/admin/session`
validate the online user, verified claims, AAL2, a separate random HttpOnly BFF
cookie, trusted membership/revision and server-clock idle/absolute expiry.
No citizen registration, role-assignment API or full dashboard is implemented.

Two forward migrations add four private forced-RLS tables: admin_memberships,
staff_sessions, staff_audit_events and staff_auth_budgets. Narrow fixed-search-path
functions are executable only by the dedicated askbd_staff role. The public
askbd_web role has no staff/raw-table access. Role changes invalidate sessions;
logout revokes the BFF session before attempting provider logout. Cookie hashes,
not raw opaque BFF tokens, are stored. Passwords remain in Supabase Auth.

Roles: owner can inspect/review/operate/manage roles; administrator can
inspect/review/operate; source_reviewer can inspect/review; auditor can inspect.
Capability permissions reserve future operations; no publication or membership
mutation endpoint is enabled by this package.

Executed: `npm.cmd run test:database` (33/33), `npm.cmd run test:unit` (205/205),
`npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run build`, and
`node scripts/phase3-integration.mjs` (11 actual local provider/HTTP checks).
Real TOTP enrollment/verification, password rejection, nonmember denial, signed-in
MFA requirement, forged-cookie rejection, protected HTML/API and logout pass.
Synthetic identities are created only in local Auth, then deleted; application
rows live in guarded disposable databases which are removed after testing.

Initial test failures were corrected: test role switching needed transaction-only
SET grants; Auth role needed its own schema search path; Next request origin
validation now compares the configured Origin and actual Host. No failure was
treated as passing. The loopback-only Auth container uses the official GoTrue
v2.197.0 digest pinned in scripts/auth-local.mjs. No hosted project was created.

First-account provisioning and recovery require an owner-approved offline trusted
operator: create an individual Auth user, verify identity out of band, insert an
active membership for that exact Auth UUID using migration-owner access, then
enroll TOTP at first login. No default account exists. Production recovery,
phishing-resistant MFA, hosting/TLS, external provider settings and remote CI
remain release gates, not claims of local foundation verification.

Primary references checked 2026-10-20:
[Supabase Next.js server authentication](https://supabase.com/docs/guides/auth/server-side/nextjs),
[online user validation](https://supabase.com/docs/reference/javascript/auth-getuser),
[MFA challenge and verification](https://supabase.com/docs/reference/javascript/auth-mfa-challengeandverify),
[official local Auth configuration](https://github.com/supabase/supabase/blob/master/docker/docker-compose.yml).
