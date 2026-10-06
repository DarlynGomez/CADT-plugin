import { buildRootSignature } from "../issues/rootSignature";
import { isSeverityWorse } from "../issues/severityRank";
import type { DecisionMatch, GroupableFinding, Root, RootDecision } from "./groupingTypes";

export type MatchableFinding = Pick<
  GroupableFinding,
  "foregroundHex" | "backgroundHex" | "foregroundBinding" | "requiredRatio" | "severity"
>;

/** Offers a matching decision, never applies it, and skips it when severity got worse */
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

/** Same match for a root, any instance stands in for severity since all share it */
export function matchRootDecision(
  root: Pick<
    Root,
    "foregroundHex" | "backgroundHex" | "foregroundBinding" | "requiredRatio" | "instances"
  >,
  decisionsBySignature: Readonly<Record<string, RootDecision>>
): DecisionMatch {
  const severity = root.instances[0]?.severity;
  if (!severity) {
    return { offered: false, decision: null, reason: "no-match" };
  }
  return matchDecision(
    {
      foregroundHex: root.foregroundHex,
      backgroundHex: root.backgroundHex,
      foregroundBinding: root.foregroundBinding,
      requiredRatio: root.requiredRatio,
      severity
    },
    decisionsBySignature
  );
}
