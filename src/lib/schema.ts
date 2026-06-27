/**
 * Hissati — shared data contract (Zod schemas + types).
 *
 * Transcribed verbatim from `.local-docs/data-model.md` §2, the AUTHORITATIVE
 * single source of truth for every enum, field name, and the Rule grammar.
 * Do NOT rename or diverge these — the dataset, engine, and scoring all key off
 * these exact strings (FR-B4: KB validated against ProgramSchema; FR-A: profile
 * validated against ProfileSchema).
 *
 * Additive-only extensions allowed by the contract (data-model.md §5) live at the
 * bottom: EvaluatedRule / EvaluatedProgram, the shapes the scoring formulas consume.
 */
import { z } from "zod";

/* ----------------------------------------------------------------------------
 * Bilingual text helper
 * -------------------------------------------------------------------------- */
export const Localized = z.object({
  en: z.string(),
  ar: z.string(),
});
export type Localized = z.infer<typeof Localized>;

/* ----------------------------------------------------------------------------
 * Enums
 * -------------------------------------------------------------------------- */
export const NationalityOwnership = z.enum([
  "emirati_majority", // Emirati ownership >= 51%
  "emirati_minority", // part-Emirati < 51%
  "gcc",
  "expat",
]);
export type NationalityOwnership = z.infer<typeof NationalityOwnership>;

export const LocationEnum = z.enum([
  "al_quaa_al_ain", // the rural-hero locus
  "abu_dhabi_other",
  "sharjah",
  "dubai",
  "other_uae",
  "outside_uae",
]);
export type LocationEnum = z.infer<typeof LocationEnum>;

/** Ordered: idea < mvp < early_traction < established */
export const Stage = z.enum(["idea", "mvp", "early_traction", "established"]);
export type Stage = z.infer<typeof Stage>;

/** Ordered: none < lt_1yr < reg_1_2yr < reg_2yr_plus */
export const Registration = z.enum(["none", "lt_1yr", "reg_1_2yr", "reg_2yr_plus"]);
export type Registration = z.infer<typeof Registration>;

export const Sector = z.enum([
  "camel",
  "dates",
  "astro_tourism",
  "handicrafts",
  "food_processing",
  "retail_services",
  "tech",
  "other",
]);
export type Sector = z.infer<typeof Sector>;

export const FundingType = z.enum(["grant", "loan", "equity", "unsure"]);
export type FundingType = z.infer<typeof FundingType>;

export const Gender = z.enum(["female", "male"]);
export type Gender = z.infer<typeof Gender>;

export const AmountBand = z.enum([
  "lt_50k",
  "aed_50_200k",
  "aed_200_500k",
  "aed_500k_2m",
  "aed_2m_plus",
]);
export type AmountBand = z.infer<typeof AmountBand>;

export const Instrument = z.enum(["grant", "loan", "equity", "accelerator", "license", "support"]);
export type Instrument = z.infer<typeof Instrument>;

export const IntroMethod = z.enum(["open_form", "tamm", "warm_intro", "competition", "email"]);
export type IntroMethod = z.infer<typeof IntroMethod>;

export const Tier = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export type Tier = z.infer<typeof Tier>;

/* ----------------------------------------------------------------------------
 * Profile — questionnaire answers (FR-A1, FR-A2)
 * -------------------------------------------------------------------------- */
export const ProfileSchema = z.object({
  // --- 6 core gating answers ---
  nationality_ownership: NationalityOwnership,
  location: LocationEnum,
  stage: Stage,
  registration: Registration,
  sector: Sector,
  funding_type: FundingType,
  amount_band: AmountBand,

  // --- conditional gate (only consulted by programs that require relocation) ---
  relocation_willing: z.boolean().optional(),
  gender: Gender.optional(),
  farm_tenure: z.boolean().optional(),
  social_impact: z.boolean().optional(),

  // --- optional numeric gates (consumed by business_age / employee_count rules) ---
  business_age_years: z.number().nonnegative().optional(),
  employee_count: z.number().int().nonnegative().optional(),

  // --- optional application-preparation inputs (NON-gating; feed checklists) ---
  team: z.enum(["solo", "cofounder", "technical_cofounder"]).optional(),
  has_pitch_deck: z.boolean().optional(),
  has_financials: z.boolean().optional(),
});
export type Profile = z.infer<typeof ProfileSchema>;

/* ----------------------------------------------------------------------------
 * Rule — a single hard eligibility gate (FR-C1)
 * -------------------------------------------------------------------------- */
export const RuleField = z.enum([
  "nationality_ownership",
  "location",
  "stage",
  "registration",
  "sector",
  "relocation_willing",
  "business_age",
  "employee_count",
  "gender",
  "farm_tenure",
  "social_impact",
]);
export type RuleField = z.infer<typeof RuleField>;

