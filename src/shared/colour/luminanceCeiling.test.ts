import { describe, expect, it } from "vitest";

import { contrastRatio } from "../../plugin/detection/rules/contrast/contrastRatio";
import { luminanceCeiling } from "./luminanceCeiling";

/** Inverse of contrastRatio.ts's channel linearization, so a target luminance can be
 *  turned into an actual grey RGBColor for a direct-computation test */
function greyAtLuminance(luminance: number) {
  const channel = luminance <= 0.0031308 ? luminance * 12.92 : 1.055 * Math.pow(luminance, 1 / 2.4) - 0.055;
  return { r: channel, g: channel, b: channel };
}

describe("luminanceCeiling", () => {
  it.each([
    { background: { r: 1, g: 1, b: 1 }, requiredRatio: 4.5 },
    { background: { r: 1, g: 1, b: 1 }, requiredRatio: 3.0 },
    { background: { r: 0.8, g: 0.8, b: 0.8 }, requiredRatio: 4.5 },
    { background: { r: 0.5, g: 0.5, b: 0.5 }, requiredRatio: 3.0 }
  ])(
    "a foreground at the derived ceiling achieves exactly requiredRatio against $background",
    ({ background, requiredRatio }) => {
      const ceiling = luminanceCeiling(background, requiredRatio);
      const boundaryColor = greyAtLuminance(ceiling);
      expect(contrastRatio(boundaryColor, background)).toBeCloseTo(requiredRatio, 5);
    }
  );

  it("is negative when no darker-side luminance can reach an unreachable ratio", () => {
    expect(luminanceCeiling({ r: 0.1, g: 0.1, b: 0.1 }, 20)).toBeLessThan(0);
  });
});
