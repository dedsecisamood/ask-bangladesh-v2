import { isLocale, type Locale, type PublicPageKey } from "./config";

export type ShellDictionary = {
  readonly brand: { readonly name: string; readonly tagline: string };
  readonly navigation: {
    readonly label: string;
    readonly home: string;
    readonly services: string;
    readonly ask: string;
    readonly howItWorks: string;
    readonly sources: string;
    readonly guides: string;
    readonly about: string;
  };
  readonly skipLink: string;
  readonly mobileMenu: {
    readonly title: string;
    readonly description: string;
    readonly open: string;
    readonly close: string;
  };
  readonly language: {
    readonly label: string;
    readonly bn: string;
    readonly en: string;
    readonly current: string;
  };
  readonly footer: {
    readonly navigationLabel: string;
    readonly projectTitle: string;
    readonly informationTitle: string;
    readonly independentDisclosure: string;
  };
  readonly home: {
    readonly eyebrow: string;
    readonly title: string;
    readonly description: string;
    readonly statusLabel: string;
    readonly noticeTitle: string;
    readonly noticeDescription: string;
    readonly nextTitle: string;
    readonly nextDescription: string;
  };
  readonly preparation: {
    readonly eyebrow: string;
    readonly description: string;
    readonly statusLabel: string;
    readonly backHome: string;
  };
  readonly states: {
    readonly errorTitle: string;
    readonly errorDescription: string;
    readonly retry: string;
    readonly notFoundTitle: string;
    readonly notFoundDescription: string;
    readonly loading: string;
  };
  readonly pages: Readonly<
    Record<
      PublicPageKey,
      { readonly title: string; readonly description: string }
    >
  >;
};

