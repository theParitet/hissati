/**
 * Hissati — bilingual UI dictionary + locale helpers (FR-H1).
 *
 * Arabic-first. Program-specific content (names, docs, blocking messages,
 * remedies) already ships bilingual in programs.json (.en/.ar); this file covers
 * the UI chrome, the question prompts, and enum option labels. All strings are
 * authored in both AR and EN so the whole flow works in either direction.
 */
import type { QuestionId } from "@/lib/questions";

export type Locale = "ar" | "en";
export const DIR: Record<Locale, "rtl" | "ltr"> = { ar: "rtl", en: "ltr" };

const AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

/** Render numbers in Eastern-Arabic numerals when in Arabic — an authentic local touch. */
export function toLocaleDigits(value: number | string, locale: Locale): string {
  const s = String(value);
  return locale === "ar" ? s.replace(/[0-9]/g, (d) => AR_DIGITS[+d]) : s;
}

/**
 * "{n} steps unlock more" with correct Arabic number–noun–verb agreement.
 * English only needs singular/plural; Arabic has four count regimes (1 / 2 /
 * 3–10 / 11+), so a single fixed "خطوة" mis-agrees for the common 2–10 case.
 */
export function stepsUnlockMore(n: number, locale: Locale): string {
  if (locale === "en") return `${n} ${n === 1 ? "step unlocks more" : "steps unlock more"}`;
  const d = toLocaleDigits(n, "ar");
  if (n === 1) return "خطوة واحدة تفتح المزيد";
  if (n === 2) return "خطوتان تفتحان المزيد";
  if (n <= 10) return `${d} خطوات تفتح المزيد`;
  return `${d} خطوة تفتح المزيد`;
}

/** Pick the right side of a bilingual {en, ar} object. */
export function pick(text: { en: string; ar: string }, locale: Locale): string {
  return text[locale];
}

/* -------------------------------------------------------------------------- */
/* Enum option labels                                                          */
/* -------------------------------------------------------------------------- */
type L = { en: string; ar: string };

export const ENUM_LABELS: Record<string, Record<string, L>> = {
  nationality_ownership: {
    emirati_majority: { en: "Emirati-owned (51%+)", ar: "ملكية إماراتية (٥١٪ أو أكثر)" },
    emirati_minority: { en: "Part-Emirati (under 51%)", ar: "ملكية إماراتية جزئية (أقل من ٥١٪)" },
    gcc: { en: "GCC national", ar: "مواطن خليجي" },
    expat: { en: "Expat / foreign-owned", ar: "وافد / ملكية أجنبية" },
  },
  location: {
    al_quaa_al_ain: { en: "Al Qua'a — Al Ain", ar: "القوع — العين" },
    abu_dhabi_other: { en: "Elsewhere in Abu Dhabi", ar: "مكان آخر في أبوظبي" },
    sharjah: { en: "Sharjah", ar: "الشارقة" },
    dubai: { en: "Dubai", ar: "دبي" },
    other_uae: { en: "Elsewhere in the UAE", ar: "مكان آخر في الإمارات" },
    outside_uae: { en: "Outside the UAE", ar: "خارج الإمارات" },
  },
  stage: {
    idea: { en: "Just an idea", ar: "مجرد فكرة" },
    mvp: { en: "Built a product / MVP", ar: "طوّرت منتجاً أولياً" },
    early_traction: { en: "Early traction (pilots, first sales)", ar: "جذب مبكر (تجارب، أول مبيعات)" },
    established: { en: "Established (1–2yr+ revenue)", ar: "قائم (إيرادات لأكثر من سنة)" },
  },
  registration: {
    none: { en: "Not registered", ar: "غير مسجّل" },
    lt_1yr: { en: "Registered, under 1 year", ar: "مسجّل، أقل من سنة" },
    reg_1_2yr: { en: "Registered, 1–2 years", ar: "مسجّل، سنة إلى سنتين" },
    reg_2yr_plus: { en: "2+ years, with financials", ar: "أكثر من سنتين، مع بيانات مالية" },
  },
  sector: {
    camel: { en: "Camel farming / dairy", ar: "تربية الإبل / الألبان" },
    dates: { en: "Dates", ar: "التمور" },
    astro_tourism: { en: "Astro-tourism / desert camps", ar: "السياحة الفلكية / مخيمات الصحراء" },
    handicrafts: { en: "Handicrafts", ar: "الحرف اليدوية" },
    food_processing: { en: "Food processing", ar: "تصنيع الأغذية" },
    retail_services: { en: "Retail / services", ar: "تجزئة / خدمات" },
    tech: { en: "Technology", ar: "التقنية" },
    other: { en: "Other", ar: "أخرى" },
  },
  funding_type: {
    grant: { en: "Grant (non-repayable)", ar: "منحة (غير مستردة)" },
    loan: { en: "Loan / financing", ar: "تمويل / قرض" },
    equity: { en: "Equity investment", ar: "استثمار بحصة ملكية" },
    unsure: { en: "Not sure yet", ar: "لست متأكداً بعد" },
  },
  amount_band: {
    lt_50k: { en: "Under AED 50K", ar: "أقل من ٥٠ ألف درهم" },
    aed_50_200k: { en: "AED 50K – 200K", ar: "٥٠ – ٢٠٠ ألف درهم" },
    aed_200_500k: { en: "AED 200K – 500K", ar: "٢٠٠ – ٥٠٠ ألف درهم" },
    aed_500k_2m: { en: "AED 500K – 2M", ar: "٥٠٠ ألف – ٢ مليون درهم" },
    aed_2m_plus: { en: "AED 2M+", ar: "أكثر من ٢ مليون درهم" },
  },
  team: {
    solo: { en: "Solo founder", ar: "مؤسس منفرد" },
    cofounder: { en: "With a co-founder", ar: "مع شريك مؤسس" },
    technical_cofounder: { en: "With a technical co-founder", ar: "مع شريك تقني" },
  },
  gender: {
    female: { en: "Woman", ar: "امرأة" },
    male: { en: "Man", ar: "رجل" },
  },
};

