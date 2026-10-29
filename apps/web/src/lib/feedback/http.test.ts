// @vitest-environment node
import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { createFeedbackHandler } from "./http";
import { feedbackReceiptSchema } from "./contracts";
const id = "49000000-0000-4000-8000-000000000001";
const input = {
  category: "incorrect",
  locale: "bn",
  page: "ask",
  consent: true,
};
const req = (value: unknown = input, headers = {}) =>
  new Request("http://localhost/api/v1/feedback", {
    method: "POST",
    headers: {
      origin: "http://localhost",
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(value),
  });
it("audit feedback accepts a minimal anonymous report and returns only an opaque receipt", async () => {
  const submit = vi.fn().mockResolvedValue(id);
  const r = await createFeedbackHandler({ development: true, submit })(req());
  expect(r.status).toBe(202);
  expect(feedbackReceiptSchema.parse(await r.json()).data.feedback_id).toBe(id);
  expect(r.headers.get("cache-control")).toBe("no-store");
  expect(r.headers.has("set-cookie")).toBe(false);
  expect(submit).toHaveBeenCalledWith(input);
});
it.each([
  { ...input, text: "123456789012 private citizen question" },
  { ...input, consent: false },
  { ...input, category: "approved" },
  { ...input, service_id: "invalid" },
  { ...input, contact: "private@example.invalid" },
])("audit feedback rejects unapproved fields/structures %#", async (value) => {
  const submit = vi.fn();
  expect(
    (await createFeedbackHandler({ development: true, submit })(req(value)))
      .status,
  ).toBe(400);
  expect(submit).not.toHaveBeenCalled();
});
it("audit feedback production gate never reads a body or calls storage", async () => {
  const submit = vi.fn();
  expect(
    (await createFeedbackHandler({ development: false, submit })(req())).status,
  ).toBe(503);
  expect(submit).not.toHaveBeenCalled();
});
it("audit feedback rejects cross-origin, unsupported types and oversize chunked bodies", async () => {
  const h = createFeedbackHandler({ development: true, submit: vi.fn() });
  expect(
    (await h(req(input, { origin: "https://other.invalid" }))).status,
  ).toBe(403);
  expect((await h(req(input, { "content-type": "text/plain" }))).status).toBe(
    415,
  );
  expect((await h(req({ text: "x".repeat(4096) }))).status).toBe(413);
  expect(
    (
      await h(
        new Request("http://localhost/api/v1/feedback", {
          method: "POST",
          headers: {
            origin: "http://localhost",
            "content-type": "application/json",
          },
          body: "{",
        }),
      )
    ).status,
  ).toBe(400);
});
it("audit feedback rate-limits without trusting spoofed forwarding headers and sanitizes storage errors", async () => {
  const h = createFeedbackHandler({
    development: true,
    maxRequests: 1,
    submit: vi.fn().mockRejectedValue(Error("PRIVATE_SQL_PASSWORD")),
  });
  const first = await h(req());
  expect(first.status).toBe(503);
  expect(await first.text()).not.toContain("PRIVATE_SQL_PASSWORD");
  expect((await h(req(input, { "x-forwarded-for": "new-ip" }))).status).toBe(
    429,
  );
});
