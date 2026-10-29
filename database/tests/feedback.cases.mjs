import assert from "node:assert/strict";

export function registerFeedbackTests({ test, transaction, rejects }) {
  const payload = {
    category: "incorrect",
    locale: "bn",
    page: "ask",
    consent: true,
  };
  test("audit feedback: dedicated writer can enqueue structured reports but cannot read or mutate queue", () =>
    transaction(async (c) => {
      await c.query(
        "GRANT askbd_feedback TO postgres WITH INHERIT FALSE, SET TRUE",
      );
      await c.query("SET LOCAL ROLE askbd_feedback");
      const result = await c.query(
        "SELECT app_public.submit_feedback($1::jsonb) id",
        [JSON.stringify(payload)],
      );
      assert.match(result.rows[0].id, /^[a-f0-9-]{36}$/);
      await rejects(c, "SELECT * FROM app_private.feedback", [], "42501");
      await rejects(
        c,
        "UPDATE app_private.feedback SET state='resolved'",
        [],
        "42501",
      );
      await c.query("RESET ROLE");
      const record = (
        await c.query("SELECT * FROM app_private.feedback WHERE id=$1", [
          result.rows[0].id,
        ])
      ).rows[0];
      assert.equal(record.category, "incorrect");
      assert.equal(record.state, "pending");
      assert.equal(record.expires_at - record.created_at, 90 * 86400000);
      assert.equal("text" in record, false);
    }));
  test("audit feedback: private/draft references, text, missing consent and invalid categories fail closed", () =>
    transaction(async (c) => {
      for (const value of [
        null,
        [],
        {},
        { ...payload, consent: false },
        { ...payload, text: "PRIVATE personal 1234567890" },
        { ...payload, category: "published" },
        { ...payload, service_id: "bad" },
        { ...payload, service_id: "14000000-0000-4000-8000-000000000003" },
        { ...payload, source_id: null },
      ]) {
        await rejects(
          c,
          "SELECT app_public.submit_feedback($1::jsonb)",
          [JSON.stringify(value)],
          "22023",
        );
      }
      assert.equal(
        (await c.query("SELECT count(*) n FROM app_private.feedback")).rows[0]
          .n,
        "0",
      );
    }));
  test("audit feedback: anonymous, authenticated, staff and embedder roles have no intake or raw queue access", () =>
    transaction(async (c) => {
      for (const role of [
        "anon",
        "askbd_web",
        "authenticated",
        "askbd_staff",
        "askbd_embedder",
      ]) {
        await c.query(`GRANT ${role} TO postgres WITH INHERIT FALSE, SET TRUE`);
        await c.query(`SET LOCAL ROLE ${role}`);
        await rejects(
          c,
          "SELECT app_public.submit_feedback($1::jsonb)",
          [JSON.stringify(payload)],
          "42501",
        );
        await rejects(c, "SELECT * FROM app_private.feedback", [], "42501");
        await c.query("RESET ROLE");
      }
    }));
  test("audit feedback: admission purges expired metadata and refuses a full bounded queue", () =>
    transaction(async (c) => {
      await c.query(
        "INSERT INTO app_private.feedback(category,locale,created_at,expires_at) VALUES('other','en',statement_timestamp()-interval '91 days',statement_timestamp()-interval '1 day')",
      );
      await c.query("SELECT app_public.submit_feedback($1::jsonb)", [
        JSON.stringify(payload),
      ]);
      assert.equal(
        (await c.query("SELECT count(*) n FROM app_private.feedback")).rows[0]
          .n,
        "1",
      );
      await c.query(
        "INSERT INTO app_private.feedback(category,locale) SELECT 'other','bn' FROM generate_series(1,9999)",
      );
      await rejects(
        c,
        "SELECT app_public.submit_feedback($1::jsonb)",
        [JSON.stringify(payload)],
        "54000",
      );
    }));
}
