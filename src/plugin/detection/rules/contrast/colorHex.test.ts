import { describe, expect, it } from "vitest";

import { rgbToHex } from "./colorHex";

describe("rgbToHex", () => {
  it("converts pure black", () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe("#000000");
  });

  it("converts pure white", () => {
    expect(rgbToHex({ r: 1, g: 1, b: 1 })).toBe("#FFFFFF");
  });

  it("rounds each channel to the nearest byte", () => {
    expect(rgbToHex({ r: 0.537, g: 0.537, b: 0.537 })).toBe("#898989");
  });

  it("pads single-digit hex bytes with a leading zero", () => {
    expect(rgbToHex({ r: 0, g: 0.02, b: 0 })).toBe("#000500");
  });
});
