import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { assertDisposableName } from "../../scripts/database-local.mjs";
import {
  seedDirectoryFixture,
  directoryIds as i,
} from "./directory-fixture.mjs";
import { registryProof } from "./registry.cases.mjs";
import { registerIngestionTests } from "./ingestion.cases.mjs";

const url = "https://crawler.example.com/fixture/";
export function registerCrawlerTests({
  test,
  transaction,
  rejects,
  committed,
  testDatabaseUrl,
}) {
  const scenario = (name, work, persist = false) =>
    test(name, () =>
      (persist ? committed : transaction)(async (c) => {
        await seedDirectoryFixture(c);
        const sessions = [randomUUID(), randomUUID()];
        const hashes = ["a".repeat(64), "b".repeat(64)];
        const users = [i.creator, i.reviewer];
        for (const [n, user] of users.entries())
          await c.query("SELECT app_staff.open_bound_session($1,$2,$3)", [
            user,
            sessions[n],
            hashes[n],
          ]);
        await c.query(
          "GRANT askbd_worker,askbd_staff,askbd_web TO postgres WITH INHERIT FALSE, SET TRUE",
        );
        const command = async (n, action, source, payload, revision) =>
          (
            await c.query(
              "SELECT app_staff.registry_command($1,$2,$3,$4,$5,$6,$7,$8) r",
              [
                users[n],
                sessions[n],
                hashes[n],
                action,
                source,
                payload,
                revision,
                randomUUID(),
              ],
            )
          ).rows[0].r;
        let s = await command(
          0,
          "create",
          null,
          {
            agency_id: i.agency,
            canonical_url: url,
            submitted_url: url,
            source_name: "Synthetic crawler fixture",
            language: "en",
            source_type: "html",
            risk_class: "general",
            reason: "Offline test",
          },
          null,
        );
        assert.ok(s.id);
        s = await command(
          0,
          "submit",
          s.id,
          { reason: "Offline test" },
          s.revision,
        );
        s = await command(1, "approve", s.id, registryProof(), s.revision);
        s = await command(
          1,
          "activate",
          s.id,
          { reason: "Offline test" },
          s.revision,
        );
        assert.equal(s.status, "active");
        const approve = async (
          n = 1,
          urls = [url],
          proof = registryProof().ownership,
          key = randomUUID(),
          limits = {},
        ) =>
          (
            await c.query(
              "SELECT app_staff.approve_crawl_policy($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) r",
              [
                users[n],
                sessions[n],
                hashes[n],
                s.id,
                s.revision,
                urls,
                proof,
                "AskBangladeshTest/1.0",
                key,
                limits,
              ],
            )
          ).rows[0].r;
        const worker = async (sql, args = []) => {
          await c.query("SAVEPOINT worker_call");
          await c.query("SET LOCAL ROLE askbd_worker");
          try {
            return (await c.query(sql, args)).rows[0]?.r;
          } catch (error) {
            await c.query("ROLLBACK TO SAVEPOINT worker_call");
            throw error;
          } finally {
            await c.query("RESET ROLE");
          }
        };
        const read = () =>
          worker("SELECT app_worker.crawl_policy($1) r", [s.id]);
        const reserve = (p, target = url) =>
          worker("SELECT app_worker.reserve_retrieval($1,$2) r", [p, target]);
        const finish = (ticket, extra = {}) =>
          worker("SELECT app_worker.finish_retrieval($1,$2) r", [
            ticket,
            {
              final_url: url,
              http_status: 200,
              content_type: "text/html",
              response_size: 123,
              content_hash: "a".repeat(64),
              etag: '"fixture"',
              last_modified: null,
              error: null,
              ...extra,
            },
          ]);
        await work({
          c,
          s,
          approve,
          worker,
          read,
          reserve,
          finish,
          users,
          sessions,
          hashes,
        });
      }),
    );

  scenario(
    "P22 source approval alone never grants crawl access; fresh independent scope review is required",
    async ({ approve, read, c, s }) => {
      assert.equal((await read()).error, "NOT_APPROVED");
      assert.equal((await approve(0)).error, "NOT_APPROVED");
      for (const target of [
        "http://crawler.example.com/fixture/",
        "https://evil.example.com/fixture/",
        url + "?nid=1",
        url + "../private/",
        url + "%2e/",
      ])
        assert.equal((await approve(1, [target])).error, "NOT_APPROVED");
      const p = await approve();
      assert.ok(p.policy_id);
      assert.equal((await read()).policy_id, p.policy_id);
      assert.equal(
        (
          await c.query(
            "SELECT count(*)::int n FROM app_private.staff_audit_events WHERE action='crawl_permission' AND record_id=$1",
            [s.id],
          )
        ).rows[0].n,
        1,
      );
    },
  );
  scenario(
    "P22 crawl permission retries are actor-bound and mismatched payloads cannot reuse an approval",
    async ({ approve }) => {
      const key = randomUUID(),
        proof = registryProof().ownership;
      const p = await approve(1, [url], proof, key);
      assert.ok(p.policy_id);
      assert.deepEqual(await approve(1, [url], proof, key), p);
      assert.equal(
        (await approve(1, [url + "changed/"], proof, key)).error,
        "NOT_APPROVED",
      );
    },
  );
  scenario(
    "P22 revocation, source edits and domain changes invalidate permission at request time",
    async ({ approve, read, c, s }) => {
      assert.ok((await approve()).policy_id);
      await c.query("SAVEPOINT allowed");
      for (const sql of [
        "UPDATE app_private.sources SET status='suspended' WHERE id=$1",
        "UPDATE app_private.sources SET source_name='Changed' WHERE id=$1",
        "UPDATE app_private.official_domains SET crawl_permission_status='denied' WHERE id=(SELECT official_domain_id FROM app_private.sources WHERE id=$1)",
        "UPDATE app_private.admin_memberships SET status='revoked' WHERE id=(SELECT registry_approved_by FROM app_private.sources WHERE id=$1)",
      ]) {
        await c.query(sql, [s.id]);
        assert.equal((await read()).error, "NOT_APPROVED");
        await c.query("ROLLBACK TO SAVEPOINT allowed");
      }
    },
  );
  scenario(
    "P22 durable single-request lease and five-second spacing guard all workers and robots",
    async ({ approve, reserve, finish, c }) => {
      const p = (await approve()).policy_id;
      assert.equal(
        (await reserve(p, "https://crawler.example.com/private/")).error,
        "NOT_APPROVED",
      );
      const ticket = (await reserve(p)).ticket;
      assert.ok(ticket);
      assert.equal((await reserve(p)).error, "BUSY");
      assert.equal((await finish(ticket)).recorded, true);
      assert.equal(
        (
          await c.query(
            "SELECT n.next_request_at>=r.completed_at+interval '5 seconds' spaced FROM app_private.crawl_network_state n CROSS JOIN app_private.crawl_retrievals r WHERE r.id=$1",
            [ticket],
          )
        ).rows[0].spaced,
        true,
      );
      assert.equal((await reserve(p)).error, "BUSY");
      await c.query(
        "UPDATE app_private.crawl_network_state SET next_request_at=clock_timestamp()-interval '1 second'",
      );
      assert.ok(
        (await reserve(p, "https://crawler.example.com/robots.txt")).ticket,
      );
    },
  );
  scenario(
    "P22 reviewed lower limits are enforced and retry hashes include them",
    async ({ approve, read, reserve, finish, c }) => {
      const key = randomUUID(),
        proof = registryProof().ownership;
      const p = await approve(1, [url], proof, key, {
        max_bytes: 128,
        max_redirects: 0,
        daily_requests: 1,
      });
      assert.ok(p.policy_id);
      const policy = await read();
      assert.equal(policy.max_bytes, 128);
      assert.equal(policy.max_redirects, 0);
      assert.equal(
        (await approve(1, [url], proof, key, { max_bytes: 256 })).error,
        "NOT_APPROVED",
      );
      const ticket = (await reserve(p.policy_id)).ticket;
      assert.equal((await finish(ticket)).recorded, true);
      await c.query(
        "UPDATE app_private.crawl_network_state SET next_request_at='-infinity',leased_until=NULL,ticket=NULL",
      );
      assert.equal((await reserve(p.policy_id)).error, "BUDGET");
      assert.equal(
        (await approve(1, [url], proof, randomUUID(), { daily_requests: 101 }))
          .error,
        "NOT_APPROVED",
      );
    },
  );
  scenario(
    "P22 persisted rolling-day budget includes failed/abandoned requests and survives new adapters",
    async ({ approve, reserve, c }) => {
      const p = (await approve()).policy_id;
      for (let n = 0; n < 100; n++) {
        await c.query(
          "UPDATE app_private.crawl_network_state SET next_request_at='-infinity',leased_until=NULL,ticket=NULL",
        );
        assert.ok((await reserve(p)).ticket);
      }
      await c.query(
        "UPDATE app_private.crawl_network_state SET next_request_at='-infinity',leased_until=NULL,ticket=NULL",
      );
      assert.equal((await reserve(p)).error, "BUDGET");
    },
  );
  scenario(
    "P22 retrieval manifests preserve HTTP/hash metadata without publishing or refreshing evidence",
    async ({ approve, reserve, finish, c, s }) => {
      const before = (
        await c.query("SELECT count(*)::int n FROM app_private.source_checks")
      ).rows[0].n;
      const ticket = (await reserve((await approve()).policy_id)).ticket;
      assert.equal((await finish(ticket)).recorded, true);
      const row = (
        await c.query(
          "SELECT * FROM app_private.crawl_retrievals WHERE id=$1",
          [ticket],
        )
      ).rows[0];
      assert.equal(row.source_id, s.id);
      assert.equal(row.requested_url, url);
      assert.equal(row.content_hash, "a".repeat(64));
      assert.ok(row.completed_at >= row.attempted_at);
      assert.equal(
        (await c.query("SELECT count(*)::int n FROM app_private.source_checks"))
          .rows[0].n,
        before,
      );
      assert.equal((await finish(ticket)).error, "NOT_APPROVED");
    },
  );
  scenario(
    "P22 malformed final URLs and invalid manifests cannot be persisted",
    async ({ approve, reserve, finish }) => {
      const ticket = (await reserve((await approve()).policy_id)).ticket;
      assert.equal(
        (await finish(ticket, { final_url: "https://evil.example.com/" }))
          .error,
        "NOT_APPROVED",
      );
      assert.equal(
        (await finish(ticket, { response_size: 100000000 })).error,
        "NOT_APPROVED",
      );
      assert.equal(
        (
          await finish(ticket, {
            content_hash: null,
            http_status: null,
            error: "TIMEOUT",
            final_url: null,
          })
        ).recorded,
        true,
      );
    },
  );
  scenario(
    "P22 worker cannot read raw data, write policy, approve content or grant staff roles",
    async ({ c, worker }) => {
      await c.query("SET LOCAL ROLE askbd_worker");
      await rejects(c, "SELECT * FROM app_private.sources", [], "42501");
      await rejects(c, "SELECT * FROM app_private.crawl_policies", [], "42501");
      await rejects(
        c,
        "INSERT INTO app_private.admin_memberships(auth_user_id,role) VALUES(gen_random_uuid(),'owner')",
        [],
        "42501",
      );
      await c.query("RESET ROLE");
      assert.ok(worker);
      for (const role of ["askbd_web", "askbd_staff"]) {
        await c.query(`SET LOCAL ROLE ${role}`);
        await rejects(
          c,
          "SELECT app_worker.crawl_policy($1)",
          [i.source],
          "42501",
        );
        await c.query("RESET ROLE");
      }
    },
  );
  registerIngestionTests({ scenario, rejects });
  scenario(
    "P22 and Phase 5 real Python adapters use temporary worker login and offline parser",
    async ({ c, s, approve }) => {
      const endpoint = new URL(testDatabaseUrl());
      assertDisposableName(endpoint.pathname.slice(1));
      assert.ok(
        (await approve(1, [url, url + "native.pdf", url + "scan.pdf"]))
          .policy_id,
      );
      await c.query("UPDATE app_private.ingestion_controls SET paused=false");
      const user = "askbd_p22_" + randomUUID().replaceAll("-", "");
      const password = randomBytes(32).toString("hex");
      // Both literals are locally generated hex/identifier strings, never job input.
      await c.query(
        `CREATE ROLE "${user}" LOGIN PASSWORD '${password}' NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`,
      );
      try {
        await c.query(
          `GRANT askbd_worker TO "${user}" WITH INHERIT FALSE, SET TRUE`,
        );
        await new Promise((resolve, reject) => {
          const child = spawn(
            process.execPath,
            [
              "scripts/python.mjs",
              "workers/ingestion/tests/crawler_database_probe.py",
            ],
            {
              windowsHide: true,
              stdio: ["ignore", "pipe", "pipe"],
              env: {
                ...process.env,
                ASKBD_PROBE_DB: endpoint.pathname.slice(1),
                ASKBD_PROBE_USER: user,
                ASKBD_PROBE_PASSWORD: password,
                ASKBD_PROBE_SOURCE: s.id,
                ASKBD_PROBE_URL: url,
              },
            },
          );
          const timer = setTimeout(() => {
            child.kill();
            reject(new Error("Local Python probe timed out"));
          }, 180000);
          let output = "";
          child.stdout.on("data", (chunk) => {
            output += chunk;
          });
          child.stderr.resume(); // Never forward credential-bearing driver diagnostics.
          child.on("error", () => {
            clearTimeout(timer);
            reject(new Error("Python probe did not start"));
          });
          child.on("exit", (code) => {
            clearTimeout(timer);
            if (code === 0 && output.includes("P22_REAL_ADAPTER_PASS"))
              resolve();
            else
              reject(
                new Error(
                  "Local Python adapter probe failed; raw diagnostics withheld",
                ),
              );
          });
        });
        const manifests = (
          await c.query(
            "SELECT count(*)::int n FROM app_private.crawl_retrievals WHERE source_id=$1 AND completed_at IS NOT NULL AND error IS NULL",
            [s.id],
          )
        ).rows[0].n;
        assert.equal(manifests, 8);
      } finally {
        await c.query(`DROP ROLE "${user}"`);
      }
    },
    true,
  );
}
