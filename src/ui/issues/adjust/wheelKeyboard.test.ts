import { describe, expect, it } from "vitest";

import { applyWheelKey } from "./wheelKeyboard";

describe("applyWheelKey", () => {
  it("moves hue left and right, wrapping at the ends of the turn", () => {
    expect(applyWheelKey("ArrowRight", false, 0.5, 0.5)?.hue).toBeCloseTo(0.5 + 1 / 72, 5);
    expect(applyWheelKey("ArrowLeft", false, 0, 0.5)?.hue).toBeCloseTo(1 - 1 / 72, 5);
  });

  it("moves saturation up and down, clamped to 0 and 1", () => {
    expect(applyWheelKey("ArrowUp", false, 0.5, 0.99)?.saturation).toBe(1);
    expect(applyWheelKey("ArrowDown", false, 0.5, 0.01)?.saturation).toBe(0);
  });

  it("takes a larger step with shift", () => {
    const small = applyWheelKey("ArrowRight", false, 0.5, 0.5);
    const large = applyWheelKey("ArrowRight", true, 0.5, 0.5);
    expect(small).not.toBeNull();
    expect(large).not.toBeNull();
    expect((large?.hue ?? 0) - 0.5).toBeGreaterThan((small?.hue ?? 0) - 0.5);
  });

  it("leaves saturation untouched on a hue move and hue untouched on a saturation move", () => {
    expect(applyWheelKey("ArrowRight", false, 0.5, 0.3)?.saturation).toBe(0.3);
    expect(applyWheelKey("ArrowUp", false, 0.5, 0.3)?.hue).toBe(0.5);
  });

  it("returns null for a key it does not handle", () => {
    expect(applyWheelKey("Enter", false, 0.5, 0.5)).toBeNull();
  });
});
