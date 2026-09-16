import { describe, expect, it } from "vitest";

import { hslToRgb, rgbToHsl } from "./hsl";

function expectCloseColor(actual: { r: number; g: number; b: number }, expected: { r: number; g: number; b: number }) {
  expect(actual.r).toBeCloseTo(expected.r, 9);
  expect(actual.g).toBeCloseTo(expected.g, 9);
  expect(actual.b).toBeCloseTo(expected.b, 9);
}

describe("rgbToHsl and hslToRgb", () => {
  it.each([
    { r: 0, g: 0, b: 0 },
    { r: 1, g: 1, b: 1 },
    { r: 1, g: 0, b: 0 },
    { r: 0, g: 1, b: 0 },
    { r: 0, g: 0, b: 1 },
    { r: 0.5, g: 0.5, b: 0.5 },
    { r: 0.8, g: 0.3, b: 0.5 },
    { r: 0.1, g: 0.9, b: 0.2 }
  ])("round trips %o through HSL", (color) => {
    const { h, s, l } = rgbToHsl(color);
    expectCloseColor(hslToRgb(h, s, l), color);
  });

  it("reports zero saturation for a grey, regardless of its lightness", () => {
    expect(rgbToHsl({ r: 0.3, g: 0.3, b: 0.3 }).s).toBe(0);
  });
});
