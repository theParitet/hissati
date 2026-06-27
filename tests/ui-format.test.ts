import { describe, it, expect } from "vitest";
import { formatAED } from "@/components/ui";

describe("formatAED — the ledger voice", () => {
  it("groups thousands in English", () => {
    expect(formatAED(0, "en")).toBe("0");
    expect(formatAED(500000, "en")).toBe("500,000");
    expect(formatAED(2000000, "en")).toBe("2,000,000");
  });

  it("uses Eastern-Arabic numerals in Arabic, keeping grouping", () => {
    expect(formatAED(500000, "ar")).toBe("٥٠٠,٠٠٠");
    expect(formatAED(2000000, "ar")).toBe("٢,٠٠٠,٠٠٠");
  });

  it("rounds to whole dirhams (never fractional money)", () => {
    expect(formatAED(1234.6, "en")).toBe("1,235");
  });
});
