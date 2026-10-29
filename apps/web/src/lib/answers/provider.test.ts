// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  createProvider,
  providerConfigSchema,
  deterministicMock,
  readProviderConfiguration,
} from "./provider";
const prompt = {
  system: "trusted grounding instructions",
  data: "synthetic input",
};
const signal = () => new AbortController().signal;
describe("P36 provider boundaries", () => {
  it("reads bounded server-only policy without activating a transport", () => {
    expect(readProviderConfiguration({}).provider).toBe("disabled");
    expect(
      readProviderConfiguration({
        AI_PROVIDER: "configured",
        AI_MODEL: "review-pending",
        AI_MAX_OUTPUT_TOKENS: "512",
      }).maxOutputTokens,
    ).toBe(512);
  });
  it("rejects unsafe environment values and environment-selected mocks", () => {
    expect(() =>
      readProviderConfiguration({ AI_PROVIDER: "mock", AI_MODEL: "test" }),
    ).toThrow();
    expect(() => readProviderConfiguration({ AI_TIMEOUT_MS: "NaN" })).toThrow();
  });
  it.each([
    { provider: "configured" },
    { provider: "mock", model: "bad model" },
    { provider: "mock", model: "ok", timeoutMs: 0 },
    { provider: "unknown" },
    { provider: "mock", model: "ok", apiKey: "private" },
  ])("rejects invalid config %#", (c) => {
    expect(providerConfigSchema.safeParse(c).success).toBe(false);
  });
  it("does not activate a missing provider/credential transport", async () => {
    await expect(
      createProvider({}).generate(prompt, signal()),
    ).rejects.toMatchObject({ category: "unavailable" });
    await expect(
      createProvider({
        provider: "configured",
        model: "review-needed",
      }).generate(prompt, signal()),
    ).rejects.toMatchObject({ category: "unavailable" });
  });
  it("reports bounded privacy-safe usage without prices or prompts", async () => {
    const p = createProvider(
      { provider: "mock", model: "synthetic" },
      deterministicMock("{}"),
    );
    await p.generate(prompt, signal());
    expect(p.usage()).toEqual([
      expect.objectContaining({
        model: "synthetic",
        inputTokens: 20,
        outputTokens: 20,
        outcome: "ok",
      }),
    ]);
    expect(JSON.stringify(p.usage())).not.toContain(prompt.data);
  });
  it.each(["failure", "malformed", "timeout"] as const)(
    "maps %s without leaking diagnostics",
    async (mode) => {
      const p = createProvider(
        { provider: "mock", model: "test", timeoutMs: 10 },
        deterministicMock("{}", mode),
      );
      await expect(p.generate(prompt, signal())).rejects.toThrow(
        "Generation unavailable.",
      );
      expect(p.usage()).toHaveLength(1);
    },
  );
  it("reserves budget, does not retry, and resets only by UTC day", async () => {
    let now = 1;
    const generate = vi.fn().mockRejectedValue(Error("private"));
    const p = createProvider(
      { provider: "configured", model: "test", dailyTokenBudget: 1200 },
      { generate },
      () => now,
    );
    await expect(p.generate(prompt, signal())).rejects.toThrow();
    await expect(p.generate(prompt, signal())).rejects.toMatchObject({
      category: "budget",
    });
    expect(generate).toHaveBeenCalledTimes(1);
    now = 86400001;
    await expect(p.generate(prompt, signal())).rejects.toThrow();
    expect(generate).toHaveBeenCalledTimes(2);
    expect(p.usageTotals().requests).toBe(3);
  });
  it("enforces context/output limits and forbids uncontrolled concurrency", async () => {
    const p = createProvider(
      { provider: "mock", model: "test", maxContextBytes: 256 },
      deterministicMock("{}"),
    );
    await expect(
      p.generate({ system: "x".repeat(257), data: "" }, signal()),
    ).rejects.toMatchObject({ category: "budget" });
    const huge = createProvider(
      { provider: "mock", model: "test", maxOutputTokens: 32 },
      {
        generate: async () => ({
          text: "{}",
          inputTokens: 1,
          outputTokens: 33,
        }),
      },
    );
    await expect(huge.generate(prompt, signal())).rejects.toMatchObject({
      category: "malformed",
    });
    const hung = createProvider(
      { provider: "mock", model: "test", timeoutMs: 10 },
      { generate: () => new Promise(() => {}) },
    );
    const first = hung.generate(prompt, signal());
    await expect(hung.generate(prompt, signal())).rejects.toMatchObject({
      category: "capacity",
    });
    await expect(first).rejects.toMatchObject({ category: "timeout" });
    await expect(hung.generate(prompt, signal())).rejects.toMatchObject({
      category: "capacity",
    });
  });
  it("honors pre-cancelled requests", async () => {
    const a = new AbortController();
    a.abort();
    await expect(
      createProvider(
        { provider: "mock", model: "test" },
        deterministicMock("{}"),
      ).generate(prompt, a.signal),
    ).rejects.toMatchObject({ category: "cancelled" });
  });
});
