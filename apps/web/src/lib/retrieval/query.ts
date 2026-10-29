import { z } from "zod";

const variants: Readonly<Record<string, string>> = {
  kibhabe: "kivabe",
  kivhabe: "kivabe",
  khajana: "khajna",
  songsodhon: "shongshodhon",
  songshodhon: "shongshodhon",
  pasport: "passport",
  passporrt: "passport",
  shonsodhon: "shongshodhon",
  naam: "nam",
  bhul: "vul",
};
export const normalizationRevision = "p43-bounded-v1";
export function normalizeRetrievalText(text: string) {
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/\bjomi-r\b/gu, "jomir")
    .replace(/\bki\s+(?:vabe|bhabe)\b/gu, "kivabe")
    .replace(/[\p{L}\p{M}\p{N}]+/gu, (token) =>
      Object.hasOwn(variants, token) ? variants[token] : token,
    )
    .replace(/[^\p{L}\p{M}\p{N}\u200c\u200d]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}
export function prepareRetrievalQuery(original: string) {
  // Heuristic minimization, not a complete PII detector. Never persist either form.
  const minimized = original
    .normalize("NFC")
    .replace(/https?:\/\/\S+|www\.\S+|[^\s@]+@[^\s@]+\.[^\s@]+/giu, " ")
    .replace(/[A-Za-z][0-9০-৯]{7,9}\b/gu, " ")
    .replace(/(?:\+?[0-9০-৯][\s-]*){8,}/gu, " ");
  const normalized = normalizeRetrievalText(minimized);
  return {
    original,
    minimized: minimized.replace(/\s+/gu, " ").trim(),
    normalization_revision: normalizationRevision,
    normalized,
    redacted: minimized !== original.normalize("NFC"),
    language: /[\u0980-\u09ff]/u.test(normalized)
      ? /[a-z]/u.test(normalized)
        ? "mixed"
        : "bn"
      : "latin",
    variants: normalized ? [normalized] : [],
  } as const;
}
export const routingCatalogSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            service_id: z.uuid(),
            name: z.string().min(1).max(500),
            aliases: z
              .array(
                z
                  .object({
                    text: z.string().min(1).max(200),
                    language: z.enum(["bn", "en", "banglish"]),
                  })
                  .strict(),
              )
              .max(32),
          })
          .strict(),
      )
      .max(200),
    generation: z.string().regex(/^\d+$/),
  })
  .strict();
export type RoutingCatalog = z.infer<typeof routingCatalogSchema>;
export function routeServiceIntent(query: string, catalog: RoutingCatalog) {
  const prepared = prepareRetrievalQuery(query);
  const normalized = ` ${prepared.normalized} `;
  const candidates = catalog.items
    .flatMap((service) => {
      const matches = [service.name, ...service.aliases.map((a) => a.text)]
        .map((text) => prepareRetrievalQuery(text).normalized)
        .filter(
          (text) =>
            text &&
            (normalized.includes(` ${text} `) ||
              (/[\u0980-\u09ff]/u.test(text) &&
                ["এর", "ের", "তে", "র"].some((suffix) =>
                  normalized.includes(` ${text}${suffix} `),
                ))),
        );
      return matches.length
        ? [
            {
              service_id: service.service_id,
              name: service.name,
              aliases_matched: [...new Set(matches)],
              matched_terms: Math.max(
                ...matches.map((m) => m.split(" ").length),
              ),
            },
          ]
        : [];
    })
    .sort(
      (a, b) =>
        b.matched_terms - a.matched_terms ||
        (a.service_id < b.service_id ? -1 : 1),
    );
  // Multiple distinct services never become an invented calibrated probability.
  return {
    ...prepared,
    candidates,
    decision: !prepared.normalized
      ? "redacted_input"
      : candidates.length > 1
        ? "ambiguous"
        : candidates.length === 1
          ? "matched"
          : "unsupported_or_unknown",
    generation: catalog.generation,
  } as const;
}
