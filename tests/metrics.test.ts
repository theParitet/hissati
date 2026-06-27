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
 * conservative "AED within reach": explicit per-applicant countable values for
 * currently available matches, with alternative products de-duplicated.
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

  it("registration unlocks Ma’an Funding Requests — count rises without inventing an amount", () => {
    const idea = statsFor(dateFounderIdea);
    const reg = statsFor(dateFounderRegistered);
    expect(reg.programsEligible).toBeGreaterThan(idea.programsEligible);
    // Ma'an publishes no fixed ceiling; Khalifa/EDB financing remains on the roadmap.
    expect(reg.hasOpenEndedAmounts).toBe(true);
    expect(reg.aedReachableAfterSteps).toBeGreaterThan(0);
  });

  it("Khalifa alternatives flip at MVP without double-counting → AED 2,000,000", () => {
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

  it("licences, support, closed cycles and unpublished VC windows never count", () => {
    expect(statsFor(dateFounderIdea).programsTotal).toBe(
      PROGRAMS.filter(
        (p) =>
          ["grant", "loan", "equity", "accelerator"].includes(p.instrument) &&
          ["open", "rolling"].includes(p.availability.status),
      ).length
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
  it("6 currently available funding programs out of 16 tracked opportunities", () => {
    expect(PROGRAMS).toHaveLength(16);
    expect(statsFor(dateFounderIdea).programsTotal).toBe(6);
  });
  it("open-match climb: 0 → 1 → 4 → 5", () => {
    expect(statsFor(dateFounderIdea).programsEligible).toBe(0);
    expect(statsFor(dateFounderRegistered).programsEligible).toBe(1);
    expect(statsFor(dateFounderMvp).programsEligible).toBe(4);
    expect(statsFor(dateFounderEstablished).programsEligible).toBe(5);
  });
  it("AED climb is 0 → 0 → 2M → 7M after EDB becomes available", () => {
    expect(statsFor(dateFounderIdea).aedReachableNow).toBe(0);
    expect(statsFor(dateFounderRegistered).aedReachableNow).toBe(0);
    expect(statsFor(dateFounderMvp).aedReachableNow).toBe(2_000_000);
    expect(statsFor(dateFounderEstablished).aedReachableNow).toBe(7_000_000);
  });
  it("does not count closed collective prize pools or both Khalifa alternatives", () => {
    const mvp = statsFor(dateFounderMvp);
    expect(mvp.aedReachableNow).toBe(2_000_000);
    expect(PROGRAMS.find((p) => p.id === "khalifa-entrepreneurship-competition")?.amount.countable_max_aed).toBeNull();
  });
});
