import "server-only";
import { z } from "zod";

export const providerConfigSchema = z
  .object({
    provider: z
      .enum(["disabled", "configured", "vertex", "mock"])
      .default("disabled"),
    model: z
      .string()
      .regex(/^[A-Za-z0-9._/-]{1,100}$/u)
      .optional(),
    timeoutMs: z.number().int().min(10).max(15000).default(5000),
    maxContextBytes: z.number().int().min(256).max(32000).default(16000),
    maxOutputTokens: z.number().int().min(32).max(2048).default(1024),
    dailyTokenBudget: z.number().int().min(64).max(1000000).default(100000),
  })
  .strict()
  .refine((c) => c.provider === "disabled" || Boolean(c.model));
export class ProviderError extends Error {
  constructor(
    readonly category:
      | "unavailable"
      | "timeout"
      | "cancelled"
      | "malformed"
      | "budget"
      | "capacity",
  ) {
    super("Generation unavailable.");
  }
}
export interface Prompt {
  system: string;
  data: string;
}
export interface ProviderTransport {
  // Trusted server injection only. Provider approval, credential loading, endpoint
  // allowlisting and a real protocol adapter are required before live activation.
  generate(request: {
    model: string;
    prompt: Prompt;
    maxOutputTokens: number;
    signal: AbortSignal;
  }): Promise<unknown>;
}
export interface UsageEvent {
  model: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  outcome: "ok" | ProviderError["category"];
}
const responseSchema = z
  .object({
    text: z.string().min(1).max(16000),
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
  })
  .strict();
export function createProvider(
  input: unknown,
  transport?: ProviderTransport,
  clock = Date.now,
) {
  const config = Object.freeze(providerConfigSchema.parse(input));
  let day = -1,
    spent = 0,
    busy = false;
  const events: UsageEvent[] = [];
  let requests = 0;
  return {
    config,
    // A bounded local diagnostic snapshot contains no prompts, questions or keys.
    usage: () => events.map((e) => ({ ...e })),
    usageTotals: () => ({ requests, reservedUnits: spent }),
    async generate(prompt: Prompt, signal: AbortSignal): Promise<string> {
      requests++;
      if (config.provider === "disabled" || !transport || !config.model)
        throw new ProviderError("unavailable");
      if (signal.aborted) throw new ProviderError("cancelled");
      if (busy) throw new ProviderError("capacity");
      const bytes = Buffer.byteLength(prompt.system + prompt.data, "utf8");
      if (bytes > config.maxContextBytes) throw new ProviderError("budget");
      // Conservative byte-based reservation, not a provider token measurement.
      // Unknown/failed usage retains its entire reservation; no paid retry loop.
      const reserve = bytes + config.maxOutputTokens;
      const today = Math.floor(clock() / 86400000);
      if (today !== day) {
        day = today;
        spent = 0;
      }
      if (spent + reserve > config.dailyTokenBudget)
        throw new ProviderError("budget");
      spent += reserve;
      busy = true;
      const started = clock(),
        abort = new AbortController();
      const stop = () => abort.abort();
      signal.addEventListener("abort", stop, { once: true });
      let timer: ReturnType<typeof setTimeout> | undefined;
      let outcome: UsageEvent["outcome"] = "unavailable",
        inputTokens = 0,
        outputTokens = 0;
      const operation = Promise.resolve().then(() =>
        transport.generate({
          model: config.model!,
          prompt,
          maxOutputTokens: config.maxOutputTokens,
          signal: abort.signal,
        }),
      );
      try {
        const interrupted = new Promise<never>((_, reject) => {
          abort.signal.addEventListener(
            "abort",
            () =>
              reject(
                new ProviderError(signal.aborted ? "cancelled" : "timeout"),
              ),
            { once: true },
          );
          timer = setTimeout(() => abort.abort(), config.timeoutMs);
        });
        const parsed = responseSchema.safeParse(
          await Promise.race([operation, interrupted]),
        );
        if (
          !parsed.success ||
          parsed.data.outputTokens > config.maxOutputTokens ||
          parsed.data.inputTokens + parsed.data.outputTokens > reserve
        )
          throw new ProviderError("malformed");
        ({ inputTokens, outputTokens } = parsed.data);
        outcome = "ok";
        // Keep reservations rather than refunding untrusted provider accounting.
        return parsed.data.text;
      } catch (error) {
        const safe =
          error instanceof ProviderError
            ? error
            : new ProviderError("unavailable");
        outcome = safe.category;
        throw safe;
      } finally {
        if (timer) clearTimeout(timer);
        signal.removeEventListener("abort", stop);
        events.push({
          model: config.model,
          inputTokens,
          outputTokens,
          durationMs: Math.max(0, clock() - started),
          outcome,
        });
        if (events.length > 100) events.shift();
        // Do not reopen concurrency after a noncooperative transport times out.
        // Its slot is released only when the underlying operation actually settles.
        void operation.then(
          () => {
            busy = false;
          },
          () => {
            busy = false;
          },
        );
        abort.abort();
      }
    },
  };
}
export type GenerationProvider = ReturnType<typeof createProvider>;
export function readProviderConfiguration(
  env: Readonly<Record<string, string | undefined>> = process.env,
) {
  if (env.AI_PROVIDER === "mock")
    throw new Error("Mock providers are test-injected only.");
  return providerConfigSchema.parse({
    provider: env.AI_PROVIDER ?? "disabled",
    model: env.AI_MODEL,
    ...(env.AI_TIMEOUT_MS ? { timeoutMs: Number(env.AI_TIMEOUT_MS) } : {}),
    ...(env.AI_MAX_CONTEXT_BYTES
      ? { maxContextBytes: Number(env.AI_MAX_CONTEXT_BYTES) }
      : {}),
    ...(env.AI_MAX_OUTPUT_TOKENS
      ? { maxOutputTokens: Number(env.AI_MAX_OUTPUT_TOKENS) }
      : {}),
    ...(env.AI_DAILY_TOKEN_BUDGET
      ? { dailyTokenBudget: Number(env.AI_DAILY_TOKEN_BUDGET) }
      : {}),
  });
}
export function deterministicMock(
  text: string,
  mode: "ok" | "failure" | "malformed" | "timeout" = "ok",
): ProviderTransport {
  return {
    generate: async ({ signal }) => {
      if (mode === "failure") throw Error("Synthetic private provider detail");
      if (mode === "malformed") return { text };
      if (mode === "timeout")
        return new Promise((_, reject) => {
          const stop = () => reject(new ProviderError("cancelled"));
          if (signal.aborted) stop();
          else signal.addEventListener("abort", stop, { once: true });
        });
      return { text, inputTokens: 20, outputTokens: 20 };
    },
  };
}
