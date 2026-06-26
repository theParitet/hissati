import { describe, it, expect } from "vitest";
import { PROGRAMS, getProgramById } from "@/lib/programs";
import { ProgramSchema } from "@/lib/schema";

describe("programs knowledge base (FR-B)", () => {
  it("loads and validates ≥6 programs against ProgramSchema (FR-B1/FR-B4/C6 threshold)", () => {
    expect(PROGRAMS.length).toBeGreaterThanOrEqual(6);
    for (const p of PROGRAMS) {
      expect(() => ProgramSchema.parse(p)).not.toThrow();
    }
  });

  it("spans all three priority tiers (rural-hero + stretch tiers)", () => {
    const tiers = new Set(PROGRAMS.map((p) => p.tier));
    expect(tiers.has(1)).toBe(true);
    expect(tiers.has(2)).toBe(true);
    expect(tiers.has(3)).toBe(true);
  });

  it("has unique program ids", () => {
    const ids = PROGRAMS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every program is cited: source url + ISO verified_date (FR-B2/ER-4)", () => {
    for (const p of PROGRAMS) {
      expect(p.source.url).toMatch(/^https?:\/\//);
      expect(p.source.verified_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("remedy links_program_id never dangles (every link resolves to a real program)", () => {
    const ids = new Set(PROGRAMS.map((p) => p.id));
    for (const p of PROGRAMS) {
      for (const rule of p.eligibility) {
        if (rule.remedy?.links_program_id) {
          expect(ids.has(rule.remedy.links_program_id)).toBe(true);
        }
      }
    }
  });

  it("getProgramById resolves known and unknown ids", () => {
    expect(getProgramById("khalifa-fund-sme")?.tier).toBe(1);
    expect(getProgramById("does-not-exist")).toBeUndefined();
  });
});
