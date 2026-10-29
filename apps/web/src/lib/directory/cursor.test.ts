import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { cursorBinding, decodeCursor, encodeCursor } from "./cursor";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});
describe("opaque directory cursors", () => {
  it("binds equivalent filter objects independently of property order", () => {
    expect(cursorBinding({ locale: "bn", query: "nid", limit: 20 })).toBe(
      cursorBinding({ limit: 20, query: "nid", locale: "bn" }),
    );
  });
  const id = "17000000-0000-4000-8000-000000000001";
  it("binds signed cursors to filters, policy and stable UUID ordering", () => {
    vi.stubEnv("CURSOR_SIGNING_KEY", "a".repeat(64));
    const b = cursorBinding({ kind: "services", locale: "bn", limit: 1 });
    const encoded = encodeCursor(id, "2", b);
    expect(decodeCursor(encoded, b)?.after).toBe(id);
    expect(() =>
      decodeCursor(
        encoded,
        cursorBinding({ kind: "services", locale: "en", limit: 1 }),
      ),
    ).toThrow("INVALID_CURSOR");
    expect(() => decodeCursor(encoded.slice(0, -8) + "bad", b)).toThrow(
      "INVALID_CURSOR",
    );
  });
  it("expires after thirty minutes and rejects malformed structures", () => {
    vi.stubEnv("CURSOR_SIGNING_KEY", "a".repeat(64));
    vi.useFakeTimers();
    const c = encodeCursor(id, "2", "binding");
    vi.advanceTimersByTime(1_800_001);
    expect(() => decodeCursor(c, "binding")).toThrow("CURSOR_EXPIRED");
    for (const bad of ["x", "a.b.c", "bad.bad"])
      expect(() => decodeCursor(bad, "binding")).toThrow();
  });
  it("requires an actual strong server key when issuing cursors", () => {
    vi.stubEnv("CURSOR_SIGNING_KEY", undefined);
    expect(() => encodeCursor(id, "2", "binding")).toThrow("configuration");
    expect(decodeCursor(undefined, "binding")).toBeUndefined();
  });
});
