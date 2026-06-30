/**
 * Hissati — progress metrics: the cited "AED within reach" headline + climb.
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
  /** Conservative, de-duplicated per-applicant AED across open matched programs. */
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

/** Static, source-checked availability keeps the offline result deterministic. */
export function isCurrentlyAvailable(program: Program): boolean {
  return program.availability.status === "open" || program.availability.status === "rolling";
}

/**
 * AED RULE (honest, no inflation): count only open/rolling funding opportunities
 * and their explicit `countable_max_aed`. Collective prize pools, licence costs,
 * support services, in-kind-only value and unknown/closed windows contribute zero.
 * Alternative products sharing `funding_group` contribute only their largest
 * conservative ceiling. We never parse figures out of prose.
 */
function amountReachable(amount: Program["amount"]): { aed: number; open: boolean } {
  if (typeof amount.countable_max_aed === "number") {
    return { aed: amount.countable_max_aed, open: false };
  }
  return { aed: 0, open: true };
}

function sumReachable(evaluated: EvaluatedProgram[]): { aed: number; open: boolean } {
  const grouped = new Map<string, { aed: number; open: boolean }>();
  for (const e of evaluated) {
    const amount = amountReachable(e.program.amount);
    const key = e.program.funding_group ?? `program:${e.program.id}`;
    const previous = grouped.get(key);
    if (!previous || amount.aed > previous.aed) grouped.set(key, amount);
    else if (amount.open) previous.open = true;
  }
  return [...grouped.values()].reduce(
    (total, value) => ({ aed: total.aed + value.aed, open: total.open || value.open }),
    { aed: 0, open: false },
  );
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

  const funding = evaluated.filter(
    (e) => FUNDING_INSTRUMENTS.has(e.program.instrument) && isCurrentlyAvailable(e.program),
  );
  const eligible = funding.filter((e) => e.status === "eligible");
  const almost = funding.filter((e) => e.status === "almost");

  const now = sumReachable(eligible);
  const after = sumReachable([...eligible, ...almost]);

  const stepsDone = doneSteps.length;
  // Total = already completed + still remaining on the current roadmap, so a
  // "stepsDone of stepsTotal" progress reading stays coherent as steps complete.
  const stepsTotal = stepsDone + deriveRoadmap(evaluated).length;

  return {
    aedReachableNow: now.aed,
    aedReachableAfterSteps: after.aed,
    programsEligible: eligible.length,
    programsAlmost: almost.length,
    programsTotal: funding.length,
    stepsDone,
    stepsTotal,
    hasOpenEndedAmounts: now.open || after.open,
  };
}
