import { describe, expect, it } from "vitest";

import type { NodeSnapshot } from "../../../../shared/issues/issueTypes";
import { contrastRule } from "./contrastRule";

const BLACK = { r: 0, g: 0, b: 0 };
const WHITE = { r: 1, g: 1, b: 1 };
// Roughly 3.5:1 against white: fails the 4.5:1 normal-text bar, passes the 3.0:1 large-text bar.
const MID_GRAY = { r: 0.537, g: 0.537, b: 0.537 };

function baseSnapshot(overrides: Partial<NodeSnapshot> = {}): NodeSnapshot {
  return {
    nodeId: "1:1",
    nodeName: "Body copy",
    nodeType: "TEXT",
    foreground: BLACK,
    background: WHITE,
    fontSizePx: 16,
    isBold: false,
    indeterminateReasons: [],
    ...overrides
  };
}

describe("contrastRule", () => {
  it("has the stable id 'contrast'", () => {
    expect(contrastRule.id).toBe("contrast");
  });

  it("produces no finding for black on white, which comfortably passes", () => {
    expect(contrastRule.evaluate(baseSnapshot())).toBeNull();
  });

  it("produces a finding for normal text that falls short of 4.5:1", () => {
    const finding = contrastRule.evaluate(baseSnapshot({ foreground: MID_GRAY }));
    expect(finding).not.toBeNull();
    expect(finding?.ruleId).toBe("contrast");
    expect(finding?.nodeId).toBe("1:1");
    expect(finding?.evidence.requiredRatio).toBe(4.5);
    expect(finding?.severity).toBe("medium");
  });

  it("uses the relaxed 3.0 threshold for large text, so a mid-range ratio passes", () => {
    const finding = contrastRule.evaluate(
      baseSnapshot({ foreground: MID_GRAY, fontSizePx: 24 })
    );
    expect(finding).toBeNull();
  });

  it("uses the bold large-text floor of 18.66px", () => {
    const finding = contrastRule.evaluate(
      baseSnapshot({ foreground: MID_GRAY, fontSizePx: 19, isBold: true })
    );
    expect(finding).toBeNull();
  });

  it("produces no finding when the snapshot carries any indeterminate reason", () => {
    const finding = contrastRule.evaluate(
      baseSnapshot({ indeterminateReasons: ["fill-mixed"] })
    );
    expect(finding).toBeNull();
  });

  it("produces no finding when a required field is missing despite no stated reason", () => {
    expect(contrastRule.evaluate(baseSnapshot({ foreground: null }))).toBeNull();
    expect(contrastRule.evaluate(baseSnapshot({ background: null }))).toBeNull();
    expect(contrastRule.evaluate(baseSnapshot({ fontSizePx: null }))).toBeNull();
    expect(contrastRule.evaluate(baseSnapshot({ isBold: null }))).toBeNull();
  });
});
