import { createHash } from "node:crypto";
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { requireLocalDocker, root, runDocker } from "./database-local.mjs";
const [command, ...extra] = process.argv.slice(2);
try {
  if (extra.length || !["build", "test"].includes(command))
    throw new Error("Use parser:build or test:parser without extra flags.");
  requireLocalDocker();
  const directory = resolve(root, "workers/ingestion");
  const files = [
    "Dockerfile",
    "requirements-sandbox.txt",
    ...readdirSync(resolve(directory, "askbd_ingestion"))
      .filter((x) => x.endsWith(".py"))
      .sort()
      .map((x) => "askbd_ingestion/" + x),
  ];
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(file + "\0");
    hash.update(readFileSync(resolve(directory, file)));
  }
  const sourceHash = hash.digest("hex");
  const manifest = resolve(root, ".cache/parser-image.json");
  if (command === "build") {
    runDocker([
      "build",
      "--label",
      "askbd.owner=phase5-parser",
      "--label",
      `askbd.source=${sourceHash}`,
      "--tag",
      "askbd-parser-local:p5",
      directory,
    ]);
    const imageId = runDocker([
      "image",
      "inspect",
      "askbd-parser-local:p5",
      "--format",
      "{{.Id}} ",
    ]).trim();
    if (!/^sha256:[a-f0-9]{64}$/u.test(imageId))
      throw new Error("Unexpected parser image identity");
    mkdirSync(resolve(root, ".cache"), { recursive: true });
    writeFileSync(
      manifest,
      JSON.stringify({ image_id: imageId, source_hash: sourceHash }) + "\n",
    );
    console.log(
      `Built local parser ${imageId}; no container or live worker started.`,
    );
  } else {
    const { spawnSync } = await import("node:child_process");
    const result = spawnSync(
      process.execPath,
      ["scripts/python.mjs", "workers/ingestion/tests/parser_probe.py"],
      { cwd: root, stdio: "inherit", windowsHide: true },
    );
    process.exitCode = result.status ?? 1;
  }
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Parser verification failed",
  );
  process.exitCode = 1;
}
