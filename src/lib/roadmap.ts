/**
 * Hissati — derive the readiness roadmap (FR-D1) from evaluated programs.
 *
 * A roadmap step is a *distinct remedial action* drawn from the failed-but-
 * remediable rules of the "almost" programs. Many programs share the same gate
 * (e.g. "register a trade licence" blocks Khalifa + Ma'an + Tanami), so steps are
 * DEDUPED by effect; completing one advances the profile field and re-flows the
 * whole engine (the FR-D3 climb). Quickest, foundational steps come first.
 */
import type { EvaluatedProgram, Localized, Profile, Program, Rule } from "@/lib/schema";
import { estTimeToMonths } from "@/lib/scoring";

export interface RoadmapStep {
  key: string;
  mutate: Partial<Profile>;
  action: Localized;
  est_time?: string;
  est_cost_aed?: number | null;
  links_program_id?: string;
  unlocks: Program[]; // programs this step helps move toward eligible
  months: number; // for ordering only
}

/** Map a failed remediable gate to the profile advance that clears it. */
function stepFromRule(rule: Rule): { key: string; mutate: Partial<Profile> } | null {
  if (rule.field === "registration" && rule.op === "gte" && typeof rule.value === "string")
    return { key: `registration:${rule.value}`, mutate: { registration: rule.value as Profile["registration"] } };
  if (rule.field === "stage" && rule.op === "gte" && typeof rule.value === "string")
    return { key: `stage:${rule.value}`, mutate: { stage: rule.value as Profile["stage"] } };
  if (rule.field === "relocation_willing" && rule.op === "is_true")
    return { key: "relocation_willing:true", mutate: { relocation_willing: true } };
  return null;
}

export function deriveRoadmap(evaluated: EvaluatedProgram[]): RoadmapStep[] {
  const map = new Map<string, RoadmapStep>();

  for (const ev of evaluated) {
    if (ev.status !== "almost") continue;
    for (const rule of ev.rules) {
      if (rule.passed || !rule.remediable || !rule.remedy) continue;
      const s = stepFromRule(rule);
      if (!s) continue;
      const existing = map.get(s.key);
      if (existing) {
        existing.unlocks.push(ev.program);
      } else {
        map.set(s.key, {
          key: s.key,
          mutate: s.mutate,
          action: rule.remedy.action,
          est_time: rule.remedy.est_time,
          est_cost_aed: rule.remedy.est_cost_aed ?? null,
          links_program_id: rule.remedy.links_program_id,
          unlocks: [ev.program],
          months: estTimeToMonths(rule.remedy.est_time),
        });
      }
    }
  }

  // Quickest / most foundational first (FR-G1), then by how much it unlocks.
  return [...map.values()].sort((a, b) => a.months - b.months || b.unlocks.length - a.unlocks.length);
}
