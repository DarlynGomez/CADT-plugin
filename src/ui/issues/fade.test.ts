import { describe, expect, it } from "vitest";

import { computeFade } from "./fade";

describe("computeFade", () => {
  it("is full strength and no warning shift at zero encounters, for every severity", () => {
    expect(computeFade("low", 0, false).opacity).toBe(1);
    expect(computeFade("low", 0, false).warningMix).toBe(0);
    expect(computeFade("medium", 0, false).opacity).toBe(1);
    expect(computeFade("high", 0, false).warningMix).toBe(0);
  });

  it("fades low severity to its 0.35 floor by five encounters", () => {
    expect(computeFade("low", 5, false).opacity).toBeCloseTo(0.35, 5);
  });

  it("never fades low severity below its floor beyond five encounters", () => {
    expect(computeFade("low", 12, false).opacity).toBeCloseTo(0.35, 5);
  });

  it("never gives low severity any warning shift", () => {
    expect(computeFade("low", 12, false).warningMix).toBe(0);
  });

  it("holds high severity at its 0.8 visibility floor regardless of count", () => {
    expect(computeFade("high", 0, false).opacity).toBe(0.8);
    expect(computeFade("high", 1, false).opacity).toBe(0.8);
    expect(computeFade("high", 20, false).opacity).toBe(0.8);
  });

  it("shifts high severity toward the warning color as the count rises, capped at 1", () => {
    expect(computeFade("high", 0, false).warningMix).toBe(0);
    expect(computeFade("high", 5, false).warningMix).toBeCloseTo(1, 5);
    expect(computeFade("high", 20, false).warningMix).toBeCloseTo(1, 5);
  });

  it("sits medium severity's floor between low's and high's", () => {
    const mediumFloor = computeFade("medium", 5, false).opacity;
    expect(mediumFloor).toBeGreaterThan(0.35);
    expect(mediumFloor).toBeLessThan(0.8);
  });

  it("never lets any severity reach zero opacity", () => {
    for (const severity of ["low", "medium", "high"] as const) {
      expect(computeFade(severity, 1000, false).opacity).toBeGreaterThan(0);
    }
  });

  it("never fades important, regardless of severity or count", () => {
    for (const severity of ["low", "medium", "high"] as const) {
      expect(computeFade(severity, 20, true)).toEqual({ opacity: 1, warningMix: 0 });
    }
  });
});
