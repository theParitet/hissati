/**
 * Hissati — program comparison (item 2). Pure: turns evaluated programs into
 * side-by-side rows the UI renders (on /plan and inline in the assistant).
 * Everything is read from the SAME deterministic engine/scoring — compare never
 * introduces a second source of truth.
 */
import type { EvaluatedProgram, Profile, Program } from "@/lib/schema";
import { matchScore, estimateTimeToEligibility } from "@/lib/scoring";

export interface CompareRow {
  id: string;
  name: { en: string; ar: string };
  operator: string;
  status: EvaluatedProgram["status"];
  matchPct: number;
  amount: Program["amount"];
  instrument: Program["instrument"];
  tier: number;
  reqMet: number;
  reqTotal: number;
  eta: string;
  stackable: boolean;
  blocking: { why: { en: string; ar: string }; remediable: boolean }[];
}

export function compareProgram(profile: Profile, ev: EvaluatedProgram): CompareRow {
  return {
    id: ev.program.id,
    name: ev.program.name,
    operator: ev.program.operator,
    status: ev.status,
    matchPct: matchScore(profile, ev.program, ev.status, ev.rules),
    amount: ev.program.amount,
    instrument: ev.program.instrument,
    tier: ev.program.tier,
    reqMet: ev.rules.filter((r) => r.passed).length,
    reqTotal: ev.rules.length,
    eta: estimateTimeToEligibility(profile, ev.program, ev.rules),
    stackable: ev.program.concurrent_compatible_with.length > 0,
    blocking: ev.rules
      .filter((r) => !r.passed)
      .map((r) => ({ why: r.blocking_message, remediable: r.remediable })),
  };
}

export function buildComparison(profile: Profile, evs: EvaluatedProgram[]): CompareRow[] {
  return evs.map((ev) => compareProgram(profile, ev));
}
