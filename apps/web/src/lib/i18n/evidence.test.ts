import { describe, expect, it, vi } from "vitest";
import {
  evidenceDate,
  evidenceLanguageLabel,
  evidenceLanguageTag,
  evidenceNumber,
  evidenceTypeLabel,
} from "./evidence";
import { getDictionary } from "./dictionaries";
import { productCopy } from "../product-copy";
import { warningSchema } from "../answers/contracts";
import {
  answerWarnings,
  answerWarningText,
} from "@/features/chat/grounded-answer";

describe("P42 evidence presentation", () => {
  it("localizes known metadata, with safe unknown/prototype fallbacks", () => {
    expect(evidenceLanguageLabel("banglish", "bn")).toContain("বাংলিশ");
    expect(evidenceLanguageLabel("bn", "en")).toBe("Bangla");
    expect(evidenceLanguageLabel("en", "bn")).toBe("ইংরেজি");
    expect(evidenceLanguageLabel("mixed", "bn")).toBe("মিশ্র ভাষা");
    expect(evidenceLanguageLabel("constructor", "bn")).toBe("অজানা");
    expect(evidenceTypeLabel("__proto__", "en")).toBe("Unknown");
    expect(evidenceTypeLabel("html", "bn")).toContain("ওয়েব পৃষ্ঠা");
    expect(evidenceTypeLabel("pdf", "en")).toBe("PDF document");
    expect(evidenceNumber(27, "bn")).toBe("২৭");
    expect(evidenceNumber(27, "en")).toBe("27");
  });
  it("marks only known source language and never inherits an invented language", () => {
    expect(evidenceLanguageTag("bn")).toBe("bn");
    expect(evidenceLanguageTag("en")).toBe("en");
    expect(evidenceLanguageTag("banglish")).toBe("bn-Latn");
    for (const value of [undefined, "unknown", "mixed", "constructor"])
      expect(evidenceLanguageTag(value)).toBe("");
  });
  it("formats original date precision and explicit UTC without inferring publication", () => {
    expect(evidenceDate("2026-10-24", "en")).toBe("24 Oct 2026");
    expect(evidenceDate("2026-10-24", "bn")).toMatch(/২৪.*২০২৬/u);
    expect(evidenceDate("2026-10-24", "bn")).not.toContain("UTC");
    expect(evidenceDate("2026-10-24T06:30:00+06:00", "en")).toBe(
      "24 Oct 2026, 00:30 UTC",
    );
    expect(evidenceDate(null, "bn")).toBe("অজানা");
  });
  it.each([
    undefined,
    "",
    "not a date",
    "2026-02-30",
    "2026-13-01",
    "2026-10-24T24:00:00Z",
    "2026-10-24T25:00:00Z",
    "2026-10-24T12:30:00",
  ])("withholds malformed/missing date %s", (value) => {
    expect(evidenceDate(value, "en")).toBe("Unknown");
  });
  it("retains a valid original date if locale formatting is unavailable", () => {
    const spy = vi.spyOn(Intl, "DateTimeFormat").mockImplementation(() => {
      throw new RangeError();
    });
    try {
      expect(evidenceDate("2026-10-24", "bn")).toBe("2026-10-24");
    } finally {
      spy.mockRestore();
    }
  });
});

describe("P42 translation completeness", () => {
  const keys = (value: unknown, path = ""): string[] => {
    if (typeof value === "string") {
      expect(value.trim().length).toBeGreaterThan(0);
      return [path];
    }
    if (Array.isArray(value))
      return value.flatMap((v, i) => keys(v, `${path}.${i}`));
    return Object.entries(value as Record<string, unknown>)
      .flatMap(([k, v]) => keys(v, `${path}.${k}`))
      .sort();
  };
  it("keeps shell and product copy complete in both UI locales", () => {
    expect(keys(getDictionary("bn"))).toEqual(keys(getDictionary("en")));
    expect(keys(productCopy.bn)).toEqual(keys(productCopy.en));
  });
  it("covers every validated warning and fails safely for an unknown copy key", () => {
    expect(Object.keys(answerWarnings).sort()).toEqual(
      [...warningSchema.options].sort(),
    );
    for (const key of warningSchema.options) {
      expect(answerWarningText(key, "bn")).toMatch(/[\u0980-\u09ff]/u);
      expect(answerWarningText(key, "en")).not.toMatch(/[\u0980-\u09ff]/u);
    }
    expect(answerWarningText("constructor", "bn")).toBe(
      "সেবা এখন পাওয়া যাচ্ছে না।",
    );
    expect(answerWarningText("new_untranslated_warning", "en")).toBe(
      "Assistance is currently unavailable.",
    );
  });
});
