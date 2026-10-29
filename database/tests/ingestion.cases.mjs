import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { registryProof } from "./registry.cases.mjs";
const url = "https://crawler.example.com/fixture/";
const hash = (value) => createHash("sha256").update(value).digest("hex");

export function registerIngestionTests({ scenario, rejects }) {
  const stage = (name, work) =>
    scenario(name, async (context) => {
      const { c, s, approve, worker } = context;
      assert.ok((await approve()).policy_id);
      const enqueue = async (key = randomUUID(), target = url) =>
        worker("SELECT app_worker.enqueue_ingestion($1,$2,'ingest',$3) r", [
          s.id,
          target,
          key,
        ]);
      const claim = async () =>
        (await worker("SELECT app_worker.claim_ingestion() r")).job;
      const ready = async () =>
        c.query("UPDATE app_private.ingestion_controls SET paused=false");
      const capture = async (
        job,
        body = "Synthetic extracted content for a private fixture only.",
        type = "text/html",
      ) => {
        await c.query(
          "UPDATE app_private.crawl_network_state SET next_request_at='-infinity',leased_until=NULL,ticket=NULL",
        );
        const ticket = (
          await worker("SELECT app_worker.reserve_ingestion($1,$2,$3) r", [
            job.id,
            job.lease_token,
            url,
          ])
        ).ticket;
        assert.ok(ticket);
        const digest = hash(body);
        assert.equal(
          (
            await worker("SELECT app_worker.finish_retrieval($1,$2) r", [
              ticket,
              {
                final_url: url,
                http_status: 200,
                content_type: type,
                response_size: body.length,
                content_hash: digest,
                etag: null,
                last_modified: null,
                error: null,
              },
            ])
          ).recorded,
          true,
        );
        return { id: ticket, hash: digest, body };
      };
      const payload = (capture, extra = {}) => ({
        title: "Synthetic extracted document",
        media_type: "text/html",
        content_hash: capture.hash,
        extraction_profile: "p5-" + hash("fixture-profile"),
        snapshot_key: `original/sha256/${capture.hash.slice(0, 2)}/${capture.hash}`,
        extracted_key:
          "derivative/sha256/" +
          hash("derivative").slice(0, 2) +
          "/" +
          hash("derivative"),
        raw_text: capture.body,
        flags: [],
        extraction_method: "html",
        passages: [
          {
            ordinal: 0,
            text: capture.body,
            normalized_text: capture.body,
            section_path: [],
            heading: null,
            page_number: null,
            page_label: null,
            character_start: 0,
            character_end: capture.body.length,
            locator: { kind: "html", dom_path: "/main[1]/p[1]" },
            language: "en",
            quality_status: "pending",
            flags: [],
          },
        ],
        ...extra,
      });
      const complete = async (job, capture, data = payload(capture)) =>
        worker("SELECT app_worker.complete_ingestion($1,$2,$3,$4) r", [
          job.id,
          job.lease_token,
          capture.id,
          data,
        ]);
      const review = async (version, action = "approve", flags = [], n = 1) => {
        const revision = (
          await c.query(
            "SELECT revision FROM app_private.document_versions WHERE id=$1",
            [version],
          )
        ).rows[0].revision;
        return (
          await c.query(
            "SELECT app_staff.review_ingestion($1,$2,$3,$4,$5,$6,$7,$8,$9) r",
            [
              context.users[n],
              context.sessions[n],
              context.hashes[n],
              version,
              revision,
              action,
              registryProof().ownership,
              flags,
              "Explicit synthetic locator/quality review",
            ],
          )
        ).rows[0].r;
      };
      await work({
        ...context,
        enqueue,
        claim,
        ready,
        capture,
        payload,
        complete,
        review,
      });
    });
  stage(
    "P27 queue is paused by default and cannot admit arbitrary source URLs",
    async ({ enqueue, claim, worker }) => {
      assert.ok((await enqueue()).job_id);
      assert.equal(await claim(), null);
      assert.equal(
        (await enqueue(randomUUID(), "https://evil.example.com/")).error,
        "NOT_APPROVED",
      );
      assert.deepEqual(
        await worker("SELECT app_worker.schedule_ingestion() r"),
        { paused: true, scheduled: 0 },
      );
    },
  );
  stage(
    "P27 enqueue deduplicates keys and active targets without accepting mismatched retries",
    async ({ enqueue }) => {
      const key = randomUUID();
      const a = await enqueue(key);
      assert.deepEqual(await enqueue(key), a);
      assert.deepEqual(await enqueue(), a);
    },
  );
  stage(
    "P27 leases serialize a source, renew, fence expired attempts and survive restart",
    async ({ c, enqueue, ready, claim, worker }) => {
      await ready();
      await enqueue();
      const first = await claim();
      assert.ok(first.lease_token);
      assert.equal(await claim(), null);
      assert.equal(
        (
          await worker("SELECT app_worker.heartbeat_ingestion($1,$2) r", [
            first.id,
            first.lease_token,
          ])
        ).renewed,
        true,
      );
      await c.query(
        "UPDATE app_private.ingestion_jobs SET leased_until=clock_timestamp()-interval '1 second' WHERE id=$1",
        [first.id],
      );
      assert.equal(await claim(), null); // Recovered work has a 30-second cooldown.
      await c.query(
        "UPDATE app_private.ingestion_jobs SET available_at=clock_timestamp()-interval '1 second' WHERE id=$1",
        [first.id],
      );
      const next = await claim();
      assert.ok(next.generation > first.generation);
      assert.notEqual(next.lease_token, first.lease_token);
      assert.equal(
        (
          await worker("SELECT app_worker.heartbeat_ingestion($1,$2) r", [
            first.id,
            first.lease_token,
          ])
        ).error,
        "NOT_APPROVED",
      );
      assert.equal(
        (
          await worker("SELECT app_worker.reserve_ingestion($1,$2,$3) r", [
            first.id,
            first.lease_token,
            url,
          ])
        ).error,
        "NOT_APPROVED",
      );
    },
  );
  stage(
    "P27 valid captured bytes commit private versions/passages and a review-blocked indexing outbox",
    async ({ c, enqueue, ready, claim, capture, complete }) => {
      await ready();
      await enqueue();
      const job = await claim();
      const observed = await capture(job);
      const result = await complete(job, observed);
      assert.equal(result.state, "completed");
      assert.ok(result.version_id);
      const version = (
        await c.query(
          "SELECT * FROM app_private.document_versions WHERE id=$1",
          [result.version_id],
        )
      ).rows[0];
      assert.equal(version.review_state, "extracted");
      assert.equal(version.published_at, null);
      assert.equal(version.released_at, null);
      assert.equal(
        (
          await c.query(
            "SELECT extraction_quality_status FROM app_private.passages WHERE document_version_id=$1",
            [version.id],
          )
        ).rows[0].extraction_quality_status,
        "pending",
      );
      assert.equal(
        (
          await c.query(
            "SELECT state FROM app_private.ingestion_outbox WHERE version_id=$1",
            [version.id],
          )
        ).rows[0].state,
        "pending_review",
      );
      assert.equal(
        (
          await c.query("SELECT app_private.version_is_eligible($1) eligible", [
            version.id,
          ])
        ).rows[0].eligible,
        false,
      );
    },
  );
  stage(
    "P27 content/profile dedup preserves historical versions and locators",
    async ({ c, enqueue, ready, claim, capture, complete, payload }) => {
      await ready();
      await enqueue();
      let job = await claim();
      let cap = await capture(job);
      const first = await complete(job, cap);
      await enqueue();
      job = await claim();
      cap = await capture(job);
      const same = await complete(job, cap);
      assert.equal(same.version_id, first.version_id);
      await enqueue();
      job = await claim();
      cap = await capture(job);
      const changed = await complete(
        job,
        cap,
        payload(cap, { extraction_profile: "p5-" + hash("different-parser") }),
      );
      assert.notEqual(changed.version_id, first.version_id);
      assert.equal(
        (
          await c.query(
            "SELECT supersedes_id FROM app_private.document_versions WHERE id=$1",
            [changed.version_id],
          )
        ).rows[0].supersedes_id,
        first.version_id,
      );
      await rejects(
        c,
        "UPDATE app_private.passages SET passage_text='changed' WHERE document_version_id=$1",
        [first.version_id],
        "23514",
      );
    },
  );
  stage(
    "P26/P27 forged spans, approval fields, mismatched hashes and stale tokens roll back atomically",
    async ({
      c,
      enqueue,
      ready,
      claim,
      capture,
      complete,
      payload,
      worker,
    }) => {
      await ready();
      await enqueue();
      const job = await claim();
      const cap = await capture(job);
      const p = payload(cap);
      for (const bad of [
        { ...p, content_hash: "b".repeat(64) },
        { ...p, review_state: "approved" },
        { ...p, passages: [{ ...p.passages[0], text: "invented text" }] },
        { ...p, passages: [{ ...p.passages[0], quality_status: "accepted" }] },
      ])
        assert.equal((await complete(job, cap, bad)).error, "NOT_APPROVED");
      assert.equal(
        (
          await c.query(
            "SELECT count(*)::int n FROM app_private.document_versions WHERE extraction_profile=$1",
            [p.extraction_profile],
          )
        ).rows[0].n,
        0,
      );
      assert.equal(
        (
          await worker("SELECT app_worker.complete_ingestion($1,$2,$3,$4) r", [
            job.id,
            randomUUID(),
            cap.id,
            p,
          ])
        ).error,
        "NOT_APPROVED",
      );
    },
  );
  stage(
    "P27 independent human review accepts immutable pending passages and can revoke them",
    async ({ c, enqueue, ready, claim, capture, complete, review }) => {
      await ready();
      await enqueue();
      const job = await claim();
      const cap = await capture(job);
      const version = (await complete(job, cap)).version_id;
      assert.equal(
        (await review(version, "approve", [], 0)).error,
        "NOT_APPROVED",
      );
      assert.equal((await review(version)).reviewed, true);
      const passage = (
        await c.query(
          "SELECT id FROM app_private.passages WHERE document_version_id=$1",
          [version],
        )
      ).rows[0].id;
      assert.equal(
        (
          await c.query("SELECT app_private.passage_is_eligible($1) eligible", [
            passage,
          ])
        ).rows[0].eligible,
        true,
      );
      assert.equal((await review(version, "revoke")).reviewed, true);
      assert.equal(
        (
          await c.query("SELECT app_private.passage_is_eligible($1) eligible", [
            passage,
          ])
        ).rows[0].eligible,
        false,
      );
      assert.equal(
        (
          await c.query(
            "SELECT count(*)::int n FROM app_private.passage_reviews WHERE passage_id=$1",
            [passage],
          )
        ).rows[0].n,
        2,
      );
    },
  );
  stage(
    "P25/P26 OCR and layout flags require explicit human acknowledgement",
    async ({ enqueue, ready, claim, capture, complete, payload, review }) => {
      await ready();
      await enqueue();
      const job = await claim();
      const cap = await capture(job);
      const version = (
        await complete(
          job,
          cap,
          payload(cap, { flags: ["ocr_review", "critical_values_review"] }),
        )
      ).version_id;
      assert.ok(version);
      assert.equal(
        (await review(version, "approve", [])).error,
        "NOT_APPROVED",
      );
      assert.equal(
        (
          await review(version, "approve", [
            "ocr_review",
            "critical_values_review",
          ])
        ).reviewed,
        true,
      );
    },
  );
  stage(
    "P28 changed captures withdraw current guidance before a failed parser can leave stale publication",
    async ({ c, enqueue, ready, claim, capture, complete, review, worker }) => {
      await ready();
      await enqueue();
      let job = await claim();
      let cap = await capture(job);
      const version = (await complete(job, cap)).version_id;
      assert.equal((await review(version)).reviewed, true);
      await enqueue();
      job = await claim();
      cap = await capture(
        job,
        "Different synthetic content, never an official procedure.",
      );
      assert.equal(
        (
          await worker("SELECT app_worker.observe_ingestion($1,$2,$3) r", [
            job.id,
            job.lease_token,
            cap.id,
          ])
        ).observed,
        true,
      );
      assert.equal(
        (
          await c.query("SELECT app_private.version_is_eligible($1) eligible", [
            version,
          ])
        ).rows[0].eligible,
        false,
      );
      await worker("SELECT app_worker.fail_ingestion($1,$2,'PDF_INVALID') r", [
        job.id,
        job.lease_token,
      ]);
      assert.equal(
        (
          await c.query(
            "SELECT current_version_id FROM app_private.source_documents WHERE id=(SELECT source_document_id FROM app_private.document_versions WHERE id=$1)",
            [version],
          )
        ).rows[0].current_version_id,
        null,
      );
    },
  );
  stage(
    "P28 retries use bounded backoff and stop after five failed attempts",
    async ({ c, enqueue, ready, claim, worker }) => {
      await ready();
      await enqueue();
      let id;
      for (let attempt = 1; attempt <= 5; attempt++) {
        const job = await claim();
        id = job.id;
        const failure = await worker(
          "SELECT app_worker.fail_ingestion($1,$2,'TIMEOUT') r",
          [id, job.lease_token],
        );
        assert.equal(failure.state, attempt === 5 ? "dead" : "retry");
        if (attempt < 5) {
          assert.ok(
            failure.retry_delay_seconds >= 30 &&
              failure.retry_delay_seconds <= 500,
          );
          await c.query(
            "UPDATE app_private.ingestion_jobs SET available_at=clock_timestamp()-interval '1 second' WHERE id=$1",
            [id],
          );
        }
      }
      assert.equal(
        (
          await c.query(
            "SELECT attempts FROM app_private.ingestion_jobs WHERE id=$1",
            [id],
          )
        ).rows[0].attempts,
        5,
      );
    },
  );
  stage(
    "P28 503 Retry-After persists a minimum job delay without retrying a network hop",
    async ({ c, enqueue, ready, claim, worker }) => {
      await ready();
      await enqueue();
      const job = await claim();
      await c.query(
        "UPDATE app_private.crawl_network_state SET next_request_at='-infinity',leased_until=NULL,ticket=NULL",
      );
      const ticket = (
        await worker("SELECT app_worker.reserve_ingestion($1,$2,$3) r", [
          job.id,
          job.lease_token,
          url,
        ])
      ).ticket;
      assert.ok(ticket);
      assert.equal(
        (
          await worker("SELECT app_worker.finish_retrieval($1,$2) r", [
            ticket,
            {
              final_url: url,
              http_status: 503,
              content_type: "text/html",
              response_size: 0,
              content_hash: null,
              etag: null,
              last_modified: null,
              error: "HTTP_ERROR",
              retry_after_seconds: 7200,
            },
          ])
        ).recorded,
        true,
      );
      const result = await worker(
        "SELECT app_worker.fail_ingestion($1,$2,'HTTP_ERROR') r",
        [job.id, job.lease_token],
      );
      assert.equal(result.state, "retry");
      assert.equal(result.retry_delay_seconds, 7200);
      assert.equal(await claim(), null);
    },
  );
  stage(
    "P28 security failures pause instead of retrying and emergency stop rejects old claims",
    async ({ c, enqueue, ready, claim, worker }) => {
      await ready();
      await enqueue();
      const job = await claim();
      await c.query("UPDATE app_private.ingestion_controls SET paused=true");
      assert.equal(
        (
          await worker("SELECT app_worker.reserve_ingestion($1,$2,$3) r", [
            job.id,
            job.lease_token,
            url,
          ])
        ).error,
        "NOT_APPROVED",
      );
      const failed = await worker(
        "SELECT app_worker.fail_ingestion($1,$2,'UNSAFE_ADDRESS') r",
        [job.id, job.lease_token],
      );
      assert.equal(failed.state, "quarantined");
      assert.equal(await claim(), null);
      await ready();
      await c.query(
        "UPDATE app_private.ingestion_targets SET next_due_at='-infinity'",
      );
      assert.equal((await enqueue()).error, "MANUAL_REVIEW_REQUIRED");
      assert.equal(
        (await worker("SELECT app_worker.schedule_ingestion() r")).scheduled,
        0,
      );
    },
  );
  stage(
    "P28 a 404 suppresses previously approved guidance without renewing content freshness",
    async ({ c, enqueue, ready, claim, capture, complete, review, worker }) => {
      await ready();
      await enqueue();
      let job = await claim();
      const version = (await complete(job, await capture(job))).version_id;
      assert.equal((await review(version)).reviewed, true);
      await enqueue();
      job = await claim();
      await c.query(
        "UPDATE app_private.crawl_network_state SET next_request_at='-infinity',leased_until=NULL,ticket=NULL",
      );
      const ticket = (
        await worker("SELECT app_worker.reserve_ingestion($1,$2,$3) r", [
          job.id,
          job.lease_token,
          url,
        ])
      ).ticket;
      assert.equal(
        (
          await worker("SELECT app_worker.finish_retrieval($1,$2) r", [
            ticket,
            {
              final_url: url,
              http_status: 404,
              content_type: "text/html",
              response_size: 0,
              content_hash: null,
              etag: null,
              last_modified: null,
              error: "HTTP_ERROR",
            },
          ])
        ).recorded,
        true,
      );
      assert.equal(
        (
          await worker(
            "SELECT app_worker.fail_ingestion($1,$2,'HTTP_ERROR') r",
            [job.id, job.lease_token],
          )
        ).state,
        "quarantined",
      );
      assert.equal(
        (
          await c.query("SELECT app_private.version_is_eligible($1) eligible", [
            version,
          ])
        ).rows[0].eligible,
        false,
      );
      const check = (
        await c.query(
          "SELECT outcome,content_checked_at FROM app_private.source_checks WHERE document_version_id=$1 ORDER BY attempted_at DESC LIMIT 1",
          [version],
        )
      ).rows[0];
      assert.equal(check.outcome, "withdrawn");
      assert.equal(check.content_checked_at, null);
    },
  );
  stage(
    "P28 pause and interval changes require a fresh bound owner or administrator and append an audit",
    async ({ c, s, enqueue, users, sessions, hashes }) => {
      await enqueue();
      await c.query(
        "UPDATE app_private.ingestion_targets SET blocked=true,hold_code='UNSAFE_ADDRESS'",
      );
      const resume = async () =>
        (
          await c.query(
            "SELECT app_staff.resume_ingestion_target($1,$2,$3,$4,$5,'Synthetic reviewed recovery') r",
            [users[0], sessions[0], hashes[0], s.id, url],
          )
        ).rows[0].r;
      const control = async () =>
        (
          await c.query(
            "SELECT app_staff.set_ingestion_state($1,$2,$3,true,'Synthetic emergency stop',21600,86400) r",
            [users[0], sessions[0], hashes[0]],
          )
        ).rows[0].r;
      assert.equal((await control()).error, "NOT_APPROVED"); // Source reviewer.
      assert.equal((await resume()).error, "NOT_APPROVED");
      await c.query(
        "UPDATE app_private.admin_memberships SET role='owner' WHERE auth_user_id=$1",
        [users[0]],
      );
      const fresh = randomUUID();
      hashes[0] = "c".repeat(64);
      await c.query("SELECT app_staff.open_bound_session($1,$2,$3)", [
        users[0],
        fresh,
        hashes[0],
      ]);
      sessions[0] = fresh;
      await c.query("SET LOCAL ROLE askbd_staff");
      assert.equal((await control()).paused, true);
      assert.equal((await resume()).resumed, true);
      await c.query("RESET ROLE");
      assert.equal(
        (
          await c.query(
            "SELECT count(*)::int n FROM app_private.staff_audit_events WHERE action='ingestion_control'",
          )
        ).rows[0].n,
        2,
      );
      await c.query(
        "UPDATE app_private.staff_sessions SET created_at=statement_timestamp()-interval '6 minutes',expires_at=statement_timestamp()+interval '11 hours' WHERE auth_session_id=$1",
        [fresh],
      );
      assert.equal((await control()).error, "NOT_APPROVED");
    },
  );
  stage(
    "P28 scheduling and aggregate monitoring are bounded and metadata-only",
    async ({ ready, worker }) => {
      await ready();
      const scheduled = await worker(
        "SELECT app_worker.schedule_ingestion() r",
      );
      assert.ok(scheduled.scheduled <= 25);
      const metrics = await worker("SELECT app_worker.ingestion_metrics() r");
      assert.equal(metrics.paused, false);
      assert.ok(metrics.jobs.queued >= 1);
      assert.ok(!JSON.stringify(metrics).includes("PRIVATE"));
    },
  );
  stage(
    "P27/P28 web/staff roles cannot run worker functions or read raw pipeline records",
    async ({ c }) => {
      for (const role of ["askbd_web", "askbd_staff"]) {
        await c.query(`SET LOCAL ROLE ${role}`);
        await rejects(c, "SELECT app_worker.claim_ingestion()", [], "42501");
        await rejects(
          c,
          "SELECT * FROM app_private.ingestion_jobs",
          [],
          "42501",
        );
        await c.query("RESET ROLE");
      }
    },
  );
}
