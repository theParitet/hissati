# Scoring — Hissati (حصتي)

> Defines the deterministic scoring/estimation formulas for the Hissati funding readiness navigator:
> **(1) Match Score** (FR-C2) — ranks eligible + almost-eligible programs, 0–100.
> **(2) `estimateTimeToEligibility`** (FR-D4) — a falsifiable time-to-eligible estimate from free-text remedy durations (§3).
>
> Both are **pure, deterministic, and tunable** from the named-constants block at the top of each section — weights can be retuned without touching logic. They reference only the [SHARED CONTRACT](#shared-contract) fields, so the schema, dataset and scoring workstreams stay in sync.

---

## 0. Shared contract (reference) <a id="shared-contract"></a>

> **`data-model.md` is the single source of truth for all types and enums.** This section only *re-states* the subset the formulas read; it must never diverge from `data-model.md`. If the two disagree, `data-model.md` wins.

These are the exact fields/values the formulas consume. They are owned by the schema + dataset agents.

```ts
// Eligibility verdict for one program against one profile (see data-model.md §3).
type EligibilityStatus = "eligible" | "almost" | "not_fit";
//  eligible  = passes every rule.
//  almost    = fails ONLY remediable rules, and 1–2 of them.
//  not_fit   = fails a non-remediable rule, OR fails > 2 remediable rules.

type Tier = 1 | 2 | 3;
//  1 = local non-dilutive / rural hero (Khalifa Fund, Ma'an, ADDED, Tajer, Mobdea, DCT)
//  2 = UAE accelerator / competition (Hub71, Sheraa, Khalifa Award)
//  3 = regional VC / global (Shorooq, BECO …)

type AmountBand =
  | "lt_50k"        // < 50,000 AED
  | "aed_50_200k"   // 50,000 – 200,000
  | "aed_200_500k"  // 200,000 – 500,000
  | "aed_500k_2m"   // 500,000 – 2,000,000
  | "aed_2m_plus";  // 2,000,000 +

// Frozen profile enums (data-model.md §1). Do NOT redefine divergently here.
type Stage = "idea" | "mvp" | "early_traction" | "established";
type Registration = "none" | "lt_1yr" | "reg_1_2yr" | "reg_2yr_plus";
type Sector =
  | "camel" | "dates" | "astro_tourism" | "handicrafts"
  | "food_processing" | "retail_services" | "tech" | "other";

interface Rule {
  field: string;
  passed: boolean;          // evaluated by the deterministic matcher (FR-C1)
  remediable: boolean;      // does this rule carry a `remedy`?
  remedy?: {
    est_time?: string;      // FREE-TEXT duration string, e.g. "1–3 days", "3–6 months",
                            // "6–12 months", "Before cohort start" — NOT an enum. See §3.
    // ...action, est_cost_aed, links_program_id — not needed for scoring
  };
}

interface Program {
  id: string;
  tier: Tier;
  sector_tags: Sector[];                    // e.g. ["dates","food_processing"]
  amount: { min_aed: number | null; max_aed: number | null }; // either bound may be null
  eligibility: Rule[];
}

interface Profile {
  sector: Sector;                           // single primary sector tag
  amount_band: AmountBand;
  stage: Stage;
  registration: Registration;
  // …nationality, location, readiness extras — not read by these two formulas
}

// One program after the matcher has run.
interface EvaluatedProgram {
  program: Program;
  status: EligibilityStatus;
  rules: Rule[];          // same rules with `.passed` filled in for THIS profile
}
```

> **A failed remediable rule = one step on the roadmap.** The Match Score is driven by how many such steps remain, so marking a step done (flipping `rule.passed` to `true` and possibly upgrading `status`) mechanically moves it. That is the FR-D3 "score climbs as you complete steps" behaviour, with no special-casing.

---

## 1. Match Score — ranking matched programs (FR-C2)

A 0–100 composite shown as a match percentage on each result card. It ranks **eligible** and **almost** programs; `not_fit` programs are not scored (they don't appear in the ranked grid, only in the "why not" explainer).

### 1.1 Tunable constants

```ts
const MATCH = {
  // Weights of the four sub-scores. MUST sum to 1.0.
  W_TIER:          0.30,   // priority tier (Tier 1 > 2 > 3) — the rural-hero thesis
  W_SECTOR:        0.25,   // sector fit (exact / adjacent / none)
  W_FUNDING:       0.20,   // funding-range fit (program range vs profile amount band)
  W_REQUIREMENTS:  0.25,   // fraction of eligibility rules already passed

  // Tier sub-score lookup (0..1). Tier 1 is the hero tier and scores highest.
  TIER_SCORE: { 1: 1.0, 2: 0.6, 3: 0.3 } as Record<Tier, number>,

  // Sector fit sub-score (0..1).
  SECTOR_EXACT:    1.0,    // a program tag === profile.sector
  SECTOR_ADJACENT: 0.6,    // a program tag in the same adjacency cluster
  SECTOR_GENERIC:  0.5,    // program is sector-agnostic (no sector_tags / "any")
  SECTOR_NONE:     0.15,   // no overlap (program still eligible on other grounds)

  // "almost eligible" multiplier: penalize near-misses so a fully-eligible
  // program of equal merit always outranks an almost one, but keep them visible.
  ALMOST_PENALTY:  0.75,
} as const;

// Sector adjacency clusters — programs whose tags share a cluster count as "adjacent".
// Uses ONLY the frozen `Sector` enum values (data-model.md §1). Tunable.
const SECTOR_CLUSTERS: Sector[][] = [
  ["camel", "food_processing"],                         // camel products ↔ processing
  ["dates", "food_processing", "handicrafts"],          // dates ↔ processing ↔ crafts
  ["astro_tourism", "retail_services"],                 // desert tourism ↔ retail/services
  ["tech", "retail_services"],                          // tech ↔ retail/services (e-commerce, platforms)
];
```

**Why these weights.** Tier (30%) carries the product's rural-first thesis: a Tier-1 local non-dilutive program should top the grid for the Al Qua'a founder even when a glossy Tier-3 VC is a tag match. Sector fit (25%) and requirements-met (25%) are tied — relevance and closeness-to-qualified matter equally for "what should I actually go do." Funding-range fit (20%) is the lightest because the amount band is a soft preference, not a gate (a program offering more than asked is still good news). The four weights sum to 1.0, so the weighted average is already in `[0,1]` before scaling to 100.

### 1.2 Sub-score definitions

**a) Tier sub-score** — direct lookup: `TIER_SCORE[program.tier]`.

**b) Sector fit sub-score** — best match across the program's tags vs the profile's single sector:
- exact tag equals profile sector → `SECTOR_EXACT` (1.0)
- program is sector-agnostic (empty `sector_tags` or contains `"any"`) → `SECTOR_GENERIC` (0.5)
- any program tag shares an adjacency cluster with the profile sector → `SECTOR_ADJACENT` (0.6)
- otherwise → `SECTOR_NONE` (0.15)

