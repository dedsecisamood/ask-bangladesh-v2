// @vitest-environment node
import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const db = vi.hoisted(() => vi.fn());
vi.mock("./connection", () => ({ feedbackQuery: db }));
import { submitFeedback } from "./repository";
import { databasePoolConfig } from "../database/config";
it("audit feedback repository uses the restricted writer and parameterized payload without citizen text", async () => {
  const id = "49000000-0000-4000-8000-000000000001";
  db.mockResolvedValue({ rows: [{ id }] });
  const payload = {
    category: "incorrect" as const,
    locale: "bn" as const,
    consent: true as const,
  };
  expect(await submitFeedback(payload)).toBe(id);
  expect(db).toHaveBeenCalledWith(
    "SELECT app_public.submit_feedback($1::jsonb) id",
    [JSON.stringify(payload)],
  );
  expect(
    databasePoolConfig(
      "postgres://askbd_feedback:unit-only@127.0.0.1/postgres",
      "askbd_feedback",
    )?.user,
  ).toBe("askbd_feedback");
  expect(() =>
    databasePoolConfig(
      "postgres://askbd_web:unit-only@127.0.0.1/postgres",
      "askbd_feedback",
    ),
  ).toThrow("Invalid DATABASE_URL");
});
