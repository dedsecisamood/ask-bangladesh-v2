import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  seedRetrievalScenario,
  asRetrievalRole,
  owner,
} from "./retrieval.cases.mjs";
import { seedRetrievalDocument } from "./keyword.cases.mjs";
import { directoryIds as i } from "./directory-fixture.mjs";

export function registerAnswerTests({ test, transaction, rejects }) {
  async function fixture(c, type = "general", options = {}) {
    await seedRetrievalScenario(c);
    const text = "Synthetic archive statement for disposable tests only.";
    const doc = await seedRetrievalDocument(c, [text]);
    const evidence = (
      await c.query(
        "SELECT evidence FROM app_private.retrieval_candidates('bn',NULL,NULL,NULL,NULL,$1::uuid[])",
        [doc.ids],
      )
    ).rows[0].evidence;
    const claim = randomUUID();
    await c.query(
      "INSERT INTO app_private.service_claims(id,service_id,claim_type,language,claim_text,created_by,applicability) VALUES($1,$2,$3,'bn',$4,$5,$6)",
      [
        claim,
        i.service,
        type === "general" ? "other" : type,
        text,
        i.creator,
        options.applicability ?? {},
      ],
    );
    await c.query(
      "INSERT INTO app_private.claim_evidence(claim_id,passage_id,support_type,reviewed_by,reviewed_at,note) VALUES($1,$2,'supports',$3,statement_timestamp(),'PRIVATE fixture review')",
      [
        claim,
        doc.ids[0],
        options.evidenceReviewer ?? (type === "general" ? i.reviewer : owner),
      ],
    );
    await c.query(
      "UPDATE app_private.service_claims SET verification_status='reviewed',publication_status='published',reviewed_by=$2,reviewed_at=statement_timestamp(),review_note='PRIVATE curated fixture review' WHERE id=$1",
      [claim, i.reviewer],
    );
    return {
      claim,
      doc,
      request: {
        key: "a".repeat(64),
        type,
        text,
        language: "bn",
        evidence: [
          {
            passage_id: evidence.passage_id,
            version_id: evidence.document_version_id,
            passage_hash: evidence.passage_hash,
            content_hash: evidence.content_hash,
            quote: text,
          },
        ],
      },
    };
  }
  async function review(c, request) {
    return (
      await asRetrievalRole(
        c,
        "askbd_web",
        "SELECT app_public.answer_support($1::jsonb) result",
        [JSON.stringify([request])],
      )
    ).rows[0].result[0];
  }
  const scenario = (name, work) => test(`P38 ${name}`, () => transaction(work));
  scenario(
    "reviewed exact claim returns only a bounded support decision",
    async (c) => {
      const f = await fixture(c);
      assert.deepEqual(await review(c, f.request), {
        key: f.request.key,
        supported: true,
        critical: false,
      });
    },
  );
  scenario(
    "critical claims require a separate independent evidence reviewer",
    async (c) => {
      const f = await fixture(c, "fee");
      assert.equal((await review(c, f.request)).critical, true);
      await c.query(
        "UPDATE app_private.admin_memberships SET status='revoked' WHERE id=$1",
        [owner],
      );
      assert.equal((await review(c, f.request)).supported, false);
    },
  );
  scenario(
    "critical claims cannot reuse the claim approver as the second reviewer",
    async (c) => {
      const f = await fixture(c, "fee", { evidenceReviewer: i.reviewer });
      assert.equal((await review(c, f.request)).supported, false);
    },
  );
  scenario(
    "applicant-specific curated claims require an explicit applicability matcher",
    async (c) => {
      const f = await fixture(c, "general", {
        applicability: { applicant: "fictional-scope" },
      });
      assert.equal((await review(c, f.request)).supported, false);
    },
  );
  for (const [name, mutate] of [
    [
      "paraphrased claim",
      (f) => {
        f.request.text += " unsupported";
      },
    ],
    [
      "wrong language",
      (f) => {
        f.request.language = "en";
      },
    ],
    [
      "wrong claim type",
      (f) => {
        f.request.type = "fee";
      },
    ],
    [
      "wrong passage version",
      (f) => {
        f.request.evidence[0].version_id = randomUUID();
      },
    ],
    [
      "wrong passage hash",
      (f) => {
        f.request.evidence[0].passage_hash = "b".repeat(64);
      },
    ],
    [
      "wrong document hash",
      (f) => {
        f.request.evidence[0].content_hash = "b".repeat(64);
      },
    ],
    [
      "irrelevant support quote",
      (f) => {
        f.request.evidence[0].quote = "Unsupported fee 999";
      },
    ],
  ])
    scenario(`rejects ${name}`, async (c) => {
      const f = await fixture(c);
      mutate(f);
      assert.equal((await review(c, f.request)).supported, false);
    });
  scenario("withdrawal is effective on the next support read", async (c) => {
    const f = await fixture(c);
    assert.equal((await review(c, f.request)).supported, true);
    await c.query(
      "UPDATE app_private.service_claims SET publication_status='withdrawn' WHERE id=$1",
      [f.claim],
    );
    assert.equal((await review(c, f.request)).supported, false);
  });
  scenario("revoked claim reviewer cannot authorize support", async (c) => {
    const f = await fixture(c);
    await c.query(
      "UPDATE app_private.admin_memberships SET status='revoked' WHERE id=$1",
      [i.reviewer],
    );
    assert.equal((await review(c, f.request)).supported, false);
  });
  scenario(
    "reactivating a reviewer does not resurrect an older critical review",
    async (c) => {
      const f = await fixture(c, "fee");
      assert.equal((await review(c, f.request)).supported, true);
      await c.query(
        "UPDATE app_private.admin_memberships SET status='revoked' WHERE id=$1",
        [owner],
      );
      await c.query(
        "UPDATE app_private.admin_memberships SET status='active' WHERE id=$1",
        [owner],
      );
      assert.equal((await review(c, f.request)).supported, false);
    },
  );
  scenario(
    "contradicting evidence invalidates an otherwise published claim",
    async (c) => {
      const f = await fixture(c);
      await c.query(
        "INSERT INTO app_private.claim_evidence(claim_id,passage_id,support_type,reviewed_by,reviewed_at) VALUES($1,$2,'contradicts',$3,statement_timestamp())",
        [f.claim, f.doc.ids[0], owner],
      );
      assert.equal((await review(c, f.request)).supported, false);
    },
  );
  scenario(
    "anonymous callers and private-table reads remain denied",
    async (c) => {
      await fixture(c);
      for (const role of ["anon", "authenticated"]) {
        await c.query(`GRANT ${role} TO postgres WITH INHERIT FALSE, SET TRUE`);
        await c.query(`SET LOCAL ROLE ${role}`);
        await rejects(c, "SELECT app_public.answer_support('[]')", [], "42501");
        await c.query("RESET ROLE");
      }
      await c.query("SET LOCAL ROLE askbd_web");
      await rejects(c, "SELECT * FROM app_private.service_claims", [], "42501");
      await c.query("RESET ROLE");
    },
  );
  scenario(
    "malformed, oversized and duplicate requests fail closed",
    async (c) => {
      const f = await fixture(c);
      for (const data of [
        null,
        {},
        Array(13).fill(f.request),
        [f.request, f.request],
        [{ ...f.request, private: true }],
        [{ ...f.request, evidence: [] }],
      ])
        await rejects(
          c,
          "SELECT app_public.answer_support($1::jsonb)",
          [JSON.stringify(data)],
          "22023",
        );
    },
  );
}
