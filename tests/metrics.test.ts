import { describe, it, expect } from "vitest";
import { PROGRAMS } from "@/lib/programs";
import { evaluateAllFull } from "@/lib/engine";
import { progressStats } from "@/lib/metrics";
import {
  dateFounderIdea,
  dateFounderRegistered,
  dateFounderMvp,
  dateFounderEstablished,
} from "./fixtures";
import type { Profile } from "@/lib/schema";

const statsFor = (p: Profile) => progressStats(p, evaluateAllFull(p, PROGRAMS), []);

/**
 * The "climb" — replaces the readiness-score climb. The headline metric is the
 * honest, cited "AED within reach": the sum of the upper funding bound (max_aed)
 * of each ELIGIBLE funding program. Licences are fees the founder pays, not funding,
 * so they never count; open-ended grants contribute 0 and flip hasOpenEndedAmounts.
 *
 * Date-founder path: idea → register a trade licence → launch an MVP → mature.
 * The cited money beat is at MVP, where Khalifa's AED 2M loan flips eligible.
 */
describe("progressStats — the climb (replaces the readiness score)", () => {
  it("idea stage: no funding open yet → 0 eligible, AED 0", () => {
    const s = statsFor(dateFounderIdea);
    expect(s.programsEligible).toBe(0);
    expect(s.aedReachableNow).toBe(0);
  });

  it("registration unlocks eligible grants — count rises (their awards are honestly open-ended)", () => {
    const idea = statsFor(dateFounderIdea);
    const reg = statsFor(dateFounderRegistered);
    expect(reg.programsEligible).toBeGreaterThan(idea.programsEligible);
    // Ma'an / ADDED awards are not publicly fixed → no invented AED figure, but
    // Khalifa's AED 2M is one roadmap step away (counted in aedReachableAfterSteps).
    expect(reg.hasOpenEndedAmounts).toBe(true);
    expect(reg.aedReachableAfterSteps).toBeGreaterThan(0);
  });

  it("Khalifa Fund (AED 2M loan) flips eligible at MVP → AED within reach jumps to 2,000,000", () => {
    const reg = statsFor(dateFounderRegistered);
    const mvp = statsFor(dateFounderMvp);
    expect(mvp.programsEligible).toBeGreaterThan(reg.programsEligible);
    expect(mvp.aedReachableNow).toBe(2_000_000);
    expect(mvp.aedReachableNow).toBeGreaterThan(reg.aedReachableNow);
  });

  it("AED within reach & eligible count are MONOTONIC non-decreasing across the climb", () => {
    const seq = [
      dateFounderIdea,
      dateFounderRegistered,
      dateFounderMvp,
      dateFounderEstablished,
    ].map(statsFor);
    for (let i = 1; i < seq.length; i++) {
      expect(seq[i].aedReachableNow).toBeGreaterThanOrEqual(seq[i - 1].aedReachableNow);
      expect(seq[i].programsEligible).toBeGreaterThanOrEqual(seq[i - 1].programsEligible);
    }
  });

  it("never inflates: aedReachableNow ≤ aedReachableAfterSteps", () => {
    const s = statsFor(dateFounderRegistered);
    expect(s.aedReachableNow).toBeLessThanOrEqual(s.aedReachableAfterSteps);
  });

  it("licences (fees the founder pays) never count toward funding programs", () => {
    // tajer-abu-dhabi + mobdea are eligible licences even at idea stage, yet excluded.
    expect(statsFor(dateFounderIdea).programsTotal).toBe(
      PROGRAMS.filter((p) => p.instrument !== "license").length
    );
  });

  it("totals are coherent: eligible + almost ≤ funding total ≤ all programs", () => {
    const s = statsFor(dateFounderRegistered);
    expect(s.programsEligible + s.programsAlmost).toBeLessThanOrEqual(s.programsTotal);
    expect(s.programsTotal).toBeGreaterThan(0);
    expect(s.programsTotal).toBeLessThanOrEqual(PROGRAMS.length);
  });
});

/**
 * Exact, falsifiable values for the README's "testable claims" section. These are
 * the real numbers the engine computes today; if the dataset changes, update here.
 */
describe("progressStats — exact cited values (README evidence)", () => {
  it("9 funding programs total (12 minus 3 licences)", () => {
    expect(statsFor(dateFounderIdea).programsTotal).toBe(9);
  });
  it("eligible-program climb: 0 → 2 → 5 → 6", () => {
    expect(statsFor(dateFounderIdea).programsEligible).toBe(0);
    expect(statsFor(dateFounderRegistered).programsEligible).toBe(2);
    expect(statsFor(dateFounderMvp).programsEligible).toBe(5);
    expect(statsFor(dateFounderEstablished).programsEligible).toBe(6);
  });
  it("AED-within-reach climb: 0 → 0 → 2,000,000 → 2,000,000 (Khalifa AED 2M loan)", () => {
    expect(statsFor(dateFounderIdea).aedReachableNow).toBe(0);
    expect(statsFor(dateFounderRegistered).aedReachableNow).toBe(0);
    expect(statsFor(dateFounderMvp).aedReachableNow).toBe(2_000_000);
    expect(statsFor(dateFounderEstablished).aedReachableNow).toBe(2_000_000);
  });
});
