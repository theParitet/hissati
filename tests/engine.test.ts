import { describe, it, expect } from "vitest";
import {
  passesRule,
  evaluateProgram,
  evaluateProgramFull,
  evaluateAll,
} from "@/lib/engine";
import { PROGRAMS, getProgramById } from "@/lib/programs";
import type { Rule } from "@/lib/schema";
import { dateFounderIdea } from "./fixtures";

const msg = { en: "", ar: "" };

describe("passesRule — per-rule semantics (data-model.md §3)", () => {
  it("`in` passes when the field value is in the list, fails otherwise", () => {
    expect(
      passesRule(dateFounderIdea, { field: "sector", op: "in", value: ["dates", "handicrafts"], blocking_message: msg })
    ).toBe(true);
    expect(
      passesRule(dateFounderIdea, { field: "sector", op: "in", value: ["tech"], blocking_message: msg })
    ).toBe(false);
  });

  it("`gte` on stage compares ORDINAL position (idea < mvp < established)", () => {
    const rule: Rule = { field: "stage", op: "gte", value: "mvp", blocking_message: msg };
    expect(passesRule(dateFounderIdea, rule)).toBe(false); // idea(0) >= mvp(1) → false
    expect(passesRule({ ...dateFounderIdea, stage: "established" }, rule)).toBe(true);
  });

  it("`lte` on registration compares ordinal position", () => {
    const rule: Rule = { field: "registration", op: "lte", value: "lt_1yr", blocking_message: msg };
    expect(passesRule(dateFounderIdea, rule)).toBe(true); // none(0) <= lt_1yr(1) → true
    expect(passesRule({ ...dateFounderIdea, registration: "reg_2yr_plus" }, rule)).toBe(false);
  });

  it("`is_true` FAILS when relocation_willing is unanswered (required boolean)", () => {
    const rule: Rule = { field: "relocation_willing", op: "is_true", value: true, blocking_message: msg };
    expect(passesRule(dateFounderIdea, rule)).toBe(false);
    expect(passesRule({ ...dateFounderIdea, relocation_willing: true }, rule)).toBe(true);
  });

  it("numeric `gte` on business_age fails when unanswered, passes when met", () => {
    const rule: Rule = { field: "business_age", op: "gte", value: 2, blocking_message: msg };
    expect(passesRule(dateFounderIdea, rule)).toBe(false);
    expect(passesRule({ ...dateFounderIdea, business_age_years: 3 }, rule)).toBe(true);
  });
});

describe("evaluateProgram — 3-bucket classification (FR-C1) for the idea-stage Al Qua'a founder", () => {
  it("ELIGIBLE: a fully-passing licence rung (Tajer Abu Dhabi)", () => {
    expect(evaluateProgram(dateFounderIdea, getProgramById("tajer-abu-dhabi")!).status).toBe("eligible");
  });

  it("ALMOST (1 step): Ma'an funding request — only registration missing, and it's remediable", () => {
    const r = evaluateProgram(dateFounderIdea, getProgramById("maan-social-grants")!);
    expect(r.status).toBe("almost");
    expect(r.failedRules.map((x) => x.field)).toEqual(["registration"]);
  });

  it("ALMOST (2 steps): Khalifa Fund loan — registration + stage, both remediable", () => {
    const r = evaluateProgram(dateFounderIdea, getProgramById("khalifa-fund-sme")!);
    expect(r.status).toBe("almost");
    expect(new Set(r.failedRules.map((x) => x.field))).toEqual(new Set(["registration", "stage"]));
  });

  it("NOT_FIT: DCT tourism licence — `dates` sector has no remedy (hard gate)", () => {
    const r = evaluateProgram(dateFounderIdea, getProgramById("dct-tourism-licence")!);
    expect(r.status).toBe("not_fit");
  });
});

describe("no-dead-end invariant (FR-C3)", () => {
  it("every `almost` program carries 1–2 failed rules and EVERY one is remediable", () => {
    const evaluated = evaluateAll(dateFounderIdea, PROGRAMS);
    const almosts = evaluated.filter((e) => e.status === "almost");
    expect(almosts.length).toBeGreaterThan(0); // the persona genuinely has near-misses
    for (const e of almosts) {
      expect(e.failedRules.length).toBeGreaterThanOrEqual(1);
      expect(e.failedRules.length).toBeLessThanOrEqual(2);
      expect(e.failedRules.every((r) => r.remedy !== undefined)).toBe(true);
    }
  });
});

describe("evaluateProgramFull — annotated rules for scoring/UI", () => {
  it("annotates every eligibility rule with passed + remediable", () => {
    const full = evaluateProgramFull(dateFounderIdea, getProgramById("khalifa-fund-sme")!);
    expect(full.rules).toHaveLength(4);
    const byField = Object.fromEntries(full.rules.map((r) => [r.field, r]));
    expect(byField["nationality_ownership"].passed).toBe(true);
    expect(byField["location"].passed).toBe(true);
    expect(byField["registration"].passed).toBe(false);
    expect(byField["registration"].remediable).toBe(true);
    expect(byField["stage"].passed).toBe(false);
    // failedRules is the subset of rules that did not pass
    expect(full.failedRules.length).toBe(full.rules.filter((r) => !r.passed).length);
  });
});
