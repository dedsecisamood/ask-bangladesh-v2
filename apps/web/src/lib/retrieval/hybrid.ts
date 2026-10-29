import "server-only";
import { z } from "zod";
import { databaseQuery } from "../database/connection";
import {
  keywordInputSchema,
  keywordPassageSchema,
  type KeywordSearchInput,
  type KeywordPassage,
} from "./contracts";
import {
  retrieveKeywordPassages,
  InvalidRetrievalInputError,
  RetrievalUnavailableError,
} from "./keyword";
import { retrieveSemanticPassages, type SemanticResult } from "./semantic";
import type { EmbeddingProvider } from "./embeddings";
import {
  prepareRetrievalQuery,
  normalizeRetrievalText,
  routeServiceIntent,
  routingCatalogSchema,
} from "./query";

export const rankOptionsSchema = z
  .object({
    rrf_k: z.number().int().min(1).max(100).default(60),
    keyword_weight: z.number().min(0.1).max(2).default(1),
    semantic_weight: z.number().min(0.1).max(2).default(1),
    candidate_limit: z.number().int().min(1).max(50).default(30),
    per_document: z.number().int().min(1).max(20).default(3),
    per_source: z.number().int().min(1).max(20).default(6),
    rerank: z.boolean().default(true),
  })
  .strict();
export type RankOptions = z.input<typeof rankOptionsSchema>;
export type RankedPassage = {
  evidence: KeywordPassage;
  keyword_rank: number | null;
  semantic_rank: number | null;
  keyword_score: number | null;
  similarity: number | null;
  fusion_score: number;
  rank_score: number;
  initial_rank: number;
  final_rank: number;
  methods: ("keyword" | "semantic")[];
  features: { heading_coverage: number; exact_phrase: boolean };
  authority: "reviewed_source" | "reviewed_service_scope";
  freshness: {
    published_at: string | null;
    content_checked_at: string;
    document_reviewed_at: string;
  };
};
const identity = (p: KeywordPassage) =>
  [
    p.document_version_id,
    p.document_id,
    p.source_id,
    p.source_url,
    p.passage_hash,
    p.content_hash,
    p.text,
    JSON.stringify(p.section_path),
    p.page_number,
    p.character_start,
    p.character_end,
  ].join("\0");
const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

// Pure, bounded RRF and deterministic feature reranking. Similarity is NOT truth.
export function rankPassages(
  query: string,
  keyword: readonly KeywordPassage[],
  semantic: SemanticResult["items"],
  limit: number,
  options: RankOptions = {},
) {
  const config = rankOptionsSchema.parse(options);
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 20 ||
    keyword.length > 50 ||
    semantic.length > 50
  )
    throw new InvalidRetrievalInputError();
  const entries = new Map<string, RankedPassage>();
  function include(
    p: KeywordPassage,
    branch: "keyword" | "semantic",
    rank: number,
    similarity: number | null,
  ) {
    const previous = entries.get(p.passage_id);
    if (
      previous &&
      (identity(previous.evidence) !== identity(p) ||
        previous.methods.includes(branch))
    )
      throw new RetrievalUnavailableError();
    const record: RankedPassage = previous ?? {
      evidence: p,
      keyword_rank: null,
      semantic_rank: null,
      keyword_score: null,
      similarity: null,
      fusion_score: 0,
      rank_score: 0,
      initial_rank: 0,
      final_rank: 0,
      methods: [],
      features: { heading_coverage: 0, exact_phrase: false },
      authority: "reviewed_source",
      freshness: {
        published_at: p.published_at,
        content_checked_at: p.content_checked_at,
        document_reviewed_at: p.document_reviewed_at,
      },
    };
    record.methods.push(branch);
    if (branch === "keyword") {
      record.keyword_rank = rank;
      record.keyword_score = p.score;
    } else {
      record.semantic_rank = rank;
      record.similarity = similarity;
    }
    record.fusion_score +=
      (branch === "keyword" ? config.keyword_weight : config.semantic_weight) /
      (config.rrf_k + rank);
    entries.set(p.passage_id, record);
  }
  keyword.forEach((p, n) => include(p, "keyword", n + 1, null));
  semantic.forEach(({ evidence, similarity }, n) =>
    include(evidence, "semantic", n + 1, similarity),
  );
  const initial = [...entries.values()].sort(
    (a, b) =>
      b.fusion_score - a.fusion_score ||
      compare(a.evidence.passage_id, b.evidence.passage_id),
  );
  const normalized = prepareRetrievalQuery(query).normalized,
    tokens = [...new Set(normalized.split(" ").filter(Boolean))];
  const max =
    (config.keyword_weight + config.semantic_weight) / (config.rrf_k + 1);
  initial.forEach((p, n) => {
    p.initial_rank = n + 1;
    const heading = ` ${normalizeRetrievalText(p.evidence.heading ?? "")} `;
    p.features.heading_coverage = tokens.length
      ? tokens.filter((t) => heading.includes(` ${t} `)).length / tokens.length
      : 0;
    p.features.exact_phrase = Boolean(
      normalized &&
      ` ${normalizeRetrievalText(p.evidence.text)} `.includes(
        ` ${normalized} `,
      ),
    );
    p.rank_score = config.rerank
      ? (0.85 * p.fusion_score) / max +
        0.1 * p.features.heading_coverage +
        0.05 * Number(p.features.exact_phrase)
      : p.fusion_score;
  });
  const sorted = initial.sort(
    (a, b) =>
      b.rank_score - a.rank_score ||
      b.fusion_score - a.fusion_score ||
      compare(a.evidence.passage_id, b.evidence.passage_id),
  );
  const docs = new Map<string, number>(),
    sources = new Map<string, number>(),
    result: RankedPassage[] = [];
  for (const p of sorted) {
    const d = docs.get(p.evidence.document_version_id) ?? 0,
      s = sources.get(p.evidence.source_id) ?? 0;
    if (d >= config.per_document || s >= config.per_source) continue;
    docs.set(p.evidence.document_version_id, d + 1);
    sources.set(p.evidence.source_id, s + 1);
    p.final_rank = result.length + 1;
    result.push(p);
    if (result.length === limit) break;
  }
  return result;
}
const recheckSchema = z
  .object({
    items: z.array(keywordPassageSchema).max(100),
    generation: z.string().regex(/^\d+$/),
    conflict_hold: z.boolean(),
    evaluated_at: z.iso.datetime({ offset: true }),
  })
  .strict();

