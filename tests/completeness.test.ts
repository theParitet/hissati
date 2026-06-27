import { describe, it, expect } from "vitest";
import { PROGRAMS } from "@/lib/programs";
import { RULE_FIELD_COVERAGE, GATING_QUESTIONS } from "@/lib/questions";
import type { RuleField } from "@/lib/schema";

/**
 * The questionnaire must be COMPLETE against the program eligibility schema
 * (FR-A5, data-model.md §4): every rule field a program gates on is asked about,
 * and every gating question actually gates ≥1 program. These guards fail the
 * build if the dataset and the questionnaire ever drift apart.
 */
describe("question ↔ rule completeness (FR-A5)", () => {
  const usedFields = new Set<RuleField>();
  for (const p of PROGRAMS) for (const r of p.eligibility) usedFields.add(r.field);

  it("NO ORPHAN RULES: every Rule.field used in the KB is covered by a question", () => {
    for (const field of usedFields) {
      expect(
        RULE_FIELD_COVERAGE[field],
        `rule field "${field}" is used by a program but no question covers it`
      ).toBeDefined();
    }
  });

  it("NO ORPHAN QUESTIONS: every gating question gates ≥1 program (filters exempt)", () => {
    for (const q of GATING_QUESTIONS) {
      if (q.filter) continue; // Q6 funding shapes ranking/instrument fit, not a hard Rule
      const gatesSomething = q.coversRuleFields.some((f) => usedFields.has(f));
      expect(gatesSomething, `question "${q.id}" gates no program (vanity question)`).toBe(true);
    }
  });

  it("every narrow rule field is represented by an adaptive conditional question", () => {
    for (const field of ["gender", "farm_tenure", "social_impact", "relocation_willing"] as const) {
      const question = GATING_QUESTIONS.find((q) => q.id === field);
      expect(question, `missing conditional question for ${field}`).toBeDefined();
      expect(question?.conditional).toBe(true);
      expect(usedFields.has(field)).toBe(true);
    }
  });
});
