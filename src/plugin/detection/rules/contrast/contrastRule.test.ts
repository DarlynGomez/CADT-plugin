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
    screenId: "screen-1",
    screenName: "Screen",
    foregroundBinding: null,
    foreground: BLACK,
    foregroundAlpha: 1,
    background: WHITE,
    backgroundAlpha: 1,
    backgroundSource: { kind: "node", nodeId: "1:2", nodeName: "Card" },
    fontSizePx: 16,
    isBold: false,
    fontStyleName: "Regular",
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

  it("carries the resolved inputs behind the ratio in the evidence, not just the ratio itself", () => {
    const finding = contrastRule.evaluate(baseSnapshot({ foreground: MID_GRAY }));
    expect(finding?.evidence).toEqual({
      measuredRatio: expect.any(Number),
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
      sizeClass: "normal"
    });
  });

  it("reports a null fontStyleName in evidence when the font name itself was mixed", () => {
    const finding = contrastRule.evaluate(
      baseSnapshot({ foreground: MID_GRAY, fontStyleName: null })
    );
    expect(finding?.evidence.fontStyleName).toBeNull();
  });

  it("names the page as the background source when no ancestor supplied the fill", () => {
    const finding = contrastRule.evaluate(
      baseSnapshot({ foreground: MID_GRAY, backgroundSource: { kind: "page" } })
    );
    expect(finding?.evidence.backgroundSource).toEqual({ kind: "page" });
  });

  it("uses the relaxed 3.0 threshold for large text, so a mid-range ratio passes", () => {
    const finding = contrastRule.evaluate(baseSnapshot({ foreground: MID_GRAY, fontSizePx: 24 }));
    expect(finding).toBeNull();
  });

  it("uses the bold large-text floor of 18.66px", () => {
    const finding = contrastRule.evaluate(
      baseSnapshot({ foreground: MID_GRAY, fontSizePx: 19, isBold: true })
    );
    expect(finding).toBeNull();
  });

  it("produces no finding when the snapshot carries any indeterminate reason", () => {
    const finding = contrastRule.evaluate(baseSnapshot({ indeterminateReasons: ["fill-mixed"] }));
    expect(finding).toBeNull();
  });

  it("produces no finding when a required field is missing despite no stated reason", () => {
    expect(contrastRule.evaluate(baseSnapshot({ foreground: null }))).toBeNull();
    expect(contrastRule.evaluate(baseSnapshot({ foregroundAlpha: null }))).toBeNull();
    expect(contrastRule.evaluate(baseSnapshot({ background: null }))).toBeNull();
    expect(contrastRule.evaluate(baseSnapshot({ backgroundAlpha: null }))).toBeNull();
    expect(contrastRule.evaluate(baseSnapshot({ backgroundSource: null }))).toBeNull();
    expect(contrastRule.evaluate(baseSnapshot({ fontSizePx: null }))).toBeNull();
    expect(contrastRule.evaluate(baseSnapshot({ isBold: null }))).toBeNull();
  });
});
