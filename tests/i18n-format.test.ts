import { describe, it, expect } from "vitest";
import { stepsUnlockMore } from "@/lib/i18n";

describe("stepsUnlockMore — Arabic number–noun–verb agreement", () => {
  it("English keeps simple singular/plural", () => {
    expect(stepsUnlockMore(1, "en")).toBe("1 step unlocks more");
    expect(stepsUnlockMore(3, "en")).toBe("3 steps unlock more");
    expect(stepsUnlockMore(0, "en")).toBe("0 steps unlock more");
  });

  it("Arabic uses the four count regimes (1 / 2 / 3–10 / 11+)", () => {
    // 1 → singular
    expect(stepsUnlockMore(1, "ar")).toBe("خطوة واحدة تفتح المزيد");
    // 2 → dual noun + dual verb
    expect(stepsUnlockMore(2, "ar")).toBe("خطوتان تفتحان المزيد");
    // 3–10 → plural noun "خطوات", with Eastern-Arabic digits
    expect(stepsUnlockMore(3, "ar")).toBe("٣ خطوات تفتح المزيد");
    expect(stepsUnlockMore(10, "ar")).toBe("١٠ خطوات تفتح المزيد");
    // 11+ → accusative-singular tamyiz "خطوة"
    expect(stepsUnlockMore(11, "ar")).toBe("١١ خطوة تفتح المزيد");
  });
});