> Note: most programs in the KB carry `"other"` as a catch-all tag, so an exact tag match on the founder's primary sector is common; the adjacency branch fires when the founder's sector is absent from a program's tags but a *related* sector is present (e.g. a `camel` founder vs a program tagged `food_processing` but not `camel`).

**c) Funding-range fit sub-score** — overlap of the program's `[min_aed, max_aed]` with the AED interval implied by the profile's `amount_band`. Computed as Jaccard-style overlap (intersection ÷ union of the two intervals), which is 1.0 when the program range fully covers the band and decays smoothly to 0 with no overlap. A tiny floor (0.1) is kept on *any* positive overlap so a partially-fitting program isn't punished as hard as a total mismatch. `null` bounds (an unstated min/max in the KB) are treated as open: `null` min → 0, `null` max → the band-cap proxy, so an amount-unspecified program is scored as broadly compatible rather than excluded.

**d) Requirements-met sub-score** — fraction of the program's eligibility rules already passed for this profile: `passedRules / totalRules`. For an `eligible` program this is 1.0 by definition; for an `almost` program it is `(total − missing) / total`. This is the lever FR-D3 moves: completing a step flips a rule to passed and raises this sub-score (and may upgrade the status).

The four sub-scores are combined as a weighted average, multiplied by `ALMOST_PENALTY` when `status === "almost"`, then scaled to 0–100 and rounded.

