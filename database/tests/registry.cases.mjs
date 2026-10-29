import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { attachRegistryEvidence } from "./registry-fixture.mjs";
import {
  seedDirectoryFixture,
  directoryIds as i,
} from "./directory-fixture.mjs";
const third = "18000000-0000-4000-8000-000000000003",
  auditor = "18000000-0000-4000-8000-000000000004";
const users = [i.creator, i.reviewer, third, auditor];
const metadata = {
  agency_id: i.agency,
  canonical_url: "https://registry.example.com/fixture/",
  submitted_url: "https://registry.example.com/fixture/",
  source_name: "Synthetic registry fixture",
  description: "PRIVATE registry description",
  language: "bn",
  source_type: "portal",
  risk_class: "critical",
  reason: "Synthetic offline fixture only",
};
export function registryProof() {
  const checked = new Date(Date.now() - 60000).toISOString(),
    expires = new Date(Date.now() + 86400000).toISOString();
  const proof = {
    method: "Synthetic offline verification",
    evidence_ref: "fixture:private-evidence",
    excerpt: "Synthetic proof excerpt, not government research",
    checked_at: checked,
    expires_at: expires,
  };
  return {
    ownership: proof,
    authority: proof,
    content_use_evidence_ref: "fixture:private-use-policy",
    availability_status: "accessible",
    availability_checked_at: checked,
    availability_evidence_ref: "fixture:private-availability",
    reason: "Synthetic offline approval",
  };
}
export function registerRegistryTests({ test, transaction, rejects }) {
  const scenario = (name, work) =>
    test(name, () =>
      transaction(async (c) => {
        await seedDirectoryFixture(c);
        await c.query(
          "INSERT INTO app_private.admin_memberships(id,auth_user_id,role,status) VALUES($1,$1,'source_reviewer','active'),($2,$2,'auditor','active')",
          [third, auditor],
        );
        const sessions = users.map(() => randomUUID()),
          hashes = users.map((_, n) => String(n + 1).repeat(64));
        for (let n = 0; n < users.length; n++)
          await c.query("SELECT app_staff.open_bound_session($1,$2,$3)", [
            users[n],
            sessions[n],
            hashes[n],
          ]);
        await c.query(
          "GRANT askbd_staff,askbd_web TO postgres WITH INHERIT FALSE, SET TRUE",
        );
        const command = async (
          n,
          action,
          id,
          payload,
          revision,
          key = randomUUID(),
        ) => {
          await c.query("SET LOCAL ROLE askbd_staff");
          try {
            return (
              await c.query(
                "SELECT app_staff.registry_command($1,$2,$3,$4,$5,$6,$7,$8) result",
                [
                  users[n],
                  sessions[n],
                  hashes[n],
                  action,
                  id,
                  payload,
                  revision,
                  key,
                ],
              )
            ).rows[0].result;
          } finally {
            await c.query("RESET ROLE");
          }
        };
        const create = (extra = {}, key) =>
          command(0, "create", null, { ...metadata, ...extra }, null, key);
        const submit = (s) =>
          command(
            0,
            "submit",
            s.id,
            { reason: "Synthetic submission" },
            s.revision,
          );
        const approve = (s) =>
          command(1, "approve", s.id, registryProof(), s.revision);
        await work({ c, command, create, submit, approve, sessions, hashes });
      }),
    );
  scenario(
    "P18 request budgets serialize new mutations while identical retries remain safe",
    async ({ command, create }) => {
      for (let n = 0; n < 30; n++)
        assert.ok(
          (
            await create({
              canonical_url: `https://registry.example.com/budget-${n}/`,
            })
          ).id,
        );
      assert.equal(
        (
          await create({
            canonical_url: "https://registry.example.com/budget-overflow/",
          })
        ).error_code,
        "RATE_LIMITED",
      );
      void command;
    },
  );
  scenario(
    "P18 renewed approval ignores expired historical proof without extending its dates",
    async ({ c, command, create, submit, approve }) => {
      const pending = await submit(await create({ risk_class: "general" }));
      await c.query(
        "INSERT INTO app_private.source_verifications(source_id,verification_type,status,method,evidence_ref,reviewer_id,verified_at,expires_at,created_at,registry_content_revision) VALUES($1,'ownership','approved','Historical synthetic fixture','fixture:historical',$2,statement_timestamp()-interval '3 days',statement_timestamp()-interval '1 day',statement_timestamp()-interval '2 days',1)",
        [pending.id, i.reviewer],
      );
      const approved = await approve(pending);
      const active = await command(
        1,
        "activate",
        approved.id,
        { reason: "Renewed evidence" },
        approved.revision,
      );
      assert.equal(active.status, "active");
      assert.equal(
        (
          await c.query("SELECT app_private.registry_public_eligible($1) ok", [
            active.id,
          ])
        ).rows[0].ok,
        true,
      );
    },
  );
  scenario(
    "P18 repeated risk downgrades cannot remove independent second review",
    async ({ command, create, submit, approve }) => {
      let s = await create();
      const { agency_id, canonical_url, submitted_url, ...edited } = metadata;
      void agency_id;
      void canonical_url;
      void submitted_url;
      for (let n = 0; n < 2; n++)
        s = await command(
          0,
          "update",
          s.id,
          { ...edited, risk_class: "general" },
          s.revision,
        );
      s = await approve(await submit(s));
      assert.equal(
        (
          await command(
            1,
            "activate",
            s.id,
            { reason: "Downgrade bypass" },
            s.revision,
          )
        ).error_code,
        "INDEPENDENT_REVIEW_REQUIRED",
      );
      assert.equal(
        (
          await command(
            2,
            "activate",
            s.id,
            { reason: "Independent review" },
            s.revision,
          )
        ).status,
        "active",
      );
    },
  );
  scenario(
    "P18 candidates are private, canonical duplicates conflict and retries are idempotent",
    async ({ c, command, create }) => {
      const key = randomUUID();
      const s = await create({}, key);
      assert.equal(s.registry_status, "draft");
      assert.equal(s.status, "candidate");
      assert.equal(s.revision, "1");
      assert.deepEqual(await create({}, key), s);
      assert.equal(
        (await create({ source_name: "Changed" }, key)).error_code,
        "IDEMPOTENCY_CONFLICT",
      );
      assert.equal((await create()).error_code, "DUPLICATE_SOURCE");
      assert.equal(
        (
          await command(
            0,
            "activate",
            s.id,
            { reason: "Invalid activation" },
            s.revision,
          )
        ).error_code,
        "INVALID_TRANSITION",
      );
      assert.equal(
        (
          await c.query(
            "SELECT count(*)::int n FROM app_private.source_registry_events WHERE source_id=$1",
            [s.id],
          )
        ).rows[0].n,
        1,
      );
      assert.equal(
        (
          await c.query(
            "SELECT crawl_permission_status FROM app_private.official_domains d JOIN app_private.sources s ON s.official_domain_id=d.id WHERE s.id=$1",
            [s.id],
          )
        ).rows[0].crawl_permission_status,
        "unknown",
      );
    },
  );
  scenario(
    "P18 approve requires current ownership/authority evidence and independent review",
    async ({ command, create, submit, approve }) => {
      const draft = await create();
      const pending = await submit(draft);
      assert.equal(
        (
          await command(
            0,
            "approve",
            pending.id,
            registryProof(),
            pending.revision,
          )
        ).error_code,
        "INDEPENDENT_REVIEW_REQUIRED",
      );
      assert.equal(
        (
          await command(
            1,
            "approve",
            pending.id,
            { reason: "No evidence" },
            pending.revision,
          )
        ).error_code,
        "INVALID_REQUEST",
      );
      const approved = await approve(pending);
      assert.equal(approved.registry_status, "approved");
      assert.equal(approved.status, "verified");
      assert.equal(
        (
          await command(
            1,
            "activate",
            approved.id,
            { reason: "Self second review" },
            approved.revision,
          )
        ).error_code,
        "INDEPENDENT_REVIEW_REQUIRED",
      );
      const active = await command(
        2,
        "activate",
        approved.id,
        { reason: "Independent critical activation" },
        approved.revision,
      );
      assert.equal(active.status, "active");
    },
  );
  scenario(
    "P18 general activation permits one independent verifier while edits withdraw approval",
    async ({ c, command, create, submit, approve }) => {
      const approved = await approve(
        await submit(await create({ risk_class: "general" })),
      );
      const active = await command(
        1,
        "activate",
        approved.id,
        { reason: "General activation" },
        approved.revision,
      );
      assert.equal(active.status, "active");
      const { agency_id, canonical_url, submitted_url, ...edited } = metadata;
      void agency_id;
      void canonical_url;
      void submitted_url;
      const changed = await command(
        0,
        "update",
        active.id,
        { ...edited, source_name: "Updated synthetic name" },
        active.revision,
      );
      assert.equal(changed.registry_status, "draft");
      assert.equal(changed.status, "suspended");
      assert.equal(
        (
          await c.query("SELECT app_private.registry_public_eligible($1) ok", [
            active.id,
          ])
        ).rows[0].ok,
        false,
      );
      assert.equal(
        (
          await command(
            2,
            "activate",
            active.id,
            { reason: "Old approval" },
            changed.revision,
          )
        ).error_code,
        "INVALID_TRANSITION",
      );
    },
  );
  scenario(
    "P18 rejection and suspension preserve bounded append-only audit/outbox history",
    async ({ c, command, create, submit }) => {
      const pending = await submit(await create());
      const rejected = await command(
        1,
        "reject",
        pending.id,
        { reason: "Synthetic rejection" },
        pending.revision,
      );
      assert.equal(rejected.registry_status, "rejected");
      const resubmitted = await submit(rejected);
      const suspended = await command(
        1,
        "suspend",
        resubmitted.id,
        { reason: "Synthetic safety hold" },
        resubmitted.revision,
      );
      assert.equal(suspended.status, "suspended");
      const events = (
        await c.query(
          "SELECT action,outbox_topic FROM app_private.source_registry_events WHERE source_id=$1 ORDER BY recorded_at,id",
          [pending.id],
        )
      ).rows;
      assert.equal(events.length, 5);
      assert.ok(
        events.every((e) => e.outbox_topic === "source_registry_changed"),
      );
      await rejects(
        c,
        "DELETE FROM app_private.source_registry_events WHERE source_id=$1",
        [pending.id],
        "23514",
      );
    },
  );
  scenario(
    "P18 stale revisions, expired authentication, auditor writes and raw-table writes fail",
    async ({ c, command, create, sessions }) => {
      const s = await create();
      assert.equal(
        (await command(0, "submit", s.id, { reason: "Stale revision" }, "999"))
          .error_code,
        "REVISION_CONFLICT",
      );
      assert.equal(
        (
          await command(
            3,
            "submit",
            s.id,
            { reason: "Auditor mutation" },
            s.revision,
          )
        ).error_code,
        "FORBIDDEN",
      );
      await c.query(
        "UPDATE app_private.staff_sessions SET created_at=statement_timestamp()-interval '6 minutes',expires_at=statement_timestamp()+interval '11 hours' WHERE auth_session_id=$1",
        [sessions[1]],
      );
      const pending = await command(
        0,
        "submit",
        s.id,
        { reason: "Submit" },
        s.revision,
      );
      assert.equal(
        (await command(1, "approve", s.id, registryProof(), pending.revision))
          .error_code,
        "REAUTHENTICATION_REQUIRED",
      );
      await c.query("SET LOCAL ROLE askbd_staff");
      await rejects(
        c,
        "UPDATE app_private.sources SET status='active'",
        [],
        "42501",
      );
      await c.query("RESET ROLE");
      await c.query("SET LOCAL ROLE askbd_web");
      await rejects(
        c,
        "SELECT * FROM app_private.source_registry_events",
        [],
        "42501",
      );
      await c.query("RESET ROLE");
    },
  );
  scenario(
    "P18 malformed URLs, forged statuses, expired evidence and duplicate writes are atomic",
    async ({ c, command, create, submit }) => {
      assert.equal(
        (await create({ canonical_url: "http://127.0.0.1/" })).error_code,
        "INVALID_REQUEST",
      );
      assert.equal(
        (await create({ status: "active" })).error_code,
        "INVALID_REQUEST",
      );
      const s = await submit(await create());
      const bad = registryProof();
      bad.ownership.expires_at = new Date(Date.now() - 1000).toISOString();
      assert.equal(
        (await command(1, "approve", s.id, bad, s.revision)).error_code,
        "INVALID_REQUEST",
      );
      assert.equal(
        (
          await c.query(
            "SELECT count(*)::int n FROM app_private.source_verifications WHERE source_id=$1",
            [s.id],
          )
        ).rows[0].n,
        0,
      );
      assert.equal(
        (
          await c.query(
            "SELECT count(*)::int n FROM app_private.source_registry_events WHERE source_id=$1",
            [s.id],
          )
        ).rows[0].n,
        2,
      );
    },
  );
  scenario(
    "P18 approved registry state alone does not bypass public document eligibility",
    async ({ c, command, create, submit, approve }) => {
      const approved = await approve(await submit(await create()));
      const active = await command(
        2,
        "activate",
        approved.id,
        { reason: "Second review" },
        approved.revision,
      );
      const result = (
        await c.query("SELECT app_public.directory('sources','bn') data")
      ).rows[0].data;
      assert.ok(!result.items.some((s) => s.id === active.id));
      const read = (
        await c.query("SELECT app_staff.registry_read($1,$2,$3,$4) data", [
          users[3],
          (
            await c.query(
              "SELECT auth_session_id FROM app_private.staff_sessions WHERE membership_id=$1",
              [users[3]],
            )
          ).rows[0].auth_session_id,
          "4".repeat(64),
          active.id,
        ])
      ).rows[0].data;
      assert.equal(read.verifications.length, 2);
      assert.equal(read.history.length, 4);
      assert.ok(read.approved_at);
      assert.ok(read.activated_at);
      assert.ok(!JSON.stringify(read).includes("actor_id"));
      await attachRegistryEvidence(c, active.id, i.reviewer);
      const published = (
        await c.query("SELECT app_public.directory('sources','bn') data")
      ).rows[0].data;
      assert.ok(published.items.some((item) => item.id === active.id));
      assert.ok(!JSON.stringify(published).includes("PRIVATE"));
      const suspended = await command(
        1,
        "suspend",
        active.id,
        { reason: "Synthetic revocation" },
        active.revision,
      );
      assert.equal(suspended.status, "suspended");
      assert.ok(
        !(
          await c.query("SELECT app_public.directory('sources','bn') data")
        ).rows[0].data.items.some((item) => item.id === active.id),
      );
    },
  );
}
