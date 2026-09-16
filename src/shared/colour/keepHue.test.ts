import { describe, expect, it } from "vitest";

import { contrastRatio } from "../../plugin/detection/rules/contrast/contrastRatio";
import { CONTRAST_ADJUST_HEADROOM } from "./headroom";
import { rgbToHsl } from "./hsl";
import { keepHue } from "./keepHue";

const WHITE = { r: 1, g: 1, b: 1 };
const BLACK = { r: 0, g: 0, b: 0 };

describe("keepHue", () => {
  it.each([
    { current: { r: 0.9, g: 0.9, b: 0.95 }, background: WHITE, requiredRatio: 4.5 },
    { current: { r: 0.6, g: 0.2, b: 0.2 }, background: WHITE, requiredRatio: 4.5 },
    { current: { r: 0.1, g: 0.1, b: 0.4 }, background: BLACK, requiredRatio: 4.5 },
    { current: { r: 0.85, g: 0.4, b: 0.4 }, background: WHITE, requiredRatio: 3.0 }
  ])(
    "clears requiredRatio plus headroom for $current against $background",
    ({ current, background, requiredRatio }) => {
      const result = keepHue(current, background, requiredRatio);
      expect(contrastRatio(result, background)).toBeGreaterThanOrEqual(
        requiredRatio + CONTRAST_ADJUST_HEADROOM
      );
    }
  );

  it("preserves the starting hue and saturation, only moving lightness", () => {
    const current = { r: 0.6, g: 0.2, b: 0.2 };
    const result = keepHue(current, WHITE, 4.5);
    const before = rgbToHsl(current);
    const after = rgbToHsl(result);
    expect(after.h).toBeCloseTo(before.h, 5);
    expect(after.s).toBeCloseTo(before.s, 5);
  });

  it("returns the input unchanged when it already clears the padded target", () => {
    const current = BLACK;
    expect(keepHue(current, WHITE, 4.5)).toEqual(current);
  });

  it("holds the closest extreme rather than a still-failing colour when the hue cannot pass at any lightness", () => {
    const midGrey = { r: 0.5, g: 0.5, b: 0.5 };
    const result = keepHue(midGrey, midGrey, 20);
    expect(contrastRatio(result, midGrey)).toBeLessThan(20 + CONTRAST_ADJUST_HEADROOM);
  });
});
