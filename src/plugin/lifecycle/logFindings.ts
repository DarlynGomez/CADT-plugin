import type { Finding } from "../../shared/issues/issueTypes";

/**
 * Console-only reporting for phase 11: one line per finding, naming the node and
 * severity, so a specific flagged node can be confirmed by eye, plus one summary line.
 * Evidence is logged as-is since contrast is the only rule today; a real renderer for
 * it arrives with the panel in phase 13.
 */
export function logFindings(
  label: string,
  nodeIds: ReadonlySet<string>,
  findings: readonly Finding[]
): void {
  for (const finding of findings) {
    console.log(
      `[CADT] finding: ${finding.ruleId} severity=${finding.severity} node=${finding.nodeId}`,
      finding.evidence
    );
  }
  console.log(`[CADT] ${label}: ${findings.length} finding(s) across ${nodeIds.size} node(s)`);
}