### 1.3 Reference implementation

```ts
// AED interval implied by each amount band (upper bound capped for the open-ended top band).
const BAND_RANGE: Record<AmountBand, [number, number]> = {
  lt_50k:       [0,         50_000],
  aed_50_200k:  [50_000,    200_000],
  aed_200_500k: [200_000,   500_000],
  aed_500k_2m:  [500_000,   2_000_000],
  aed_2m_plus:  [2_000_000, 10_000_000], // cap is a tunable proxy for "open-ended"
};

function sectorFit(profileSector: Sector, tags: Sector[]): number {
  if (tags.length === 0 || (tags as string[]).includes("any")) return MATCH.SECTOR_GENERIC;
  if (tags.includes(profileSector)) return MATCH.SECTOR_EXACT;
  const cluster = SECTOR_CLUSTERS.find((c) => c.includes(profileSector));
  if (cluster && tags.some((t) => cluster.includes(t))) return MATCH.SECTOR_ADJACENT;
  return MATCH.SECTOR_NONE;
}

function fundingFit(band: AmountBand, amount: { min_aed: number | null; max_aed: number | null }): number {
  const [bLo, bHi] = BAND_RANGE[band];
  const pLo = amount.min_aed ?? 0;          // null min => open at the bottom
  const pHi = amount.max_aed ?? bHi;        // null max => open at the top (use band cap)
  const lo = Math.max(bLo, pLo);
  const hi = Math.min(bHi, pHi);
  const intersection = Math.max(0, hi - lo);
  if (intersection === 0) return 0;
  const union = Math.max(bHi, pHi) - Math.min(bLo, pLo);
  const overlap = union > 0 ? intersection / union : 1;
  return Math.max(0.1, overlap); // floor: any overlap is worth something
}

function requirementsMet(rules: Rule[]): number {
  if (rules.length === 0) return 1; // no rules = nothing blocking
  const passed = rules.filter((r) => r.passed).length;
  return passed / rules.length;
}

/** 0–100 match score for an eligible or almost-eligible program. */
function matchScore(
  profile: Profile,
  program: Program,
  status: EligibilityStatus,
  rules: Rule[], // evaluated rules for THIS profile (EvaluatedProgram.rules)
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
```

### 1.4 Worked examples

**Example A — `khalifa-fund-sme` for the operating date-products founder (fully eligible).**
Profile: `sector: "dates"`, `amount_band: "aed_200_500k"`, `stage: "established"`, `registration: "reg_2yr_plus"`, Emirati-majority, located in `al_quaa_al_ain`.
Program `khalifa-fund-sme`: Tier 1, `sector_tags: ["camel","dates","food_processing","astro_tourism","retail_services","other"]`, `amount: {min_aed: null, max_aed: 2000000}`. Its four rules (nationality `in [emirati_majority]`, location `in [al_quaa_al_ain, abu_dhabi_other]`, registration `gte lt_1yr`, stage `gte mvp`) all pass → `status: "eligible"`.

- tier = `TIER_SCORE[1]` = **1.0**
- sector = exact (`"dates"` in tags) = **1.0**
- funding: band `[200k,500k]` ∩ program `[0,2M]` = `[200k,500k]` → intersection 300k; union = `max(500k,2M) − min(200k,0) = 2M` → overlap = `300k / 2M = 0.15` → **0.15**
- reqs = 4/4 passed = **1.0**

