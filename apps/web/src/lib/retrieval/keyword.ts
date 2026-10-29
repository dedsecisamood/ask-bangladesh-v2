import "server-only";
import { databaseQuery } from "../database/connection";
import {
  keywordInputSchema,
  keywordResultSchema,
  type KeywordSearchInput,
} from "./contracts";

export class InvalidRetrievalInputError extends Error {
  constructor() {
    super("Invalid keyword retrieval request.");
    this.name = "InvalidRetrievalInputError";
  }
}
export class RetrievalUnavailableError extends Error {
  constructor() {
    super("Keyword retrieval is unavailable. No evidence result was returned.");
    this.name = "RetrievalUnavailableError";
  }
}

// Internal only: no raw query logging, persistent trace, HTTP route or cross-request cache.
// Future P31 may fuse these stable passage IDs/scores; scores never prove a claim.
export async function retrieveKeywordPassages(input: KeywordSearchInput) {
  const parsed = keywordInputSchema.safeParse(input);
  if (!parsed.success) throw new InvalidRetrievalInputError();
  const q = parsed.data;
  try {
    const response = await databaseQuery<{ result: unknown }>(
      "SELECT app_public.keyword_search($1::text,$2::text,$3::integer,$4::integer,$5::uuid,$6::uuid,$7::uuid,$8::text) result",
      [
        q.query,
        q.locale,
        q.limit,
        q.offset,
        q.service_id ?? null,
        q.agency_id ?? null,
        q.source_id ?? null,
        q.language ?? null,
      ],
    );
    const result = keywordResultSchema.parse(response.rows[0]?.result);
    if (
      result.limit !== q.limit ||
      result.offset !== q.offset ||
      result.items.length > q.limit ||
      result.has_more !== (result.next_offset !== null) ||
      (result.next_offset !== null && result.next_offset !== q.offset + q.limit)
    )
      throw new Error("Invalid projection");
    // Original query is ephemeral request context, not part of reusable evidence.
    return {
      ...result,
      query: { original: q.query, normalized: result.normalized_query },
    };
  } catch {
    // Never disguise outages, permission failures or malformed evidence as no matches.
    throw new RetrievalUnavailableError();
  }
}
