/**
 * Hissati — progress metrics (replaces the former Readiness Score).
 *
 * Every number here is DERIVED from the deterministic engine's EvaluatedProgram[]
 * plus the user's completed roadmap steps — so it is cited and falsifiable, not an
 * estimated weighting. The headline is `aedReachableNow`: the real money a founder
 * can access today, which climbs MONOTONICALLY as roadmap steps unlock more
 * programs. Pure, deterministic, offline (no clock/network/randomness).
 */
import type { Program, EvaluatedProgram, Profile } from "@/lib/schema";
import { deriveRoadmap } from "@/lib/roadmap";
// Type-only import (erased at build) → safe to use from the server agent route;
// no client/zustand code is pulled in. Keeps `doneSteps` on the shared contract.
import type { DoneStep } from "@/lib/store";

export interface ProgressStats {
  /** Σ upper funding bound of ELIGIBLE funding programs (honest — see amountReachable). */
  aedReachableNow: number;
  /** Σ upper funding bound of eligible ∪ almost funding programs (what the roadmap unlocks). */
  aedReachableAfterSteps: number;
  /** Counts below cover FUNDING programs only (licences are roadmap rungs, not the prize). */
  programsEligible: number;
  programsAlmost: number;
  programsTotal: number;
  stepsDone: number;
  stepsTotal: number;
  /** True if any counted program has an open/unbounded amount → render "up to / varies". */
  hasOpenEndedAmounts: boolean;
}

/**
 * The metric is about MONEY, so it counts funding instruments only and excludes
 * "license" (a trade licence is a fee the founder PAYS — a rung on the path, not
 * funding they receive). Mirrors `lib/format.isCostInstrument`. Excluding licences
 * is also what keeps the idea-stage headline honestly at AED 0 (Tajer/Mobdea are
 * "eligible" licences from day one, but they are not money in hand).
 */
const FUNDING_INSTRUMENTS: ReadonlySet<string> = new Set([
  "grant",
  "loan",
  "equity",
  "accelerator",
]);

/**
 * AED RULE (honest, no inflation): a program contributes its STRUCTURED `max_aed`
 * upper bound only. When that is null (award not publicly fixed, e.g. Ma'an / ADDED
 * grants), it contributes 0 and flips `hasOpenEndedAmounts` so the UI can show
 * "+ programs whose amounts vary". We deliberately do NOT scrape a figure from the
 * prose `notes` — that risks mixing in durations/counts ("4-month", "1,000 activities")
 * and inventing an un-cited number. Every counted dirham is a real, cited max_aed.
 */
function amountReachable(amount: Program["amount"]): { aed: number; open: boolean } {
  if (typeof amount.max_aed === "number") return { aed: amount.max_aed, open: false };
  return { aed: 0, open: true };
}

/**
 * The dashboard's headline progress stats.
 *
 * `profile` is part of the frozen contract (spec §4) and kept for forward
 * compatibility / call-site symmetry with the rest of the metric API; every value
 * is derived from `evaluated` (already computed from the effective profile) so the
 * numbers can never drift from the engine. `doneSteps` contributes only its length.
 */
export function progressStats(
  profile: Partial<Profile>,
  evaluated: EvaluatedProgram[],
  doneSteps: DoneStep[],
): ProgressStats {
  void profile; // see doc comment — derived from `evaluated`, kept for contract symmetry

  const funding = evaluated.filter((e) => FUNDING_INSTRUMENTS.has(e.program.instrument));
  const eligible = funding.filter((e) => e.status === "eligible");
  const almost = funding.filter((e) => e.status === "almost");

  let aedReachableNow = 0;
  let aedReachableAfterSteps = 0;
  let hasOpenEndedAmounts = false;

  for (const e of eligible) {
    const { aed, open } = amountReachable(e.program.amount);
    aedReachableNow += aed;
    aedReachableAfterSteps += aed;
    if (open) hasOpenEndedAmounts = true;
  }
  for (const e of almost) {
    const { aed, open } = amountReachable(e.program.amount);
    aedReachableAfterSteps += aed;
    if (open) hasOpenEndedAmounts = true;
  }

  const stepsDone = doneSteps.length;
  // Total = already completed + still remaining on the current roadmap, so a
  // "stepsDone of stepsTotal" progress reading stays coherent as steps complete.
  const stepsTotal = stepsDone + deriveRoadmap(evaluated).length;

  return {
    aedReachableNow,
    aedReachableAfterSteps,
    programsEligible: eligible.length,
    programsAlmost: almost.length,
    programsTotal: funding.length,
    stepsDone,
    stepsTotal,
    hasOpenEndedAmounts,
  };
}
