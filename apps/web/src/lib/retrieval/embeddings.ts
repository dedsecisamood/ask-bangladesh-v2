import "server-only";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import models from "../../../../../packages/embeddings/models.json";
export type LocalModel = keyof typeof models;
export const embeddingProfiles = models;
export type EmbeddingBatch = {
  profile_id: string;
  model_revision: string;
  vectors: number[][];
  token_counts: number[];
  elapsed_ms: number;
  rss_bytes: number;
};
export interface EmbeddingProvider {
  readonly profile: (typeof models)[LocalModel];
  embed(
    texts: readonly string[],
    kind: "query" | "passage",
    signal?: AbortSignal,
  ): Promise<EmbeddingBatch>;
}
export class EmbeddingUnavailableError extends Error {
  constructor(
    readonly reason:
      "unavailable" | "capacity" | "timeout" | "input_limit" = "unavailable",
  ) {
    super("Local embeddings are unavailable.");
    this.name = "EmbeddingUnavailableError";
  }
}
const responseSchema = z
  .object({
    profile_id: z.uuid(),
    model_revision: z.string().regex(/^[a-f0-9]{40}$/),
    vectors: z.array(z.array(z.number().finite()).length(384)).min(1).max(8),
    token_counts: z.array(z.number().int().positive().max(512)).min(1).max(8),
    elapsed_ms: z.number().finite().nonnegative(),
    rss_bytes: z.number().int().positive(),
  })
  .strict();
type Session = {
  model: LocalModel;
  child: ChildProcessWithoutNullStreams;
  buffer: string;
  pending: {
    accept: (value: unknown) => void;
    reject: (error: EmbeddingUnavailableError) => void;
  } | null;
  idle: ReturnType<typeof setTimeout> | null;
};
let session: Session | undefined,
  active = false;
export function closeLocalEmbeddingWorker() {
  const current = session;
  session = undefined;
  if (!current) return;
  if (current.idle) clearTimeout(current.idle);
  current.pending?.reject(new EmbeddingUnavailableError());
  current.pending = null;
  current.child.kill();
}
function start(model: LocalModel): Session {
  const roots = [process.cwd(), resolve(process.cwd(), "../..")];
  const root = roots.find((p) =>
    existsSync(resolve(p, "packages/embeddings/worker.mjs")),
  );
  if (!root) throw new EmbeddingUnavailableError();
  closeLocalEmbeddingWorker();
  const child = spawn(
    process.execPath,
    [
      "--max-old-space-size=384",
      resolve(root, "packages/embeddings/worker.mjs"),
    ],
    {
      cwd: root,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        NODE_ENV: "production",
        SystemRoot: process.env.SystemRoot,
        TEMP: process.env.TEMP,
        PATH: process.env.PATH,
        HF_HUB_OFFLINE: "1",
        TRANSFORMERS_OFFLINE: "1",
        OMP_NUM_THREADS: "2",
      },
    },
  );
  const current: Session = {
    model,
    child,
    buffer: "",
    pending: null,
    idle: null,
  };
  function fail() {
    if (session === current) session = undefined;
    if (current.idle) clearTimeout(current.idle);
    current.pending?.reject(new EmbeddingUnavailableError());
    current.pending = null;
    child.kill();
  }
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk: string) => {
    current.buffer += chunk;
    if (Buffer.byteLength(current.buffer) > 1_000_000) {
      fail();
      return;
    }
    const end = current.buffer.indexOf("\n");
    if (end < 0) return;
    const line = current.buffer.slice(0, end);
    current.buffer = current.buffer.slice(end + 1);
    const pending = current.pending;
    current.pending = null;
    if (!pending || current.buffer) {
      pending?.reject(new EmbeddingUnavailableError());
      fail();
      return;
    }
    try {
      pending.accept(JSON.parse(line));
    } catch {
      pending.reject(new EmbeddingUnavailableError());
      fail();
    }
  });
  child.stderr.on("data", () => {
    /* Discard native diagnostics; no query or model-body logs. */
  });
  child.stdin.on("error", fail);
  child.on("error", fail);
  child.once("close", fail);
  session = current;
  return current;
}
// One offline process and one active request; no queue, private query cache or retry.
export function localEmbeddingProvider(
  model: LocalModel = "e5",
): EmbeddingProvider {
  if (!Object.hasOwn(models, model)) throw new EmbeddingUnavailableError();
  const profile = models[model];
  return {
    profile,
    async embed(texts, kind, signal) {
      if (
        texts.length < 1 ||
        texts.length > 8 ||
        (kind === "query" && texts.length !== 1) ||
        texts.some((t) => !t.trim() || !t.isWellFormed() || t.length > 16_000)
      )
        throw new EmbeddingUnavailableError("input_limit");
      const input = JSON.stringify({ model, kind, texts });
      if (Buffer.byteLength(input) > 65_536)
        throw new EmbeddingUnavailableError("input_limit");
      if (active) throw new EmbeddingUnavailableError("capacity");
      if (signal?.aborted) throw new EmbeddingUnavailableError("timeout");
      active = true;
      let current: Session | undefined;
      try {
        current = session?.model === model ? session : start(model);
        if (current.idle) clearTimeout(current.idle);
        const raw = await new Promise<unknown>((accept, reject) => {
          const abort = () => {
            reject(new EmbeddingUnavailableError("timeout"));
            closeLocalEmbeddingWorker();
          };
          const timer = setTimeout(abort, 45_000);
          const settle = () => {
            clearTimeout(timer);
            signal?.removeEventListener("abort", abort);
          };
          signal?.addEventListener("abort", abort, { once: true });
          current!.pending = {
            accept: (value) => {
              settle();
              accept(value);
            },
            reject: (error) => {
              settle();
              reject(error);
            },
          };
          current!.child.stdin.write(input + "\n", "utf8");
        });
        if (raw && typeof raw === "object" && "error" in raw)
          throw new EmbeddingUnavailableError(
            ["TOKEN_LIMIT", "INPUT_LIMIT", "INVALID_INPUT"].includes(
              String(raw.error),
            )
              ? "input_limit"
              : "unavailable",
          );
        const result = responseSchema.parse(raw);
        if (
          result.profile_id !== profile.profileId ||
          result.model_revision !== profile.revision ||
          result.vectors.length !== texts.length ||
          result.token_counts.length !== texts.length ||
          result.vectors.some((v) => Math.abs(Math.hypot(...v) - 1) > 0.001) ||
          result.token_counts.some((n) => n > profile.maxTokens)
        )
          throw new EmbeddingUnavailableError();
        return result;
      } catch (error) {
        closeLocalEmbeddingWorker();
        if (error instanceof EmbeddingUnavailableError) throw error;
        throw new EmbeddingUnavailableError();
      } finally {
        active = false;
        if (current && session === current) {
          current.idle = setTimeout(closeLocalEmbeddingWorker, 30_000);
          current.idle.unref();
        }
      }
    },
  };
}