const dictionaries = {
  bn: {
    brand: {
      name: "Ask Bangladesh",
      tagline: "একটি স্বাধীন তথ্যসেবার উদ্যোগ",
    },
    navigation: {
      label: "মূল নেভিগেশন",
      home: "হোম",
      services: "সেবা ডিরেক্টরি",
      ask: "এআই সহকারী",
      howItWorks: "যেভাবে কাজ করবে",
      sources: "যাচাইকৃত উৎস",
      guides: "গাইডসমূহ",
      about: "আমাদের সম্পর্কে",
    },
    skipLink: "মূল বিষয়বস্তুতে যান",
    mobileMenu: {
      title: "সাইটের মেনু",
      description: "পৃষ্ঠাগুলো দেখুন অথবা ভাষা নির্বাচন করুন।",
      open: "মেনু খুলুন",
      close: "মেনু বন্ধ করুন",
    },
    language: {
      label: "ভাষা নির্বাচন",
      bn: "বাংলা",
      en: "English",
      current: "নির্বাচিত",
    },
    footer: {
      navigationLabel: "সহায়ক পৃষ্ঠাগুলো",
      projectTitle: "এই উদ্যোগ সম্পর্কে",
      informationTitle: "তথ্য ও সহায়তা",
      independentDisclosure:
        "Ask Bangladesh একটি স্বাধীন প্রকল্প। এটি বাংলাদেশ সরকারের কোনো সরকারি ওয়েবসাইট নয়।",
    },
    home: {
      eyebrow: "একটি স্বাধীন উদ্যোগ",
      title: "তথ্য সহজ ভাষায়।\nসবার জন্য।",
      description:
        "বাংলাদেশের সরকারি সেবার তথ্য সহজভাবে বোঝার একটি স্বাধীন উদ্যোগ। প্ল্যাটফর্মটি এখন তৈরি হচ্ছে।",
      statusLabel: "উন্নয়ন চলছে",
      noticeTitle: "প্ল্যাটফর্মটি এখন তৈরি হচ্ছে",
      noticeDescription:
        "প্রশ্নোত্তর সহকারী, সেবার তালিকা ও যাচাইকৃত উৎসের তথ্য এখনো চালু হয়নি। কোনো সরকারি নিয়ম, ফি বা সময়সীমার তথ্য এখানে প্রকাশ করা হচ্ছে না।",
      nextTitle: "এক নজরে প্রস্তুতির অবস্থা",
      nextDescription:
        "আপনার তথ্য খোঁজার অভিজ্ঞতা সহজ করতে এই জায়গাগুলো তৈরি করছি।",
    },
    preparation: {
      eyebrow: "প্রস্তুতি চলছে",
      description:
        "এই পাতাটি এখন প্রস্তুত করা হচ্ছে। এখানে কোনো চালু সেবা বা সরকারি নির্দেশনা দেওয়া হচ্ছে না।",
      statusLabel: "এখনো চালু হয়নি",
      backHome: "হোমে ফিরে যান",
    },
    states: {
      errorTitle: "পাতাটি দেখানো যাচ্ছে না",
      errorDescription:
        "একটি সমস্যা হয়েছে। আবার চেষ্টা করুন অথবা হোমে ফিরে যান।",
      retry: "আবার চেষ্টা করুন",
      notFoundTitle: "পাতাটি পাওয়া যায়নি",
      notFoundDescription:
        "ঠিকানাটি ঠিক আছে কি না দেখুন, অথবা মেনু থেকে অন্য পৃষ্ঠা বেছে নিন।",
      loading: "পাতাটি লোড হচ্ছে…",
    },
    pages: {
      guides: {
        title: "গাইডসমূহ",
        description: "যাচাইকৃত নির্দেশনা এখনো প্রকাশিত নয়।",
      },
      help: {
        title: "সহায়তা",
        description: "এই ডেমোতে প্রশ্ন, ভাষা ও নেভিগেশন ব্যবহারের সহায়তা।",
      },
      categories: {
        title: "বিভাগসমূহ",
        description:
          "প্রস্তুতির বিষয়গুলো বিভাগ অনুযায়ী দেখুন। যাচাইকৃত নির্দেশনা এখনো নেই।",
      },
      agencies: {
        title: "সংস্থাসমূহ",
        description: "যাচাইকৃত সংস্থার রেকর্ড এখনো প্রকাশিত হয়নি।",
      },
      search: {
        title: "বিষয় খুঁজুন",
        description: "স্থানীয়ভাবে প্রস্তুতির বিষয়ের নাম খুঁজুন।",
      },
      status: {
        title: "সেবার অবস্থা",
        description: "বাস্তবায়নের অবস্থা; সরাসরি পর্যবেক্ষণ যুক্ত হয়নি।",
      },
      services: {
        title: "সেবাসমূহ",
        description:
          "প্রস্তুতির বিষয়গুলো নাম ও বিভাগ দিয়ে খুঁজুন। যাচাইকৃত সরকারি নির্দেশনা এখনো নেই।",
      },
      ask: {
        title: "এআই সহকারী",
        description:
          "সরাসরি এআই এখনো চালু হয়নি। স্থানীয় ডেমো কথোপকথন দেখুন; ব্যক্তিগত তথ্য লিখবেন না।",
      },
      howItWorks: {
        title: "যেভাবে কাজ করবে",
        description:
          "তথ্য খোঁজা, উৎস দেখানো ও অনিশ্চয়তা বোঝানোর পরিকল্পনা এবং বর্তমান ডেমোর সীমা জানুন।",
      },
      about: {
        title: "আমাদের সম্পর্কে",
        description:
          "এই স্বাধীন উদ্যোগের লক্ষ্য, কাজের পরিধি ও বর্তমান সীমাবদ্ধতার পরিচিতি।",
      },
      sources: {
        title: "সরকারি উৎস",
        description:
          "সরকারি উৎসের তালিকা এখনো প্রকাশ করা হয়নি। এখানে কোনো উৎসকে যাচাইকৃত বা হালনাগাদ বলে দাবি করা হচ্ছে না।",
      },
      trust: {
        title: "আস্থা ও স্বচ্ছতা",
        description:
          "স্বাধীন পরিচয়, পরিকল্পিত প্রমাণের মান, গোপনীয়তা ও বর্তমান সীমাবদ্ধতা।",
      },
      privacy: {
        title: "গোপনীয়তা",
        description:
          "বর্তমান স্থানীয় ডেমোর তথ্যপ্রবাহের খসড়া নীতি; উৎপাদনে প্রকাশের আগে পর্যালোচনা বাকি।",
      },
      terms: {
        title: "ব্যবহারের শর্ত",
        description:
          "স্বাধীন তথ্যসেবার ব্যবহার ও সীমাবদ্ধতার খসড়া শর্ত; প্রকাশের আগে যোগ্য পর্যালোচনা প্রয়োজন।",
      },
      accessibility: {
        title: "সবার জন্য ব্যবহারযোগ্যতা",
        description:
          "প্রবেশগম্যতার লক্ষ্য, বর্তমান সহায়তা ও জানা সীমাবদ্ধতা; পূর্ণ মানসম্মতির দাবি করা হচ্ছে না।",
      },
      feedback: {
        title: "মতামত",
        description:
          "স্থানীয় ডেমো ফর্ম দেখুন; কোনো মতামত সার্ভারে পাঠানো বা যোগাযোগের তথ্য সংগ্রহ করা হয় না।",
      },
      sourcePolicy: {
        title: "উৎস যাচাইয়ের নীতি",
        description:
          "পরিকল্পিত মালিকানা যাচাই, সংগ্রহের অনুমতি ও বর্তমান প্রমাণের পার্থক্য; কোনো উৎস অনুমোদিত নয়।",
      },
    },
  },
  en: {
    brand: {
      name: "Ask Bangladesh",
      tagline: "An independent information project",
    },
    navigation: {
      label: "Main navigation",
      home: "Home",
      services: "Service Directory",
      ask: "AI Assistant",
      howItWorks: "How it will work",
      sources: "Verified Sources",
      guides: "Step-by-Step Guides",
      about: "About Us",
    },
    skipLink: "Skip to main content",
    mobileMenu: {
      title: "Site menu",
      description: "Explore the pages or choose your language.",
      open: "Open menu",
      close: "Close menu",
    },
    language: {
      label: "Choose language",
      bn: "বাংলা",
      en: "English",
      current: "Selected",
    },
    footer: {
      navigationLabel: "Footer navigation",
      projectTitle: "About the project",
      informationTitle: "Information and help",
      independentDisclosure:
        "Ask Bangladesh is an independent project and is not an official Government of Bangladesh website.",
    },
    home: {
      eyebrow: "An independent project",
      title: "Information made clear.\nFor everyone.",
      description:
        "An independent project to make Bangladesh government-service information easier to understand. The platform is under development.",
      statusLabel: "Under development",
      noticeTitle: "The platform is under development",
      noticeDescription:
        "The assistant, service directory and reviewed source information are not operational yet. No government rules, fees or deadlines are published here.",
      nextTitle: "Where things stand",
      nextDescription:
        "We are preparing these spaces to make finding information easier.",
    },
    preparation: {
      eyebrow: "In preparation",
      description:
        "This page is being prepared. It does not provide an operational service or government instructions.",
      statusLabel: "Not operational yet",
      backHome: "Back to home",
    },
    states: {
      errorTitle: "This page could not be displayed",
      errorDescription:
        "Something went wrong. Try again or return to the home page.",
      retry: "Try again",
      notFoundTitle: "Page not found",
      notFoundDescription:
        "Check the address or choose another page from the menu.",
      loading: "Loading the page…",
    },
    pages: {
      guides: {
        title: "Step-by-Step Guides",
        description:
          "Explore guide preparations. Verified instructions are not yet published.",
      },
      help: {
        title: "Help",
        description:
          "Using questions, language selection and navigation in this demonstration.",
      },
      categories: {
        title: "Categories",
        description:
          "Browse preparation topics by category. Verified instructions are not available yet.",
      },
      agencies: {
        title: "Agencies",
        description: "No verified agency records have been published yet.",
      },
      search: {
        title: "Find a topic",
        description: "Search preparation topic names locally.",
      },
      status: {
        title: "Service status",
        description: "Implementation status; live monitoring is not connected.",
      },
      services: {
        title: "Services",
        description:
          "Find preparation topics by name and category. Verified government instructions are not available yet.",
      },
      ask: {
        title: "Ask AI",
        description:
          "Live AI is not operational yet. Try a local demonstration conversation; do not enter personal information.",
      },
      howItWorks: {
        title: "How it will work",
        description:
          "Understand planned retrieval, citations and uncertainty handling, and the limits of the current local demo.",
      },
      about: {
        title: "About",
        description:
          "An introduction to this independent project's purpose, coverage and current limitations.",
      },
      sources: {
        title: "Official sources",
        description:
          "No source registry has been published. This page does not claim that any source has been verified or checked for freshness.",
      },
      trust: {
        title: "Trust and transparency",
        description:
          "Independent status, planned evidence standards, privacy and current limitations.",
      },
      privacy: {
        title: "Privacy",
        description:
          "Draft description of current local-demo data flows; production review remains pending.",
      },
      terms: {
        title: "Terms",
        description:
          "Draft terms describing this independent information project; qualified review is required before production.",
      },
      accessibility: {
        title: "Accessibility",
        description:
          "Accessibility goals, current interaction support and known limitations. Full conformance is not claimed.",
      },
      feedback: {
        title: "Feedback",
        description:
          "Try a local-only feedback form. Reports are not sent to a server and contact details are not requested.",
      },
      sourcePolicy: {
        title: "Source policy",
        description:
          "The planned distinction between ownership verification, crawler permission and current evidence; no source is approved.",
      },
    },
  },
} as const satisfies Record<Locale, ShellDictionary>;

export function getDictionary(locale: Locale): ShellDictionary {
  if (!isLocale(locale)) {
    throw new Error("Unsupported interface locale");
  }

  return dictionaries[locale];
}
