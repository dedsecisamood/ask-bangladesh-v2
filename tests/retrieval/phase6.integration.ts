import { beforeAll, afterAll, expect, test, vi } from "vitest";
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { resolve } from "node:path";
import { cpus, totalmem } from "node:os";
import pg from "pg";
vi.mock("server-only", () => ({}));
const port = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../../apps/web/src/lib/database/connection", () => ({
  databaseQuery: port.query,
}));
import {
  root,
  localDatabaseUrl,
  assertDisposableConnection,
  assertDisposableName,
} from "../../scripts/database-local.mjs";
import {
  seedRetrievalScenario,
  owner,
} from "../../database/tests/retrieval.cases.mjs";
import { seedRetrievalDocument } from "../../database/tests/keyword.cases.mjs";
import { directoryIds as i } from "../../database/tests/directory-fixture.mjs";
import {
  localEmbeddingProvider,
  closeLocalEmbeddingWorker,
  embeddingProfiles,
  type EmbeddingProvider,
  type LocalModel,
} from "../../apps/web/src/lib/retrieval/embeddings";
import {
  embedEligibleBatch,
  type EmbeddingStore,
} from "../../apps/web/src/lib/retrieval/embedding-batch";
import { retrieveKeywordPassages } from "../../apps/web/src/lib/retrieval/keyword";
import { retrieveSemanticPassages } from "../../apps/web/src/lib/retrieval/semantic";
import {
  retrieveHybridPassages,
  retrieveRoutedPassages,
} from "../../apps/web/src/lib/retrieval/hybrid";
import { prepareRetrievalQuery } from "../../apps/web/src/lib/retrieval/query";
import { retrievalMetrics } from "../../apps/web/src/lib/retrieval/metrics";
import dataset from "./benchmark.synthetic.json";

const name = "askbd_p14_test_" + randomUUID().replaceAll("-", "");
const logins: string[] = [];
let admin: pg.Client, c: pg.Client, web: pg.Pool, embed: pg.Pool, base: string;
const documentIds = new Map<string, string>();
const documentProvenance: Record<
  string,
  {
    passage_id: string;
    document_id: string;
    version_id: string;
    source_url: string;
    content_hash: string;
  }
