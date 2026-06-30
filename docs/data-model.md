# Data Model & Matching Logic — Hissati (حصتي)

> **Authoritative shared data contract** for the Hissati funding-readiness navigator.
> Three workstreams build against this file: the **dataset** team (program records), the **scoring** team (ranking + the "AED within reach" metric), and the **engine** team (eligibility evaluation). The enums and field names below are **frozen** — do not rename them. You may add JSDoc, `notes`, or optional fields, but the canonical vocabulary, Rule grammar, and the three-bucket eligibility classification must match exactly.
>
> Implements: FR-A1 (gating questions), FR-A5 (question→rule traceability), FR-B1/FR-B4 (program schema + Zod), FR-C1/FR-C3 (deterministic classification + almost-eligible remedies).

---

## 1. Enums & vocabularies

These are the canonical enum value-sets. Question UIs, program data, and rules all reference these exact strings.

### Profile enums

| Field | Values |
|---|---|
| `nationality_ownership` | `emirati_majority` \| `emirati_minority` \| `gcc` \| `expat` |
| `location` | `al_quaa_al_ain` \| `abu_dhabi_other` \| `sharjah` \| `dubai` \| `other_uae` \| `outside_uae` |
| `stage` | `idea` \| `mvp` \| `early_traction` \| `established` |
| `registration` | `none` \| `lt_1yr` \| `reg_1_2yr` \| `reg_2yr_plus` |
| `sector` | `camel` \| `dates` \| `astro_tourism` \| `handicrafts` \| `food_processing` \| `retail_services` \| `tech` \| `other` |
| `funding_type` | `grant` \| `loan` \| `equity` \| `unsure` |
| `gender` | `female` \| `male` |
| `amount_band` | `lt_50k` \| `aed_50_200k` \| `aed_200_500k` \| `aed_500k_2m` \| `aed_2m_plus` |

### Program enums

| Field | Values |
|---|---|
| `tier` | `1` (local non-dilutive / rural hero) \| `2` (UAE accelerator / competition) \| `3` (regional VC / global) |
| `instrument` | `grant` \| `loan` \| `equity` \| `accelerator` \| `license` \| `support` |
| `intro_method` | `open_form` \| `tamm` \| `warm_intro` \| `competition` \| `email` |

### Rule enums

| Field | Values |
|---|---|
| `Rule.field` | `nationality_ownership` \| `location` \| `stage` \| `registration` \| `sector` \| `relocation_willing` \| `business_age` \| `employee_count` \| `gender` \| `farm_tenure` \| `social_impact` |
| `Rule.op` | `in` \| `gte` \| `lte` \| `eq` \| `is_true` |

> **`business_age` / `employee_count`** are numeric rule fields (compared with `gte`/`lte` against a `number` value). They are derived/auxiliary gates that programs may impose; the engine reads them from optional numeric Profile extensions (`business_age_years`, `employee_count`) when present. They are not part of the 6 core gating questions.
>
> **`gender` / `farm_tenure` / `social_impact`** are narrow conditional gates (a few programs only — e.g. Mobdea's Emirati-women licence gates on `gender`; Farm Licence / Sheikh Mansour Award gate on `farm_tenure`; Ma'an gates on `social_impact`). `gender` is compared with `eq` against a `Gender` value; `farm_tenure` and `social_impact` are booleans checked with `is_true`. The engine reads them from optional Profile fields (`gender`, `farm_tenure`, `social_impact`), surfaced only by the matching conditional questions (FR-A0).

### Ordered enums (for `gte` / `lte`)

Two enums have a meaningful order, used by `gte`/`lte` comparisons. Higher index = "more advanced":

```
stage:        idea (0) < mvp (1) < early_traction (2) < established (3)
registration: none (0) < lt_1yr (1) < reg_1_2yr (2) < reg_2yr_plus (3)
```

