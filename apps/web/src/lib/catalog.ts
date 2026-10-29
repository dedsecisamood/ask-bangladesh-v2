import type { Locale } from "./i18n/config";

export type Translated = Readonly<Record<Locale, string>>;
export type VerificationStatus =
  "draft" | "pending" | "verified" | "outdated" | "unavailable";
export interface Category {
  slug: string;
  name: Translated;
  icon: "identity" | "travel" | "land" | "other";
}
export interface ServiceAlias {
  language: "bn" | "en" | "banglish";
  text: string;
}
interface ServiceIdentity {
  slug: string;
  name: Translated;
  category: string;
  aliases: readonly ServiceAlias[];
  agencyId?: string;
}
export type Service = ServiceIdentity &
  (
    | { kind: "preparation-topic"; status: "unavailable" }
    | {
        kind: "reviewed-backend";
        status: VerificationStatus;
        summary?: Translated;
      }
  );
export interface Agency {
  slug: string;
  name: Translated;
  status: VerificationStatus;
  description?: Translated;
  sourceIds: readonly string[];
}
export interface SourceSummary {
  id: string;
  title: string;
  kind: "synthetic" | "reviewed-backend";
  ownership: VerificationStatus;
  evidenceEligible: boolean;
  originalUrl?: string;
  agency?: string;
  language?: string;
  documentType?: "html" | "pdf";
  category?: string;
  serviceSlug?: string;
  publishedAt?: string;
  effectiveAt?: string;
  checkedAt?: string;
  version?: string;
  passage?: string;
  page?: number;
}
const category = (
  slug: string,
  bn: string,
  en: string,
  icon: Category["icon"] = "other",
): Category => ({ slug, name: { bn, en }, icon });
export const categories: readonly Category[] = [
  category(
    "identity",
    "জাতীয় পরিচয়পত্র",
    "National Identity Card",
    "identity",
  ),
  category(
    "passport",
    "পাসপোর্ট ও অভিবাসন",
    "Passports and Immigration",
    "travel",
  ),
  category(
    "birth-registration",
    "জন্ম ও মৃত্যু নিবন্ধন",
    "Birth and Death Registration",
  ),
  category("land", "জমি ও সম্পত্তি", "Land and Property", "land"),
  category("tax", "কর ও ভ্যাট", "Tax and VAT"),
  category(
    "driving",
    "ড্রাইভিং লাইসেন্স ও যানবাহন",
    "Driving Licences and Vehicles",
  ),
  category("education", "শিক্ষা ও পরীক্ষা", "Education and Examinations"),
  category("jobs", "সরকারি চাকরি", "Government Jobs"),
  category("welfare", "সমাজকল্যাণ ও ভাতা", "Social Welfare and Allowances"),
  category("health", "স্বাস্থ্য", "Health"),
  category("business", "ব্যবসা ও বিনিয়োগ", "Business and Investment"),
  category("agriculture", "কৃষি", "Agriculture"),
  category("local-government", "স্থানীয় সরকার", "Local Government"),
  category("utilities", "ইউটিলিটি সেবা", "Utilities"),
  category(
    "overseas",
    "প্রবাস ও বৈদেশিক কর্মসংস্থান",
    "Expatriate and Overseas Employment",
  ),
  category("complaints", "অভিযোগ ও প্রতিকার", "Complaints and Grievances"),
];
const topic = (
  slug: string,
  bn: string,
  en: string,
  categorySlug: string,
  banglish: string,
): Service => ({
  slug,
  name: { bn, en },
  category: categorySlug,
  aliases: [{ language: "banglish", text: banglish }],
  kind: "preparation-topic",
  status: "unavailable",
});
// Editorial discovery topics only. These are NOT published government records.
export const catalog = {
  services: [
    topic(
      "nid",
      "জাতীয় পরিচয়পত্র",
      "National Identity Card",
      "identity",
      "nid shongshodhon",
    ),
    topic(
      "e-passport",
      "ই-পাসপোর্ট",
      "E-passport",
      "passport",
      "passport abedon",
    ),
    topic(
      "land-tax",
      "জমি ও ভূমি উন্নয়ন কর",
      "Land and Land Development Tax",
      "land",
      "jomir khajna",
    ),
    topic(
      "birth-registration",
      "জন্ম নিবন্ধন",
      "Birth Registration",
      "birth-registration",
      "jonmo nibondhon",
    ),
    topic(
      "driving-licence",
      "ড্রাইভিং লাইসেন্স",
      "Driving Licence",
      "driving",
      "driving license",
    ),
    topic("education", "শিক্ষা", "Education", "education", "shikkha"),
    topic(
      "government-jobs",
      "সরকারি চাকরি",
      "Government Jobs",
      "jobs",
      "sorkari chakri",
    ),
    topic("taxation", "কর", "Taxation", "tax", "kor vat"),
  ] as readonly Service[],
  agencies: [] as readonly Agency[],
  sources: [] as readonly SourceSummary[],
};
export function findService(slug: string) {
  return catalog.services.find((item) => item.slug === slug);
}
export function findCategory(slug: string) {
  return categories.find((item) => item.slug === slug);
}
export function filterServices(
  query: string,
  categorySlug = "",
): readonly Service[] {
  const normalized = query.normalize("NFC").trim().toLocaleLowerCase();
  return catalog.services.filter(
    (service) =>
      (!categorySlug || service.category === categorySlug) &&
      [
        service.name.bn,
        service.name.en,
        ...service.aliases.map((alias) => alias.text),
      ].some((label) =>
        label.normalize("NFC").toLocaleLowerCase().includes(normalized),
      ),
  );
}
export function safeSourceHref(source: SourceSummary): string | undefined {
  if (
    source.kind !== "reviewed-backend" ||
    source.ownership !== "verified" ||
    !source.evidenceEligible ||
    !source.originalUrl
  )
    return;
  try {
    const url = new URL(source.originalUrl);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      /[\s\\]/u.test(source.originalUrl) ||
      !url.hostname.includes(".") ||
      /^[\d.:\[\]]+$/u.test(url.hostname) ||
      /\.(?:test|invalid|local|localhost)$/u.test(url.hostname)
    )
      return;
    return source.originalUrl;
  } catch {
    return;
  }
}
