import { describe, it, expect } from "vitest";
import { evaluateProgramFull } from "@/lib/engine";
import { getProgramById } from "@/lib/programs";
import { matchScore, estimateTimeToEligibility } from "@/lib/scoring";
import {
  dateFounderIdea,
  dateFounderRegistered,
  dateFounderMvp,
  dateFounderEstablished,
  mvpTechFounder,
} from "./fixtures";

// The progress climb (AED within reach) is asserted in tests/metrics.test.ts.

describe("Headline demo beat: Khalifa Fund loan flips almost → eligible at step 2", () => {
  const khalifa = getProgramById("khalifa-fund-sme")!;
  it("ALMOST at step 1 (registered, still idea-stage — only the MVP gate remains)", () => {
    expect(evaluateProgramFull(dateFounderRegistered, khalifa).status).toBe("almost");
  });
  it("ELIGIBLE at step 2 (after launching an MVP)", () => {
    expect(evaluateProgramFull(dateFounderMvp, khalifa).status).toBe("eligible");
  });
});

describe("Match Score — worked examples (FR-C2, scoring.md §1.4)", () => {
  it("Example A: khalifa-fund-sme for the established date founder = 83", () => {
    const ev = evaluateProgramFull(dateFounderEstablished, getProgramById("khalifa-fund-sme")!);
    expect(ev.status).toBe("eligible");
    expect(matchScore(dateFounderEstablished, ev.program, ev.status, ev.rules)).toBe(83);
  });

  it("Example B: hub71-access reflects the verified AED 750K package = 51", () => {
    const ev = evaluateProgramFull(mvpTechFounder, getProgramById("hub71-access")!);
    expect(ev.status).toBe("almost");
    expect(matchScore(mvpTechFounder, ev.program, ev.status, ev.rules)).toBe(51);
  });

  it("not_fit programs are not ranked (score 0)", () => {
    const ev = evaluateProgramFull(dateFounderIdea, getProgramById("dct-tourism-licence")!);
    expect(ev.status).toBe("not_fit");
    expect(matchScore(dateFounderIdea, ev.program, ev.status, ev.rules)).toBe(0);
  });

  it("a fully-eligible program always outranks the same program when only 'almost'", () => {
    const elig = evaluateProgramFull(dateFounderEstablished, getProgramById("khalifa-fund-sme")!);
    const almost = evaluateProgramFull(dateFounderRegistered, getProgramById("khalifa-fund-sme")!);
    const eligScore = matchScore(dateFounderEstablished, elig.program, elig.status, elig.rules);
    const almostScore = matchScore(dateFounderRegistered, almost.program, almost.status, almost.rules);
    expect(eligScore).toBeGreaterThan(almostScore);
  });
});

describe("estimateTimeToEligibility (FR-D4, scoring.md §3)", () => {
  it("khalifa for the idea founder ≈ 6–8 months (registration days + MVP months)", () => {
    const ev = evaluateProgramFull(dateFounderIdea, getProgramById("khalifa-fund-sme")!);
    expect(estimateTimeToEligibility(dateFounderIdea, ev.program, ev.rules)).toBe("≈6–8 months");
  });

  it("an already-eligible program → 'now'", () => {
    const ev = evaluateProgramFull(dateFounderIdea, getProgramById("tajer-abu-dhabi")!);
    expect(estimateTimeToEligibility(dateFounderIdea, ev.program, ev.rules)).toBe("now");
  });

  it("a hard, non-remediable gate → 'not on this path' (DCT sector for a dates founder)", () => {
    const ev = evaluateProgramFull(dateFounderIdea, getProgramById("dct-tourism-licence")!);
    expect(estimateTimeToEligibility(dateFounderIdea, ev.program, ev.rules)).toBe("not on this path");
  });
});
