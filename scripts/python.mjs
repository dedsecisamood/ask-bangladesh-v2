import { existsSync, mkdirSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const candidates = [
  ".venv/Scripts/python.exe",
  ".venv/bin/python.exe",
  ".venv/bin/python",
];
const python = candidates
  .map((path) => fileURLToPath(new URL(`../${path}`, import.meta.url)))
  .find(existsSync);

if (!python) {
  console.error(
    "Missing isolated Python environment. Follow workers/ingestion/README.md.",
  );
  process.exitCode = 1;
} else {
  const args = process.argv.slice(2);
  let testArguments = args;
  if (!args.length) {
    const cache = join(root, ".cache");
    mkdirSync(cache, { recursive: true });
    // Separate runs also avoid permission collisions across local execution users.
    const runDirectory = mkdtempSync(join(cache, "pytest-run-"));
    testArguments = [
      "-m",
      "pytest",
      "-c",
      "workers/ingestion/pyproject.toml",
      `--basetemp=${join(runDirectory, "tmp")}`,
      "-o",
      `cache_dir=${join(runDirectory, "cache")}`,
    ];
  }
  const result = spawnSync(python, testArguments, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  });
  if (result.error)
    console.error(`Python failed to start: ${result.error.code}`);
  process.exitCode = result.status ?? 1;
}
