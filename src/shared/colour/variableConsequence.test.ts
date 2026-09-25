import { describe, expect, it } from "vitest";

import { evaluateConsumer, summarizeVariableConsequence } from "./variableConsequence";

const WHITE = { r: 1, g: 1, b: 1 };
const BLACK = { r: 0, g: 0, b: 0 };
const MID_GRAY = { r: 0.5, g: 0.5, b: 0.5 };
const DARK_SURFACE = { r: 0.05, g: 0.05, b: 0.05 };

describe("evaluateConsumer", () => {
  it("returns null for an indeterminate consumer", () => {
    expect(
      evaluateConsumer(
        { foreground: null, background: WHITE, fontSizePx: 16, isBold: false },
        "Label",
        BLACK
      )
    ).toBeNull();
  });

  it("reports currentlyPasses and wouldPass independently", () => {
    const outcome = evaluateConsumer(
      { foreground: MID_GRAY, background: WHITE, fontSizePx: 16, isBold: false },
      "Caption",
      BLACK
    );
    expect(outcome).toEqual({ nodeName: "Caption", currentlyPasses: false, wouldPass: true });
  });

  it("uses the large text threshold for large, bold text", () => {
    const outcome = evaluateConsumer(
      { foreground: MID_GRAY, background: WHITE, fontSizePx: 24, isBold: true },
      "Heading",
      MID_GRAY
    );
    expect(outcome?.currentlyPasses).toBe(true);
  });
});

describe("summarizeVariableConsequence", () => {
  it("counts only consumers that currently pass and would stop passing", () => {
    const outcomes = [
      { nodeName: "A", currentlyPasses: true, wouldPass: false },
      { nodeName: "B", currentlyPasses: true, wouldPass: true },
      { nodeName: "C", currentlyPasses: false, wouldPass: false },
      { nodeName: "D", currentlyPasses: true, wouldPass: false }
    ];

    const summary = summarizeVariableConsequence(outcomes);
    expect(summary).toEqual({
      totalConsumers: 4,
      newlyFailingCount: 2,
      newlyFailingNames: ["A", "D"]
    });
  });

  it("reports zero newly failing over an empty or all-safe list", () => {
    expect(summarizeVariableConsequence([])).toEqual({
      totalConsumers: 0,
      newlyFailingCount: 0,
      newlyFailingNames: []
    });
  });
});
