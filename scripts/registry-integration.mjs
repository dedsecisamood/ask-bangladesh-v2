import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { request } from "@playwright/test";
import { directoryIds } from "../database/tests/directory-fixture.mjs";
import { attachRegistryEvidence } from "../database/tests/registry-fixture.mjs";
import { registryProof } from "../database/tests/registry.cases.mjs";
export async function runRegistryIntegration({
  db,
  browser,
  baseURL,
  authAdmin,
  totp,
  contexts,
  identities,
  check,
}) {
  const post = (client, path, data, key = randomUUID()) =>
    client.post(path, {
      data,
      headers: { origin: baseURL, "idempotency-key": key },
      maxRedirects: 0,
    });
  const reviewers = [];
  for (let n = 0; n < 2; n++) {
    const email = `p18-${randomUUID()}@example.invalid`,
      password = randomBytes(32).toString("hex");
    const user = await authAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    assert.ok(!user.error);
    identities.push(user.data.user.id);
    const member = (
      await db.query(
        "INSERT INTO app_private.admin_memberships(auth_user_id,role,status) VALUES($1,'source_reviewer','active') RETURNING id",
        [user.data.user.id],
      )
    ).rows[0].id;
    const client = await request.newContext({ baseURL });
    contexts.push(client);
    const form = (path, data) =>
      client.post(path, {
        form: data,
        headers: { origin: baseURL },
        maxRedirects: 0,
      });
    assert.equal(
      (await form("/admin/sign-in", { email, password })).status(),
      303,
    );
    const enrolled = await form("/admin/enroll", {});
    assert.equal(enrolled.status(), 200);
    const html = await enrolled.text();
    const secret = /<code>([A-Z2-7]+)<\/code>/u.exec(html)?.[1],
      factor = /name="factor_id" value="([a-f0-9-]+)"/u.exec(html)?.[1];
    assert.ok(secret && factor);
    assert.equal(
      (
        await form("/admin/mfa", { factor_id: factor, code: totp(secret) })
      ).status(),
      303,
    );
    reviewers.push({ client, member });
  }
  check(
    "P18 two additional synthetic reviewers sign in with real provider MFA",
  );
  const anon = await request.newContext({ baseURL });
  contexts.push(anon);
  const input = {
    agency_id: directoryIds.agency,
    url: "https://registry.example.com/http-fixture/#section",
    source_name: "Synthetic HTTP registry fixture",
    description: "PRIVATE registry notes",
    language: "bn",
    source_type: "portal",
    risk_class: "critical",
    reason: "Synthetic fixture only",
  };
  assert.equal(
    (await post(anon, "/api/v1/admin/sources", input)).status(),
    401,
  );
  assert.equal(
    (
      await post(browser, "/api/v1/admin/sources", {
        ...input,
        url: "https://127.0.0.1/",
      })
    ).status(),
    400,
  );
  assert.equal(
    (
      await post(browser, "/api/v1/admin/sources", {
        ...input,
        status: "active",
      })
    ).status(),
    400,
  );
  const key = randomUUID();
  let response = await post(browser, "/api/v1/admin/sources", input, key);
  assert.equal(response.status(), 201);
  let source = (await response.json()).data;
  const path = `/api/v1/admin/sources/${source.id}`;
  assert.deepEqual(
    (await (await post(browser, "/api/v1/admin/sources", input, key)).json())
      .data,
    source,
  );
  assert.equal(
    (
      await post(
        browser,
        "/api/v1/admin/sources",
        { ...input, source_name: "Changed" },
        key,
      )
    ).status(),
    409,
  );
  assert.equal(
    (await post(browser, "/api/v1/admin/sources", input)).status(),
    409,
  );
  assert.equal((await anon.get(`/api/v1/sources/${source.id}`)).status(), 404);
  check(
    "P18 real candidate creation, URL safety, trust-field denial, deduplication and retry isolation",
  );
  const act = async (
    client,
    action,
    payload = { reason: "Synthetic review" },
  ) => {
    const res = await post(client, path + "/" + action, {
      ...payload,
      revision: source.revision,
    });
    assert.equal(res.status(), 200, `P18 ${action} status`);
    source = (await res.json()).data;
    return source;
  };
  assert.equal(
    (
      await post(browser, path + "/submit", {
        revision: "999",
        reason: "Stale",
      })
    ).status(),
    409,
  );
  await act(browser, "submit");
  assert.equal(
    (
      await post(browser, path + "/approve", {
        ...registryProof(),
        revision: source.revision,
      })
    ).status(),
    403,
  );
  await act(reviewers[0].client, "approve", registryProof());
  assert.equal(source.status, "verified");
  assert.equal((await anon.get(`/api/v1/sources/${source.id}`)).status(), 404);
  assert.equal(
    (
      await post(reviewers[0].client, path + "/activate", {
        revision: source.revision,
        reason: "First reviewer cannot countersign",
      })
    ).status(),
    403,
  );
  await act(reviewers[1].client, "activate");
  assert.equal(source.status, "active");
  assert.equal((await anon.get(`/api/v1/sources/${source.id}`)).status(), 404);
  await attachRegistryEvidence(db, source.id, reviewers[0].member);
  const published = await anon.get(`/api/v1/sources/${source.id}`);
  assert.equal(published.status(), 200);
  const publicBody = await published.text();
  assert.ok(!publicBody.includes("PRIVATE"));
  assert.ok(!publicBody.includes("evidence_ref"));
  assert.equal(JSON.parse(publicBody).data.evidence_eligible, false);
  check(
    "P18 independent critical approval and activation preserve the document/public-private gates",
  );
  const reviewed = await reviewers[0].client.get(path);
  assert.equal(reviewed.status(), 200);
  const privateBody = await reviewed.json();
  assert.ok(privateBody.data.approved_at);
  assert.ok(privateBody.data.verifications.length >= 2);
  assert.equal(privateBody.data.history.length, 4);
  const { agency_id, url, ...update } = input;
  void agency_id;
  void url;
  const edited = await browser.patch(path, {
    data: {
      ...update,
      source_name: "Edited synthetic fixture",
      revision: source.revision,
    },
    headers: { origin: baseURL, "idempotency-key": randomUUID() },
  });
  assert.equal(edited.status(), 200);
  source = (await edited.json()).data;
  assert.equal(source.registry_status, "draft");
  assert.equal((await anon.get(`/api/v1/sources/${source.id}`)).status(), 404);
  await act(browser, "submit");
  await act(reviewers[0].client, "approve", registryProof());
  await act(reviewers[1].client, "activate");
  await act(reviewers[0].client, "suspend");
  assert.equal((await anon.get(`/api/v1/sources/${source.id}`)).status(), 404);
  await act(browser, "submit");
  await act(reviewers[0].client, "reject");
  assert.equal(source.registry_status, "rejected");
  assert.equal((await anon.get(`/api/v1/sources/${source.id}`)).status(), 404);
  check(
    "P18 HTTP edits, suspension and rejection withhold old publication and retain review history",
  );
  return { reviewers, source };
}