composite = `0.30·1.0 + 0.25·1.0 + 0.20·0.15 + 0.25·1.0` = `0.30 + 0.25 + 0.03 + 0.25` = **0.83**
No almost-penalty. **Match score = 83.** → Tops the grid for the established date founder.

**Example B — `hub71-access` for an MVP tech founder (almost eligible: needs relocation).**
Profile: `sector: "tech"`, `amount_band: "aed_200_500k"`, `stage: "mvp"`, `relocation_willing` unanswered.
Program `hub71-access`: Tier 2, `sector_tags: ["tech","other"]`, `amount: {min_aed: null, max_aed: 750000}`. Three rules: stage `gte mvp` (pass), sector `in [tech, other]` (pass), `relocation_willing is_true` (fails — unanswered boolean; remediable, `est_time: "Before cohort start"`) → `status: "almost"`, 2 of 3 rules passed.

- tier = `TIER_SCORE[2]` = **0.6**
- sector = exact (`"tech"`) = **1.0**
- funding: band `[200k,500k]`; program min `null`→0, max `750k` → program `[0,750k]`; ∩ = `[200k,500k]` → intersection 300k; union = `max(500k,750k) − min(200k,0) = 750k` → overlap **0.4**
- reqs = 2/3 passed ≈ **0.6667**

composite = `0.30·0.6 + 0.25·1.0 + 0.20·0.4 + 0.25·0.6667` = `0.18 + 0.25 + 0.08 + 0.16667` = **0.67667**
almost-penalty ×0.75 → `0.5075`. **Match score = 51.** → Shown, clearly below fully-eligible peers but still a visible "you could qualify if you relocate" card (FR-C3).

> Sanity check: had Hub71 been fully eligible (reqs = 1.0, no penalty), composite = `0.18 + 0.25 + 0.08 + 0.25 = 0.76` → **76**. The relocation gap costs ~25 points, the intended "penalized but still shown" behaviour.

---

## 3. `estimateTimeToEligibility` — time-to-eligible from free-text durations (FR-D4)

Produces a falsifiable, human-readable estimate ("≈8 months to qualify for Khalifa Fund at this path") by **summing the duration of the remedies for every failed remediable rule** on a program, then mapping the total to a friendly band.

Per the frozen contract (`data-model.md` §2: `remedy.est_time` is `z.string().optional()`), `est_time` is a **free-text string**, not an enum. Real values in the KB include `"1–3 days"`, `"3–6 months"`, `"6–12 months"`, `"3–9 months"`, and non-numeric strings like `"Before cohort start"`. So this function **parses** each string: it extracts the **upper-bound** number and a unit (days / weeks / months), converts to a month estimate, sums across blocking remedies, and buckets the total. Non-numeric or unparseable strings (e.g. "Before cohort start") contribute a small fixed nudge rather than crashing. It is deterministic — no clock, no locale dependence beyond the digit/word parse.

