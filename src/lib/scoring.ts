/**
 * Hissati — deterministic scoring (FR-C2 Match Score, FR-D2/D3 Readiness Score,
 * FR-D4 time-to-eligibility). Transcribed from `.local-docs/scoring.md`.
 *
 * Both scores are PURE, DETERMINISTIC, bounded to [0,100], and TUNABLE from the
 * named-constant blocks below (retune the demo curve = edit constants only). They
 * read only the shared-contract fields (data-model.md), so schema/dataset/scoring
 * stay in sync. No randomness, no clock, no network — backs NFR-7 + the Vitest
 * evidence. A failed remediable rule = one roadmap step; marking it done flips a
 * rule to passed and mechanically moves both scores (the FR-D3 climb).
 */
import type {
  AmountBand,
  EligibilityStatus,
  EvaluatedProgram,
  EvaluatedRule,
  Profile,
  Program,
  Sector,
  Stage,
  Registration,
  Tier,
} from "@/lib/schema";

/* ==========================================================================
 * 1. MATCH SCORE (FR-C2)
 * ======================================================================== */

export const MATCH = {
  // Weights of the four sub-scores. MUST sum to 1.0.
  W_TIER: 0.3, // priority tier (Tier 1 > 2 > 3) — the rural-hero thesis
  W_SECTOR: 0.25, // sector fit (exact / adjacent / none)
  W_FUNDING: 0.2, // funding-range fit (program range vs profile amount band)
  W_REQUIREMENTS: 0.25, // fraction of eligibility rules already passed

  TIER_SCORE: { 1: 1.0, 2: 0.6, 3: 0.3 } as Record<Tier, number>,

  SECTOR_EXACT: 1.0,
  SECTOR_ADJACENT: 0.6,
  SECTOR_GENERIC: 0.5,
  SECTOR_NONE: 0.15,

  // Penalize near-misses so a fully-eligible program of equal merit always
  // outranks an "almost" one, but keep them visible.
  ALMOST_PENALTY: 0.75,
} as const;

// Sector adjacency clusters — programs whose tags share a cluster count as "adjacent".
export const SECTOR_CLUSTERS: Sector[][] = [
  ["camel", "food_processing"],
  ["dates", "food_processing", "handicrafts"],
  ["astro_tourism", "retail_services"],
  ["tech", "retail_services"],
];

// AED interval implied by each amount band (upper bound capped for the open top band).
export const BAND_RANGE: Record<AmountBand, [number, number]> = {
  lt_50k: [0, 50_000],
  aed_50_200k: [50_000, 200_000],
  aed_200_500k: [200_000, 500_000],
  aed_500k_2m: [500_000, 2_000_000],
  aed_2m_plus: [2_000_000, 10_000_000],
};

function sectorFit(profileSector: Sector, tags: Sector[]): number {
  if (tags.length === 0 || (tags as string[]).includes("any")) return MATCH.SECTOR_GENERIC;
  if (tags.includes(profileSector)) return MATCH.SECTOR_EXACT;
  const cluster = SECTOR_CLUSTERS.find((c) => c.includes(profileSector));
  if (cluster && tags.some((t) => cluster.includes(t))) return MATCH.SECTOR_ADJACENT;
  return MATCH.SECTOR_NONE;
}

function fundingFit(
  band: AmountBand,
  amount: { min_aed: number | null; max_aed: number | null }
): number {
  const [bLo, bHi] = BAND_RANGE[band];
  const pLo = amount.min_aed ?? 0; // null min => open at the bottom
  const pHi = amount.max_aed ?? bHi; // null max => open at the top (use band cap)
  const lo = Math.max(bLo, pLo);
  const hi = Math.min(bHi, pHi);
  const intersection = Math.max(0, hi - lo);
  if (intersection === 0) return 0;
  const union = Math.max(bHi, pHi) - Math.min(bLo, pLo);
  const overlap = union > 0 ? intersection / union : 1;
  return Math.max(0.1, overlap); // floor: any overlap is worth something
}

function requirementsMet(rules: EvaluatedRule[]): number {
  if (rules.length === 0) return 1; // no rules = nothing blocking
  const passed = rules.filter((r) => r.passed).length;
  return passed / rules.length;
}

/** 0–100 match score for an eligible or almost-eligible program (FR-C2). */
export function matchScore(
  profile: Profile,
  program: Program,
  status: EligibilityStatus,
  rules: EvaluatedRule[]
): number {
  if (status === "not_fit") return 0; // not ranked

  const tier = MATCH.TIER_SCORE[program.tier];
  const sector = sectorFit(profile.sector, program.sector_tags);
  const funding = fundingFit(profile.amount_band, program.amount);
  const reqs = requirementsMet(rules);

  let composite =
    MATCH.W_TIER * tier +
    MATCH.W_SECTOR * sector +
    MATCH.W_FUNDING * funding +
    MATCH.W_REQUIREMENTS * reqs; // already in [0,1] because weights sum to 1

  if (status === "almost") composite *= MATCH.ALMOST_PENALTY;

  return Math.round(Math.min(100, Math.max(0, composite * 100)));
}

/* ==========================================================================
 * 2. READINESS SCORE (FR-D2 / FR-D3)
 * ======================================================================== */

