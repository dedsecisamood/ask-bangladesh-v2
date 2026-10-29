import { afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { publishedDirectoryEnabled } from "./mode";
afterEach(() => vi.unstubAllEnvs());
it("published mode is explicit and malformed mode cannot silently fall back to demo", () => {
  vi.stubEnv("DIRECTORY_MODE", undefined);
  expect(publishedDirectoryEnabled()).toBe(false);
  vi.stubEnv("DIRECTORY_MODE", "published");
  expect(publishedDirectoryEnabled()).toBe(true);
  vi.stubEnv("DIRECTORY_MODE", "typo");
  expect(() => publishedDirectoryEnabled()).toThrow("DIRECTORY_MODE");
});
