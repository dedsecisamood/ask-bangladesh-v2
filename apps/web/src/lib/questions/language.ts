import { prepareRetrievalQuery } from "../retrieval/query";

export type AnswerLanguage = "bn" | "en" | "banglish";
type Turn = { role: "user" | "assistant"; content: string };

// Exact bounded commands only, never extract commands embedded in quoted text.
export function languageCommand(text: string): AnswerLanguage | undefined {
  const command = text
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/[.!?।]+$/u, "");
  if (
    /^(?:বাংলায়|বাংলায়|বাংলা)(?: বলুন| বলো| উত্তর দিন)?$/u.test(command) ||
    /^(?:in bangla|bangla please|please (?:answer|reply) in bangla)$/u.test(
      command,
    )
  )
    return "bn";
  if (
    /^(?:in english|english please|please (?:answer|reply) in english|ইংরেজিতে বলুন)$/u.test(
      command,
    )
  )
    return "en";
  if (
    /^(?:in banglish|banglish please|please (?:answer|reply) in banglish|banglish e bolun)$/u.test(
      command,
    )
  )
    return "banglish";
  return undefined;
}

export function isContextFollowup(text: string): boolean {
  return (
    languageCommand(text) !== undefined ||
    /^(?:what documents(?: are (?:required|needed))?|what about (?:it|this|that)|what (?:is|are) (?:it|this|that)|how much(?: does it cost)?|when|and (?:then|what else)|আর(?: কী| কি)?|কত(?: টাকা)?|কি কি(?: লাগবে)?|ki ki(?: lagbe)?|koto(?: taka)?|ar(?: ki)?)\s*[?!.।]*$/iu.test(
      text.trim(),
    )
  );
}

function detect(text: string): AnswerLanguage {
  if (/[\u0980-\u09ff]/u.test(text)) return "bn";
  const search = prepareRetrievalQuery(text).normalized;
  if (
    /\b(?:kivabe|korbo|korte|lagbe|shongshodhon|khajna|amar|dibo|nam|vul|koto|ki ki)\b/iu.test(
      search,
    )
  )
    return "banglish";
  if (
    /\b(?:how|what|when|where|which|please|can|could|information|question|renewal|passport|nid|land|documents|english)\b/iu.test(
      search,
    )
  )
    return "en";
  return "bn";
}

export function resolveAnswerLanguage(
  question: string,
  preference: "auto" | AnswerLanguage,
  history: readonly Turn[] = [],
): AnswerLanguage {
  if (preference !== "auto") return preference;
  const command = languageCommand(question);
  if (command) return command;
  if (isContextFollowup(question)) {
    const users = history.slice(-6).filter((t) => t.role === "user");
    for (const prior of users.reverse()) {
      const requested = languageCommand(prior.content);
      if (requested) return requested;
      if (!isContextFollowup(prior.content)) return detect(prior.content);
    }
  }
  return detect(question);
}

export function conversationQuestion(
  question: string,
  history: readonly Turn[] = [],
) {
  const current = prepareRetrievalQuery(question);
  if (!isContextFollowup(current.minimized)) return current.minimized;
  const prior = history
    .slice(-6)
    .filter((t) => t.role === "user" && !isContextFollowup(t.content))
    .at(-1);
  if (!prior)
    return languageCommand(current.minimized) ? "" : current.minimized;
  const topic = prepareRetrievalQuery(prior.content).minimized;
  return languageCommand(current.minimized)
    ? topic
    : `${topic} ${current.minimized}`;
}