```ts
const EST = {
  // Conversion of a parsed (number, unit) pair to months.
  DAYS_PER_MONTH:  30,
  WEEKS_PER_MONTH: 4.345,
  // Fixed month nudge for a remedy whose est_time has no parseable number
  // (e.g. "Before cohort start", "rolling"): real work, but not a calendar span.
  NON_NUMERIC_MONTHS: 1,
  // Banding of the summed months into a display label.
  BANDS: [
    { maxMonths: 0.5,      label: "now"          },  // instant / a few days
    { maxMonths: 1.5,      label: "≈1 month"     },
    { maxMonths: 4,        label: "≈2–4 months"  },
    { maxMonths: 8,        label: "≈6–8 months"  },
    { maxMonths: Infinity, label: "≈9+ months"   },
  ],
} as const;

/**
 * Parse a free-text duration string to an upper-bound month estimate.
 * Handles "1–3 days", "3-6 months", "~2 weeks", "6–12 months", "Before cohort start".
 * Strategy: take the LARGEST number found (the upper bound of any range), pick a unit
 * by keyword, convert to months. No parseable number => NON_NUMERIC_MONTHS.
 */
function estTimeToMonths(estTime: string | undefined): number {
  if (!estTime) return 0;
  const s = estTime.toLowerCase();

  // Collect all numbers (handles ranges like "1–3" / "6-12" with en-dash or hyphen).
  const nums = (s.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  if (nums.length === 0) return EST.NON_NUMERIC_MONTHS; // e.g. "before cohort start"
  const upper = Math.max(...nums); // upper bound of the range

  if (/\bday/.test(s))   return upper / EST.DAYS_PER_MONTH;
  if (/\bweek/.test(s))  return upper / EST.WEEKS_PER_MONTH;
  if (/\bmonth/.test(s)) return upper;
  if (/\byear/.test(s))  return upper * 12;
  return upper; // bare number => assume months (conservative)
}

/** Qualitative ETA string for becoming eligible for one program at the current path. */
function estimateTimeToEligibility(
  profile: Profile,
  program: Program,
  rules: Rule[], // evaluated rules for this profile
): string {
  const blocking = rules.filter((r) => !r.passed);
  if (blocking.length === 0) return "now";                              // already eligible
  if (blocking.some((r) => !r.remediable)) return "not on this path";  // hard gate (FR-D4)
  const months = blocking.reduce(
    (acc, r) => acc + estTimeToMonths(r.remedy?.est_time),
    0,
  );
  return EST.BANDS.find((b) => months <= b.maxMonths)!.label;
}
```

**Worked — `khalifa-fund-sme` for the idea-stage founder.** Two blocking remediable rules:
- `registration gte lt_1yr`, remedy `est_time: "1–3 days"` → upper bound 3 days → `3 / 30 ≈ 0.1` month
- `stage gte mvp`, remedy `est_time: "3–6 months"` → upper bound 6 → `6` months

Sum = `6.1` months → falls in the `≤ 8` band → **"≈6–8 months"** → renders as "≈6–8 months to qualify for Khalifa Fund at this path."

**Worked — `hub71-access` relocation gate.** If the founder leaves `relocation_willing` unset, the `is_true` rule fails but is remediable with `est_time: "Before cohort start"` (no parseable number → `NON_NUMERIC_MONTHS = 1`). If that were the only blocker, sum = 1 month → **"≈1 month"**. A genuinely non-remediable gate (a rule with no `remedy`, e.g. `dct-tourism-licence`'s sector rule for a `dates` founder) short-circuits to **"not on this path"**, which the UI pairs with a different, non-dead-end suggestion.

---

## 4. Notes & invariants

- **Deterministic.** No randomness, no clock, no network. Same inputs → same outputs every run. Backs NFR-7 (deterministic outputs) and the Vitest tests (TR-3). The `est_time` parser in §3 is pure string→number.
- **Bounded.** Every returned score is clamped to `[0,100]` and rounded to an integer. Sub-scores and components are each in `[0,1]`; weight blocks sum to 1.0, so composites never exceed 1.0 before the ×100 scale.
- **Monotonic.** Completing a roadmap step flips a rule from failed→passed, which can only raise `requirementsMet`, so the Match Score rises as steps complete (FR-D3).
- **Contract-pure & single-sourced.** The formulas read only the shared-contract fields owned by `data-model.md` (`tier`, `sector_tags`, `amount`, `eligibility[].passed/remediable/remedy.est_time`, `status`, and profile `sector`/`amount_band`/`stage`/`registration`). All enum vocabularies are defined once in `data-model.md`; this doc never redefines them divergently.
- **Tunable without touching logic.** All weights, tier tables, sector clusters, band ranges and time bands live in the `MATCH`, `SECTOR_CLUSTERS`, `BAND_RANGE` and `EST` constant blocks. Retuning = editing constants only.