> = {};
const topics = {
  passport: {
    id: "33000000-0000-4000-8000-000000000001",
    title: "ই-পাসপোর্ট",
    aliases: ["passport", "e-passport", "পাসপোর্ট"],
  },
  nid: {
    id: "33000000-0000-4000-8000-000000000002",
    title: "এনআইডি",
    aliases: ["NID", "এনআইডি", "national id"],
  },
  land: {
    id: "33000000-0000-4000-8000-000000000003",
    title: "ভূমি উন্নয়ন কর",
    aliases: ["land development tax", "land tax", "জমির খাজনা", "jomir khajna"],
  },
};
beforeAll(async () => {
  base = localDatabaseUrl();
  assertDisposableConnection(base);
  assertDisposableName(name);
  admin = new pg.Client({ connectionString: base });
  await admin.connect();
  await admin.query(
    `CREATE DATABASE "${name}" TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C'`,
  );
  const url = new URL(base);
  url.pathname = "/" + name;
  c = new pg.Client({ connectionString: url.toString() });
  await c.connect();
  for (const file of readdirSync(resolve(root, "database/supabase/migrations"))
    .filter((f) => /^\d{14}_.+\.sql$/u.test(f))
    .sort())
    await c.query(
      readFileSync(resolve(root, "database/supabase/migrations", file), "utf8"),
    );
  await seedRetrievalScenario(c);
  await c.query(
    "INSERT INTO app_private.embedding_profile_approvals(profile_id,enabled,approved_by,note) VALUES($1,true,$2,'Synthetic local candidate comparison')",
    [embeddingProfiles.minilm.profileId, owner],
  );
  for (const [topic, t] of Object.entries(topics)) {
    await c.query(
      "INSERT INTO app_private.services(id,slug,publication_status) VALUES($1,$2,'published')",
      [t.id, "synthetic-" + topic],
    );
    await c.query(
      "INSERT INTO app_private.service_translations(service_id,locale,title,summary,review_state) VALUES($1,'bn',$2,'Synthetic fixture only','reviewed')",
      [t.id, t.title],
    );
    await c.query(
      "INSERT INTO app_private.service_categories(service_id,category_id) VALUES($1,$2)",
      [t.id, i.category],
    );
    await c.query(
      "INSERT INTO app_private.service_agencies(service_id,agency_id,review_state) VALUES($1,$2,'reviewed')",
      [t.id, i.agency],
    );
    await c.query(
      "INSERT INTO app_private.service_sources(service_id,source_id) VALUES($1,$2)",
      [t.id, i.source],
    );
    for (const alias of t.aliases)
      await c.query(
        "INSERT INTO app_private.service_aliases(service_id,alias,language,review_state) VALUES($1,$2,$3,'reviewed')",
        [
          t.id,
          alias,
          /[\u0980-\u09ff]/u.test(alias)
            ? "bn"
            : alias.includes("jomir")
              ? "banglish"
              : "en",
        ],
      );
    await c.query(
      "INSERT INTO app_private.metadata_releases(service_id,locale,record_revision,translation_revision,created_by,reviewed_by,reviewer_revision,reviewed_at,expires_at) SELECT s.id,'bn',s.revision,t.revision,$2,$3,1,statement_timestamp(),statement_timestamp()+interval '1 day' FROM app_private.services s JOIN app_private.service_translations t ON t.service_id=s.id AND t.locale='bn' WHERE s.id=$1",
      [t.id, i.creator, i.reviewer],
    );
  }
  for (const [n, doc] of dataset.documents.entries()) {
    const identity = (part: number) =>
      `34000000-0000-4000-8000-${String(n * 10 + part).padStart(12, "0")}`;
    const f = await seedRetrievalDocument(c, [doc.text], {
      language: doc.language,
      title: "Synthetic " + doc.key,
      identity: {
        document: identity(1),
        version: identity(2),
        passages: [identity(3)],
      },
    });
    documentIds.set(doc.key, f.ids[0]);
    documentProvenance[doc.key] = {
      passage_id: f.ids[0],
      document_id: f.doc,
      version_id: f.version,
      source_url: f.url,
      content_hash: f.hash,
    };
  }
  async function login(role: string) {
    const username = "askbd_p6_" + randomUUID().replaceAll("-", "");
    const password = randomBytes(32).toString("hex");
    await admin.query(
      `CREATE ROLE "${username}" LOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD '${password}'`,
    );
    logins.push(username);
    await admin.query(`GRANT ${role} TO "${username}"`);
    const connection = new URL(url);
    connection.username = username;
    connection.password = password;
    return new pg.Pool({
      connectionString: connection.toString(),
      max: 3,
      connectionTimeoutMillis: 2000,
      statement_timeout: 3000,
      application_name: "askbd-phase6-synthetic-test",
    });
  }
  web = await login("askbd_web");
  embed = await login("askbd_embedder");
  port.query.mockImplementation((sql: string, values: unknown[]) =>
    web.query(sql, values),
  );
});
afterAll(async () => {
  closeLocalEmbeddingWorker();
  await web?.end();
  await embed?.end();
  await c?.end();
  if (admin) {
    try {
      assertDisposableConnection(base);
      assertDisposableName(name);
      await admin.query(`DROP DATABASE IF EXISTS "${name}"`);
      for (const role of logins) {
        if (!/^askbd_p6_[a-f0-9]{32}$/u.test(role))
          throw Error("Unsafe cleanup identity");
        await admin.query(`DROP ROLE "${role}"`);
      }
    } finally {
      await admin.end();
    }
  }
});

