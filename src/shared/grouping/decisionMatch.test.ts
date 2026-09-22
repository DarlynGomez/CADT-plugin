import { describe, expect, it } from "vitest";

import { buildRootSignature } from "../issues/rootSignature";
import type { RootDecision } from "./groupingTypes";
import { matchDecision, type MatchableFinding } from "./decisionMatch";

const SAGE_ON_WHITE: MatchableFinding = {
  foregroundHex: "#9CB5B1",
  backgroundHex: "#FFFFFF",
  foregroundBinding: "sage/muted",
  requiredRatio: 4.5,
  severity: "high"
};

function decisionFor(
  finding: MatchableFinding,
  severityAtDecision: RootDecision["severityAtDecision"]
): RootDecision {
  return {
    signature: buildRootSignature(finding),
    reason: "Brand colour required by guidelines; tracked for the next brand review",
    recordedAt: "2026-09-01T00:00:00.000Z",
    severityAtDecision
  };
}

describe("matchDecision", () => {
  it("offers nothing when no decision matches the signature", () => {
    const result = matchDecision(SAGE_ON_WHITE, {});
    expect(result).toEqual({ offered: false, decision: null, reason: "no-match" });
  });

  it("offers the decision when the new instance is at the same severity", () => {
    const decision = decisionFor(SAGE_ON_WHITE, "high");
    const result = matchDecision(SAGE_ON_WHITE, { [decision.signature]: decision });
    expect(result).toEqual({ offered: true, decision });
  });

  it("offers the decision when the new instance is at a better severity", () => {
    const decision = decisionFor(SAGE_ON_WHITE, "high");
    const result = matchDecision(
      { ...SAGE_ON_WHITE, severity: "low" },
      { [decision.signature]: decision }
    );
    expect(result).toEqual({ offered: true, decision });
  });

  it("suppresses the offer when the new instance is at a worse severity than the decision", () => {
    const decision = decisionFor(SAGE_ON_WHITE, "low");
    const result = matchDecision(
      { ...SAGE_ON_WHITE, severity: "high" },
      { [decision.signature]: decision }
    );
    expect(result).toEqual({ offered: false, decision, reason: "worse-severity" });
  });

  it("does not match a decision recorded for a different required ratio", () => {
    const decision = decisionFor({ ...SAGE_ON_WHITE, requiredRatio: 3 }, "high");
    const result = matchDecision(SAGE_ON_WHITE, { [decision.signature]: decision });
    expect(result).toEqual({ offered: false, decision: null, reason: "no-match" });
  });
});
