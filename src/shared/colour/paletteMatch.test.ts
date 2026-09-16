import { describe, expect, it } from "vitest";

import { paletteMatch, type NamedColor } from "./paletteMatch";

const WHITE = { r: 1, g: 1, b: 1 };

describe("paletteMatch", () => {
  it("picks the nearest passing candidate by hue distance", () => {
    const current = { r: 0.8, g: 0.2, b: 0.2 }; // reddish
    const candidates: readonly NamedColor[] = [
      { name: "sage/muted", color: { r: 0.2, g: 0.4, b: 0.2 } }, // green, passes, far in hue
      { name: "brick/text", color: { r: 0.5, g: 0.1, b: 0.1 } }, // red-ish, passes, near in hue
      { name: "sky/light", color: { r: 0.9, g: 0.9, b: 1 } } // fails against white
    ];

    const result = paletteMatch(current, candidates, WHITE, 4.5);
    expect(result?.name).toBe("brick/text");
  });

  it("returns null when none of the candidates pass", () => {
    const current = { r: 0.8, g: 0.2, b: 0.2 };
    const candidates: readonly NamedColor[] = [
      { name: "pale/pink", color: { r: 0.95, g: 0.85, b: 0.85 } },
      { name: "pale/blue", color: { r: 0.85, g: 0.9, b: 0.95 } }
    ];

    expect(paletteMatch(current, candidates, WHITE, 4.5)).toBeNull();
  });

  it("returns null for an empty candidate list", () => {
    expect(paletteMatch({ r: 0, g: 0, b: 0 }, [], WHITE, 4.5)).toBeNull();
  });
});
