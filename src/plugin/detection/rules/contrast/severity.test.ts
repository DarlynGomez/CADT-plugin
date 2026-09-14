import { describe, expect, it } from "vitest";

import { computeSeverity } from "./severity";

describe("computeSeverity", () => {
  it("is low exactly at the 0.8 achieved-fraction boundary", () => {
    expect(computeSeverity(3.6, 4.5)).toBe("low");
  });

  it("is medium just below the 0.8 boundary", () => {
    expect(computeSeverity(3.59, 4.5)).toBe("medium");
  });

  it("is medium exactly at the 0.5 achieved-fraction boundary", () => {
    expect(computeSeverity(2.25, 4.5)).toBe("medium");
  });

  it("is high just below the 0.5 boundary", () => {
    expect(computeSeverity(2.24, 4.5)).toBe("high");
  });

  it("is low when the ratio fully meets or exceeds the requirement", () => {
    expect(computeSeverity(4.5, 4.5)).toBe("low");
    expect(computeSeverity(21, 4.5)).toBe("low");
  });

  it("is high for a near-zero ratio", () => {
    expect(computeSeverity(1, 4.5)).toBe("high");
  });

  it("bands on the achieved fraction, not the raw ratio, across thresholds", () => {
    expect(computeSeverity(3.2, 3.0)).toBe("low");
    expect(computeSeverity(2.5, 3.0)).toBe("low");
  });
});