export async function retrieveHybridPassages(
  input: KeywordSearchInput,
  provider?: EmbeddingProvider,
  options: RankOptions = {},
) {
  const parsed = keywordInputSchema.safeParse(input),
    config = rankOptionsSchema.safeParse(options);
  if (
    !parsed.success ||
    !config.success ||
    parsed.data.offset !== 0 ||
    parsed.data.limit > 20
  )
    throw new InvalidRetrievalInputError();
  const q = parsed.data,
    query = prepareRetrievalQuery(q.query);
  if (!query.normalized) throw new InvalidRetrievalInputError();
  const branch = {
    ...q,
    query: query.normalized,
    limit: config.data.candidate_limit,
  };
  const [keyword, semantic] = await Promise.allSettled([
    retrieveKeywordPassages(branch),
    provider
      ? retrieveSemanticPassages(branch, provider)
      : Promise.reject(new Error("Semantic branch disabled")),
  ]);
  if (keyword.status === "rejected" && semantic.status === "rejected")
    throw new RetrievalUnavailableError();
  const candidates = [
    ...new Map(
      [
        ...(keyword.status === "fulfilled" ? keyword.value.items : []),
        ...(semantic.status === "fulfilled"
          ? semantic.value.items.map((p) => p.evidence)
          : []),
      ].map((p) => [p.passage_id, { evidence: p }]),
    ).values(),
  ];
  try {
    const response = await databaseQuery<{ result: unknown }>(
      "SELECT app_public.recheck_retrieval($1::uuid[],$2::text,$3::uuid,$4::uuid,$5::uuid,$6::text,$7::uuid) result",
      [
        candidates.map((c) => c.evidence.passage_id),
        q.locale,
        q.service_id ?? null,
        q.agency_id ?? null,
        q.source_id ?? null,
        q.language ?? null,
        semantic.status === "fulfilled" ? semantic.value.profile_id : null,
      ],
    );
    const recheck = recheckSchema.parse(response.rows[0]?.result),
      allowed = new Map(recheck.items.map((p) => [p.passage_id, p]));
    if (
      allowed.size !== recheck.items.length ||
      recheck.items.some(
        (p) => !candidates.some((c) => c.evidence.passage_id === p.passage_id),
      )
    )
      throw Error();
    const current = (p: KeywordPassage) => {
      const now = allowed.get(p.passage_id);
      if (now && identity(p) !== identity(now)) throw Error();
      return now ? { ...now, score: p.score, signals: p.signals } : undefined;
    };
    const k =
      keyword.status === "fulfilled"
        ? keyword.value.items
            .map(current)
            .filter((p): p is KeywordPassage => Boolean(p))
        : [];
    const s =
      semantic.status === "fulfilled"
        ? semantic.value.items.flatMap((p) => {
            const now = current(p.evidence);
            return now ? [{ evidence: now, similarity: p.similarity }] : [];
          })
        : [];
    const items = rankPassages(query.normalized, k, s, q.limit, config.data);
    if (q.service_id)
      items.forEach((p) => {
        p.authority = "reviewed_service_scope";
      });
    return {
      items,
      status: recheck.conflict_hold
        ? "conflict_hold"
        : keyword.status !== "fulfilled" ||
            semantic.status !== "fulfilled" ||
            !semantic.value.coverage.complete
          ? "degraded"
          : items.length
            ? "complete"
            : "no_results",
      branches: {
        keyword: keyword.status === "fulfilled" ? "available" : "unavailable",
        semantic: semantic.status === "fulfilled" ? "available" : "unavailable",
      },
      semantic_coverage:
        semantic.status === "fulfilled" ? semantic.value.coverage : null,
      generation: recheck.generation,
      evaluated_at: recheck.evaluated_at,
      conflict_hold: recheck.conflict_hold,
      redacted: query.redacted,
      rank_version: "p32-rrf-features-v1",
      policy_revision: "p30-eligible-v1",
      query: { original: q.query, normalized: query.normalized },
    } as const;
  } catch {
    throw new RetrievalUnavailableError();
  }
}

