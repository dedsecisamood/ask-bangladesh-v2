// @vitest-environment node
import { describe, expect, it } from "vitest";
import { normalizeRegistryUrl } from "./url";
import {
  createSourceSchema,
  approveSourceSchema,
  sourceActionSchema,
} from "./contracts";
const input = {
  agency_id: "17000000-0000-4000-8000-000000000003",
  url: "https://registry.example.com/",
  source_name: "Synthetic source",
  reason: "Synthetic candidate",
};
describe("source registry URL identities and strict commands", () => {
  it("normalizes HTTPS/IDNA identity while preserving semantic query order", () => {
    expect(
      normalizeRegistryUrl(
        "HTTPS://REGISTRY.EXAMPLE.COM:443/a?b=2&a=1#section",
      ),
    ).toBe("https://registry.example.com/a?b=2&a=1");
    expect(normalizeRegistryUrl("https://বাংলা.example.com/পথ")).toMatch(
      /^https:\/\/xn--/u,
    );
    const parsed = createSourceSchema.parse({
      ...input,
      url: "https://REGISTRY.example.com/#section",
    });
    expect(parsed.submitted_url).toContain("#section");
    expect(parsed.canonical_url).toBe("https://registry.example.com/");
  });
  it.each([
    "http://registry.example.com/",
    "javascript:alert(1)",
    "https://user:secret@example.com/",
    "https://@example.com/",
    "https://127.0.0.1/",
    "https://2130706433/",
    "https://0x7f000001/",
    "https://[::1]/",
    "https://metadata.google.internal/",
    "https://source.local/",
    "https://x.invalid/",
    "https://localhost/",
    "https://x.home.arpa/",
    "https://x.example.com:8443/",
    "https://x.example.com./",
    "https://x.example.com/../secret",
    "https://x.example.com/%2e%2e/",
    "https://x.example.com/%2fsecret",
    "https://x.example.com/a\\b",
    "https://x.example.com/?access_token=private",
    "https://x.example.com/?%70assword=private",
    "https://x.example.com/\u200b",
  ])("rejects unsafe source identity %s", (url) =>
    expect(() => normalizeRegistryUrl(url)).toThrow(),
  );
  it("never grants trust from a government-looking hostname and rejects forged fields", () => {
    expect(
      createSourceSchema.parse({ ...input, url: "https://candidate.gov.bd/" }),
    ).not.toHaveProperty("status");
    expect(
      createSourceSchema.safeParse({ ...input, status: "active" }).success,
    ).toBe(false);
    expect(
      sourceActionSchema.safeParse({
        revision: "1",
        reason: "Review",
        reviewer_id: input.agency_id,
      }).success,
    ).toBe(false);
    expect(
      sourceActionSchema.safeParse({ revision: 1, reason: "Review" }).success,
    ).toBe(false);
  });
  it("requires independent current proof types and separate availability evidence", () => {
    const checked_at = new Date(Date.now() - 60000).toISOString(),
      expires_at = new Date(Date.now() + 3600000).toISOString();
    const proof = {
      method: "Synthetic",
      evidence_ref: "fixture:review",
      excerpt: "Synthetic excerpt",
      checked_at,
      expires_at,
    };
    const data = {
      revision: "1",
      reason: "Review",
      ownership: proof,
      authority: proof,
      content_use_evidence_ref: "fixture:use",
      availability_status: "unknown",
    };
    expect(approveSourceSchema.safeParse(data).success).toBe(true);
    expect(
      approveSourceSchema.safeParse({
        ...data,
        availability_status: "accessible",
      }).success,
    ).toBe(false);
    expect(
      approveSourceSchema.safeParse({
        ...data,
        ownership: {
          ...proof,
          expires_at: new Date(Date.now() - 1000).toISOString(),
        },
      }).success,
    ).toBe(false);
    expect(
      approveSourceSchema.safeParse({ ...data, authority: undefined }).success,
    ).toBe(false);
  });
});
