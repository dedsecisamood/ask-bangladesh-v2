import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const input = readFileSync(resolve(root, ".cache/phase8/evaluation.json"));
const data = JSON.parse(input.toString("utf8"));
if (
  data.dataset_revision !== "p45-synthetic-v1" ||
  data.scope !== "synthetic-engineering-only-not-release-acceptance" ||
  data.human_review_status !== "pending" ||
  data.official_corpus_approval !== null ||
  !Array.isArray(data.cases) ||
  data.cases.length !== 61 ||
  Object.values(data.dimensions).some(
    (v) => v !== null && (v.passed !== v.total || v.total < 1),
  )
)
  throw Error("Incomplete synthetic evaluation; run test:phase8 first.");
const hash = createHash("sha256").update(input).digest("hex");
const directory = resolve(root, ".cache/phase8/review-export", hash);
mkdirSync(directory, { recursive: true });
const review = {
  artifact_sha256: hash,
  scope: "synthetic-engineering-only-not-release-acceptance",
  approved_corpus_manifest: null,
  reviewer_reference: null,
  review_date: null,
  independent: null,
  qualifications: null,
  review_status: "pending",
  cases: data.cases.map((c) => ({
    id: c.id,
    language_understanding: null,
    service_identification: null,
    retrieval_relevance: null,
    answer_language: null,
    clarity: null,
    factual_grounding: null,
    citation_correctness: null,
    safe_abstention: null,
    multiturn_consistency: null,
    privacy_security: null,
    observations: null,
    error_classification: null,
    decision: null,
  })),
};
for (const [name, body] of [
  ["evaluation.json", input],
  ["review.json", JSON.stringify(review, null, 2) + "\n"],
]) {
  const path = resolve(directory, name);
  // Keep annotations intact across repeat exports.
  if (!existsSync(path)) writeFileSync(path, body, { flag: "wx" });
}
console.log(
  `61 synthetic cases exported under .cache/phase8/review-export/${hash}. Human/corpus/live-provider acceptance pending.`,
);
