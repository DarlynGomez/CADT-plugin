import { describe, expect, it } from "vitest";

import { contrastRatio, passesContrastThreshold, relativeLuminance } from "./contrastRatio";

const BLACK = { r: 0, g: 0, b: 0 };
const WHITE = { r: 1, g: 1, b: 1 };

describe("relativeLuminance", () => {
  it("is 0 for black and 1 for white", () => {
    expect(relativeLuminance(BLACK)).toBe(0);
    expect(relativeLuminance(WHITE)).toBe(1);
  });
});

describe("contrastRatio", () => {
  it("is 21:1 for black on white, the maximum possible ratio", () => {
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(21, 5);
  });

  it("does not depend on argument order", () => {
    expect(contrastRatio(BLACK, WHITE)).toBe(contrastRatio(WHITE, BLACK));
  });

  it("is 1:1 for a color against itself, the minimum possible ratio", () => {
    const gray = { r: 0.5, g: 0.5, b: 0.5 };
    expect(contrastRatio(gray, gray)).toBeCloseTo(1, 10);
  });

  it("matches the commonly cited WCAG gray-on-white pair at roughly 4.5:1", () => {
    const gray767676 = { r: 118 / 255, g: 118 / 255, b: 118 / 255 };
    expect(contrastRatio(gray767676, WHITE)).toBeCloseTo(4.54, 1);
  });
});

describe("passesContrastThreshold", () => {
  it("passes exactly at the large-text boundary of 3.0", () => {
    expect(passesContrastThreshold(3.0, 3.0)).toBe(true);
  });

  it("fails just below the large-text boundary of 3.0", () => {
    expect(passesContrastThreshold(2.999999, 3.0)).toBe(false);
  });

  it("passes exactly at the normal-text boundary of 4.5", () => {
    expect(passesContrastThreshold(4.5, 4.5)).toBe(true);
  });

  it("fails just below the normal-text boundary of 4.5", () => {
    expect(passesContrastThreshold(4.499999, 4.5)).toBe(false);
  });
});