const findings: unknown[] = [];
test.each(["e5", "minilm"] as LocalModel[])(
  "P30-P34 real offline %s model, PostgreSQL and hybrid/routing benchmark",
  async (key) => {
    const store: EmbeddingStore = {
      batch: async (profile, locale, limit) =>
        (
          await embed.query(
            "SELECT app_public.embedding_batch($1,$2,$3) result",
            [profile, locale, limit],
          )
        ).rows[0].result,
      commit: async (profile, revision, locale, entries) =>
        (
          await embed.query(
            "SELECT app_public.store_embeddings($1,$2,$3,$4::jsonb) n",
            [profile, revision, locale, JSON.stringify(entries)],
          )
        ).rows[0].n,
    };
    {
      const provider = localEmbeddingProvider(key);
      let inserted = 0;
      for (let batch = 0; batch < 4; batch++) {
        const r = await embedEligibleBatch(provider, store, "bn", 8);
        inserted += r.inserted;
        if (!r.selected) break;
        if (batch === 3) throw Error("Unexpected unbounded fixture batch");
      }
      expect(inserted).toBe(7);
      expect(
        (await embedEligibleBatch(provider, store, "bn", 8)).selected,
      ).toBe(0);
      const cases = [];
      for (const q of dataset.queries) {
        const minimized = prepareRetrievalQuery(q.query).normalized;
        const start = performance.now();
        const embedding = await provider.embed([minimized], "query");
        const embeddingMs = performance.now() - start;
        expect(embedding.vectors[0]).toHaveLength(384);
        expect(embedding.token_counts[0]).toBeLessThanOrEqual(
          provider.profile.maxTokens,
        );
        const vectors = new Map([
          [JSON.stringify(["query", [minimized]]), Promise.resolve(embedding)],
        ]);
        const requestProvider: EmbeddingProvider = {
          profile: provider.profile,
          embed: (texts, kind, signal) => {
            const cacheKey = JSON.stringify([kind, texts]);
            if (!vectors.has(cacheKey))
              vectors.set(cacheKey, provider.embed(texts, kind, signal));
            return vectors.get(cacheKey)!;
          },
        };
        const kStart = performance.now(),
          keyword = await retrieveKeywordPassages({
            query: minimized,
            locale: "bn",
            limit: 20,
          });
        const keywordMs = performance.now() - kStart;
        const sStart = performance.now(),
          semantic = await retrieveSemanticPassages(
            { query: minimized, locale: "bn", limit: 20 },
            requestProvider,
          );
        const semanticMs = performance.now() - sStart;
        const hStart = performance.now(),
          hybrid = await retrieveHybridPassages(
            { query: q.query, locale: "bn", limit: 20 },
            requestProvider,
            { rerank: false },
          );
        const hybridMs = performance.now() - hStart;
        const rerankStart = performance.now(),
          reranked = await retrieveHybridPassages(
            { query: q.query, locale: "bn", limit: 20 },
            requestProvider,
            { rerank: true },
          );
        const rerankMs = performance.now() - rerankStart;
        const rStart = performance.now(),
          ranked = await retrieveRoutedPassages(
            { query: q.query, locale: "bn", limit: 20 },
            requestProvider,
          );
        const rankedMs = performance.now() - rStart;
        expect(ranked.routing.decision).toBe(q.expected_route);
        if (q.topic)
          expect(ranked.routing.candidates[0].service_id).toBe(
            topics[q.topic as keyof typeof topics].id,
          );
        for (const p of ranked.items) {
          expect(p.evidence.source_id).toBe(i.source);
          expect(p.evidence.source_url).toMatch(
            /^https:\/\/p17\.example\.invalid\//u,
          );
          expect(p.evidence.page_number).toBeGreaterThan(0);
          expect(p.evidence.content_trust).toBe("untrusted_data");
        }
        const grades = Object.fromEntries(
          dataset.documents
            .filter((d) => d.topic === q.topic)
            .map((d) => [documentIds.get(d.key)!, 2]),
        );
        cases.push({
          id: q.id,
          language: q.language,
          has_gold: Boolean(q.topic),
          routing: ranked.routing.decision,
          redacted: ranked.redacted,
          keyword: retrievalMetrics(
            keyword.items.map((p) => p.passage_id),
            grades,
          ),
          semantic: retrievalMetrics(
            semantic.items.map((p) => p.evidence.passage_id),
            grades,
          ),
          hybrid: retrievalMetrics(
            hybrid.items.map((p) => p.evidence.passage_id),
            grades,
          ),
          reranked: retrievalMetrics(
            reranked.items.map((p) => p.evidence.passage_id),
            grades,
          ),
          routed: retrievalMetrics(
            ranked.items.map((p) => p.evidence.passage_id),
            grades,
          ),
          latency_ms: {
            embedding_total: embeddingMs,
            keyword: keywordMs,
            semantic_cached_vector: semanticMs,
            hybrid_cached_vector: hybridMs,
            reranked_cached_vector: rerankMs,
            reranked_routed_cached_vector: rankedMs,
          },
          model_rss_bytes: embedding.rss_bytes,
          provenance_ids: ranked.items.map((p) => p.evidence.passage_id),
        });
      }
      // True cold model process, followed by 100 sequential complete warm requests.
      closeLocalEmbeddingWorker();
      const coldStart = performance.now();
      await retrieveRoutedPassages(
        { query: "পাসপোর্ট নবায়ন", locale: "bn" },
        provider,
      );
      const coldMs = performance.now() - coldStart;
      const warmRequests = [];
      for (let n = 0; n < 100; n++) {
        const question = dataset.queries[n % dataset.queries.length].query,
          start = performance.now();
        await retrieveRoutedPassages(
          { query: question, locale: "bn" },
          provider,
        );
        warmRequests.push(performance.now() - start);
      }
      findings.push({
        model: key,
        profile: provider.profile,
        inserted,
        cold_routed_pipeline_ms: coldMs,
        warm_complete_requests_ms: warmRequests,
        cases,
      });
      console.log(
        `Phase6 ${key}: ${cases.length} real local model query experiments; seven synthetic passage vectors stored; cold pipeline ${coldMs.toFixed(1)} ms.`,
      );
    }
    mkdirSync(resolve(root, ".cache/phase6"), { recursive: true });
    writeFileSync(
      resolve(root, ".cache/phase6/benchmark.json"),
      JSON.stringify(
        {
          date: new Date().toISOString(),
          dataset_revision: dataset.revision,
          dataset_sha256: createHash("sha256")
            .update(
              readFileSync(
                resolve(root, "tests/retrieval/benchmark.synthetic.json"),
              ),
            )
            .digest("hex"),
          review_status: dataset.review_status,
          production_quality_gate:
            "NOT_EVALUATED_NO_REAL_CORPUS_OR_HUMAN_LABELS",
          environment: {
            node: process.version,
            platform: process.platform,
            cpu: cpus()[0]?.model,
            logical_cpus: cpus().length,
            memory_bytes: totalmem(),
          },
          findings,
          documents: documentProvenance,
        },
        null,
        2,
      ),
    );
  },
  180_000,
);

