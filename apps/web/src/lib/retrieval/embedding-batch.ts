import "server-only";
import { z } from "zod";
import {
  EmbeddingUnavailableError,
  type EmbeddingProvider,
} from "./embeddings";

export interface EmbeddingStore {
  batch(profile: string, locale: "bn" | "en", limit: number): Promise<unknown>;
  commit(
    profile: string,
    revision: string,
    locale: "bn" | "en",
    entries: { passage_id: string; passage_hash: string; vector: number[] }[],
  ): Promise<number>;
}
const batchSchema = z
  .object({
    profile_id: z.uuid(),
    items: z
      .array(
        z
          .object({
            passage_id: z.uuid(),
            passage_hash: z.string().regex(/^[a-f0-9]{64}$/),
            text: z.string().min(1).max(16000),
          })
          .strict(),
      )
      .max(8),
  })
  .strict();
// Single explicit batch, no infinite polling, retry loop, background task or web API.
export async function embedEligibleBatch(
  provider: EmbeddingProvider,
  store: EmbeddingStore,
  locale: "bn" | "en" = "bn",
  limit = 2,
) {
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 8 ||
    !["bn", "en"].includes(locale)
  )
    throw new EmbeddingUnavailableError("input_limit");
  try {
    const batch = batchSchema.parse(
      await store.batch(provider.profile.profileId, locale, limit),
    );
    if (
      batch.profile_id !== provider.profile.profileId ||
      batch.items.length > limit ||
      new Set(batch.items.map((p) => p.passage_id)).size !== batch.items.length
    )
      throw Error();
    if (!batch.items.length) return { selected: 0, inserted: 0, skipped: 0 };
    const result = await provider.embed(
      batch.items.map((p) => p.text),
      "passage",
    );
    if (
      result.profile_id !== provider.profile.profileId ||
      result.model_revision !== provider.profile.revision ||
      result.vectors.length !== batch.items.length ||
      result.vectors.some(
        (v) =>
          v.length !== provider.profile.dimensions ||
          v.some((n) => !Number.isFinite(n)) ||
          Math.abs(Math.hypot(...v) - 1) > 0.001,
      )
    )
      throw Error();
    const inserted = await store.commit(
      provider.profile.profileId,
      provider.profile.revision,
      locale,
      batch.items.map((p, n) => ({
        passage_id: p.passage_id,
        passage_hash: p.passage_hash,
        vector: result.vectors[n],
      })),
    );
    if (
      !Number.isInteger(inserted) ||
      inserted < 0 ||
      inserted > batch.items.length
    )
      throw Error();
    return {
      selected: batch.items.length,
      inserted,
      skipped: batch.items.length - inserted,
    };
  } catch (error) {
    if (error instanceof EmbeddingUnavailableError) throw error;
    throw new EmbeddingUnavailableError();
  }
}
