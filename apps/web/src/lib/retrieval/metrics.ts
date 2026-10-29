export type RelevanceGrades = Readonly<Record<string, number>>;
export function retrievalMetrics(
  ids: readonly string[],
  grades: RelevanceGrades,
  k = 3,
) {
  if (
    !Number.isInteger(k) ||
    k < 1 ||
    k > 50 ||
    Object.values(grades).some((g) => !Number.isInteger(g) || g < 0 || g > 3)
  )
    throw new Error("Invalid relevance experiment.");
  const retrieved = [...new Set(ids)].slice(0, k),
    gold = Object.entries(grades).filter(([, g]) => g > 0);
  const hits = retrieved.filter((id) => (grades[id] ?? 0) > 0).length,
    first = retrieved.findIndex((id) => (grades[id] ?? 0) > 0);
  const dcg = (values: number[]) =>
    values.reduce((sum, g, n) => sum + (2 ** g - 1) / Math.log2(n + 2), 0);
  const ideal = dcg(
    gold
      .map(([, g]) => g)
      .sort((a, b) => b - a)
      .slice(0, k),
  );
  return {
    k,
    relevant: gold.length,
    retrieved: retrieved.length,
    hits,
    recall: gold.length ? hits / gold.length : null,
    precision: hits / k,
    mrr: gold.length ? (first >= 0 ? 1 / (first + 1) : 0) : null,
    ndcg: ideal ? dcg(retrieved.map((id) => grades[id] ?? 0)) / ideal : null,
    zero_result: retrieved.length === 0,
  };
}
