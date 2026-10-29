// Bounded JSON-lines CPU worker. Artifact setup is separate; network is disabled.
import { createHash } from "node:crypto";
import { readFileSync, createReadStream } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { env, pipeline } from "@huggingface/transformers";
const root = fileURLToPath(new URL("../../", import.meta.url));
const models = JSON.parse(
  readFileSync(new URL("models.json", import.meta.url), "utf8"),
);
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.useFSCache = false;
env.localModelPath = resolve(root, ".cache/embedding-models") + "/";
globalThis.fetch = async () => {
  throw Error("NETWORK_DISABLED");
};
let extractor, loaded;
async function run(input) {
  try {
    const request = JSON.parse(input);
    if (
      !request ||
      Object.keys(request).sort().join() !== "kind,model,texts" ||
      typeof request.model !== "string" ||
      !Object.hasOwn(models, request.model) ||
      !["query", "passage"].includes(request.kind) ||
      !Array.isArray(request.texts) ||
      request.texts.length < 1 ||
      request.texts.length > 8 ||
      (request.kind === "query" && request.texts.length !== 1) ||
      request.texts.some(
        (t) =>
          typeof t !== "string" ||
          !t.trim() ||
          t.length > 16_000 ||
          !t.isWellFormed(),
      ) ||
      (loaded && loaded !== request.model)
    )
      throw Error("INVALID_INPUT");
    const model = models[request.model],
      started = performance.now();
    if (!extractor) {
      for (const file of model.files) {
        const hash = createHash(file.sha256 ? "sha256" : "sha1");
        if (!file.sha256) hash.update(`blob ${file.bytes}\0`);
        let size = 0;
        for await (const chunk of createReadStream(
          resolve(env.localModelPath, request.model, file.path),
        )) {
          hash.update(chunk);
          size += chunk.length;
        }
        if (
          size !== file.bytes ||
          hash.digest("hex") !== (file.sha256 ?? file.gitBlob)
        )
          throw Error("ARTIFACT_INVALID");
      }
      extractor = await pipeline("feature-extraction", request.model, {
        local_files_only: true,
        device: "cpu",
        dtype: "q8",
        session_options: {
          intraOpNumThreads: 2,
          interOpNumThreads: 1,
          logSeverityLevel: 3,
        },
      });
      loaded = request.model;
    }
    const texts = request.texts.map(
      (t) =>
        (request.kind === "query" ? model.queryPrefix : model.passagePrefix) +
        t.normalize("NFC"),
    );
    const counts = texts.map(
      (t) => extractor.tokenizer.encode(t, { add_special_tokens: true }).length,
    );
    if (
      counts.some((n) => n > model.maxTokens) ||
      counts.reduce((a, b) => a + b, 0) > 2048
    )
      throw Error("TOKEN_LIMIT");
    const vectors = (
      await extractor(texts, { pooling: "mean", normalize: true })
    ).tolist();
    if (
      vectors.length !== texts.length ||
      vectors.some(
        (v) =>
          v.length !== model.dimensions ||
          v.some((n) => !Number.isFinite(n)) ||
          Math.abs(Math.hypot(...v) - 1) > 0.001,
      )
    )
      throw Error("OUTPUT_INVALID");
    return {
      profile_id: model.profileId,
      model_revision: model.revision,
      vectors,
      token_counts: counts,
      elapsed_ms: performance.now() - started,
      rss_bytes: process.memoryUsage().rss,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error &&
        [
          "INVALID_INPUT",
          "ARTIFACT_INVALID",
          "TOKEN_LIMIT",
          "OUTPUT_INVALID",
        ].includes(error.message)
          ? error.message
          : "MODEL_UNAVAILABLE",
    };
  }
}
try {
  process.stdin.setEncoding("utf8");
  let pending = "";
  for await (const chunk of process.stdin) {
    pending += chunk;
    if (Buffer.byteLength(pending) > 65_536) {
      process.stdout.write('{"error":"INPUT_LIMIT"}\n');
      process.exitCode = 1;
      break;
    }
    const end = pending.indexOf("\n");
    if (end < 0) continue;
    const input = pending.slice(0, end);
    pending = pending.slice(end + 1);
    if (pending) {
      process.stdout.write('{"error":"INPUT_LIMIT"}\n');
      process.exitCode = 1;
      break;
    }
    process.stdout.write(JSON.stringify(await run(input)) + "\n");
  }
  if (pending.trim()) {
    process.stdout.write('{"error":"INVALID_INPUT"}\n');
    process.exitCode = 1;
  }
} finally {
  await extractor?.dispose();
}