export function enumLabel(group: string, value: string, locale: Locale): string {
  return ENUM_LABELS[group]?.[value]?.[locale] ?? value;
}

/* -------------------------------------------------------------------------- */
/* Question prompts + helper text                                              */
/* -------------------------------------------------------------------------- */
export const QUESTION_TEXT: Record<QuestionId, { prompt: L; help?: L }> = {
  nationality_ownership: {
    prompt: { en: "Who owns the business?", ar: "من يملك المشروع؟" },
    help: {
      en: "Many UAE programs require Emirati ownership.",
      ar: "تشترط العديد من البرامج ملكية إماراتية.",
    },
  },
  location: {
    prompt: { en: "Where is the business based?", ar: "أين يقع المشروع؟" },
    help: {
      en: "Funding is often tied to a specific emirate.",
      ar: "غالباً ما يرتبط التمويل بإمارة محددة.",
    },
  },
  stage: {
    prompt: { en: "What stage are you at?", ar: "في أي مرحلة أنت؟" },
    help: {
      en: "Loans want an operating business; accelerators want an MVP.",
      ar: "يتطلب التمويل مشروعاً قائماً؛ وتتطلب المسرّعات منتجاً أولياً.",
    },
  },
  registration: {
    prompt: { en: "Is the business registered?", ar: "هل المشروع مسجّل؟" },
    help: {
      en: "A trade licence unlocks most funding.",
      ar: "تفتح الرخصة التجارية معظم أبواب التمويل.",
    },
  },
  sector: {
    prompt: { en: "What does the business do?", ar: "ما مجال المشروع؟" },
  },
  funding: {
    prompt: { en: "What funding are you looking for?", ar: "ما نوع التمويل الذي تبحث عنه؟" },
  },
  gender: {
    prompt: { en: "Are you applying as a woman?", ar: "هل مقدِّم الطلب امرأة؟" },
    help: {
      en: "Asked only to check women-only programmes such as the Mobdea home licence.",
      ar: "يُطرح فقط للتحقق من البرامج المخصصة للنساء مثل رخصة مبدعة المنزلية.",
    },
  },
  farm_tenure: {
    prompt: { en: "Do you own or lease a farm?", ar: "هل تملك أو تستأجر مزرعة؟" },
    help: {
      en: "This checks the Farm Licence and agriculture-specific pathways.",
      ar: "تتحقق هذه الإجابة من رخصة المزرعة والمسارات الزراعية المتخصصة.",
    },
  },
  social_impact: {
    prompt: {
      en: "Does the project address a defined social priority?",
      ar: "هل يعالج المشروع أولوية اجتماعية محددة؟",
    },
    help: {
      en: "Ma’an funding requests require a documented social initiative and beneficiaries.",
      ar: "تتطلب طلبات تمويل معاً مبادرة اجتماعية موثقة ومستفيدين محددين.",
    },
  },
  relocation_willing: {
    prompt: {
      en: "Could a founder relocate to Abu Dhabi?",
      ar: "هل يمكن لأحد المؤسسين الانتقال إلى أبوظبي؟",
    },
    help: {
      en: "One program (Hub71) requires it — answering unlocks it.",
      ar: "يشترط ذلك برنامج واحد (هب71) — والإجابة تفتحه.",
    },
  },
  team: {
    prompt: { en: "Who is on the founding team?", ar: "من في فريق التأسيس؟" },
  },
  has_pitch_deck: {
    prompt: { en: "Do you have a pitch deck?", ar: "هل لديك عرض تقديمي للمشروع؟" },
  },
  has_financials: {
    prompt: { en: "Do you have financial statements?", ar: "هل لديك بيانات مالية؟" },
  },
};