test("P30 worker bounds, cancellation and explicit provider incompatibility fail without persisting queries", async () => {
  const p = localEmbeddingProvider("e5");
  const activeController = new AbortController();
  const pending = p.embed(
    ["Synthetic cancellable query"],
    "query",
    activeController.signal,
  );
  await expect(
    p.embed(["Synthetic second query"], "query"),
  ).rejects.toMatchObject({ reason: "capacity" });
  activeController.abort();
  await expect(pending).rejects.toMatchObject({ reason: "timeout" });
  await expect(p.embed([], "query")).rejects.toThrow();
  const controller = new AbortController();
  controller.abort();
  await expect(
    p.embed(["Synthetic archive"], "query", controller.signal),
  ).rejects.toThrow();
  await expect(p.embed(["long ".repeat(1000)], "passage")).rejects.toThrow();
  const result = await web.query(
    "SELECT app_public.embedding_profile_authorized($1,$2) allowed",
    [p.profile.profileId, "0".repeat(40)],
  );
  expect(result.rows[0].allowed).toBe(false);
  const r = await c.query(
    "SELECT count(*)::int n FROM information_schema.tables WHERE table_schema='app_private' AND table_name IN ('citizen_queries','query_embeddings')",
  );
  expect(r.rows[0].n).toBe(0);
});
