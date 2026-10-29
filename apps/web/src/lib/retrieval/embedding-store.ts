import "server-only";
import { Pool } from "pg";
import { databasePoolConfig } from "../database/config";
import { EmbeddingUnavailableError } from "./embeddings";
import type { EmbeddingStore } from "./embedding-batch";

// Dedicated internal role, never DATABASE_URL or an elevated/service-role key.
export function createEmbeddingStore(
  url: string | undefined,
): EmbeddingStore & { close(): Promise<void> } {
  const config = databasePoolConfig(url, "askbd_embedder");
  if (!config) throw new EmbeddingUnavailableError();
  const pool = new Pool({
    ...config,
    max: 1,
    application_name: "askbd-local-embedder",
  });
  pool.on("error", () => {
    /* Fixed failures are returned by batch operations; no logs. */
  });
  return {
    async batch(profile, locale, limit) {
      try {
        return (
          await pool.query(
            "SELECT app_public.embedding_batch($1::uuid,$2::text,$3::integer) result",
            [profile, locale, limit],
          )
        ).rows[0]?.result;
      } catch {
        throw new EmbeddingUnavailableError();
      }
    },
    async commit(profile, revision, locale, entries) {
      try {
        return (
          await pool.query(
            "SELECT app_public.store_embeddings($1::uuid,$2::text,$3::text,$4::jsonb) inserted",
            [profile, revision, locale, JSON.stringify(entries)],
          )
        ).rows[0]?.inserted;
      } catch {
        throw new EmbeddingUnavailableError();
      }
    },
    async close() {
      await pool.end();
    },
  };
}
