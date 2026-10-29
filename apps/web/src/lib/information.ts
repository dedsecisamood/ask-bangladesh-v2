import type { Translated } from "./catalog";

const t = (bn: string, en: string): Translated => ({ bn, en });
type Section = { heading: Translated; text: Translated };
const section = (
  bnHeading: string,
  enHeading: string,
  bn: string,
  en: string,
): Section => ({ heading: t(bnHeading, enHeading), text: t(bn, en) });
export const information = {
  help: [
    section(
      "ডেমো ব্যবহার",
      "Using the demonstration",
      "হোমে প্রশ্ন লিখে ডেমো কথোপকথন খুলুন। উদাহরণ বেছে নেওয়া বা সেবার বিষয় দেখা যায়। ব্যক্তিগত তথ্য দেবেন না। রিফ্রেশ বা ভাষা বদলালে কথোপকথন মুছে যায়।",
      "Write a question on the homepage to open the conversation demo. You can select an example or browse service topics. Avoid personal information. Refreshing or changing languages clears the conversation.",
    ),
    section(
      "কিবোর্ড ও ভাষা",
      "Keyboard and language",
      "ট্যাব দিয়ে নিয়ন্ত্রণগুলো বেছে নিন। মূল বিষয়বস্তুতে যাওয়ার লিংক ব্যবহার করুন। মেনুতে এস্কেপ দিয়ে বন্ধ করুন। ফোনে পাঠানোর বোতাম এবং ডেস্কটপে নতুন লাইনের জন্য শিফট+এন্টার ব্যবহার করুন।",
      "Use Tab to reach controls and the skip link to reach the main content. Escape closes menus. On phones use the send button; on desktop use Shift+Enter for a new line.",
    ),
    section(
      "আসল সহায়তা এখনো যুক্ত নয়",
      "Real support is not connected",
      "ডেমো ফর্ম কোনো দলের কাছে প্রতিবেদন পাঠায় না। কোনো যোগাযোগের ঠিকানা বা সরকারি যোগাযোগের নম্বর এখানে বানিয়ে দেওয়া হচ্ছে না।",
      "The demo feedback form does not send reports to a team. No contact address or government contact number is invented here.",
    ),
  ],
  about: [
    section(
      "কেন এই উদ্যোগ",
      "Why this project exists",
      "সরকারি সেবার তথ্য খুঁজে বোঝা সহজ করার জন্য Ask Bangladesh তৈরি হচ্ছে। বাংলা ভাষাভাষী মানুষ, নতুন স্মার্টফোন ব্যবহারকারী এবং সহজ ব্যাখ্যা খোঁজা সবার জন্য এই উদ্যোগ।",
      "Ask Bangladesh is being built to make government-service information easier to find and understand, including for Bangla readers and people new to using smartphones.",
    ),
    section(
      "স্বাধীন পরিচয়",
      "Independent status",
      "এটি একটি স্বাধীন প্রকল্প; সরকারি ওয়েবসাইট নয়। সরকারের অনুমোদন, অংশীদারত্ব বা প্রতিনিধিত্বের দাবি করা হচ্ছে না।",
      "This is an independent project, not an official government website. No government approval, partnership or representative role is claimed.",
    ),
    section(
      "আজ কী দেখা যাবে",
      "What is available today",
      "দুই ভাষার ওয়েবসাইট, প্রস্তুতির বিষয় এবং স্থানীয় কথোপকথনের ডেমো দেখা যায়। সরকারি তথ্যভান্ডার, এআই, উৎস সংগ্রহ ও আসল মতামত ব্যবস্থা যুক্ত হয়নি।",
      "You can explore the bilingual website, preparation topics and local conversation demo. Government-source data, AI, ingestion and real feedback processing are not connected.",
    ),
    section(
      "দীর্ঘমেয়াদি লক্ষ্য",
      "Longer-term direction",
      "পর্যালোচিত সরকারি প্রমাণ, পাঠযোগ্য উদ্ধৃতি এবং প্রবেশগম্য অভিজ্ঞতার মাধ্যমে তথ্য বুঝতে সাহায্য করাই লক্ষ্য। কণ্ঠ, নথি সহায়তা বা লেনদেন এখন চালু নয়; ভবিষ্যতে আলাদা অনুমোদন লাগবে।",
      "The goal is understandable guidance with reviewed official evidence, readable citations and accessible interactions. Voice, document assistance and transactions are unavailable and require separate future authorization.",
    ),
  ],
  howItWorks: [
    section(
      "এখন: প্রশ্ন লিখে ডেমো দেখুন",
      "Now: write a question and try the demo",
      "বাংলা, বাংলিশ বা ইংরেজি লেখা যায়। হোমের প্রশ্ন স্থানীয় মেমরির মাধ্যমে ডেমো কথোপকথনে যায়। কোনো এআইকে পাঠানো হয় না। ডেমো অর্থ বুঝে উত্তর দেয় না।",
      "Enter Bangla, Banglish or English. The homepage passes the question through local memory to the conversation demo. No question is sent to AI, and the demo does not understand its meaning.",
    ),
    section(
      "পরিকল্পনা: উদ্দেশ্য ও প্রাসঙ্গিক তথ্য",
      "Planned: intent and relevant evidence",
      "ভবিষ্যতে অস্পষ্ট প্রশ্নে ব্যাখ্যা চাওয়া হবে এবং অনুমোদিত সরকারি উৎসের প্রাসঙ্গিক অংশ খোঁজা হবে। উৎস সংগ্রহ বা তথ্য অনুসন্ধান এখন চালু নয়।",
      "A future system will clarify ambiguous questions and retrieve relevant passages from approved official sources. Source ingestion and retrieval are not operational today.",
    ),
    section(
      "পরিকল্পনা: প্রমাণের ভিত্তিতে ব্যাখ্যা",
      "Planned: explanation grounded in evidence",
      "উৎসের বর্তমান ও প্রাসঙ্গিক তথ্য ছাড়া কার্যকর নির্দেশনা প্রকাশ করা হবে না। উদ্ধৃতিতে মূল নথি, নির্দিষ্ট অংশ বা পৃষ্ঠা এবং জানা পরীক্ষার তারিখ দেখানোর পরিকল্পনা আছে।",
      "Actionable guidance is planned to require current applicable evidence. Citations will identify the original document, exact passage or page, and known check dates.",
    ),
    section(
      "তথ্য না থাকলে",
      "When information is missing",
      "তথ্য না পাওয়া, পুরোনো হওয়া বা পরস্পরবিরোধী হওয়া আলাদা করে জানানো হবে। অনুমান করে ফি বা নিয়ম বানানো হবে না। মতামতের ডেমো দেখা যায়; আসল সংশোধন ব্যবস্থা এখনো যুক্ত হয়নি।",
      "Missing, stale and conflicting evidence will be explained separately. Fees or rules must not be guessed. The feedback demonstration is available; actual correction processing is not connected yet.",
    ),
  ],
  trust: [
    section(
      "স্বাধীন প্রকল্প",
      "Independent project",
      "Ask Bangladesh সরকারি সেবা নয়। সরকারি সিদ্ধান্ত, আবেদন, অর্থ প্রদান বা যোগ্যতার নিশ্চয়তা দেয় না।",
      "Ask Bangladesh is not an official government service. It does not make government decisions, submit applications, take payments or guarantee eligibility.",
    ),
    section(
      "তথ্যের উৎস",
      "Information sources",
      "কোনো ডোমেইন সরকারি দেখালেই তা অনুমোদিত নয়। ভবিষ্যৎ যাচাইয়ে সরকারি মালিকানা, সংগ্রহের অনুমতি এবং প্রকাশযোগ্য প্রমাণ আলাদা করে দেখা হবে। এখন কোনো যাচাইকৃত উৎস প্রকাশিত নেই।",
      "A government-looking domain is not approval. Future reviews will distinguish official ownership, crawler permission and publishable evidence. No verified sources are currently published.",
    ),
    section(
      "উদ্ধৃতি মিলিয়ে দেখুন",
      "Check the citations",
      "ভবিষ্যৎ উত্তরে দেওয়া মূল উৎস ও নির্দিষ্ট অংশ মিলিয়ে দেখুন। নমুনা প্রমাণ কার্ড সরকারি প্রমাণ নয়। উৎস না থাকলে কোনো পদ্ধতি ধরে নেবেন না।",
      "Check the original source and exact passage accompanying future answers. A synthetic evidence card is not official evidence. Do not infer a procedure from missing sources.",
    ),
    section(
      "সতেজতা",
      "Freshness",
      "প্রকাশের তারিখ, নথি পরীক্ষার তারিখ ও পর্যালোচনা আলাদা বিষয়। শুধু ওয়েবসাইটে ঢোকা গেছে মানেই তথ্য বর্তমান বা অনুমোদিত নয়। এখন কোনো পরীক্ষার তারিখ বানিয়ে দেখানো হচ্ছে না।",
      "Publication, content checks and review are different events. Website accessibility alone does not establish current approved evidence. No check dates are invented here.",
    ),
    section(
      "সীমাবদ্ধতা",
      "Limits",
      "তথ্য অনুপস্থিত, পুরোনো বা পরস্পরবিরোধী হতে পারে। এখনকার ইন্টারফেস সরকারি প্রশ্নের বাস্তব উত্তর দেয় না।",
      "Information can be missing, outdated or conflicting. The current interface does not give real government-service answers.",
    ),
    section(
      "সংশোধনের পরিকল্পনা",
      "Planned corrections",
      "আসল মতামত ব্যবস্থা যুক্ত হলে ভুল বা পুরোনো তথ্য পর্যালোচনায় পাঠানো হবে। এখনকার ডেমো ফর্ম কোনো দলের কাছে পাঠায় না এবং সমাধানের সময়ের প্রতিশ্রুতি দেয় না।",
      "Once real feedback processing exists, reports can enter review for correction or withdrawal. Today’s demo form does not send to a team or promise resolution times.",
    ),
    section(
      "গোপনীয়তা",
      "Privacy",
      "অপ্রয়োজনীয় ব্যক্তিগত তথ্য এড়ানো এই উদ্যোগের লক্ষ্য। বর্তমান প্রশ্ন ও ডেমো কথোপকথন পৃষ্ঠার মেমরিতে থাকে। উৎপাদন ব্যবস্থার নীতি পর্যালোচনা বাকি।",
      "The project aims to avoid unnecessary personal information. Current questions and demo conversations are held in page memory. Production privacy policy review remains pending.",
    ),
    section(
      "নিরাপদে প্রশ্ন করুন",
      "Ask safely",
      "এনআইডি, পাসপোর্ট নম্বর, পাসওয়ার্ড, ব্যাংকের তথ্য বা ব্যক্তিগত নথি লিখবেন না। স্বয়ংক্রিয় ব্যক্তিগত তথ্য মুছে দেওয়ার ব্যবস্থা এই ডেমোতে নেই।",
      "Do not enter NID or passport numbers, passwords, banking information or private documents. Automatic personal-information redaction is not implemented in this demo.",
    ),
  ],
  privacy: [
    section(
      "পর্যালোচনার জন্য খসড়া",
      "Draft for review",
      "এটি বর্তমান ফ্রন্টএন্ডের তথ্যপ্রবাহ বোঝানোর খসড়া। উৎপাদনে প্রকাশের আগে প্রকৃত অবকাঠামো ও আইনগত পর্যালোচনার সঙ্গে মিলাতে হবে। এটি চূড়ান্ত গোপনীয়তা নীতি নয়।",
      "This draft describes current frontend data flows. It must be checked against actual infrastructure and qualified legal review before production. It is not a finalized privacy policy.",
    ),
    section(
      "প্রশ্ন ও কথোপকথন",
      "Questions and conversations",
      "ডেমোর লেখা React মেমরিতে থাকে; প্রশ্ন ইউআরএল, লোকালস্টোরেজ বা সেশনস্টোরেজে রাখা হয় না। রিফ্রেশ বা ভাষা বদলালে কথোপকথন হারায়। মুছুন বোতাম ব্যবহার করুন। ডেমো প্রশ্ন কোনো এআই বা প্রকল্পের এপিআইতে পাঠায় না।",
      "Demo text lives in React memory; questions are not placed in URLs, localStorage or sessionStorage. Refreshing or switching languages loses the conversation. Use Clear conversation when finished. The demo sends no questions to AI or a project API.",
    ),
    section(
      "মতামত ও অনুসন্ধান",
      "Feedback and search",
      "ডেমো মতামত ফর্ম ও সার্চ স্থানীয়ভাবে কাজ করে। ফর্মটি জমা যায় না; যোগাযোগের তথ্য চাওয়া হয় না। পৃষ্ঠা খোলা অবস্থায় অন্য পৃষ্ঠায় গেলে কথোপকথন মেমরিতে থাকতে পারে। ব্যক্তিগত তথ্য লিখবেন না।",
      "The demo feedback form and search operate locally. Feedback is not submitted and no contact details are requested. Conversations can remain in memory while navigating within the open site. Avoid personal information.",
    ),
    section(
      "ওয়েব অনুরোধ ও সীমাবদ্ধতা",
      "Web requests and limits",
      "পৃষ্ঠা, কোড ও ফন্ট স্থানীয় অ্যাপ থেকে আসে। এই ইন্টারফেসে ট্র্যাকিং স্ক্রিপ্ট নেই। হোস্টিংয়ের সাধারণ অনুরোধ-লগ, ব্রাউজারের নিজস্ব আচরণ বা ব্যবহারকারীর এক্সটেনশন এই পৃষ্ঠা নিয়ন্ত্রণ করে না। তাই সব তথ্য কখনো সংরক্ষিত হয় না এমন দাবি করছি না।",
      "Pages, code and fonts are served by the app. This interface includes no tracking scripts. It does not control ordinary hosting request logs, browser behavior or user extensions, so it does not claim that no information is ever stored anywhere.",
    ),
    section(
      "সিদ্ধান্ত বাকি",
      "Decisions still pending",
      "উৎপাদনের হোস্টিং, অঞ্চল, সরবরাহকারী, সংরক্ষণের সময়, মুছে দেওয়ার প্রক্রিয়া ও আইনগত শর্ত পরে পর্যালোচনা করতে হবে। কোনো বাস্তব এআই বা তথ্যসংগ্রহ চালুর আগে নীতি হালনাগাদ করতে হবে।",
      "Production hosting, regions, vendors, retention periods, deletion processes and legal terms remain subject to review. This policy must be updated before real AI or data collection is enabled.",
    ),
  ],
  terms: [
    section(
      "ব্যবহারের শর্ত: খসড়া",
      "Terms of Use: draft",
      "এটি পর্যালোচনাধীন খসড়া, চূড়ান্ত আইনগত শর্ত নয়। Ask Bangladesh একটি স্বাধীন উদ্যোগ। সরকারি অনুমোদন বা প্রতিনিধিত্বের দাবি করে না।",
      "These are review-required draft terms, not finalized legal terms. Ask Bangladesh is an independent project with no claim of government approval or representation.",
    ),
    section(
      "তথ্যমূলক উদ্দেশ্য",
      "Informational purpose",
      "বর্তমান অভিজ্ঞতা শুধু ফ্রন্টএন্ড প্রদর্শনী। কোনো সরকারি প্রক্রিয়া, যোগ্যতা বা ফলাফলের পরামর্শ হিসেবে ব্যবহার করবেন না। পরে প্রকাশিত নির্দেশনাও মূল সরকারি উৎসের সঙ্গে মিলিয়ে নিতে হবে।",
      "The current experience is a frontend demonstration. Do not treat it as advice about a government procedure, eligibility or outcome. Future guidance must also be checked against original official sources.",
    ),
    section(
      "উপযুক্ত ব্যবহার",
      "Appropriate use",
      "অন্যের ব্যক্তিগত তথ্য, গোপন নথি বা পাসওয়ার্ড দেবেন না। অপব্যবহার, ভুয়া সরকারি পরিচয় বা ক্ষতিকর কনটেন্ট পাঠানো থেকে বিরত থাকুন।",
      "Do not enter another person’s personal information, restricted documents or passwords. Avoid abuse, false government representation and harmful content.",
    ),
    section(
      "আইনগত পর্যালোচনা বাকি",
      "Legal review pending",
      "দায়বদ্ধতা, বিরোধ নিষ্পত্তি, প্রযোজ্য আইন ও অন্যান্য আইনগত বিধান যোগ্য পরামর্শকের পর্যালোচনার আগে চূড়ান্ত করা হয়নি।",
      "Liability, dispute resolution, governing law and other legal provisions have not been finalized and require qualified review.",
    ),
  ],
  accessibility: [
    section(
      "প্রবেশগম্যতার লক্ষ্য",
      "Accessibility goal",
      "সবার জন্য পাঠযোগ্য ও কিবোর্ডে ব্যবহারযোগ্য অভিজ্ঞতা এবং WCAG 2.2 AA লক্ষ্য নিয়ে কাজ করছি। পূর্ণ সামঞ্জস্য বা সনদের দাবি করছি না।",
      "We aim for readable, keyboard-accessible journeys and WCAG 2.2 AA. We do not claim full conformance or certification.",
    ),
    section(
      "বর্তমান সহায়তা",
      "Current support",
      "বাংলা ও ইংরেজি, মূল বিষয়ে যাওয়ার লিংক, দৃশ্যমান ফোকাস, লেবেলযুক্ত ইনপুট, কিবোর্ডে মেনু ও মোবাইল ডায়ালগ ব্যবহার করা যায়। শিফট+এন্টার নতুন লাইন দেয়; মোবাইলে পাঠানোর বোতাম ব্যবহার করুন।",
      "The interface supports Bangla and English, a skip link, visible focus, labeled fields and keyboard navigation including the mobile dialog. Shift+Enter inserts a newline; use the send button on mobile.",
    ),
    section(
      "যাচাইয়ের সীমা",
      "Verification limits",
      "স্বয়ংক্রিয় পরীক্ষা সব বাধা ধরতে পারে না। সাবলীল বাংলা পাঠক, স্ক্রিন রিডার, বাস্তব কম ক্ষমতার ফোন ও পুরোনো ব্রাউজারে মানবিক পর্যালোচনা বাকি। সমর্থিত আধুনিক ব্রাউজার ভিত্তি: Chrome/Edge 111+, Safari 16.4+, Firefox 128+।",
      "Automated tests cannot find every barrier. Fluent Bangla, screen-reader, real low-end device and older-browser reviews remain pending. The modern browser baseline is Chrome/Edge 111+, Safari 16.4+, Firefox 128+.",
    ),
    section(
      "উন্নয়নের প্রক্রিয়া",
      "Improvement process",
      "মতামত ফর্মে প্রবেশগম্যতার ধরন দেখা যায়, তবে এখন জমা দেওয়া যায় না। বাস্তব রিপোর্টিং ও মানবিক যাচাই যুক্ত হলে বাধা পর্যালোচনা করে সংশোধন করা হবে।",
      "The feedback form includes an accessibility category but cannot submit yet. Real reporting and human review will support prioritizing and correcting barriers once connected.",
    ),
  ],
  sourcePolicy: [
    section(
      "সরকারি পরিচয় যাচাই",
      "Official ownership verification",
      "ডোমেইনের নাম, তালিকায় থাকা বা সরকারি চেহারা যাচাইয়ের বিকল্প নয়। মালিকানার প্রমাণ ও অনুমোদিত ঠিকানার পরিধি পর্যালোচনা প্রয়োজন। এখন কোনো উৎস অনুমোদিত বলে প্রকাশ করা হয়নি।",
      "A domain name, directory listing or official appearance is not verification. Ownership evidence and approved URL scope need review. No source is currently published as approved.",
    ),
    section(
      "প্রবেশ ও সংগ্রহের অনুমতি",
      "Access and crawler permission",
      "ওয়েবসাইট খোলা যায় কি না এবং স্বয়ংক্রিয় সংগ্রহের অনুমতি আছে কি না আলাদা বিষয়। মালিকানা যাচাই হলেই সংগ্রহের অনুমতি হয় না। এই ডেমো সরকারি সাইট থেকে কিছু সংগ্রহ করে না।",
      "Accessibility and permission for automated collection are separate. Ownership verification does not authorize crawling. This demo fetches nothing from government sites.",
    ),
    section(
      "বর্তমান প্রমাণ",
      "Current evidence",
      "ভবিষ্যৎ কার্যকর তথ্যের জন্য বর্তমান অনুমোদিত নথি, নির্দিষ্ট অংশ, সতেজতা ও প্রযোজ্যতা পর্যালোচনা লাগবে। দ্বন্দ্ব, প্রত্যাহার বা পুরোনো প্রমাণে সংশ্লিষ্ট নির্দেশনা বন্ধ রাখতে হবে।",
      "Future actionable information requires reviewed current documents, exact passages, freshness and applicability. Conflicts, withdrawal or stale evidence must withhold affected guidance.",
    ),
  ],
  status: [
    section(
      "সরাসরি পর্যবেক্ষণ যুক্ত হয়নি",
      "Live monitoring is not connected",
      "এই পৃষ্ঠা ইন্টারফেসের বাস্তবায়নের অবস্থা জানায়; তাৎক্ষণিক সচলতা, আপটাইম বা ঘটনার ইতিহাস নয়।",
      "This page describes implementation status, not live availability, uptime or incident history.",
    ),
  ],
} satisfies Record<string, readonly Section[]>;
export type InformationKey = keyof typeof information;
