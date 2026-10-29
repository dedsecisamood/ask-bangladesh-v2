import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const input = readFileSync(resolve(root, ".cache/phase7/evaluation.json"));
const data = JSON.parse(input.toString("utf8"));
if (
  data.dataset_revision !== "p41-synthetic-v1" ||
  data.label_status !== "engineering-only-not-independent-human-review" ||
  data.model !== "deterministic-mock" ||
  !Array.isArray(data.cases) ||
  data.cases.length !== 18
)
  throw new Error("Unexpected evaluation artifact; run test:phase7 first.");
const hash = createHash("sha256").update(input).digest("hex");
const directory = resolve(root, ".cache/phase7/review-export", hash);
mkdirSync(directory, { recursive: true });
for (const [name, body] of [
  ["evaluation.json", input],
  [
    "review.json",
    JSON.stringify(
      {
        artifact_sha256: hash,
        dataset_revision: data.dataset_revision,
        scope: "synthetic-engineering-regression-only",
        release_quality_evaluated: false,
        human_review_status: "pending",
        reviewer: null,
        observations: null,
        required_real_corpus:
          "Approved official evidence and independent bilingual labels remain unavailable.",
      },
      null,
      2,
    ) + "\n",
  ],
]) {
  const path = resolve(directory, name);
  // Rerunning never overwrites annotations or an already exported artifact.
  if (!existsSync(path)) writeFileSync(path, body, { flag: "wx" });
}
console.log(
  `Synthetic review snapshot preserved: .cache/phase7/review-export/${hash}`,
);
console.log(
  "18 synthetic cases; independent official-corpus review remains pending.",
);
