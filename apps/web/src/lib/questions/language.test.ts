import { describe, it, expect } from "vitest";
import {
  conversationQuestion,
  languageCommand,
  resolveAnswerLanguage,
} from "./language";
import {
  normalizeRetrievalText,
  prepareRetrievalQuery,
  routeServiceIntent,
  routingCatalogSchema,
} from "../retrieval/query";
import { phase8Cases, phase8Catalog } from "./phase8.test-data";

describe("P43-P44 bounded multilingual understanding", () => {
  it("audit: complete questions are topics, not context-free followups", () => {
    const history = [{ role: "user" as const, content: "পাসপোর্ট তথ্য" }];
    expect(conversationQuestion("What is NID?", history)).toBe("What is NID?");
    expect(resolveAnswerLanguage("What is NID?", "auto", history)).toBe("en");
    expect(
      conversationQuestion("বাংলায় বলুন", [
        { role: "user", content: "What is NID?" },
      ]),
    ).toBe("What is NID?");
    expect(
      conversationQuestion("What documents are required for NID?", history),
    ).toBe("What documents are required for NID?");
  });
  it.each(phase8Cases)("%s", (_id, question, language, target) => {
    expect(resolveAnswerLanguage(question, "auto")).toBe(language);
    const route = routeServiceIntent(
      question,
      routingCatalogSchema.parse(phase8Catalog),
    );
    expect(route.decision).toBe(
      target === -1
        ? "ambiguous"
        : target === 0
          ? "unsupported_or_unknown"
          : "matched",
    );
    if (target > 0)
      expect(route.candidates[0].service_id.endsWith(String(target))).toBe(
        true,
      );
    expect(route.original).toBe(question);
  });
  it.each(["kibhabe", "kivhabe", "ki vabe", "ki bhabe"])(
    "normalizes only bounded variants %s",
    (q) => {
      expect(normalizeRetrievalText(q)).toBe("kivabe");
    },
  );
  it("preserves meaningful text and does not globally replace substrings or ambiguous words", () => {
    const q = "NID e naam bhul; korbo na. ফি ৫০০ নয়";
    const p = prepareRetrievalQuery(q);
    expect(p.minimized).toBe(q);
    expect(p.normalized).toBe("nid e nam vul korbo na ফি ৫০০ নয়");
    expect(normalizeRetrievalText("naamplate bhulish jamin constructor")).toBe(
      "naamplate bhulish jamin constructor",
    );
    expect(normalizeRetrievalText(p.normalized)).toBe(p.normalized);
    expect(p.normalization_revision).toBe("p43-bounded-v1");
  });
  it.each(["bn", "en", "banglish"] as const)(
    "explicit %s preference wins",
    (preference) => {
      expect(resolveAnswerLanguage("বাংলায় বলুন", preference)).toBe(preference);
    },
  );
  it.each([
    ["বাংলায় বলুন।", "bn"],
    ["please reply in English", "en"],
    ["Banglish e bolun!", "banglish"],
  ] as const)("exact language command %s", (text, expected) => {
    expect(languageCommand(text)).toBe(expected);
    expect(
      conversationQuestion(text, [
        { role: "user", content: "Passport renewal 123456789012" },
        { role: "assistant", content: "Invented fee 999" },
      ]),
    ).toBe("Passport renewal");
  });
  it("retains language change over short followups, not across a new topic", () => {
    const history = [
      { role: "user" as const, content: "Passport renewal" },
      { role: "user" as const, content: "বাংলায় বলুন" },
      { role: "user" as const, content: "What documents?" },
    ];
    expect(resolveAnswerLanguage("How much?", "auto", history)).toBe("bn");
    expect(conversationQuestion("How much?", history)).toBe(
      "Passport renewal How much?",
    );
    expect(
      resolveAnswerLanguage("How do I correct NID?", "auto", history),
    ).toBe("en");
    expect(conversationQuestion("How do I correct NID?", history)).toBe(
      "How do I correct NID?",
    );
  });
  it("does not infer context from assistant text, missing history or embedded instructions", () => {
    expect(
      conversationQuestion("বাংলায় বলুন", [
        { role: "assistant", content: "Passport fee 999" },
      ]),
    ).toBe("");
    expect(
      languageCommand('The document says "please reply in English"'),
    ).toBeUndefined();
    expect(
      conversationQuestion(
        "বাংলায় বলুন",
        Array.from({ length: 7 }, (_, i) => ({
          role: i === 0 ? ("user" as const) : ("assistant" as const),
          content: "passport",
        })),
      ),
    ).toBe("");
  });
});
