/**
 * Hissati — deterministic eligibility engine (FR-C1, FR-C4).
 *
 * Pure, side-effect-free TypeScript over the program KB. Same (profile, program)
 * always yields the same result (NFR-7) — runs entirely in the browser, no network.
 * The `passesRule` / `evaluateProgram` / `evaluateAll` bodies are transcribed from
 * the authoritative `docs/data-model.md` §3. `annotateRules` /
 * `evaluateProgramFull` / `evaluateAllFull` are additive helpers (contract §5) that
 * attach `.passed`/`.remediable` per rule for the scoring formulas and the UI.
 */
import type {
  Profile,
  Program,
  Rule,
  EligibilityResult,
  EvaluatedRule,
  EvaluatedProgram,
} from "@/lib/schema";
import { ruleStepKey } from "@/lib/steps";

/** No completed steps — the default for plain (profile-only) evaluation. */
const NO_DONE: ReadonlySet<string> = new Set();

/**
 * A rule is CLEARED for this profile if the answers already satisfy it OR the
 * founder has marked the atomic step that clears it. This is the whole of the
 * roadmap "climb": each step independently clears the gate(s) it names — no
 * profile folding, no implication between rungs (so undo always re-opens it).
 */
function ruleCleared(profile: Profile, rule: Rule, doneKeys: ReadonlySet<string>): boolean {
  if (passesRule(profile, rule)) return true;
  const key = ruleStepKey(rule);
  return key !== null && doneKeys.has(key);
}

/** Ordered enums for gte/lte ordinal comparison. */
const STAGE_ORDER: readonly string[] = ["idea", "mvp", "early_traction", "established"];
const REGISTRATION_ORDER: readonly string[] = ["none", "lt_1yr", "reg_1_2yr", "reg_2yr_plus"];

function ordinal(order: readonly string[], v: string): number {
  return order.indexOf(v);
}

/** Resolve the profile value a rule targets. Returns undefined if unanswered. */
function profileValueFor(
  profile: Profile,
  field: Rule["field"]
): string | number | boolean | undefined {
  switch (field) {
    case "nationality_ownership":
      return profile.nationality_ownership;
    case "location":
      return profile.location;
    case "stage":
      return profile.stage;
    case "registration":
      return profile.registration;
    case "sector":
      return profile.sector;
    case "relocation_willing":
      return profile.relocation_willing; // may be undefined
    case "business_age":
      return profile.business_age_years; // may be undefined
    case "employee_count":
      return profile.employee_count; // may be undefined
    case "gender":
      return profile.gender;
    case "farm_tenure":
      return profile.farm_tenure;
    case "social_impact":
      return profile.social_impact;
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

/**
 * The eligible / almost / not_fit classification from a program's failed rules
 * (data-model.md §3). Single source of truth — shared by the profile-only and the
 * done-aware (Full) evaluators so they can never drift apart.
 */
function classify(failedRules: Rule[]): EligibilityResult["status"] {
  if (failedRules.length === 0) return "eligible";
  if (failedRules.length <= 2 && failedRules.every((r) => r.remedy !== undefined)) return "almost";
  return "not_fit";
}

/** Classify a single program for a profile (FR-C1). */
export function evaluateProgram(profile: Profile, program: Program): EligibilityResult {
  const failedRules: Rule[] = program.eligibility.filter((rule) => !passesRule(profile, rule));
  return { status: classify(failedRules), failedRules };
}

/** Convenience: classify the whole KB (data-model.md §3). */
export function evaluateAll(
  profile: Profile,
  programs: Program[]
): Array<{ program: Program } & EligibilityResult> {
  return programs.map((program) => ({ program, ...evaluateProgram(profile, program) }));
}

/* --------------------------------------------------------------------------
 * Additive helpers (contract §5): annotate each rule with this profile's verdict.
 * Consumed by the scoring formulas (requirements-met, roadmap proximity) and the
 * results UI (which rules passed / which to surface as steps).
 * ------------------------------------------------------------------------ */

/**
 * Every eligibility rule of `program`, tagged with passed + remediable. `passed`
 * folds in completed atomic steps (`doneKeys`): a gate the founder has marked done
 * reads as passed. Omitting `doneKeys` gives plain profile-only evaluation.
 */
export function annotateRules(
  profile: Profile,
  program: Program,
  doneKeys: ReadonlySet<string> = NO_DONE,
): EvaluatedRule[] {
  return program.eligibility.map((rule) => ({
    ...rule,
    passed: ruleCleared(profile, rule, doneKeys),
    remediable: rule.remedy !== undefined,
  }));
}

/**
 * Full evaluation: classification + every rule annotated, with completed steps
 * (`doneKeys`) clearing their gates. Status is recomputed from the cleared rules,
 * so marking/undoing a step flips a program eligible↔almost deterministically.
 */
export function evaluateProgramFull(
  profile: Profile,
  program: Program,
  doneKeys: ReadonlySet<string> = NO_DONE,
): EvaluatedProgram {
  const rules = annotateRules(profile, program, doneKeys);
  const failedRules = program.eligibility.filter((rule) => !ruleCleared(profile, rule, doneKeys));
  return { program, status: classify(failedRules), failedRules, rules };
}

/** Full evaluation across the whole KB, folding in completed atomic steps. */
export function evaluateAllFull(
  profile: Profile,
  programs: Program[],
  doneKeys: ReadonlySet<string> = NO_DONE,
): EvaluatedProgram[] {
  return programs.map((program) => evaluateProgramFull(profile, program, doneKeys));
}
