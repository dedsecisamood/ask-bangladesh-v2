import type { PublicAnswer, AnswerPayload } from "@/lib/answers/contracts";
import type { Locale } from "@/lib/i18n/config";
import { evidenceDate, evidenceNumber } from "@/lib/i18n/evidence";

export const answerWarnings = {
  insufficient_evidence: [
    "যথেষ্ট যাচাইকৃত প্রমাণ নেই।",
    "There is not enough verified evidence.",
  ],
  validation_failed: [
    "উত্তরের সমর্থন যাচাই করা যায়নি।",
    "The answer could not be supported by validated evidence.",
  ],
  source_conflict: [
    "উৎসে বিরোধ আছে; দায়িত্বপ্রাপ্ত সংস্থার নিশ্চিতকরণ প্রয়োজন।",
    "Sources conflict; confirmation from the responsible agency is needed.",
  ],
  stale_evidence: [
    "উৎসের বর্তমান অবস্থা নিশ্চিত নয়।",
    "Current source validity could not be confirmed.",
  ],
  provider_unavailable: [
    "উত্তর দেওয়ার সেবা এখন চালু নেই।",
    "Answer assistance is currently unavailable.",
  ],
  policy_unavailable: [
    "উত্তর দেওয়ার সেবা এখন চালু নেই।",
    "Answer assistance is currently unavailable.",
  ],
  budget_exhausted: [
    "ব্যবহারের সীমা পূর্ণ হয়েছে। পরে চেষ্টা করুন।",
    "The usage limit has been reached. Please try later.",
  ],
  partial_support: [
    "উত্তরের শুধু সমর্থিত অংশ দেখানো হচ্ছে।",
    "Only the supported part of the answer is shown.",
  ],
  ambiguous_request: [
    "প্রশ্নে কোন সেবাটি বোঝানো হয়েছে তা স্পষ্ট করুন।",
    "Please clarify which service you mean.",
  ],
  personal_information_removed: [
    "ব্যক্তিগত শনাক্তকারী তথ্য বাদ দেওয়া হয়েছে।",
    "Identifier-like personal information was removed.",
  ],
  publication_date_unknown: [
    "উৎসের প্রকাশের তারিখ জানা নেই।",
    "The source publication date is unknown.",
  ],
  retrieval_degraded: [
    "অনুসন্ধানের কিছু অংশ পাওয়া যায়নি।",
    "Part of the evidence search was unavailable.",
  ],
  context_limit: [
    "প্রশ্নটি সংক্ষিপ্ত করে সেবার নামসহ লিখুন।",
    "Please shorten the question and include the service name.",
  ],
  out_of_scope: [
    "এই সেবার জন্য যাচাইকৃত সহায়তা নেই।",
    "Verified guidance for this service is unavailable.",
  ],
} satisfies Record<AnswerPayload["warnings"][number], [string, string]>;
export function answerWarningText(code: string, locale: Locale): string {
  return Object.hasOwn(answerWarnings, code)
    ? answerWarnings[code as keyof typeof answerWarnings][
        locale === "bn" ? 0 : 1
      ]
    : locale === "bn"
      ? "সেবা এখন পাওয়া যাচ্ছে না।"
      : "Assistance is currently unavailable.";
}
export const banglishWarnings = {
  insufficient_evidence: "Jothesto jachaikrito proman nei.",
  validation_failed: "Uttorer pokkhe proman jachai kora jayni.",
  source_conflict:
    "Utshogulote omil ache; dayittoprapto songsthar nishchitkoron dorkar.",
  stale_evidence: "Utshor bortoman obostha nishchit kora jayni.",
  policy_unavailable: "Uttor dewar sheba ekhon chalu nei.",
  provider_unavailable: "Uttor dewar sheba ekhon chalu nei.",
  budget_exhausted: "Byaboharer shima shesh. Pore cheshta korun.",
  ambiguous_request: "Kon sheba bojhacchen, ektu sposto korun.",
  partial_support: "Shudhu proman diye somorthito ongsho dekhano hocche.",
  personal_information_removed:
    "Byaktigoto porichoy shonaktokari tottho bad dewa hoyeche.",
  publication_date_unknown: "Utshor prokasher tarikh jana nei.",
  retrieval_degraded: "Proman khojar kichu ongsho pawa jayni.",
  context_limit: "Proshnoti chhoto kore shebar nam shoho likhun.",
  out_of_scope: "Ei shebar jonno jachaikrito shohayota nei.",
} satisfies Record<AnswerPayload["warnings"][number], string>;
export function GroundedAnswer({
  answer,
  locale,
}: {
  answer: PublicAnswer;
  locale: Locale;
}) {
  const bn = locale === "bn";
  const warnings = [...new Set([...answer.reason_codes, ...answer.warnings])];
  const limited = answer.status !== "answered";
  return (
    <div className="space-y-4">
      <p className="type-label">
        {bn ? "স্বাধীন তথ্য সহায়তা" : "Independent information assistance"}
      </p>
      {(warnings.length > 0 || limited) && (
        <section
          role={limited ? "alert" : "note"}
          className="rounded-lg border border-border p-4"
        >
          <h3 className="font-semibold">
            {bn ? "সীমাবদ্ধতা ও সতর্কতা" : "Limitations and warnings"}
          </h3>
          {warnings.map((w) => (
            <div key={w}>
              <p lang={locale}>{answerWarningText(w, locale)}</p>
              {answer.language !== locale && (
                <p
                  lang={
                    answer.language === "banglish" ? "bn-Latn" : answer.language
                  }
                >
                  {answer.language === "banglish"
                    ? banglishWarnings[w]
                    : answerWarningText(w, answer.language)}
                </p>
              )}
            </div>
          ))}
          {"error" in answer && answer.error.code === "RATE_LIMITED" && (
            <p>
              {bn
                ? "অনুরোধের সীমা পূর্ণ হয়েছে। পরে চেষ্টা করুন।"
                : "Too many requests. Please try again later."}
            </p>
          )}
        </section>
      )}
      {answer.blocks.map((block) => (
        <section key={block.id}>
          {block.kind === "step" && (
            <h3 className="font-semibold">
              {bn ? "পরবর্তী ধাপ" : "Next step"}
            </h3>
          )}
          <p
            className="whitespace-pre-wrap"
            dir="auto"
            lang={answer.language === "banglish" ? "bn-Latn" : answer.language}
          >
            {block.text}
          </p>
          <ul>
            {block.citation_ids.map((id) => (
              <li key={id}>
                <a
                  className="text-link"
                  href={`#citation-${answer.request_id}-${id}`}
                >
                  {bn ? "সমর্থনকারী উৎস দেখুন" : "View supporting source"}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {answer.citations.map((c) => (
        <article
          key={c.id}
          id={`citation-${answer.request_id}-${c.id}`}
          className="source-card"
        >
          <h3 className="font-semibold" lang="">
            {c.title}
          </h3>
          {c.agency_name && <p lang="">{c.agency_name}</p>}
          <blockquote className="whitespace-pre-wrap" dir="auto" lang="">
            {c.passage}
          </blockquote>
          {c.locator.page !== null && (
            <p>
              {bn ? "পৃষ্ঠা" : "Page"}: {evidenceNumber(c.locator.page, locale)}
            </p>
          )}
          <p>
            {bn ? "উৎস যাচাই" : "Source checked"}:{" "}
            <time dateTime={c.checked_at}>
              {evidenceDate(c.checked_at, locale)}
            </time>
          </p>
          <p>
            {bn ? "প্রকাশের তারিখ" : "Publication date"}:{" "}
            {c.published_at ? (
              <time dateTime={c.published_at}>
                {evidenceDate(c.published_at, locale)}
              </time>
            ) : (
              evidenceDate(null, locale)
            )}
          </p>
          <a
            href={c.url}
            className="text-link break-all"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
          >
            {bn ? "মূল সরকারি উৎস" : "Original official source"}
          </a>
        </article>
      ))}
      <a className="text-link" href={`/${locale}/services`}>
        {bn ? "সেবার তালিকা দেখুন" : "Browse the service directory"}
      </a>
    </div>
  );
}
