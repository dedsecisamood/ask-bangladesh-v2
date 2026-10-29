import "server-only";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { z } from "zod";
import {
  createProvider,
  ProviderError,
  readProviderConfiguration,
  type ProviderTransport,
} from "./provider";

export const vertexConfigurationSchema = z
  .object({
    project: z.string().regex(/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/u),
    location: z.enum(["global", "us", "eu"]),
    // Explicit stable model IDs only; changing this list requires availability review.
    model: z.enum(["gemini-3.8-flash", "gemini-3.7-flash"]),
  })
  .strict();

const usageSchema = z.object({
  promptTokenCount: z.number().int().nonnegative(),
  candidatesTokenCount: z.number().int().nonnegative(),
  thoughtsTokenCount: z.number().int().nonnegative().optional(),
  totalTokenCount: z.number().int().nonnegative(),
});

/** No environment flag grants live approval. The public route never composes this.
 * Future trusted server composition must verify billing/project/privacy and obtain
 * explicit owner authorization before passing liveApproved. Tests mock the SDK.
 */
export function createVertexProvider(
  env: Readonly<Record<string, string | undefined>> = process.env,
  authorization: { liveApproved: boolean } = { liveApproved: false },
) {
  const policy = readProviderConfiguration(env);
  if (!authorization.liveApproved || policy.provider !== "vertex")
    return createProvider({ ...policy, provider: "disabled" });
  const parsed = vertexConfigurationSchema.safeParse({
    project: env.GOOGLE_CLOUD_PROJECT,
    location: env.GOOGLE_CLOUD_LOCATION,
    model: policy.model,
  });
  if (!parsed.success) throw new ProviderError("unavailable");
  // Forbid API-key/Express-mode fallback. ADC is the only authentication strategy.
  if (
    env.GOOGLE_API_KEY ||
    env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY
  )
    throw new ProviderError("unavailable");
  const config = Object.freeze(parsed.data);
  let client: GoogleGenAI | undefined;
  const transport: ProviderTransport = {
    async generate({ model, prompt, maxOutputTokens, signal }) {
      try {
        if (signal.aborted) throw new ProviderError("cancelled");
        if (model !== config.model) throw new ProviderError("unavailable");
        client ??= new GoogleGenAI({
          vertexai: true,
          project: config.project,
          location: config.location,
          apiVersion: "v1",
          // Explicit endpoint prevents SDK environment/global base-URL overrides.
          httpOptions: {
            baseUrl:
              config.location === "global"
                ? "https://aiplatform.googleapis.com"
                : `https://${config.location}-aiplatform.googleapis.com`,
            timeout: policy.timeoutMs,
            retryOptions: { attempts: 1 },
          },
          googleAuthOptions: {
            scopes: ["https://www.googleapis.com/auth/cloud-platform"],
          },
        });
        const response = await client.models.generateContent({
          model,
          contents: [{ role: "user", parts: [{ text: prompt.data }] }],
          config: {
            systemInstruction: prompt.system,
            responseMimeType: "application/json",
            maxOutputTokens,
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.LOW,
              includeThoughts: false,
            },
            automaticFunctionCalling: { disable: true },
            abortSignal: signal,
            httpOptions: {
              timeout: policy.timeoutMs,
              retryOptions: { attempts: 1 },
            },
          },
        });
        const candidate = response.candidates?.[0];
        const parts = candidate?.content?.parts;
        if (
          response.promptFeedback?.blockReason ||
          response.candidates?.length !== 1 ||
          candidate?.finishReason !== "STOP" ||
          candidate.content?.role !== "model" ||
          !parts?.length ||
          parts.some(
            (p) =>
              !p.text ||
              p.thought ||
              (p.thoughtSignature !== undefined &&
                typeof p.thoughtSignature !== "string") ||
              Object.keys(p).some(
                (k) => !["text", "thought", "thoughtSignature"].includes(k),
              ),
          )
        )
          throw new ProviderError("malformed");
        const text = parts.map((p) => p.text).join("");
        const usage = usageSchema.safeParse(response.usageMetadata);
        if (!usage.success || !text.trim() || text.length > 16000)
          throw new ProviderError("malformed");
        const inputTokens = usage.data.promptTokenCount;
        // Include reasoning and any other charged output in the existing cap/metrics.
        const outputTokens = usage.data.totalTokenCount - inputTokens;
        if (
          outputTokens <
            usage.data.candidatesTokenCount +
              (usage.data.thoughtsTokenCount ?? 0) ||
          outputTokens > maxOutputTokens
        )
          throw new ProviderError("malformed");
        return { text, inputTokens, outputTokens };
      } catch (error) {
        if (error instanceof ProviderError) throw error;
        if (signal.aborted) throw new ProviderError("cancelled");
        // Never copy SDK messages, response bodies, credentials or prompts.
        throw new ProviderError("unavailable");
      }
    },
  };
  return createProvider(policy, transport);
}
