/**
 * Hissati — wizard flow logic (FR-A0 adaptive ordering + progressive disclosure).
 *
 * Pure helpers over the KB: the ordered steps to ask (inserting the conditional
 * relocation question only when it's the deciding gate), and a live "N programs
 * still match" count that shrinks as the founder answers.
 */
import { PROGRAMS } from "@/lib/programs";
import { passesRule } from "@/lib/engine";
import { GATING_QUESTIONS, type QuestionId } from "@/lib/questions";
import type { Profile, Program, RuleField } from "@/lib/schema";

const FIELD_OF: Record<RuleField, keyof Profile> = {
  nationality_ownership: "nationality_ownership",
  location: "location",
  stage: "stage",
  registration: "registration",
  sector: "sector",
  relocation_willing: "relocation_willing",
  business_age: "business_age_years",
  employee_count: "employee_count",
  gender: "gender",
  farm_tenure: "farm_tenure",
  social_impact: "social_impact",
};

function answered(answers: Partial<Profile>, field: RuleField): boolean {
  return answers[FIELD_OF[field]] !== undefined;
}

/**
 * Ask the relocation question only when it is the DECIDING gate (data-model §4):
 * some relocation-gated program already passes all its other answered rules, so
 * the founder's relocation answer actually changes that program's verdict.
 */
export function shouldAskRelocation(answers: Partial<Profile>): boolean {
  return PROGRAMS.some((p) => {
    const hasReloc = p.eligibility.some((r) => r.field === "relocation_willing");
    if (!hasReloc) return false;
    const others = p.eligibility.filter((r) => r.field !== "relocation_willing");
    // Ask only after every other published gate for that programme is answered
    // and passing; otherwise relocation is not yet the deciding question.
    return others.every((r) => answered(answers, r.field) && passesRule(answers as Profile, r));
  });
}

const ABU_DHABI = new Set(["al_quaa_al_ain", "abu_dhabi_other"]);
const EMIRATI = new Set(["emirati_majority", "emirati_minority"]);
const AGRICULTURAL = new Set(["camel", "dates", "food_processing"]);

export function shouldAskGender(answers: Partial<Profile>): boolean {
  return (
    answers.location !== undefined &&
    ABU_DHABI.has(answers.location) &&
    answers.nationality_ownership !== undefined &&
    EMIRATI.has(answers.nationality_ownership)
  );
}

export function shouldAskFarmTenure(answers: Partial<Profile>): boolean {
  return (
    shouldAskGender(answers) &&
    answers.sector !== undefined &&
    AGRICULTURAL.has(answers.sector)
  );
}

export function shouldAskSocialImpact(answers: Partial<Profile>): boolean {
  return answers.location !== undefined && ABU_DHABI.has(answers.location);
}

/** The ordered list of question ids to present, given current answers. */
export function wizardSteps(answers: Partial<Profile>): QuestionId[] {
  const core = GATING_QUESTIONS.filter((q) => !q.conditional).map((q) => q.id);
  const conditional: QuestionId[] = [];
  if (shouldAskGender(answers)) conditional.push("gender");
  if (shouldAskFarmTenure(answers)) conditional.push("farm_tenure");
  if (shouldAskSocialImpact(answers)) conditional.push("social_impact");
  if (shouldAskRelocation(answers)) conditional.push("relocation_willing");
  return [...core, ...conditional];
}

/** Whether a single program is still in the running (drives the live chip state). */
export function isStillMatching(answers: Partial<Profile>, p: Program): boolean {
  return !p.eligibility.some(
    (r) => answered(answers, r.field) && !passesRule(answers as Profile, r) && r.remedy === undefined
  );
}
