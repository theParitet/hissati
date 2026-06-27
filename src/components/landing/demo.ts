/**
 * Landing-only DEMO data. Self-contained: it drives the marketing page's live UI
 * (the scroll chain + the touchable preview) from the SAME deterministic engine the
 * product runs, but with LOCAL profiles — it never reads or writes the global store.
 *
 * The persona is the project's hero user: an Emirati woman making date products at
 * home in Al Qua'a. Her climb (idea → registered → MVP) is the exact path the
 * dashboard + metrics tests pin: eligible funding programs 0 → 2 → 5 and "AED within
 * reach" 0 → 0 → 2,000,000 when Khalifa Fund's cited AED 2M loan flips eligible.
 */
import type { Profile, EvaluatedProgram } from "@/lib/schema";
import type { SkyStar } from "@/components/dashboard/FundingSky";
import { evaluateAllFull } from "@/lib/engine";
import { progressStats, type ProgressStats } from "@/lib/metrics";
import { PROGRAMS } from "@/lib/programs";
import type { Locale } from "@/lib/i18n";

/** Funding instruments only — licences are fees the founder pays, not money in hand. */
const FUNDING = new Set(["grant", "loan", "equity", "accelerator"]);

const IDEA: Profile = {
  nationality_ownership: "emirati_majority",
  location: "al_quaa_al_ain",
  stage: "idea",
  registration: "none",
  sector: "dates",
  funding_type: "grant",
  amount_band: "lt_50k",
};
const REGISTERED: Profile = { ...IDEA, registration: "lt_1yr" };
const MVP: Profile = { ...REGISTERED, stage: "mvp" };

export const DEMO_PROFILES = { IDEA, REGISTERED, MVP } as const;

export function evalFor(profile: Profile): EvaluatedProgram[] {
  return evaluateAllFull(profile, PROGRAMS);
}

export function statsFor(profile: Profile): ProgressStats {
  return progressStats(profile, evalFor(profile), []);
}

/** Funding programs as sky stars (the dashboard's signature surface), for one profile. */
export function fundingStars(profile: Profile): SkyStar[] {
  return evalFor(profile)
    .filter((e) => FUNDING.has(e.program.instrument))
    .map((e) => ({ id: e.program.id, name: e.program.name, status: e.status }));
}

export const KHALIFA_ID = "khalifa-fund-sme";

/** The cited headline figure — Khalifa Fund's small-enterprise loan ceiling. */
export const KHALIFA = {
  ceiling: 2_000_000,
  sourceUrl: "https://www.khalifafund.ae/services/funding-scheme/",
  verifiedDate: "2026-06-26",
};

/* ── The scroll chain's rungs ──────────────────────────────────────────────
 * Four links in the founder's path. Each carries the engine's REAL numbers for
 * the profile it represents, so the climbing ledger is honest at every rung. */
export interface Rung {
  title: { en: string; ar: string };
  note: { en: string; ar: string };
  profile: Profile;
  /** AED within reach AT this rung (engine-derived; the ledger eases between these). */
  aed: number;
  /** Eligible funding programs at this rung. */
  eligible: number;
  /** This rung is the cited money beat (Khalifa unlocks). */
  win?: boolean;
}

const ideaStats = statsFor(IDEA);
const regStats = statsFor(REGISTERED);
const mvpStats = statsFor(MVP);

export const RUNGS: Rung[] = [
  {
    title: { en: "Today — just an idea", ar: "اليوم — مجرّد فكرة" },
    note: {
      en: "Dates made at home. No licence, no funding yet — but no dead-end either.",
      ar: "تمور تُصنع في المنزل. لا رخصة ولا تمويل بعد — ولا طريق مسدود أيضاً.",
    },
    profile: IDEA,
    aed: ideaStats.aedReachableNow,
    eligible: ideaStats.programsEligible,
  },
  {
    title: { en: "Get a home licence", ar: "احصل على رخصة منزلية" },
    note: {
      en: "Mobdea via TAMM, a fee you pay (~AED 1,000) — it makes the business real.",
      ar: "مبدِعة عبر تَم، رسوم تدفعها (~١٬٠٠٠ درهم) — تجعل المشروع حقيقياً.",
    },
    profile: IDEA,
    aed: ideaStats.aedReachableNow,
    eligible: ideaStats.programsEligible,
  },
  {
    title: { en: "Register the business", ar: "سجّل المشروع" },
    note: {
      en: "Grants open up — Ma'an and ADDED become eligible (their awards vary).",
      ar: "تنفتح المنح — تصبح مَعاً وأبوظبي للاقتصاد مؤهَّلة (مبالغها تختلف).",
    },
    profile: REGISTERED,
    aed: regStats.aedReachableNow,
    eligible: regStats.programsEligible,
  },
  {
    title: { en: "Launch your MVP → Khalifa Fund unlocks", ar: "أطلِق منتجك → يفتح صندوق خليفة" },
    note: {
      en: "Khalifa's AED 2,000,000 loan flips from “almost” to eligible — within reach.",
      ar: "يتحوّل تمويل صندوق خليفة (٢٬٠٠٠٬٠٠٠ درهم) من «قريب» إلى مؤهَّل — ضمن متناولك.",
    },
    profile: MVP,
    aed: mvpStats.aedReachableNow,
    eligible: mvpStats.programsEligible,
    win: true,
  },
];

/** Scattered UAE funding portals — the fragmentation Hissati ties together. */
export function scatteredSources(locale: Locale): { name: string; kind: string }[] {
  const ar = locale === "ar";
  return [
    { name: ar ? "صندوق خليفة" : "Khalifa Fund", kind: ar ? "تمويل" : "Loan" },
    { name: ar ? "مَعاً" : "Ma'an", kind: ar ? "منحة" : "Grant" },
    { name: "ADDED", kind: ar ? "دعم" : "Support" },
    { name: "TAMM", kind: ar ? "ترخيص" : "Licence" },
    { name: "Hub71", kind: ar ? "مسرّعة" : "Accelerator" },
    { name: "Sheraa", kind: ar ? "مسرّعة" : "Accelerator" },
    { name: "DCT", kind: ar ? "سياحة" : "Tourism" },
    { name: "Shorooq", kind: ar ? "استثمار" : "VC" },
  ];
}
