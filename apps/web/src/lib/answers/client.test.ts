// @vitest-environment node
import { it, expect, vi } from "vitest";
import { createApiAdapter } from "./client";
import {
  questionResponseSchema,
  resolveAnswerLanguage,
} from "../questions/contracts";
import { parseServerEnvironment } from "../env/schema";
it("basic Banglish detection and explicit language preferences are preserved", () => {
  expect(resolveAnswerLanguage("Passport renew kivabe korbo?", "auto")).toBe(
    "banglish",
  );
  expect(resolveAnswerLanguage("English question", "bn")).toBe("bn");
  expect(resolveAnswerLanguage("বাংলা প্রশ্ন", "en")).toBe("en");
});
const response = () =>
  Response.json(
    questionResponseSchema.parse({
      request_id: "35000000-0000-4000-8000-000000000001",
      status: "unavailable",
      language: "en",
      blocks: [],
      citations: [],
      reason_codes: ["policy_unavailable"],
      warnings: [],
      error: { code: "POLICY_UNAVAILABLE", message: "Unavailable." },
    }),
    { status: 503 },
  );
const args = () => ({
  question: "passport 123456789012",
  history: [{ role: "user" as const, content: "renew passport 987654321012" }],
  answerLanguage: "en" as const,
  locale: "en" as const,
  signal: new AbortController().signal,
});
it("client sends minimized bounded context only to the same-origin API", async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response());
  const answer = await createApiAdapter(fetcher)(args());
  expect(answer.kind).toBe("service");
  expect(answer.result?.status).toBe("unavailable");
  const [url, request] = fetcher.mock.calls[0];
  expect(url).toBe("/api/v1/answers");
  expect(request?.credentials).toBe("omit");
  expect(request?.cache).toBe("no-store");
  expect(request?.body).not.toContain("123456789012");
  expect(request?.body).not.toContain("987654321012");
});
it("P44 keeps original minimized wording for generation, separate from search spellings", async () => {
  const f = vi.fn<typeof fetch>().mockResolvedValue(response());
  await createApiAdapter(f)({
    ...args(),
    question: "NID e naam bhul; korbo na! 123456789012",
  });
  expect(JSON.parse(f.mock.calls[0][1]?.body as string).question).toBe(
    "NID e naam bhul; korbo na!",
  );
});
it("client does not retry network failures or invalid response contracts", async () => {
  const f = vi.fn<typeof fetch>().mockRejectedValue(Error("Network down"));
  await expect(createApiAdapter(f)(args())).rejects.toThrow();
  expect(f).toHaveBeenCalledOnce();
  await expect(
    createApiAdapter(
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          Response.json({ status: "answered", url: "https://evil.example" }),
        ),
    )(args()),
  ).rejects.toThrow();
});
it("client limits history to six bounded minimized user turns", async () => {
  const f = vi.fn<typeof fetch>().mockResolvedValue(response());
  await createApiAdapter(f)({
    ...args(),
    history: Array.from({ length: 20 }, () => ({
      role: "user",
      content: "a".repeat(1500),
    })),
  });
  const body = JSON.parse(f.mock.calls[0][1]?.body as string);
  expect(body.history.length).toBeLessThanOrEqual(6);
  expect(
    body.history.reduce(
      (n: number, h: { content: string }) => n + h.content.length,
      body.question.length,
    ),
  ).toBeLessThanOrEqual(8000);
});
it("unknown chat mode fails configuration and no public credential option exists", () => {
  expect(() => parseServerEnvironment({ CHAT_MODE: "unsafe" })).toThrow();
  expect(parseServerEnvironment({ CHAT_MODE: "api" }).CHAT_MODE).toBe("api");
});
