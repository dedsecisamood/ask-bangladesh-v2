import { describe, it, expect } from "vitest";
import { retrievalMetrics } from "./metrics";
describe("P34 reproducible retrieval metrics", () => {
  it("uses all gold passages in recall, fixed k precision and first relevant reciprocal rank", () => {
    const m = retrievalMetrics(
      ["wrong", "a", "a", "b"],
      { a: 3, b: 1, c: 2 },
      3,
    );
    expect(m.recall).toBe(2 / 3);
    expect(m.precision).toBe(2 / 3);
    expect(m.mrr).toBe(0.5);
    expect(m.ndcg).toBeGreaterThan(0);
    expect(m.ndcg).toBeLessThan(1);
  });
  it("scores perfect graded ordering at one", () =>
    expect(retrievalMetrics(["a", "b"], { a: 3, b: 1 }, 2).ndcg).toBe(1));
  it("counts a retrieval failure as zero on an answerable case", () => {
    const m = retrievalMetrics([], { a: 3 });
    expect(m.recall).toBe(0);
    expect(m.mrr).toBe(0);
    expect(m.zero_result).toBe(true);
  });
  it("never turns a zero-denominator case into perfect recall", () => {
    const m = retrievalMetrics([], {});
    expect(m.recall).toBeNull();
    expect(m.mrr).toBeNull();
    expect(m.ndcg).toBeNull();
  });
  it.each([0, 51, -1, 1.5])("rejects invalid k=%s", (k) =>
    expect(() => retrievalMetrics([], {}, k)).toThrow(),
  );
  it("rejects invalid human-label grades", () =>
    expect(() => retrievalMetrics([], { a: NaN })).toThrow());
});
