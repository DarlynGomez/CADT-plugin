import type { GroupableFinding } from "./groupingTypes";

export interface SecondaryGroup {
  key: string;
  instances: readonly GroupableFinding[];
}

function groupBy(
  findings: readonly GroupableFinding[],
  keyOf: (finding: GroupableFinding) => string
): SecondaryGroup[] {
  const byKey = new Map<string, GroupableFinding[]>();
  for (const finding of findings) {
    const key = keyOf(finding);
    const group = byKey.get(key);
    if (group) {
      group.push(finding);
    } else {
      byKey.set(key, [finding]);
    }
  }
  return [...byKey.entries()].map(([key, instances]) => ({ key, instances }));
}

/**
 * Spec section 6.2's "Screen" view: the same flat instance list, bucketed by screen
 * instead of root. Keyed by screenId, not screenName, since two screens can share a
 * name, MARKERS_SPEC.md 5.1; every instance in a group shares one screenName for display
 */
export function groupByScreen(findings: readonly GroupableFinding[]): SecondaryGroup[] {
  return groupBy(findings, (finding) => finding.screenId);
}

/** Spec section 6.2's "Severity" view: the same flat instance list, bucketed by severity band */
export function groupBySeverity(findings: readonly GroupableFinding[]): SecondaryGroup[] {
  return groupBy(findings, (finding) => finding.severity);
}
