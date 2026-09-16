import { describe, expect, it } from "vitest";

import { hueSaturationToPoint, pointToHueSaturation } from "./wheelGeometry";

describe("hueSaturationToPoint and pointToHueSaturation", () => {
  it.each([
    { hue: 0, saturation: 1 },
    { hue: 0.25, saturation: 1 },
    { hue: 0.5, saturation: 0.5 },
    { hue: 0.75, saturation: 0.2 },
    { hue: 0.999, saturation: 0.8 }
  ])("round trips hue $hue and saturation $saturation", ({ hue, saturation }) => {
    const point = hueSaturationToPoint(hue, saturation);
    const back = pointToHueSaturation(point);
    expect(back.hue).toBeCloseTo(hue, 9);
    expect(back.saturation).toBeCloseTo(saturation, 9);
  });

  it("stays on the unit disc: saturation 1 lands exactly one unit from the centre", () => {
    const point = hueSaturationToPoint(0.3, 1);
    expect(Math.hypot(point.x, point.y)).toBeCloseTo(1, 9);
  });

  it("clamps a point outside the disc to saturation 1 rather than overshooting", () => {
    const { saturation } = pointToHueSaturation({ x: 2, y: 0 });
    expect(saturation).toBe(1);
  });

  it("gives the centre point a defined hue rather than NaN", () => {
    const { hue } = pointToHueSaturation({ x: 0, y: 0 });
    expect(Number.isNaN(hue)).toBe(false);
  });
});
