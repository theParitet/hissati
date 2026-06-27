import { describe, expect, it } from "vitest";
import { wizardSteps } from "@/lib/wizard";
import { dateFounderIdea, mvpTechFounder } from "./fixtures";

describe("adaptive questionnaire", () => {
  it("starts with only the six core questions", () => {
    expect(wizardSteps({})).toEqual([
      "location",
      "nationality_ownership",
      "stage",
      "registration",
      "sector",
      "funding",
    ]);
  });

  it("adds only the narrow checks relevant to the Al Qua’a date founder", () => {
    expect(wizardSteps(dateFounderIdea)).toEqual([
      "location",
      "nationality_ownership",
      "stage",
      "registration",
      "sector",
      "funding",
      "gender",
      "farm_tenure",
      "social_impact",
    ]);
  });

  it("asks relocation only when it is Hub71’s deciding gate", () => {
    expect(wizardSteps(mvpTechFounder)).toContain("relocation_willing");
    expect(wizardSteps({ sector: "tech" })).not.toContain("relocation_willing");
  });
});
