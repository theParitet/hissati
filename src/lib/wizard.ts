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
    // every *answered* non-relocation rule must pass; none may already be decided against.
    return others.every((r) => !answered(answers, r.field) || passesRule(answers as Profile, r));
  });
}

/** The ordered list of question ids to present, given current answers. */
export function wizardSteps(answers: Partial<Profile>): QuestionId[] {
  const core = GATING_QUESTIONS.filter((q) => !q.conditional).map((q) => q.id);
  return shouldAskRelocation(answers) ? [...core, "relocation_willing"] : core;
}

/**
 * Programs still in the running given partial answers: a program is eliminated
 * only when an ALREADY-ANSWERED rule fails with NO remedy (a hard "out"). Rules
 * on not-yet-answered fields, and remediable near-misses, keep it in.
 */
export function stillMatching(answers: Partial<Profile>): Program[] {
  return PROGRAMS.filter((p) => {
    const hardOut = p.eligibility.some(
      (r) => answered(answers, r.field) && !passesRule(answers as Profile, r) && r.remedy === undefined
    );
    return !hardOut;
  });
}

/** Whether a single program is still in the running (drives the live chip state). */
export function isStillMatching(answers: Partial<Profile>, p: Program): boolean {
  return !p.eligibility.some(
    (r) => answered(answers, r.field) && !passesRule(answers as Profile, r) && r.remedy === undefined
  );
}

export function countStillMatching(answers: Partial<Profile>): number {
  return stillMatching(answers).length;
}
