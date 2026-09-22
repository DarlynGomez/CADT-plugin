import { describe, expect, it } from "vitest";

import { isSeverityWorse, SEVERITY_RANK } from "./severityRank";

describe("SEVERITY_RANK", () => {
  it("orders low below medium below high", () => {
    expect(SEVERITY_RANK.low).toBeLessThan(SEVERITY_RANK.medium);
    expect(SEVERITY_RANK.medium).toBeLessThan(SEVERITY_RANK.high);
  });
});

describe("isSeverityWorse", () => {
  it("is true when the candidate band is worse than the baseline", () => {
    expect(isSeverityWorse("high", "low")).toBe(true);
    expect(isSeverityWorse("medium", "low")).toBe(true);
    expect(isSeverityWorse("high", "medium")).toBe(true);
  });

  it("is false when the candidate band equals the baseline", () => {
    expect(isSeverityWorse("low", "low")).toBe(false);
    expect(isSeverityWorse("medium", "medium")).toBe(false);
    expect(isSeverityWorse("high", "high")).toBe(false);
  });

  it("is false when the candidate band is better than the baseline", () => {
    expect(isSeverityWorse("low", "high")).toBe(false);
    expect(isSeverityWorse("medium", "high")).toBe(false);
  });
});
