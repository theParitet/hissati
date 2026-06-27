/**
 * Hissati — per-program progress (items 14/15). Two honest signals:
 *  - requirements MET: derived from the deterministic engine (rules that pass);
 *  - documents READY: the founder's manual checklist ticks (from the store).
 * Pure so the card, the dialog, and tests all read the same numbers.
 */
import type { EvaluatedProgram } from "@/lib/schema";

export interface ProgramProgress {
  reqMet: number;
  reqTotal: number;
  docsReady: number;
  docsTotal: number;
}

export function programProgress(ev: EvaluatedProgram, checkedDocIdx: number[] = []): ProgramProgress {
  const reqTotal = ev.rules.length;
  const reqMet = ev.rules.filter((r) => r.passed).length;
  const docsTotal = ev.program.required_documents.length;
  // Only count ticks that point at a real document (guards against stale indices).
  const docsReady = new Set(checkedDocIdx.filter((i) => i >= 0 && i < docsTotal)).size;
  return { reqMet, reqTotal, docsReady, docsTotal };
}
