import { describe, expect, it } from "vitest";
import {
  catalog,
  categories,
  filterServices,
  findService,
  findCategory,
  safeSourceHref,
  type SourceSummary,
} from "./catalog";

describe("preparation catalog", () => {
  it("contains the sixteen bilingual editorial categories without inventing agencies or sources", () => {
    expect(categories).toHaveLength(16);
    expect(new Set(categories.map((item) => item.slug)).size).toBe(16);
    expect(categories.every((item) => item.name.bn && item.name.en)).toBe(true);
    expect(catalog.agencies).toEqual([]);
    expect(catalog.sources).toEqual([]);
    expect(
      catalog.services.every(
        (item) =>
          item.kind === "preparation-topic" &&
          item.status === "unavailable" &&
          !item.agencyId,
      ),
    ).toBe(true);
    expect(findCategory("land")?.name.en).toBe("Land and Property");
    expect(findCategory("missing")).toBeUndefined();
    expect(findService("missing")).toBeUndefined();
  });
  it.each([
    ["পাসপোর্ট", "e-passport"],
    ["PASSPORT", "e-passport"],
    ["  passport  ", "e-passport"],
    ["jomir khajna", "land-tax"],
    ["shongshodhon", "nid"],
  ])("matches %s by plain names and curated aliases", (query, slug) => {
    expect(filterServices(query).map((item) => item.slug)).toContain(slug);
  });
  it("combines search and category filters without modifying source data", () => {
    expect(filterServices("")).toHaveLength(8);
    expect(filterServices("", "identity").map((item) => item.slug)).toEqual([
      "nid",
    ]);
    expect(filterServices("passport", "land")).toEqual([]);
    expect(filterServices("", "health")).toEqual([]);
    expect(filterServices("nothing")).toEqual([]);
    expect(catalog.services).toHaveLength(8);
  });
});
describe("source link boundary", () => {
  const source: SourceSummary = {
    id: "unit-fixture",
    title: "Unit fixture; never published",
    kind: "reviewed-backend",
    ownership: "verified",
    evidenceEligible: true,
    originalUrl: "https://example.org/original.pdf",
  };
  it("retains exact backend URLs without fabricating page fragments", () => {
    expect(safeSourceHref(source)).toBe(source.originalUrl);
  });
  it.each([
    "javascript:alert(1)",
    "http://example.org",
    "https://user:password@example.org",
    "https://127.0.0.1",
    "https://[::1]",
    "https://localhost",
    "https://example.test",
    "https://example.invalid",
    "https://example.local",
    "https://example.org:444/",
    "https://example.org/has space",
    "not-a-url",
  ])("rejects unsafe or non-public URL %s", (originalUrl) => {
    expect(safeSourceHref({ ...source, originalUrl })).toBeUndefined();
  });
  it("never promotes synthetic, pending, stale or incomplete metadata to a link", () => {
    expect(safeSourceHref({ ...source, kind: "synthetic" })).toBeUndefined();
    expect(safeSourceHref({ ...source, ownership: "pending" })).toBeUndefined();
    expect(
      safeSourceHref({ ...source, evidenceEligible: false }),
    ).toBeUndefined();
    expect(
      safeSourceHref({ ...source, originalUrl: undefined }),
    ).toBeUndefined();
  });
});
