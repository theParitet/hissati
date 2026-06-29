/**
 * Hissati — the bridge between an eligibility rule and the atomic roadmap step
 * that clears it. A completed step is just a key in a set; a rule is "cleared" if
 * the base profile already passes it OR its step key is marked done. One shared
 * derivation keeps the engine (which clears gates) and the roadmap (which offers
 * steps) in lock-step, so every step toggles exactly the gates it names.
 */
import type { Rule } from "@/lib/schema";

/** The atomic step key a remediable rule maps to, or null if the rule isn't a rung. */
export function ruleStepKey(rule: Rule): string | null {
  if (
    (rule.field === "stage" || rule.field === "registration") &&
    rule.op === "gte" &&
    typeof rule.value === "string"
  ) {
    return `${rule.field}:${rule.value}`;
  }
  if (rule.field === "relocation_willing" && rule.op === "is_true") {
    return "relocation_willing:true";
  }
  return null;
}
