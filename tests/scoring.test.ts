import { describe, it, expect } from "vitest";
import { evaluateAllFull, evaluateProgramFull } from "@/lib/engine";
import { PROGRAMS, getProgramById } from "@/lib/programs";
import { matchScore, readinessScore, estimateTimeToEligibility } from "@/lib/scoring";
import type { Profile } from "@/lib/schema";
import {
  dateFounderIdea,
  dateFounderRegistered,
  dateFounderMvp,
  dateFounderEstablished,
  mvpTechFounder,
} from "./fixtures";

const readinessFor = (p: Profile) => readinessScore(p, evaluateAllFull(p, PROGRAMS));

describe("Readiness Score — THE CLIMB (FR-D2/D3, scoring.md §2.4)", () => {
  const r0 = readinessFor(dateFounderIdea); // idea / unregistered
  const r1 = readinessFor(dateFounderRegistered); // + trade licence
  const r2 = readinessFor(dateFounderMvp); // + launched MVP
  const r3 = readinessFor(dateFounderEstablished); // matured: established, 2yr+

  // Deterministic, falsifiable claim — the exact rehearsed demo trajectory
  // (CLAUDE.md build-order §4: "14 → 51 → 59 (±3)"; established → 75).
  it("starts genuinely low — no funding open yet → 14", () => {
    expect(r0).toBe(14);
  });

  it("jumps when registration unlocks two Tier-1 grants → 51", () => {
    expect(r1).toBe(51);
  });

  it("rises again when the Khalifa loan flips eligible → 59", () => {
    expect(r2).toBe(59);
  });

  it("climbs further as the business matures → 75", () => {
    expect(r3).toBe(75);
  });

  it("is MONOTONIC across the whole climb — the gauge never regresses (FR-D3)", () => {
    expect(r0).toBeLessThan(r1);
    expect(r1).toBeLessThan(r2);
    expect(r2).toBeLessThan(r3);
  });
});

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

  it("Example B: hub71-access for the MVP tech founder (almost, needs relocation) = 54", () => {
    const ev = evaluateProgramFull(mvpTechFounder, getProgramById("hub71-access")!);
    expect(ev.status).toBe("almost");
    expect(matchScore(mvpTechFounder, ev.program, ev.status, ev.rules)).toBe(54);
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