export async function retrieveRoutedPassages(
  input: KeywordSearchInput,
  provider?: EmbeddingProvider,
  options: RankOptions = {},
) {
  const q = keywordInputSchema.safeParse(input);
  if (!q.success) throw new InvalidRetrievalInputError();
  let catalog;
  try {
    const r = await databaseQuery<{ result: unknown }>(
      "SELECT app_public.routing_catalog($1::text) result",
      [q.data.locale],
    );
    catalog = routingCatalogSchema.parse(r.rows[0]?.result);
  } catch {
    throw new RetrievalUnavailableError();
  }
  const route = routeServiceIntent(q.data.query, catalog);
  if (route.decision === "redacted_input")
    throw new InvalidRetrievalInputError();
  const service =
    q.data.service_id ??
    (route.decision === "matched" ? route.candidates[0].service_id : undefined);
  const contextName =
    route.decision === "matched" &&
    (!q.data.service_id || q.data.service_id === route.candidates[0].service_id)
      ? normalizeRetrievalText(route.candidates[0].name)
      : "";
  const expanded =
    contextName && !` ${route.normalized} `.includes(` ${contextName} `)
      ? `${route.normalized} ${contextName}`
      : route.normalized;
  const retrievalQuery = keywordInputSchema.safeParse({
    ...q.data,
    query: expanded,
  }).success
    ? expanded
    : route.normalized;
  // One ephemeral query-vector promise across a bounded scoped/general fallback.
  let embedding: ReturnType<EmbeddingProvider["embed"]> | undefined;
  const requestProvider = provider
    ? {
        profile: provider.profile,
        embed: (...args: Parameters<EmbeddingProvider["embed"]>) =>
          embedding ?? (embedding = provider.embed(...args)),
      }
    : undefined;
  let result = await retrieveHybridPassages(
    { ...q.data, query: retrievalQuery, service_id: service },
    requestProvider,
    options,
  );
  let fallback = false;
  if (
    service &&
    !q.data.service_id &&
    !result.items.length &&
    !result.conflict_hold
  ) {
    result = await retrieveHybridPassages(
      { ...q.data, query: retrievalQuery, service_id: undefined },
      requestProvider,
      options,
    );
    fallback = true;
  }
  if (!q.data.service_id && route.decision === "ambiguous") {
    try {
      const check = await databaseQuery<{ hold: boolean }>(
        "SELECT app_public.routing_conflict_hold($1::uuid[],$2::text) hold",
        [route.candidates.map((c) => c.service_id), q.data.locale],
      );
      if (typeof check.rows[0]?.hold !== "boolean") throw Error();
      if (check.rows[0].hold)
        result = { ...result, conflict_hold: true, status: "conflict_hold" };
    } catch {
      throw new RetrievalUnavailableError();
    }
  }
  return {
    ...result,
    redacted: route.redacted || result.redacted,
    query: { original: q.data.query, normalized: result.query.normalized },
    routing: {
      ...route,
      routing_version: "p33-alias-v1",
      query_variants: [...new Set([route.normalized, retrievalQuery])],
      fallback,
      coverage:
        route.decision === "matched" && fallback
          ? "no_scoped_evidence"
          : "not_asserted",
    },
  };
}
