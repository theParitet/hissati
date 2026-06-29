import { describe, it, expect } from "vitest";
import { PROGRAMS } from "@/lib/programs";
import { evaluateAllFull } from "@/lib/engine";
import { deriveRoadmap } from "@/lib/roadmap";
import { ruleStepKey } from "@/lib/steps";
import { pruneStepsForEdit, type DoneStep } from "@/lib/store";
import type { Profile, Rule } from "@/lib/schema";

/**
 * Atomic roadmap steps. A step is a KEY; the engine clears exactly the gate(s)
 * that name it. There is no folding and no implication between rungs, so each
 * step is an independent done/not-done toggle and undoing any step ALWAYS returns
 * it to the queue. These pin that contract against the real dataset.
 */

// An expat tech/equity founder at idea: several stage rungs are 'almost' on real data.
const base: Profile = {
  nationality_ownership: "expat",
  location: "dubai",
  stage: "idea",
  registration: "lt_1yr",
  sector: "tech",
  funding_type: "equity",
  amount_band: "aed_200_500k",
};

const queue = (doneKeys: Set<string>) =>
  deriveRoadmap(evaluateAllFull(base, PROGRAMS, doneKeys)).map((s) => s.key);

describe("ruleStepKey — the rule ⇄ step bridge", () => {
  it("maps ordered gte gates and the relocation gate", () => {
    expect(ruleStepKey({ field: "stage", op: "gte", value: "mvp" } as Rule)).toBe("stage:mvp");
    expect(ruleStepKey({ field: "registration", op: "gte", value: "lt_1yr" } as Rule)).toBe(
      "registration:lt_1yr"
    );
    expect(ruleStepKey({ field: "relocation_willing", op: "is_true" } as Rule)).toBe(
      "relocation_willing:true"
    );
  });

  it("returns null for gates that aren't remediable rungs", () => {
    expect(ruleStepKey({ field: "sector", op: "in", value: ["tech"] } as Rule)).toBeNull();
    expect(ruleStepKey({ field: "nationality_ownership", op: "eq", value: "emirati_majority" } as Rule)).toBeNull();
  });
});

describe("atomic step toggle — each key clears only its own gate", () => {
  it("offers a 'reach MVP' step from the idea stage", () => {
    expect(queue(new Set())).toContain("stage:mvp");
  });

  it("marking a step removes it from the queue; undoing it brings it back — always", () => {
    expect(queue(new Set(["stage:mvp"]))).not.toContain("stage:mvp"); // cleared while marked
    expect(queue(new Set())).toContain("stage:mvp"); // undo (key removed) → returns
  });

  it("marking a higher rung does NOT clear a lower one (no implication)", () => {
    // early_traction is its own gate; programs gated at mvp stay 'almost'.
    expect(queue(new Set(["stage:early_traction"]))).toContain("stage:mvp");
  });

  it("two rungs of the same field are fully independent: undo one, the other stays done", () => {
    const both = queue(new Set(["stage:mvp", "stage:early_traction"]));
    expect(both).not.toContain("stage:mvp");
    expect(both).not.toContain("stage:early_traction");

    const undidMvp = queue(new Set(["stage:early_traction"])); // undo MVP only
    expect(undidMvp).toContain("stage:mvp"); // ← returns to the queue
    expect(undidMvp).not.toContain("stage:early_traction"); // ← still done
  });
});

describe("pruneStepsForEdit — a re-stated answer wins over a stale completed step", () => {
  const registerStep: DoneStep = { key: "registration:lt_1yr" };
  const mvpStep: DoneStep = { key: "stage:mvp" };

  it("editing a field drops a completed step keyed on that field (the honesty fix)", () => {
    expect(pruneStepsForEdit({ registration: "none" }, [registerStep])).toEqual([]);
  });

  it("fires on the edit regardless of whether the raw value changed", () => {
    // Re-affirming 'none' (answer was already none) still drops the contradicting key.
    expect(pruneStepsForEdit({ registration: "none" }, [registerStep, mvpStep])).toEqual([mvpStep]);
  });

  it("leaves steps on fields the edit didn't touch (same reference)", () => {
    const done = [registerStep, mvpStep];
    expect(pruneStepsForEdit({ sector: "tech" }, done)).toBe(done);
  });

  it("edits one field, drops only that field's step", () => {
    expect(pruneStepsForEdit({ stage: "idea" }, [registerStep, mvpStep])).toEqual([registerStep]);
  });

  it("handles the relocation key", () => {
    const reloc: DoneStep = { key: "relocation_willing:true" };
    expect(pruneStepsForEdit({ relocation_willing: false }, [reloc])).toEqual([]);
  });

  it("end-to-end: re-stating registration drops the key so the gate re-fails", () => {
    const unreg: Profile = { ...base, registration: "none" };
    const cleared = evaluateAllFull(unreg, PROGRAMS, new Set(["registration:lt_1yr"]));
    const khalifaReg = cleared
      .find((e) => e.program.id === "khalifa-fund-sme")!
      .rules.find((r) => r.field === "registration")!;
    expect(khalifaReg.passed).toBe(true); // stale key clears the gate...

    const remaining = pruneStepsForEdit({ registration: "none" }, [{ key: "registration:lt_1yr" }]);
    const after = evaluateAllFull(unreg, PROGRAMS, new Set(remaining.map((d) => d.key)));
    const khalifaReg2 = after
      .find((e) => e.program.id === "khalifa-fund-sme")!
      .rules.find((r) => r.field === "registration")!;
    expect(khalifaReg2.passed).toBe(false); // ...until the re-stated answer prunes it
  });
});
