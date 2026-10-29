import "server-only";
import {
  keywordInputSchema,
  keywordPassageSchema,
} from "../retrieval/contracts";
import { retrieveRoutedPassages } from "../retrieval/hybrid";
import { prepareRetrievalQuery } from "../retrieval/query";
import { conversationQuestion } from "../questions/language";
import {
  questionSchema,
  resolveAnswerLanguage,
  type QuestionInput,
} from "../questions/contracts";
import {
  answerPayloadSchema,
  draftSchema,
  type AnswerPayload,
} from "./contracts";
import { assemblePrompt } from "./prompt";
import { ProviderError, type GenerationProvider } from "./provider";
import {
  bindCitation,
  denyUnreviewed,
  deliverySchema,
  evidenceIdentity,
  isCritical,
  numericSupport,
  recheckEvidence,
  supportKey,
  type SupportReview,
  type Delivery,
} from "./citations";

type Routed = Awaited<ReturnType<typeof retrieveRoutedPassages>>;
export type RetrievalBundle = Pick<
  Routed,
  "items" | "status" | "conflict_hold" | "generation" | "evaluated_at"
> & { routing?: { decision: string } };
export interface RagPorts {
  provider: GenerationProvider;
  retrieve?: (
    input: { query: string; locale: "bn" | "en" },
    signal: AbortSignal,
  ) => Promise<RetrievalBundle>;
  recheck?: (
    ids: string[],
    locale: "bn" | "en",
    signal: AbortSignal,
  ) => Promise<Delivery>;
  review?: SupportReview;
  now?: () => number;
  deadlineMs?: number;
}
export function createRagService(ports: RagPorts) {
  const retrieve =
    ports.retrieve ??
    (async (input, signal) => {
      if (signal.aborted) throw Error();
      const result = await retrieveRoutedPassages({
        ...input,
        limit: 12,
        offset: 0,
      });
      if (signal.aborted) throw Error();
      return result;
    });
  const recheck = ports.recheck ?? recheckEvidence,
    review = ports.review ?? denyUnreviewed;
  return async function answer(
    input: QuestionInput,
    signal: AbortSignal,
  ): Promise<AnswerPayload> {
    const parsed = questionSchema.safeParse(input);
    let language: AnswerPayload["language"] = "bn";
    const baseWarnings: AnswerPayload["warnings"] = [];
    const fallback = (
      reason: AnswerPayload["reason_codes"][number],
      status: AnswerPayload["status"] = "abstained",
    ) =>
      answerPayloadSchema.parse({
        status,
        language,
        blocks: [],
        citations: [],
        reason_codes: [reason],
        warnings: [...new Set([...baseWarnings, reason])],
      });
    if (!parsed.success) return fallback("validation_failed");
    const q = parsed.data;
    language = resolveAnswerLanguage(q.question, q.answer_language, q.history);
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stage: "retrieval" | "generation" | "support" | "delivery" =
      "retrieval";
    const work = async () => {
      try {
        if (controller.signal.aborted)
          return fallback("provider_unavailable", "unavailable");
        const minimized = prepareRetrievalQuery(q.question);
        if (minimized.redacted)
          baseWarnings.push("personal_information_removed");
        if (!minimized.normalized) return fallback("insufficient_evidence");
        // Only prior USER intent is context; assistant prose is never evidence.
        const context = conversationQuestion(q.question, q.history);
        if (!context) return fallback("ambiguous_request");
        const retrievalInput = {
          query: prepareRetrievalQuery(context).normalized,
          locale: language === "bn" ? ("bn" as const) : ("en" as const),
        };
        if (!keywordInputSchema.safeParse(retrievalInput).success)
          return fallback("context_limit");
        const bundle = await retrieve(retrievalInput, controller.signal);
        if (bundle.conflict_hold || bundle.status === "conflict_hold")
          return fallback("source_conflict");
        if (bundle.routing?.decision === "ambiguous")
          return fallback("ambiguous_request");
        if (bundle.status === "degraded")
          baseWarnings.push("retrieval_degraded");
        if (!bundle.items.length) return fallback("insufficient_evidence");
        const passages = bundle.items
          .slice(0, 20)
          .map((p) => keywordPassageSchema.parse(p.evidence));
        if (new Set(passages.map((p) => p.passage_id)).size !== passages.length)
          return fallback("validation_failed");
        const { prompt, selected } = assemblePrompt(
          context,
          language,
          passages,
          ports.provider.config.maxContextBytes,
        );
        if (!selected.length) return fallback("insufficient_evidence");
        stage = "generation";
        const output = await ports.provider.generate(prompt, controller.signal);
        const draft = draftSchema.parse(JSON.parse(output));
        if (!draft.claims.length) return fallback("insufficient_evidence");
        const byId = new Map(selected.map((p) => [p.passage_id, p]));
        const candidates = draft.claims.filter(
          (c) =>
            c.evidence.every(
              (e) =>
                byId.has(e.evidence_id) &&
                byId.get(e.evidence_id)!.text.includes(e.quote),
            ) && numericSupport(c),
        );
        if (candidates.length !== draft.claims.length)
          return fallback("validation_failed");
        const keys = candidates.map((c) => supportKey(c, language, selected));
        stage = "support";
        const supportCandidates = candidates.map((claim, i) => ({
          key: keys[i],
          claim,
          language,
          passages: selected,
        }));
        const decisions = await review(
          keys,
          controller.signal,
          supportCandidates,
        );
        const accepted = candidates.filter((c, i) => {
          const r = decisions.get(keys[i]);
          return (
            r?.supported === true && (!isCritical(c) || r.critical === true)
          );
        });
        if (!accepted.length) return fallback("validation_failed");
        // Recheck AFTER generation and support review, never replay cached trust.
        const ids = [
          ...new Set(
            accepted.flatMap((c) => c.evidence.map((e) => e.evidence_id)),
          ),
        ];
        stage = "delivery";
        const current = deliverySchema.parse(
          await recheck(ids, retrievalInput.locale, controller.signal),
        );
        if (controller.signal.aborted)
          return fallback("provider_unavailable", "unavailable");
        if (current.conflict_hold) return fallback("source_conflict");
        if (current.generation !== bundle.generation)
          return fallback("stale_evidence");
        if (
          current.items.length !== ids.length ||
          new Set(current.items.map((p) => p.passage_id)).size !== ids.length ||
          current.items.some(
            (p) =>
              !ids.includes(p.passage_id) ||
              evidenceIdentity(byId.get(p.passage_id)!) !== evidenceIdentity(p),
          )
        )
          return fallback("stale_evidence");
        const now = (ports.now ?? Date.now)(),
          clock = Date.parse(current.evaluated_at);
        if (!Number.isFinite(clock) || clock > now + 1000 || now - clock > 5000)
          return fallback("stale_evidence");
        const cited = current.items;
        if (
          cited.some(
            (p) =>
              Date.parse(p.content_checked_at) > now + 1000 ||
              Date.parse(p.document_reviewed_at) > now + 1000 ||
              (p.effective_from !== null &&
                Date.parse(p.effective_from) > now) ||
              (p.effective_to !== null && Date.parse(p.effective_to) <= now),
          )
        )
          return fallback("stale_evidence");
        if (cited.some((p) => p.published_at === null))
          baseWarnings.push("publication_date_unknown");
        // A claim may be withdrawn or its reviewer revoked during delivery checks.
        // Revalidate independent support immediately before constructing the answer.
        stage = "support";
        const finalDecisions = await review(
          keys,
          controller.signal,
          supportCandidates,
        );
        if (
          controller.signal.aborted ||
          accepted.some((c) => {
            const decision = finalDecisions.get(
              supportKey(c, language, selected),
            );
            return (
              !decision?.supported || (isCritical(c) && !decision.critical)
            );
          })
        )
          return fallback("validation_failed");
        const citations = cited.map(bindCitation),
          citeId = new Map(citations.map((c) => [c.passage_id, c.id]));
        const partial =
          accepted.length !== draft.claims.length || draft.status === "partial";
        return answerPayloadSchema.parse({
          status: partial ? "partial" : "answered",
          language,
          blocks: accepted.map((c) => ({
            id: c.id,
            kind: c.type === "procedure" ? "step" : "explanation",
            text: c.text,
            citation_ids: [
              ...new Set(c.evidence.map((e) => citeId.get(e.evidence_id)!)),
            ],
          })),
          citations,
          reason_codes: partial ? ["partial_support"] : [],
          warnings: [
            ...new Set([
              ...baseWarnings,
              ...(partial ? ["partial_support" as const] : []),
            ]),
          ],
        });
      } catch (e) {
        if (e instanceof ProviderError)
          return fallback(
            e.category === "budget"
              ? "budget_exhausted"
              : "provider_unavailable",
            "unavailable",
          );
        return fallback(
          stage === "generation" ? "validation_failed" : "policy_unavailable",
          stage === "generation" ? "abstained" : "unavailable",
        );
      }
    };
    try {
      const timeout = new Promise<AnswerPayload>((resolve) => {
        controller.signal.addEventListener(
          "abort",
          () => resolve(fallback("provider_unavailable", "unavailable")),
          { once: true },
        );
        timer = setTimeout(() => controller.abort(), ports.deadlineMs ?? 15000);
      });
      return await Promise.race([work(), timeout]);
    } finally {
      if (timer) clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      controller.abort();
    }
  };
}
