import "server-only";
import { z } from "zod";
import { databaseQuery } from "../database/connection";
import {
  keywordInputSchema,
  keywordPassageSchema,
  type KeywordSearchInput,
} from "./contracts";
import {
  InvalidRetrievalInputError,
  RetrievalUnavailableError,
} from "./keyword";
import {
  EmbeddingUnavailableError,
  type EmbeddingProvider,
} from "./embeddings";
import { prepareRetrievalQuery } from "./query";

export const semanticResultSchema = z
  .object({
    coverage: z
      .object({
        eligible: z.number().int().nonnegative(),
        embedded: z.number().int().nonnegative(),
        complete: z.boolean(),
      })
      .strict()
      .refine(
        (c) =>
          c.embedded <= c.eligible &&
          c.complete === (c.eligible === c.embedded),
      ),
    items: z
      .array(
        z
          .object({
            evidence: keywordPassageSchema,
            similarity: z.number().finite().min(-1).max(1),
          })
          .strict(),
      )
      .max(50),
    profile_id: z.uuid(),
    model_revision: z.string().regex(/^[a-f0-9]{40}$/),
    generation: z.string().regex(/^\d+$/),
    evaluated_at: z.iso.datetime({ offset: true }),
  })
  .strict();
export type SemanticResult = z.infer<typeof semanticResultSchema>;
export async function retrieveSemanticPassages(
  input: KeywordSearchInput,
  provider: EmbeddingProvider,
): Promise<SemanticResult> {
  const parsed = keywordInputSchema.safeParse(input);
  if (!parsed.success || parsed.data.offset !== 0)
    throw new InvalidRetrievalInputError();
  const q = parsed.data,
    profile = provider.profile;
  const query = prepareRetrievalQuery(q.query).normalized;
  if (!query) throw new InvalidRetrievalInputError();
  try {
    const allowed = await databaseQuery<{ allowed: boolean }>(
      "SELECT app_public.embedding_profile_authorized($1::uuid,$2::text) allowed",
      [profile.profileId, profile.revision],
    );
    if (allowed.rows[0]?.allowed !== true)
      throw new EmbeddingUnavailableError();
    const embedding = await provider.embed([query], "query");
    const vector = embedding.vectors[0];
    if (
      embedding.profile_id !== profile.profileId ||
      embedding.model_revision !== profile.revision ||
      embedding.vectors.length !== 1 ||
      vector.length !== profile.dimensions ||
      vector.some((v) => !Number.isFinite(v)) ||
      Math.abs(Math.hypot(...vector) - 1) > 0.001
    )
      throw new EmbeddingUnavailableError();
    const response = await databaseQuery<{ result: unknown }>(
      "SELECT app_public.semantic_search($1::uuid,$2::text,$3::text,$4::text,$5::integer,$6::uuid,$7::uuid,$8::uuid,$9::text) result",
      [
        profile.profileId,
        profile.revision,
        JSON.stringify(vector),
        q.locale,
        q.limit,
        q.service_id ?? null,
        q.agency_id ?? null,
        q.source_id ?? null,
        q.language ?? null,
      ],
    );
    const result = semanticResultSchema.parse(response.rows[0]?.result);
    if (
      result.profile_id !== profile.profileId ||
      result.model_revision !== profile.revision ||
      result.items.length > q.limit
    )
      throw new Error();
    return result;
  } catch (error) {
    if (error instanceof EmbeddingUnavailableError) throw error;
    throw new RetrievalUnavailableError();
  }
}
