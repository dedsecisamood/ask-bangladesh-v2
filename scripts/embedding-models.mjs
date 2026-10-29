import { createHash } from "node:crypto";
import {
  readFileSync,
  mkdirSync,
  createWriteStream,
  renameSync,
  unlinkSync,
  existsSync,
} from "node:fs";
import { once } from "node:events";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const models = JSON.parse(
  readFileSync(resolve(root, "packages/embeddings/models.json"), "utf8"),
);
const mode = process.argv[2];
if (process.argv.length !== 3 || !["download", "verify"].includes(mode))
  throw Error(
    "Use embedding:download or embedding:verify; no remote models or custom URLs.",
  );
function valid(path, file) {
  if (!existsSync(path)) return false;
  const bytes = readFileSync(path);
  return (
    bytes.length === file.bytes &&
    (file.sha256
      ? createHash("sha256").update(bytes).digest("hex") === file.sha256
      : createHash("sha1")
          .update(`blob ${bytes.length}\0`)
          .update(bytes)
          .digest("hex") === file.gitBlob)
  );
}
for (const [key, model] of Object.entries(models)) {
  for (const file of model.files) {
    const path = resolve(root, ".cache/embedding-models", key, file.path);
    if (valid(path, file)) continue;
    if (mode === "verify")
      throw Error(
        `Missing or invalid pinned model artifact: ${key}/${file.path}`,
      );
    mkdirSync(resolve(path, ".."), { recursive: true });
    let url = new URL(
      `https://huggingface.co/${model.repo}/resolve/${model.revision}/${file.path}`,
    );
    let response;
    for (let hop = 0; hop < 6; hop++) {
      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        !(
          url.hostname === "huggingface.co" ||
          url.hostname.endsWith(".hf.co") ||
          url.hostname.endsWith(".huggingface.co")
        )
      )
        throw Error("Model artifact redirect refused.");
      response = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(120_000),
        headers: { "User-Agent": "AskBD-local-model-setup/1" },
      });
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      await response.body?.cancel();
      url = new URL(response.headers.get("location"), url);
    }
    if (!response?.ok || !response.body)
      throw Error("Pinned artifact download unavailable.");
    const temporary = path + ".tmp";
    let count = 0;
    const stream = createWriteStream(temporary, { flags: "w" });
    try {
      for await (const chunk of response.body) {
        count += chunk.length;
        if (count > file.bytes || count > 140_000_000)
          throw Error("Model artifact exceeds pinned size.");
        if (!stream.write(chunk)) await once(stream, "drain");
      }
      stream.end();
      await once(stream, "close");
      if (!valid(temporary, file)) throw Error("Model artifact hash mismatch.");
      renameSync(temporary, path);
      console.log(`Verified pinned ${key}/${file.path}: ${count} bytes`);
    } catch {
      stream.destroy();
      if (existsSync(temporary)) unlinkSync(temporary);
      throw Error("Pinned model download failed; no model was enabled.");
    }
  }
}
console.log(
  "Both local candidate artifact sets verified; no database profile activated.",
);
