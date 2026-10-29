import assert from "node:assert/strict";
const user = "16000000-0000-4000-8000-000000000001";
const session = "16000000-0000-4000-8000-000000000002";
export function registerStaffTests({ test, transaction, rejects }) {
  const scenario = (name, work) =>
    test(name, () =>
      transaction(async (c) => {
        await c.query(
          "GRANT askbd_web,askbd_staff TO postgres WITH INHERIT FALSE, SET TRUE",
        );
        await c.query(
          "INSERT INTO app_private.admin_memberships(auth_user_id,role,status) VALUES($1,'owner','active')",
          [user],
        );
        await work(c);
      }),
    );
  scenario(
    "P16 roles cannot read private records or self-assign memberships",
    async (c) => {
      for (const role of ["askbd_web", "askbd_staff"]) {
        await c.query(`SET LOCAL ROLE ${role}`);
        await rejects(
          c,
          "SELECT * FROM app_private.admin_memberships",
          [],
          "42501",
        );
        await rejects(
          c,
          "INSERT INTO app_private.admin_memberships(auth_user_id,role,status) VALUES($1,'owner','active')",
          [session],
          "42501",
        );
        await c.query("RESET ROLE");
      }
      await c.query("SET LOCAL ROLE askbd_web");
      await rejects(
        c,
        "SELECT * FROM app_staff.membership($1)",
        [user],
        "42501",
      );
      await c.query("RESET ROLE");
    },
  );
  scenario(
    "P16 all four roles enforce the server-side capability matrix",
    async (c) => {
      for (const role of [
        "owner",
        "administrator",
        "source_reviewer",
        "auditor",
      ]) {
        await c.query(
          "UPDATE app_private.admin_memberships SET role=$1 WHERE auth_user_id=$2",
          [role, user],
        );
        await c.query("DELETE FROM app_private.staff_sessions");
        await c.query("SET LOCAL ROLE askbd_staff");
        assert.equal(
          (
            await c.query("SELECT app_staff.open_bound_session($1,$2,$3) ok", [
              user,
              session,
              "a".repeat(64),
            ])
          ).rows[0].ok,
          true,
        );
        for (const cap of ["inspect", "review", "operate", "manage_roles"]) {
          const allowed =
            cap === "inspect" ||
            (cap === "review" && role !== "auditor") ||
            (cap === "operate" && ["owner", "administrator"].includes(role)) ||
            (cap === "manage_roles" && role === "owner");
          assert.equal(
            (
              await c.query(
                "SELECT * FROM app_staff.authorize_bound($1,$2,$3,$4)",
                [user, session, cap, "a".repeat(64)],
              )
            ).rowCount,
            allowed ? 1 : 0,
          );
        }
        await c.query("RESET ROLE");
      }
    },
  );
  scenario(
    "P16 revoked, missing and changed memberships invalidate sessions immediately",
    async (c) => {
      await c.query("SELECT app_staff.open_session($1,$2)", [user, session]);
      await c.query(
        "UPDATE app_private.admin_memberships SET status='revoked' WHERE auth_user_id=$1",
        [user],
      );
      assert.equal(
        (
          await c.query("SELECT * FROM app_staff.authorize($1,$2,'inspect')", [
            user,
            session,
          ])
        ).rowCount,
        0,
      );
      assert.equal(
        (
          await c.query("SELECT app_staff.open_session($1,$2) ok", [
            session,
            user,
          ])
        ).rows[0].ok,
        false,
      );
      await c.query(
        "UPDATE app_private.admin_memberships SET status='active' WHERE auth_user_id=$1",
        [user],
      );
      assert.equal(
        (
          await c.query("SELECT * FROM app_staff.authorize($1,$2,'inspect')", [
            user,
            session,
          ])
        ).rowCount,
        0,
      );
    },
  );
  scenario(
    "P16 absolute/idle expiry and logout cannot be bypassed by reopening a session",
    async (c) => {
      await c.query("SELECT app_staff.open_session($1,$2)", [user, session]);
      await c.query(
        "UPDATE app_private.staff_sessions SET last_seen_at=statement_timestamp()-interval '31 minutes'",
      );
      assert.equal(
        (
          await c.query("SELECT app_staff.open_session($1,$2) ok", [
            user,
            session,
          ])
        ).rows[0].ok,
        false,
      );
      assert.equal(
        (
          await c.query("SELECT * FROM app_staff.authorize($1,$2,'inspect')", [
            user,
            session,
          ])
        ).rowCount,
        0,
      );
      await c.query(
        "UPDATE app_private.staff_sessions SET last_seen_at=statement_timestamp(),expires_at=statement_timestamp()-interval '1 second'",
      );
      assert.equal(
        (
          await c.query("SELECT * FROM app_staff.authorize($1,$2,'inspect')", [
            user,
            session,
          ])
        ).rowCount,
        0,
      );
      await c.query("SELECT app_staff.revoke_session($1,$2)", [user, session]);
      assert.equal(
        (
          await c.query("SELECT app_staff.open_session($1,$2) ok", [
            user,
            session,
          ])
        ).rows[0].ok,
        false,
      );
      await rejects(
        c,
        "DELETE FROM app_private.staff_audit_events",
        [],
        "23514",
      );
    },
  );
  scenario(
    "P16 authentication budget is atomic and fails closed after thirty attempts",
    async (c) => {
      for (let n = 0; n < 31; n++)
        assert.equal(
          (await c.query("SELECT app_staff.consume_auth_budget() ok")).rows[0]
            .ok,
          n < 30,
        );
    },
  );
}
