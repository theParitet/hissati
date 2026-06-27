import { describe, it, expect } from "vitest";
import { getProgramById } from "@/lib/programs";
import { evaluateProgramFull } from "@/lib/engine";
import { buildComparison } from "@/lib/compare";
import { dateFounderIdea } from "./fixtures";

describe("compare", () => {
  const ids = ["khalifa-fund-sme", "maan-social-grants"];
  const evs = ids.map((id) => evaluateProgramFull(dateFounderIdea, getProgramById(id)!));
  const rows = buildComparison(dateFounderIdea, evs);

  it("produces one row per program", () => {
    expect(rows).toHaveLength(ids.length);
    expect(rows.map((r) => r.id)).toEqual(ids);
  });

  it("requirements met never exceeds total, and match is 0..100", () => {
    for (const r of rows) {
      expect(r.reqMet).toBeGreaterThanOrEqual(0);
      expect(r.reqMet).toBeLessThanOrEqual(r.reqTotal);
      expect(r.reqTotal).toBeGreaterThan(0);
      expect(r.matchPct).toBeGreaterThanOrEqual(0);
      expect(r.matchPct).toBeLessThanOrEqual(100);
    }
  });

  it("status mirrors the engine (compare is not a second source of truth)", () => {
    expect(rows.map((r) => r.status)).toEqual(evs.map((e) => e.status));
  });

  it("a not-yet-eligible program lists its blocking rule(s)", () => {
    const blocked = rows.filter((r) => r.status !== "eligible");
    expect(blocked.length).toBeGreaterThan(0);
    for (const r of blocked) expect(r.blocking.length).toBeGreaterThan(0);
  });
});
