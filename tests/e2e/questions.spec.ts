import { expect, test } from "@playwright/test";

test("P35 production question API stays closed without citizen authentication", async ({
  request,
}) => {
  const response = await request.post("/api/v1/answers", {
    data: { question: "Synthetic passport question 123456789012" },
    headers: { "x-forwarded-for": "127.0.0.1" },
  });
  expect(response.status()).toBe(503);
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(response.headers()["retry-after"]).toBe("60");
  const body = await response.json();
  expect(body.request_id).toBe(response.headers()["x-request-id"]);
  expect(body.error.code).toBe("POLICY_UNAVAILABLE");
  expect(body.blocks).toEqual([]);
  expect(body.citations).toEqual([]);
  expect(JSON.stringify(body)).not.toContain("123456789012");
  expect((await request.get("/api/v1/answers")).status()).toBe(405);
});
