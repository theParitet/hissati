import { describe, it, expect } from "vitest";
import { getProgramById } from "@/lib/programs";
import { evaluateProgramFull } from "@/lib/engine";
import { programProgress } from "@/lib/checklist";
import { dateFounderIdea } from "./fixtures";

describe("programProgress", () => {
  const ev = evaluateProgramFull(dateFounderIdea, getProgramById("khalifa-fund-sme")!);

  it("requirements met comes from the engine and never exceeds total", () => {
    const p = programProgress(ev, []);
    expect(p.reqMet).toBe(ev.rules.filter((r) => r.passed).length);
    expect(p.reqMet).toBeLessThanOrEqual(p.reqTotal);
    expect(p.docsReady).toBe(0);
    expect(p.docsTotal).toBe(ev.program.required_documents.length);
  });

  it("counts checked documents", () => {
    const p = programProgress(ev, [0, 1]);
    expect(p.docsReady).toBe(2);
  });

  it("ignores out-of-range and duplicate indices", () => {
    const p = programProgress(ev, [0, 0, -1, 999]);
    expect(p.docsReady).toBe(1);
    expect(p.docsReady).toBeLessThanOrEqual(p.docsTotal);
  });
});