`gte`/`lte` on `stage` and `registration` compare these ordinal positions. `gte`/`lte` on `business_age`/`employee_count` are plain numeric comparisons. `in`/`eq` are direct string/value equality. `is_true` checks a boolean field (`relocation_willing`).

---

## 2. Zod schemas (TypeScript)

Copy-pasteable. Requires `zod`. These schemas are the single source of truth; the KB JSON file is validated against `ProgramFileSchema` — a wrapper around the `programs` array, each element of which is a `ProgramSchema` (FR-B4) — and questionnaire output against `ProfileSchema`.

```ts
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

/** The whole knowledge base file shape — the KB JSON validates against this. */
export const ProgramFileSchema = z.object({
  schema_version: z.string(),
  generated: z.string(),
  note: z.string().optional(),
  programs: z.array(ProgramSchema),
});

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
```

---

## 3. Eligibility evaluation algorithm

### Spec

For a given `profile` and `program`:

1. Evaluate **every** rule in `program.eligibility` independently against the profile. Collect the rules that **fail** into `failedRules`. (All rules are ANDed; there is no OR.)
2. Classify:
   - **`eligible`** — `failedRules` is empty (passes all rules).
   - **`almost`** — `failedRules.length` is between **1 and 2 inclusive**, AND **every** failed rule has a `remedy`.
   - **`not_fit`** — otherwise: at least one failed rule has **no** remedy, OR `failedRules.length > 2`.

This guarantees the **no-dead-end** invariant (FR-C3): an `almost` program always carries ≥1 and ≤2 remediable steps to surface as "You could qualify if…".

### Per-rule evaluation semantics

