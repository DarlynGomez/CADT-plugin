import { buildRootSignature } from "../issues/rootSignature";
import { isSeverityWorse } from "../issues/severityRank";
import type { DecisionMatch, GroupableFinding, RootDecision } from "./groupingTypes";

export type MatchableFinding = Pick<
  GroupableFinding,
  "foregroundHex" | "backgroundHex" | "foregroundBinding" | "requiredRatio" | "severity"
>;

/**
 * Spec section 3.4: a new open instance whose signature matches a recorded decision is
 * never acknowledged automatically, that would be the tool closing an issue on the
 * designer's behalf, which the absolute rule forbids. Instead the offer to apply the
 * same reason is one confirmation away, unless ADR-014's worse-severity rule already
 * applies: a decision recorded at a better band than what is showing now is not offered,
 * since the designer accepted a specific tradeoff and a materially worse version of it
 * is a different one.
 */
export function matchDecision(
  finding: MatchableFinding,
  decisionsBySignature: Readonly<Record<string, RootDecision>>
): DecisionMatch {
  const signature = buildRootSignature({
    foregroundHex: finding.foregroundHex,
    backgroundHex: finding.backgroundHex,
    foregroundBinding: finding.foregroundBinding,
    requiredRatio: finding.requiredRatio
  });

  const decision = decisionsBySignature[signature];
  if (!decision) {
    return { offered: false, decision: null, reason: "no-match" };
  }

  if (isSeverityWorse(finding.severity, decision.severityAtDecision)) {
    return { offered: false, decision, reason: "worse-severity" };
  }

  return { offered: true, decision };
}
