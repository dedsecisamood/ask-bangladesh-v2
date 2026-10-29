import { describe, expect, it } from "vitest";
import { parseServerEnvironment } from "./schema";

describe("server environment configuration", () => {
  it("needs no configuration to render the foundation", () => {
    expect(parseServerEnvironment({})).toEqual({});
    expect(
      parseServerEnvironment({ APP_ORIGIN: undefined }).APP_ORIGIN,
    ).toBeUndefined();
  });

  it.each([
    { input: "https://example.test", expected: "https://example.test" },
    { input: "HTTPS://EXAMPLE.TEST:443/", expected: "https://example.test" },
    {
      input: "https://example.test:8443/",
      expected: "https://example.test:8443",
    },
    { input: "http://localhost:3000", expected: "http://localhost:3000" },
    { input: "http://LOCALHOST:80/", expected: "http://localhost" },
    { input: "http://127.0.0.1:3100/", expected: "http://127.0.0.1:3100" },
    { input: "http://[::1]:3000/", expected: "http://[::1]:3000" },
  ])("normalizes the supported origin $input", ({ input, expected }) => {
    expect(parseServerEnvironment({ APP_ORIGIN: input }).APP_ORIGIN).toBe(
      expected,
    );
  });

  it.each([
    { name: "an empty value", input: "" },
    { name: "whitespace", input: " " },
    { name: "leading whitespace", input: " https://example.test" },
    { name: "trailing whitespace", input: "https://example.test " },
    { name: "embedded whitespace", input: "https://example.\ntest" },
    { name: "a malformed URL", input: "not-a-url" },
    { name: "a missing authority delimiter", input: "https:example.test" },
    { name: "backslash URL syntax", input: "https:\\\\example.test" },
    { name: "an invalid port", input: "https://example.test:65536" },
    { name: "remote HTTP", input: "http://example.test" },
    {
      name: "a deceptive localhost suffix",
      input: "http://localhost.evil.test",
    },
    { name: "a deceptive IPv4 suffix", input: "http://127.0.0.1.evil.test" },
    { name: "an abbreviated IPv4 literal", input: "http://127.1" },
    { name: "an integer IPv4 literal", input: "http://2130706433" },
    { name: "an IPv4-mapped IPv6 literal", input: "http://[::ffff:127.0.0.1]" },
    {
      name: "credentials",
      input: "https://user:synthetic-password@example.test",
    },
    { name: "empty userinfo", input: "https://@example.test" },
    { name: "a path", input: "https://example.test/path" },
    { name: "a normalized dot path", input: "https://example.test/path/.." },
    { name: "a query string", input: "https://example.test/?mode=test" },
    { name: "an empty query delimiter", input: "https://example.test/?" },
    { name: "a fragment", input: "https://example.test/#section" },
    { name: "an empty fragment delimiter", input: "https://example.test/#" },
    { name: "FTP", input: "ftp://example.test" },
    { name: "a script URL", input: "javascript:alert(1)" },
    { name: "null", input: null },
    { name: "a numeric value", input: 3000 },
    { name: "a boolean value", input: true },
    { name: "an array", input: ["https://example.test"] },
    { name: "an object", input: { origin: "https://example.test" } },
  ])("rejects $name", ({ input }) => {
    expect(() => parseServerEnvironment({ APP_ORIGIN: input })).toThrow(
      /^Invalid environment configuration: APP_ORIGIN must be/,
    );
  });

  it("reports the invalid setting without echoing its value or credentials", () => {
    const input = "https://synthetic-user:do-not-echo-this@example.test/path";
    let caught: unknown;

    try {
      parseServerEnvironment({ APP_ORIGIN: input });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(Error);
    expect(String(caught)).toContain("APP_ORIGIN");
    expect(String(caught)).not.toContain(input);
    expect(String(caught)).not.toContain("do-not-echo-this");
  });
});
