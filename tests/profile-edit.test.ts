import { describe, it, expect } from "vitest";
import { effectiveProfile, pruneSupersededSteps, type DoneStep } from "@/lib/store";
import { dateFounderIdea, dateFounderRegistered, dateFounderMvp } from "./fixtures";

/**
 * The mark/undo fold (FR-D3 climb) and its inverse. Marking a roadmap step
 * stores a Partial<Profile> advance; `effectiveProfile` folds those onto the raw
 * answers and re-runs the engine. The agent review flagged this round-trip as
 * having zero direct coverage — these pin it, plus the "a re-stated answer wins
 * over a completed step" fix (pruneSupersededSteps).
 */
const registerStep: DoneStep = { key: "registration:lt_1yr", mutate: { registration: "lt_1yr" } };
const mvpStep: DoneStep = { key: "stage:mvp", mutate: { stage: "mvp" } };

describe("effectiveProfile — the mark/undo fold", () => {
  it("folds completed steps onto the base answers", () => {
    expect(effectiveProfile(dateFounderIdea, [registerStep, mvpStep])).toEqual(dateFounderMvp);
  });

  it("is order-independent over the same ordered fields", () => {
    expect(effectiveProfile(dateFounderIdea, [mvpStep, registerStep])).toEqual(
      effectiveProfile(dateFounderIdea, [registerStep, mvpStep])
    );
  });

  it("removing a step restores the state as if it were never marked (unmark)", () => {
    const both = [registerStep, mvpStep];
    expect(effectiveProfile(dateFounderIdea, both.filter((s) => s.key !== mvpStep.key))).toEqual(
      dateFounderRegistered
    );
    expect(effectiveProfile(dateFounderIdea, [])).toEqual(dateFounderIdea);
  });

  it("a completed step only ever advances a field; removing it reverts that field to base", () => {
    const onlyMvp = effectiveProfile(dateFounderIdea, [mvpStep]);
    expect(onlyMvp.stage).toBe("mvp");
    expect(onlyMvp.registration).toBe("none"); // never pinned by a step that isn't there
  });
});

describe("pruneSupersededSteps — a direct edit overrides a completed step on the same field", () => {
  it("re-stating a field below a completed step drops that step (LOW-MED fix)", () => {
    // Founder marked "register" done: raw answer is still "none", effective is "lt_1yr".
    expect(effectiveProfile(dateFounderIdea, [registerStep]).registration).toBe("lt_1yr");

    const pruned = pruneSupersededSteps(dateFounderIdea, { registration: "none" }, [registerStep]);
    expect(pruned).toEqual([]);
    // With the step gone, the matcher follows the re-stated answer.
    expect(effectiveProfile({ ...dateFounderIdea, registration: "none" }, pruned).registration).toBe("none");
  });

  it("re-affirming the same effective value keeps the step (no needless reset)", () => {
    expect(pruneSupersededSteps(dateFounderIdea, { registration: "lt_1yr" }, [registerStep])).toEqual([
      registerStep,
    ]);
  });

  it("editing an unrelated field leaves completed steps untouched", () => {
    expect(pruneSupersededSteps(dateFounderIdea, { sector: "tech" }, [registerStep, mvpStep])).toEqual([
      registerStep,
      mvpStep,
    ]);
  });

  it("raising a field directly past its step prunes the now-redundant step", () => {
    expect(pruneSupersededSteps(dateFounderIdea, { registration: "reg_2yr_plus" }, [registerStep])).toEqual([]);
  });

  it("with multiple steps, only the edited field's step is dropped", () => {
    expect(pruneSupersededSteps(dateFounderIdea, { stage: "idea" }, [registerStep, mvpStep])).toEqual([
      registerStep,
    ]);
  });

  it("prunes nothing when there are no completed steps", () => {
    const empty: DoneStep[] = [];
    expect(pruneSupersededSteps(dateFounderIdea, { registration: "none" }, empty)).toBe(empty);
  });
});
