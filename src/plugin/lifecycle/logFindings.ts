import type { Finding } from "../../shared/issues/issueTypes";
import type { ContrastEvidence } from "../detection/rules/contrast/contrastRule";
import { describeContrastEvidence } from "../detection/rules/contrast/describeEvidence";

/**
 * Evidence is typed per rule (see ADR-016) but logged generically
 */
const EVIDENCE_DESCRIBERS: Record<string, (evidence: unknown, severity: Finding["severity"]) => string> = {
  contrast: (evidence, severity) => describeContrastEvidence(evidence as ContrastEvidence, severity)
};

function describeFinding(finding: Finding): string {
  const describe = EVIDENCE_DESCRIBERS[finding.ruleId];
  return describe ? describe(finding.evidence, finding.severity) : JSON.stringify(finding.evidence);
}

/**
 * Console-only reporting with one line per finding, plus a summary line
 */
export function logFindings(
  label: string,
  nodeIds: ReadonlySet<string>,
  findings: readonly Finding[]
): void {
  for (const finding of findings) {
    console.log(`[CADT] finding: ${finding.ruleId} node=${finding.nodeId} ${describeFinding(finding)}`);
  }
  console.log(`[CADT] ${label}: ${findings.length} finding(s) across ${nodeIds.size} node(s)`);
}