/* -------------------------------------------------------------------------- */
/* UI chrome strings                                                           */
/* -------------------------------------------------------------------------- */
export const UI: Record<Locale, Record<string, string>> = {
  ar: {
    appName: "حِصّتي",
    tagline: "مرشدك نحو جاهزية التمويل",
    heroLead:
      "لا تكتفي بإخبارك أنك «غير مؤهّل». حِصّتي تطابقك مع برامج التمويل الإماراتية الحقيقية، وتحوّل كل «لا» إلى خطوة تالية موثّقة.",
    heroPromiseTitle: "من فكرة إلى مسار تمويل — بالمصادر",
    startCta: "ابدأ — ٦ أسئلة",
    continueCta: "أكمِل من حيث توقفت",
    langName: "English",
    builtFor: "مصمّم للقوع، العين",
    offlineReady: "يعمل دون اتصال",
    cited: "كل رقم وقاعدة موثّقان",

    // wizard
    questionOf: "السؤال",
    of: "من",
    stillMatch: "برنامجاً ما زال مطابقاً",
    stillMatchOne: "برنامج واحد ما زال مطابقاً",
    back: "السابق",
    next: "التالي",
    skip: "تخطّي",
    seeResults: "اعرض نتائجي",
    yes: "نعم",
    no: "لا",
    fundingType: "نوع التمويل",
    fundingAmount: "المبلغ المطلوب",
    optionalNote: "اختياري — يحسّن مطابقاتك",

    // results
    eligibleNow: "يستوفي الشروط المنشورة",
    almostEligible: "قريب من التأهّل",
    notAFit: "غير مناسب الآن",
    match: "تطابق",
    youCouldQualify: "يمكنك التأهّل إذا…",
    nextStep: "الخطوة التالية",
    timeToQualify: "الوقت حتى التأهّل",
    whyNot: "سبب عدم المطابقة",
    blockingRule: "القاعدة المانعة",
    markDone: "أنجزتُ هذه الخطوة",
    markedDone: "تمّت ✓",
    undo: "تراجع",
    viewChecklist: "قائمة التقديم",
    apply: "تقديم الطلب",
    source: "المصدر",
    verified: "تم التحقق",
    amountRange: "المبلغ",
    youPay: "تدفع",
    youReceive: "تستلم",
    whatThisUnlocks: "ما الذي تفتحه هذه الرسوم",
    requiredFor: "خطوة مطلوبة للوصول إلى",
    instrument: "الأداة",
    tier: "الفئة",
    tier1: "محلي غير مخفِّف للملكية",
    tier2: "مسرّعة / مسابقة",
    tier3: "استثمار جريء",
    instrument_grant: "منحة",
    instrument_loan: "تمويل",
    instrument_equity: "حصة ملكية",
    instrument_accelerator: "مسرّعة",
    instrument_license: "رخصة",
    instrument_support: "دعم",
    availability_open: "مفتوح الآن",
    availability_rolling: "متاح بشكل مستمر",
    availability_closed: "مغلق — تابع الدورة القادمة",
    availability_unknown: "التوفر غير منشور",
    confidence_confirmed: "مؤكد من المصدر الأساسي",
    confidence_reported: "مذكور رسمياً",
    confidence_estimated: "تقديري",
    roadmapTitle: "خارطة الطريق إلى التمويل",
    roadmapLead: "خطوات مرتّبة وموثّقة لتفتح البرامج القريبة منك.",
    stackable: "يمكن الجمع بينه وبين برامج أخرى",
    noResultsTitle: "ابدأ رحلتك",
    noResultsBody: "أكمل الأسئلة لترى البرامج المطابقة.",
    restart: "ابدأ من جديد",
    resultsFor: "النتائج بناءً على ملفك",
    editAnswers: "تعديل الإجابات",
    programs: "البرامج",
    assistant: "المساعد",
    clearAll: "مسح الكل",
    saveAndSee: "حفظ وعرض النتائج",
    assistantLead: "اسأل عن التمويل والتراخيص — كل إجابة موثّقة من البرامج، لا اختراع.",
    askLandingLabel: "أو اسأل المساعد مباشرة",
    askLandingPlaceholder: "اسأل عن التمويل… مثال: أصنع التمور في المنزل",
    compare: "قارن",
    compareTitle: "مقارنة البرامج",
    compareHint: "اختر برنامجين أو ثلاثة للمقارنة جنباً إلى جنب.",
    compareCount: "قارن",
    pin: "تثبيت",
    unpin: "إلغاء التثبيت",
    pinned: "مثبَّتة",
    requirements: "المتطلبات المستوفاة",
    stackableShort: "قابل للجمع",
    formPrompt: "لأجيبك بدقة، اختر ما يناسبك:",
    formContinue: "متابعة",
    myDetails: "تفاصيلي:",
    documentsReady: "المستندات الجاهزة",
    docsProgress: "جاهزة",
    contents: "الأسئلة",
    navDetails: "تفاصيلي",
    navPlan: "خطتي",
    // dashboard tabs + AED-within-reach metric (overhaul)
    tabOverview: "نظرة عامة",
    tabPrograms: "البرامج",
    tabChecklist: "قائمة التقديم",
    withinReach: "ضمن متناولك",
    withinReachHint: "تمويل حقيقي يمكنك الوصول إليه الآن — يرتفع كلما أنجزت خطوة.",
    potentialReach: "ضمن متناولك بعد إكمال الخطوات",
    programsEligibleLabel: "مطابقات مفتوحة",
    stepsLabel: "خطوات منجزة",
    amountVaries: "المبلغ يختلف",
    seePlanCta: "اعرض خطتي",
    stillInRunning: "لا تزال مطابِقة",

    // checklist
    checklistTitle: "قائمة التقديم",
    requiredDocs: "المستندات المطلوبة",
    format: "الصيغة",
    introMethod: "طريقة التقديم",
    processingTime: "مدة المعالجة",
    intro_open_form: "نموذج مفتوح",
    intro_tamm: "عبر تَم (TAMM)",
    intro_warm_intro: "تعريف مباشر",
    intro_competition: "مسابقة",
    intro_email: "عبر البريد الإلكتروني",
    readyToApply: "جاهز للتقديم",
    downloadPdf: "تنزيل الخطة (PDF)",
    close: "إغلاق",

    // est-time bands echoed from scoring labels are program-driven; generic fallback
    estNow: "الآن",
  },
  en: {
    appName: "Hissati",
    tagline: "Your funding-readiness navigator",
    heroLead:
      "It doesn't just tell you \"you don't qualify.\" Hissati matches you to real UAE funding programs and turns every \"no\" into a cited next step.",
    heroPromiseTitle: "From an idea to a funding path — with receipts",
    startCta: "Start — 6 questions",
    continueCta: "Continue where you left off",
    langName: "العربية",
    builtFor: "Built for Al Qua'a, Al Ain",
    offlineReady: "Works offline",
    cited: "Every figure & rule cited",

    questionOf: "Question",
    of: "of",
    stillMatch: "programs still match",
    stillMatchOne: "program still matches",
    back: "Back",
    next: "Next",
    skip: "Skip",
    seeResults: "See my results",
    yes: "Yes",
    no: "No",
    fundingType: "Type of funding",
    fundingAmount: "Amount you need",
    optionalNote: "Optional — sharpens your matches",

    eligibleNow: "Published criteria met",
    almostEligible: "Almost eligible",
    notAFit: "Not a fit yet",
    match: "match",
    youCouldQualify: "You could qualify if…",
    nextStep: "Next step",
    timeToQualify: "Time to qualify",
    whyNot: "Why it doesn't match",
    blockingRule: "Blocking rule",
    markDone: "Mark this step done",
    markedDone: "Done ✓",
    undo: "Undo",
    viewChecklist: "Checklist",
    apply: "Apply",
    source: "Source",
    verified: "verified",
    amountRange: "Amount",
    youPay: "You pay",
    youReceive: "You receive",
    whatThisUnlocks: "What this payment unlocks",
    requiredFor: "Required step toward",
    instrument: "Instrument",
    tier: "Tier",
    tier1: "Local non-dilutive",
    tier2: "Accelerator / competition",
    tier3: "Venture capital",
    instrument_grant: "Grant",
    instrument_loan: "Loan",
    instrument_equity: "Equity",
    instrument_accelerator: "Accelerator",
    instrument_license: "Licence",
    instrument_support: "Support",
    availability_open: "Open now",
    availability_rolling: "Rolling",
    availability_closed: "Closed — track next cycle",
    availability_unknown: "Availability not published",
    confidence_confirmed: "Primary-source confirmed",
    confidence_reported: "Officially reported",
    confidence_estimated: "Estimated",
    roadmapTitle: "Your roadmap to funding",
    roadmapLead: "Ordered, cited steps that unlock the programs closest to you.",
    stackable: "Can be combined with other programs",
    noResultsTitle: "Start your journey",
    noResultsBody: "Answer the questions to see matching programs.",
    restart: "Start over",
    resultsFor: "Results for your profile",
    editAnswers: "Edit answers",
    programs: "Programs",
    assistant: "Assistant",
    clearAll: "Clear all",
    saveAndSee: "Save & see results",
    assistantLead: "Ask about funding and licensing — every answer cited from the programs, nothing invented.",
    askLandingLabel: "Or ask the assistant directly",
    askLandingPlaceholder: "Ask about funding… e.g. I make dates at home",
    compare: "Compare",
    compareTitle: "Compare programs",
    compareHint: "Pick 2–3 programs to compare side by side.",
    compareCount: "Compare",
    pin: "Pin",
    unpin: "Unpin",
    pinned: "Pinned",
    requirements: "Requirements met",
    stackableShort: "Stackable",
    formPrompt: "To answer precisely, pick what fits:",
    formContinue: "Continue",
    myDetails: "My details:",
    documentsReady: "Documents ready",
    docsProgress: "ready",
    contents: "Contents",
    navDetails: "My details",
    navPlan: "My plan",
    // dashboard tabs + AED-within-reach metric (overhaul)
    tabOverview: "Overview",
    tabPrograms: "Programs",
    tabChecklist: "Checklist",
    withinReach: "Within reach",
    withinReachHint: "Real funding you can access now — it climbs as you complete steps.",
    potentialReach: "Reachable with your roadmap",
    programsEligibleLabel: "Open matches",
    stepsLabel: "Steps done",
    amountVaries: "amount varies",
    seePlanCta: "See my plan",
    stillInRunning: "Still matching",

    checklistTitle: "Application checklist",
    requiredDocs: "Required documents",
    format: "Format",
    introMethod: "How to apply",
    processingTime: "Processing time",
    intro_open_form: "Open form",
    intro_tamm: "Via TAMM",
    intro_warm_intro: "Warm intro",
    intro_competition: "Competition",
    intro_email: "By email",
    readyToApply: "Ready to apply",
    downloadPdf: "Download plan (PDF)",
    close: "Close",

    estNow: "now",
  },
};

export function ui(locale: Locale) {
  return UI[locale];
}