export const RuleOp = z.enum(["in", "gte", "lte", "eq", "is_true"]);
export type RuleOp = z.infer<typeof RuleOp>;

/**
 * `value` shape by op:
 *  - in     -> string[]   (enum value list; field value must be one of)
 *  - gte/lte (stage|registration) -> string (single enum value; ordinal compare)
 *  - gte/lte (business_age|employee_count) -> number
 *  - eq     -> string | number | boolean
 *  - is_true -> boolean (effectively true; checks relocation_willing)
 */
export const RuleSchema = z.object({
  field: RuleField,
  op: RuleOp,
  value: z.union([z.array(z.string()), z.string(), z.number(), z.boolean()]),
  /** Shown when this rule fails. */
  blocking_message: Localized,
  /** Present => this failure is remediable => contributes to "almost". Absent => hard "not_fit". */
  remedy: z
    .object({
      action: Localized,
      links_program_id: z.string().optional(), // e.g. the licence program that unblocks this
      est_cost_aed: z.number().nullable().optional(),
      est_time: z.string().optional(), // e.g. "~2 weeks", "≈8 months"
    })
    .optional(),
});
export type Rule = z.infer<typeof RuleSchema>;

/* ----------------------------------------------------------------------------
 * Program record (FR-B1, FR-B4)
 * -------------------------------------------------------------------------- */
export const ProgramSchema = z.object({
  id: z.string(), // slug, unique
  name: Localized,
  operator: z.string(),
  tier: Tier,
  instrument: Instrument,
  amount: z.object({
    min_aed: z.number().nullable(),
    max_aed: z.number().nullable(),
    /** Conservative per-applicant amount used by the headline metric. */
    countable_max_aed: z.number().nullable().optional(),
    value_kind: z
      .enum(["finance", "cash", "cash_and_in_kind", "in_kind", "prize_pool", "service", "cost", "variable"])
      .optional(),
    notes: z.string().optional(),
  }),
  /** Alternative products in the same group contribute only the largest ceiling. */
  funding_group: z.string().optional(),
  sector_tags: z.array(Sector),
  eligibility: z.array(RuleSchema), // ALL rules are hard gates (AND)
  required_documents: z.array(
    z.object({
      en: z.string(),
      ar: z.string(),
      format: z.string().optional(),
    })
  ),
  intro_method: IntroMethod,
  application_url: z.string().url(),
  equity: z.boolean(), // true if dilutive
  concurrent_compatible_with: z.array(z.string()), // program ids stackable with this one
  processing_time: z.string().optional(),
  description: Localized,
  availability: z.object({
    status: z.enum(["rolling", "open", "closed", "unknown"]),
    checked_date: z.string(),
    opens: z.string().optional(),
    closes: z.string().optional(),
    next_cycle: z.string().optional(),
    note: Localized.optional(),
  }),
  source: z.object({
    url: z.string().url(),
    verified_date: z.string(), // ISO date, e.g. "2026-06-20"
    source_date: z.string().optional(),
    confidence: z.enum(["confirmed", "reported", "estimated"]),
    method: z.string(),
    additional_urls: z.array(z.string().url()).optional(),
  }),
});
export type Program = z.infer<typeof ProgramSchema>;

/** The whole knowledge base file shape. */
export const ProgramFileSchema = z.object({
  schema_version: z.string(),
  generated: z.string(),
  note: z.string().optional(),
  programs: z.array(ProgramSchema),
});
export type ProgramFile = z.infer<typeof ProgramFileSchema>;

/* ----------------------------------------------------------------------------
 * Eligibility result types (FR-C1, FR-C3)
 * -------------------------------------------------------------------------- */
export const EligibilityStatus = z.enum(["eligible", "almost", "not_fit"]);
export type EligibilityStatus = z.infer<typeof EligibilityStatus>;

export interface EligibilityResult {
  status: EligibilityStatus;
  /** Rules the profile failed (empty when eligible). Drives blocking messages + remedies. */
  failedRules: Rule[];
}

/* ----------------------------------------------------------------------------
 * Additive extensions (data-model.md §5 — allowed): the shapes the scoring
 * formulas consume (scoring.md §0). A Rule annotated with this profile's verdict.
 * -------------------------------------------------------------------------- */
export interface EvaluatedRule extends Rule {
  /** Did THIS profile pass this rule? (FR-C1) */
  passed: boolean;
  /** Does this rule carry a `remedy`? (drives "almost" + roadmap steps) */
  remediable: boolean;
}

/** One program after the matcher has run for a given profile. */
export interface EvaluatedProgram {
  program: Program;
  status: EligibilityStatus;
  /** Every eligibility rule, annotated with `.passed` for this profile. */
  rules: EvaluatedRule[];
  /** Convenience subset: the rules that failed (same as EligibilityResult.failedRules). */
  failedRules: Rule[];
}