export const READINESS = {
  // Component weights. MUST sum to 1.0.
  W_ELIGIBLE: 0.45, // strength of currently-eligible programs (the payoff)
  W_ROADMAP: 0.25, // proximity to the best almost-eligible Tier-1 programs
  W_MATURITY: 0.3, // profile maturity (stage + registration) — moves first, early

  // Eligible-now strength counts FUNDING programs only (licences are rungs, not the goal).
  FUNDING_INSTRUMENTS: ["grant", "loan", "equity", "accelerator"] as const, // excludes "license"
  ELIGIBLE_TIER_WEIGHT: { 1: 1.0, 2: 0.7, 3: 0.4 } as Record<Tier, number>,
  ELIGIBLE_SATURATION: 3.0, // sum of tier-weights at which this hits 1.0

  ROADMAP_STEP_DECAY: 0.45, // decay per remaining remedial step

  STAGE_SCORE: { idea: 0.0, mvp: 0.4, early_traction: 0.7, established: 1.0 } as Record<
    Stage,
    number
  >,
  REGISTRATION_SCORE: { none: 0.0, lt_1yr: 0.5, reg_1_2yr: 0.8, reg_2yr_plus: 1.0 } as Record<
    Registration,
    number
  >,
  MATURITY_STAGE_SHARE: 0.5,
  MATURITY_REG_SHARE: 0.5,
} as const;

function eligibleStrength(programs: EvaluatedProgram[]): number {
  const funding = READINESS.FUNDING_INSTRUMENTS as readonly string[];
  const sum = programs
    .filter((p) => p.status === "eligible" && funding.includes(p.program.instrument))
    .reduce((acc, p) => acc + READINESS.ELIGIBLE_TIER_WEIGHT[p.program.tier], 0);
  return Math.min(1, sum / READINESS.ELIGIBLE_SATURATION);
}

function roadmapProximity(programs: EvaluatedProgram[]): number {
  const tier1Almost = programs.filter((p) => p.status === "almost" && p.program.tier === 1);
  if (tier1Almost.length === 0) return 0;
  const proximities = tier1Almost.map((p) => {
    const missing = p.rules.filter((r) => !r.passed && r.remediable).length;
    return Math.max(0, 1 - missing * READINESS.ROADMAP_STEP_DECAY);
  });
  return Math.max(...proximities); // closest prize drives the climb
}

function profileMaturity(profile: Profile): number {
  return (
    READINESS.MATURITY_STAGE_SHARE * READINESS.STAGE_SCORE[profile.stage] +
    READINESS.MATURITY_REG_SHARE * READINESS.REGISTRATION_SCORE[profile.registration]
  );
}

/** 0–100 readiness score. Rises as roadmap steps are completed (FR-D3). */
export function readinessScore(profile: Profile, evaluated: EvaluatedProgram[]): number {
  const eligible = eligibleStrength(evaluated);
  const roadmap = roadmapProximity(evaluated);
  const maturity = profileMaturity(profile);

  const composite =
    READINESS.W_ELIGIBLE * eligible +
    READINESS.W_ROADMAP * roadmap +
    READINESS.W_MATURITY * maturity;

  return Math.round(Math.min(100, Math.max(0, composite * 100)));
}

/**
 * Breakdown for the gauge UI — the three components behind the number, so the
 * results screen can explain "what would raise this".
 */
export function readinessBreakdown(profile: Profile, evaluated: EvaluatedProgram[]) {
  return {
    score: readinessScore(profile, evaluated),
    eligible: eligibleStrength(evaluated),
    roadmap: roadmapProximity(evaluated),
    maturity: profileMaturity(profile),
  };
}

/* ==========================================================================
 * 3. estimateTimeToEligibility (FR-D4)
 * ======================================================================== */

export const EST = {
  DAYS_PER_MONTH: 30,
  WEEKS_PER_MONTH: 4.345,
  NON_NUMERIC_MONTHS: 1, // nudge for unparseable durations ("Before cohort start")
  BANDS: [
    { maxMonths: 0.5, label: "now" },
    { maxMonths: 1.5, label: "≈1 month" },
    { maxMonths: 4, label: "≈2–4 months" },
    { maxMonths: 8, label: "≈6–8 months" },
    { maxMonths: Infinity, label: "≈9+ months" },
  ],
} as const;

/** Parse a free-text duration ("1–3 days", "3-6 months", "Before cohort start") to an upper-bound month estimate. */
export function estTimeToMonths(estTime: string | undefined): number {
  if (!estTime) return 0;
  const s = estTime.toLowerCase();

  const nums = (s.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  if (nums.length === 0) return EST.NON_NUMERIC_MONTHS;
  const upper = Math.max(...nums);

  if (/\bday/.test(s)) return upper / EST.DAYS_PER_MONTH;
  if (/\bweek/.test(s)) return upper / EST.WEEKS_PER_MONTH;
  if (/\bmonth/.test(s)) return upper;
  if (/\byear/.test(s)) return upper * 12;
  return upper; // bare number => assume months (conservative)
}

/** Qualitative ETA for becoming eligible for one program at the current path (FR-D4). */
export function estimateTimeToEligibility(
  _profile: Profile,
  _program: Program,
  rules: EvaluatedRule[]
): string {
  const blocking = rules.filter((r) => !r.passed);
  if (blocking.length === 0) return "now"; // already eligible
  if (blocking.some((r) => !r.remediable)) return "not on this path"; // hard gate
  const months = blocking.reduce((acc, r) => acc + estTimeToMonths(r.remedy?.est_time), 0);
  return EST.BANDS.find((b) => months <= b.maxMonths)!.label;
}
