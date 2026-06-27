/**
 * Hissati — questionnaire definition + question↔rule traceability (FR-A1/FR-A5).
 *
 * Single source of truth for the wizard's questions AND the completeness guard
 * (tests/completeness.test.ts). Mirrors the mapping table in data-model.md §4.
 *
 * Labels live in the i18n dictionary, keyed by id — this file is pure structure
 * so the matcher, the wizard, and the tests all read the same definitions.
 */
import type { Profile, RuleField } from "@/lib/schema";

export type QuestionId =
  | "nationality_ownership"
  | "location"
  | "stage"
  | "registration"
  | "sector"
  | "funding"
  | "gender"
  | "farm_tenure"
  | "social_impact"
  | "relocation_willing"
  | "team"
  | "has_pitch_deck"
  | "has_financials";

/** How the wizard renders/collects the answer. */
export type QuestionKind = "single" | "boolean" | "funding";

export interface Question {
  id: QuestionId;
  kind: QuestionKind;
  /** Profile field(s) this question writes (FR-A5). */
  writes: (keyof Profile)[];
  /** Rule.field(s) this answer is evaluated against. Empty for pure filters. */
  coversRuleFields: RuleField[];
  /** Core gating question (vs optional readiness, which never gates eligibility). */
  gating: boolean;
  /** A pure filter (Q6 funding): shapes ranking/instrument fit, never a hard Rule. */
  filter?: boolean;
  /** Conditional — only asked when relevant (FR-A0). */
  conditional?: boolean;
  /** Enum option values for single-choice questions (labels resolved via i18n). */
  options?: string[];
}

/**
 * The full questionnaire, in default ask-order (most eliminating first; the
 * wizard skips/branches adaptively — FR-A0). 6 core gating + 1 conditional, then
 * 3 optional application-preparation questions that feed checklists only.
 */
export const QUESTIONS: Question[] = [
  {
    id: "location",
    kind: "single",
    writes: ["location"],
    coversRuleFields: ["location"],
    gating: true,
    options: ["al_quaa_al_ain", "abu_dhabi_other", "sharjah", "dubai", "other_uae", "outside_uae"],
  },
  {
    id: "nationality_ownership",
    kind: "single",
    writes: ["nationality_ownership"],
    coversRuleFields: ["nationality_ownership"],
    gating: true,
    options: ["emirati_majority", "emirati_minority", "gcc", "expat"],
  },
  {
    id: "stage",
    kind: "single",
    writes: ["stage"],
    coversRuleFields: ["stage"],
    gating: true,
    options: ["idea", "mvp", "early_traction", "established"],
  },
  {
    id: "registration",
    kind: "single",
    writes: ["registration"],
    // Q4 also covers the (numeric) business_age gate per data-model.md §4.
    coversRuleFields: ["registration", "business_age"],
    gating: true,
    options: ["none", "lt_1yr", "reg_1_2yr", "reg_2yr_plus"],
  },
  {
    id: "sector",
    kind: "single",
    writes: ["sector"],
    coversRuleFields: ["sector"],
    gating: true,
    options: [
      "camel",
      "dates",
      "astro_tourism",
      "handicrafts",
      "food_processing",
      "retail_services",
      "tech",
      "other",
    ],
  },
  {
    id: "funding",
    kind: "funding",
    writes: ["funding_type", "amount_band"],
    coversRuleFields: [], // filter only — shapes instrument/amount fit, not a Rule
    gating: true,
    filter: true,
  },
  {
    id: "gender",
    kind: "single",
    writes: ["gender"],
    coversRuleFields: ["gender"],
    gating: true,
    conditional: true,
    options: ["female", "male"],
  },
  {
    id: "farm_tenure",
    kind: "boolean",
    writes: ["farm_tenure"],
    coversRuleFields: ["farm_tenure"],
    gating: true,
    conditional: true,
  },
  {
    id: "social_impact",
    kind: "boolean",
    writes: ["social_impact"],
    coversRuleFields: ["social_impact"],
    gating: true,
    conditional: true,
  },
  {
    id: "relocation_willing",
    kind: "boolean",
    writes: ["relocation_willing"],
    coversRuleFields: ["relocation_willing"],
    gating: true,
    conditional: true,
  },
  // --- optional preparation inputs (non-gating; feed checklists) ---
  {
    id: "team",
    kind: "single",
    writes: ["team"],
    // The optional preparation block also covers the numeric employee_count gate.
    coversRuleFields: ["employee_count"],
    gating: false,
    options: ["solo", "cofounder", "technical_cofounder"],
  },
  {
    id: "has_pitch_deck",
    kind: "boolean",
    writes: ["has_pitch_deck"],
    coversRuleFields: [],
    gating: false,
  },
  {
    id: "has_financials",
    kind: "boolean",
    writes: ["has_financials"],
    coversRuleFields: [],
    gating: false,
  },
];

/** The gating subset (core 6 + conditional relocation). */
export const GATING_QUESTIONS: Question[] = QUESTIONS.filter((q) => q.gating);

/**
 * Every RuleField → the question id that covers it (FR-A5 completeness).
 * Includes the two numeric piggyback fields so a future program adding a
 * business_age / employee_count gate is not flagged as an orphan rule.
 */
export const RULE_FIELD_COVERAGE: Record<RuleField, QuestionId> = {
  nationality_ownership: "nationality_ownership",
  location: "location",
  stage: "stage",
  registration: "registration",
  sector: "sector",
  relocation_willing: "relocation_willing",
  business_age: "registration",
  employee_count: "team",
  gender: "gender",
  farm_tenure: "farm_tenure",
  social_impact: "social_impact",
};

export function getQuestion(id: QuestionId): Question | undefined {
  return QUESTIONS.find((q) => q.id === id);
}
