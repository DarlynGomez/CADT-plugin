import { describe, expect, it } from "vitest";

import type { ContrastEvidence } from "./contrastRule";
import { describeContrastEvidence } from "./describeEvidence";

function evidence(overrides: Partial<ContrastEvidence> = {}): ContrastEvidence {
  return {
    measuredRatio: 2.1743634905132234,
    requiredRatio: 4.5,
    foregroundHex: "#898989",
    foregroundAlpha: 1,
    foregroundBinding: null,
    backgroundHex: "#FFFFFF",
    backgroundAlpha: 1,
    backgroundSource: { kind: "node", nodeId: "1:2", nodeName: "Card" },
    fontSizePx: 16,
    isBold: false,
    fontStyleName: "Regular",
    sizeClass: "normal",
    ...overrides
  };
}

describe("describeContrastEvidence", () => {
  it("carries foreground, background, ratio, and severity on one line", () => {
    const line = describeContrastEvidence(evidence(), "high");
    expect(line).toBe("fg=#898989 bg=#FFFFFF ratio=2.17:1 (needs 4.5:1) severity=high");
  });

  it("rounds the ratio to two places and the requirement to one, for a scannable line", () => {
    const line = describeContrastEvidence(evidence({ measuredRatio: 3, requiredRatio: 3 }), "low");
    expect(line).toBe("fg=#898989 bg=#FFFFFF ratio=3.00:1 (needs 3.0:1) severity=low");
  });
});
