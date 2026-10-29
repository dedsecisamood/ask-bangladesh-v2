import { describe, expect, it } from "vitest";
import { can, parseAuthConfig, verifiedIdentity } from "./config";
describe("staff configuration and capabilities", () => {
  it("rejects elevated secret/service-role keys in the runtime auth adapter", () => {
    const serviceKey =
      "header." +
      Buffer.from(JSON.stringify({ role: "service_role" })).toString(
        "base64url",
      ) +
      ".signature";
    for (const key of ["sb_secret_synthetic", serviceKey])
      expect(() =>
        parseAuthConfig({
          APP_ORIGIN: "https://ask.example",
          SUPABASE_URL: "https://project.supabase.co",
          SUPABASE_PUBLISHABLE_KEY: key,
        }),
      ).toThrow("Invalid staff");
  });
  it("allows the public demo without auth credentials", () =>
    expect(parseAuthConfig({})).toBeUndefined());
  it.each([{}, { APP_ORIGIN: "https://ask.example" }])(
    "rejects incomplete auth configuration",
    (extra) => {
      expect(() =>
        parseAuthConfig({
          ...extra,
          SUPABASE_URL: "https://project.supabase.co",
        }),
      ).toThrow("Invalid staff");
    },
  );
  it.each([
    "http://external.example",
    "https://project.supabase.co/path",
    "https://name:secret@example.com",
    "file:///tmp/auth",
  ])("rejects unsafe provider origins: %s", (url) => {
    expect(() =>
      parseAuthConfig({
        SUPABASE_URL: url,
        SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic_test_key",
        APP_ORIGIN: "https://ask.example",
      }),
    ).toThrow("Invalid staff");
  });
  it("supports HTTPS and explicit loopback development", () => {
    expect(
      parseAuthConfig({
        SUPABASE_URL: "http://127.0.0.1:54325",
        SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic_test_key",
        APP_ORIGIN: "http://127.0.0.1:3000",
      })?.secure,
    ).toBe(false);
    expect(
      parseAuthConfig({
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic_test_key",
        APP_ORIGIN: "https://ask.example",
      })?.secure,
    ).toBe(true);
  });
  it("rejects aal1 and malformed signed-claim shapes", () => {
    expect(
      verifiedIdentity.safeParse({ sub: "forged", aal: "aal2" }).success,
    ).toBe(false);
    expect(
      verifiedIdentity.safeParse({
        sub: "16000000-0000-4000-8000-000000000001",
        session_id: "16000000-0000-4000-8000-000000000002",
        aal: "aal1",
        exp: 9999999999,
      }).success,
    ).toBe(false);
  });
  it("keeps auditor/reviewer/administrator capabilities separate", () => {
    expect(can("auditor", "inspect")).toBe(true);
    expect(can("auditor", "review")).toBe(false);
    expect(can("source_reviewer", "review")).toBe(true);
    expect(can("source_reviewer", "operate")).toBe(false);
    expect(can("administrator", "operate")).toBe(true);
    expect(can("administrator", "manage_roles")).toBe(false);
    expect(can("owner", "manage_roles")).toBe(true);
    expect(can("owner", "invent")).toBe(false);
  });
});
