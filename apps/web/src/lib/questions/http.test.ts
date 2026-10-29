// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { createQuestionHandler } from "./http";
import { questionResponseSchema, questionSchema } from "./contracts";
const req = (body: unknown, headers = {}) =>
  new Request("http://localhost/api/v1/answers", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
describe("P35 question boundary", () => {
  it.each([
    "পাসপোর্ট কীভাবে করব",
    "How to renew a passport?",
    "Passport renew kivabe korbo?",
  ])("accepts %s without account or fabricated answer", async (question) => {
    const r = await createQuestionHandler({ development: true })(
      req({ question }),
    );
    expect(r.status).toBe(503);
    expect(r.headers.get("cache-control")).toBe("no-store");
    const b = questionResponseSchema.parse(await r.json());
    expect(b.blocks).toEqual([]);
    expect(b.request_id).toBe(r.headers.get("x-request-id"));
  });
  it.each([
    {},
    { question: "" },
    { question: 3 },
    { question: "a".repeat(2001) },
    { question: "ok", filters: {} },
    { question: "ok", answer_language: "xx" },
    { question: "ok", conversation_id: "bad" },
    { question: "a\u0000b" },
  ])("rejects invalid structures", async (input) => {
    expect(
      (await createQuestionHandler({ development: true })(req(input))).status,
    ).toBe(400);
  });
  it("preserves Unicode and joiners while trimming", () => {
    expect(
      questionSchema.parse({ question: "  বাংলা\u200d কথা  " }).question,
    ).toBe("বাংলা\u200d কথা");
  });
  it("rejects malformed JSON, oversized bodies and unsupported encodings", async () => {
    const h = createQuestionHandler({ development: true });
    expect(
      (
        await h(
          new Request("http://localhost/api/v1/answers", {
            method: "POST",
            body: "{",
            headers: { "content-type": "application/json" },
          }),
        )
      ).status,
    ).toBe(400);
    expect(
      (await h(req({ question: "ok" }, { "content-type": "text/plain" })))
        .status,
    ).toBe(415);
    expect(
      (await h(req({ question: "ok" }, { "content-encoding": "gzip" }))).status,
    ).toBe(415);
    expect((await h(req({ question: "a".repeat(50000) }))).status).toBe(413);
    expect(
      (await h(req({ question: "ok" }, { origin: "https://evil.example" })))
        .status,
    ).toBe(403);
  });
  it("bounds process admission despite spoofed headers and resets window", async () => {
    let t = 1;
    const h = createQuestionHandler({
      development: true,
      maxRequests: 1,
      windowMs: 10,
      now: () => t,
    });
    await h(req({ question: "ok" }));
    const r = await h(
      req({ question: "ok" }, { "x-forwarded-for": "different" }),
    );
    expect(r.status).toBe(429);
    expect(r.headers.get("retry-after")).toBeTruthy();
    t = 12;
    expect((await h(req({ question: "ok" }))).status).toBe(503);
  });
  it("fails production closed without reading a body", async () => {
    expect(
      (
        await createQuestionHandler({ development: false })(
          req({ question: "ok" }),
        )
      ).status,
    ).toBe(503);
  });
  it("minimizes identifiers and hides retrieval exception details without logs", async () => {
    const log = vi.spyOn(console, "log"),
      error = vi.spyOn(console, "error");
    const retrieve = vi
      .fn()
      .mockRejectedValue(new Error("SECRET_SQL_CREDENTIAL"));
    const r = await createQuestionHandler({ development: true, retrieve })(
      req({ question: "Passport 123456789012 info" }),
    );
    expect(retrieve.mock.calls[0][0].query).not.toContain("123456789012");
    expect(await r.text()).not.toContain("SECRET_SQL_CREDENTIAL");
    expect(log).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });
  it("deadlines cancel a stalled backend", async () => {
    const retrieve = vi.fn().mockImplementation(() => new Promise(() => {}));
    const r = await createQuestionHandler({
      development: true,
      retrieve,
      deadlineMs: 10,
    })(req({ question: "passport" }));
    expect(r.status).toBe(408);
    expect(retrieve.mock.calls[0][1].aborted).toBe(true);
  });
});