- **Missing optional field.** If a rule targets a field the profile hasn't answered:
  - `relocation_willing` absent → the `is_true` rule **fails** (the program requires relocation and the founder hasn't opted in). Pair this rule with a remedy so it lands in `almost`.
  - `business_age` / `employee_count` absent → treat as **fail** (cannot prove the gate is met).
- **`in`** — pass if the profile's field value is included in `value` (a string array).
- **`eq`** — pass if profile field strictly equals `value`.
- **`is_true`** — pass if the boolean profile field is `true`.
- **`gte` / `lte` on `stage` or `registration`** — compare ordinal positions (`idea`<`mvp`<`early_traction`<`established`; `none`<`lt_1yr`<`reg_1_2yr`<`reg_2yr_plus`). `gte` passes when `profileIndex >= valueIndex`; `lte` passes when `profileIndex <= valueIndex`.
- **`gte` / `lte` on `business_age` / `employee_count`** — plain numeric comparison.

### Reference implementation

```ts
import type { Profile, Program, Rule, EligibilityResult } from "./schema";

/** Ordered enums for gte/lte ordinal comparison. */
const STAGE_ORDER: readonly string[] = ["idea", "mvp", "early_traction", "established"];
const REGISTRATION_ORDER: readonly string[] = ["none", "lt_1yr", "reg_1_2yr", "reg_2yr_plus"];

function ordinal(order: readonly string[], v: string): number {
  return order.indexOf(v);
}

/** Resolve the profile value a rule targets. Returns undefined if unanswered. */
function profileValueFor(profile: Profile, field: Rule["field"]): string | number | boolean | undefined {
  switch (field) {
    case "nationality_ownership": return profile.nationality_ownership;
    case "location":              return profile.location;
    case "stage":                 return profile.stage;
    case "registration":          return profile.registration;
    case "sector":                return profile.sector;
    case "relocation_willing":    return profile.relocation_willing; // may be undefined
    case "business_age":          return profile.business_age_years;  // may be undefined
    case "employee_count":        return profile.employee_count;      // may be undefined
    case "gender":                return profile.gender;              // may be undefined
    case "farm_tenure":           return profile.farm_tenure;         // may be undefined
    case "social_impact":         return profile.social_impact;       // may be undefined
  }
}

/** Returns true if the profile PASSES this single rule. */
export function passesRule(profile: Profile, rule: Rule): boolean {
  const pv = profileValueFor(profile, rule.field);

  switch (rule.op) {
    case "is_true":
      // Required boolean (relocation_willing). Unanswered or false => fail.
      return pv === true;

    case "in": {
      if (pv === undefined) return false;
      const list = Array.isArray(rule.value) ? rule.value : [];
      return list.includes(String(pv));
    }

    case "eq":
      if (pv === undefined) return false;
      return pv === rule.value;

    case "gte":
    case "lte": {
      if (pv === undefined) return false;

      // Ordered-enum fields: compare ordinal positions.
      if (rule.field === "stage" || rule.field === "registration") {
        const order = rule.field === "stage" ? STAGE_ORDER : REGISTRATION_ORDER;
        const pIdx = ordinal(order, String(pv));
        const vIdx = ordinal(order, String(rule.value));
        if (pIdx < 0 || vIdx < 0) return false; // unknown enum value => fail safe
        return rule.op === "gte" ? pIdx >= vIdx : pIdx <= vIdx;
      }

      // Numeric fields: business_age / employee_count.
      const pn = Number(pv);
      const vn = Number(rule.value);
      if (Number.isNaN(pn) || Number.isNaN(vn)) return false;
      return rule.op === "gte" ? pn >= vn : pn <= vn;
    }
  }
}

/** Classify a single program for a profile (FR-C1). */
export function evaluateProgram(profile: Profile, program: Program): EligibilityResult {
  const failedRules: Rule[] = program.eligibility.filter((rule) => !passesRule(profile, rule));

  if (failedRules.length === 0) {
    return { status: "eligible", failedRules };
  }

  const allRemediable = failedRules.every((r) => r.remedy !== undefined);
  if (failedRules.length <= 2 && allRemediable) {
    return { status: "almost", failedRules };
  }

  return { status: "not_fit", failedRules };
}

/** Convenience: classify the whole KB. */
export function evaluateAll(profile: Profile, programs: Program[]): Array<{ program: Program } & EligibilityResult> {
  return programs.map((program) => ({ program, ...evaluateProgram(profile, program) }));
}
```

> **Note for the scoring team:** `evaluateProgram` is the gate. Ranking (FR-C2: tier × sector fit × funding-range fit × fewest-missing) and the "AED within reach" headline metric (`lib/metrics.ts`) consume `status` and `failedRules.length` but must not change classification.

---

## 4. Question → rule mapping (FR-A5)

Each of the 6 core gating questions (plus the conditional gates — gender, farm tenure, social impact, relocation) feeds exactly one Profile field, which one or more `Rule.field`s evaluate against. **Completeness invariant:** every `Rule.field` used in the KB is covered by a question (no orphan rules), and every question gates ≥1 program (no orphan questions).

| # | Question | Profile field(s) written | Rule.field(s) satisfied | Example programs gated |
|---|---|---|---|---|
| 1 | Nationality / ownership | `nationality_ownership` | `nationality_ownership` | Khalifa Fund loans, Tajer / Mobdea licences, Khalifa Competition |
| 2 | Location | `location` | `location` | Khalifa Fund (Abu Dhabi), Sheraa (Sharjah) |
| 3 | Stage / traction | `stage` | `stage` | Accelerators/VCs need `gte mvp`; loans need `gte established` |
| 4 | Registration / licence | `registration` (+ optional `business_age_years`) | `registration`, `business_age` | Khalifa loans (registered); triggers pre-registration track |
| 5 | Sector | `sector` | `sector` | Sector whitelists + Al Qua'a livelihood tags |
| 6 | Funding sought (type + amount) | `funding_type`, `amount_band` | — (filters `instrument` + `amount` range, not a `Rule`) | Filters instrument type + funding-range fit |
| 7 | (Conditional) Gender | `gender` | `gender` | Mobdea (Emirati-women home licence) |
| 8 | (Conditional) Farm tenure / land access | `farm_tenure` | `farm_tenure` | Farm Licence, Sheikh Mansour Agricultural Award |
| 9 | (Conditional) Social-impact venture | `social_impact` | `social_impact` | Ma'an — Funding Requests |
| 10 | (Conditional) Relocation willingness | `relocation_willing` | `relocation_willing` | Hub71 (relocation to Abu Dhabi) |
| — | (Optional preparation — non-gating) | `team`, `has_pitch_deck`, `has_financials`, `employee_count` | `employee_count` only if a program imposes a headcount gate | Feeds the application checklist |

**Notes on the mapping:**

- **Question 6 is a filter, not a gate.** `funding_type` and `amount_band` shape ranking and instrument/amount fit (FR-C2). They are *not* expressed as `Rule`s, so they never produce a hard `not_fit`. This is intentional — a founder seeking a grant should still *see* loan programs, ranked lower.
- **`business_age` and `employee_count`** are numeric rule fields that piggyback on existing questions (Q4 for age, the optional preparation block for headcount). They are covered, so they are not orphan rules even though they have no dedicated standalone question.
- **Questions 7–10 are adaptive** (FR-A0): the conditional gates are only asked when relevant (the wizard's `shouldAskGender` / `shouldAskFarmTenure` / `shouldAskSocialImpact` / `shouldAskRelocation` helpers). For example, relocation is only asked when a relocation-gated program (e.g., Hub71) is otherwise a match and the founder is not already in Abu Dhabi; gender is asked only for Emirati founders in Abu Dhabi (gates Mobdea); farm tenure only for agricultural founders there. If a conditional gate is left unanswered, its rule fails — but those rules carry remedies, so the program lands in `almost`, not silently hidden.

### Orphan tests (commit alongside the engine)

Two Vitest assertions enforce the completeness invariant:

- **No orphan rules.** Collect the set of `Rule.field` values across every program's `eligibility`. Assert each is covered by a question per the mapping above — all 11 rule fields: `nationality_ownership`, `location`, `stage`, `registration`, `sector`, `relocation_willing`, `business_age`, `employee_count`, `gender`, `farm_tenure`, `social_impact` (the `RULE_FIELD_COVERAGE` map in `lib/questions.ts`). Fails the build if a program introduces a gate no question asks about.
- **No orphan questions.** Assert each of the 6 core gating questions (and each conditional gate — `gender`, `farm_tenure`, `social_impact`, `relocation_willing` — when any program uses that field) gates ≥1 program — i.e., at least one program either has a `Rule` on that field, or (for Q6) filters on instrument/amount. Fails if a question gates nothing (a "vanity question").

---

## 5. Notes on extensibility

- **Adding a program requires data only, never code.** A new program is one `Program` object that validates against `ProgramSchema`. Its gates are expressed entirely as `Rule[]` using the frozen `Rule.field`/`Rule.op`/`value` grammar; `evaluateProgram` already interprets all of them. No engine change is needed.
- **New emirate / region** → reuse the `location` enum (or extend it once, in one place) and add `in`-rules. Extending to other emirates is data-driven (no engine change).
- **Remedies drive the no-dead-end guarantee.** To make a failing gate land in `almost` (and produce a "You could qualify if…" step), attach a `remedy` to that rule, optionally linking `links_program_id` to the licence/registration program that unblocks it (e.g., Tajer/Mobdea → registration). Omitting `remedy` deliberately routes the failure to `not_fit`.
- **Determinism (NFR-7).** `evaluateProgram` is pure and side-effect-free: same `(profile, program)` always yields the same result. Seeded personas therefore produce deterministic output and are unit-testable in Vitest.
- **Don't rename the contract.** Enum values and field names here are referenced verbatim by the dataset and scoring workstreams. Additive changes (new optional fields, new enum members) are fine; renames break all three streams.
