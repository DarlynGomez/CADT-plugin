import { readContrastEvidence } from "../issues/contrastEvidenceView";
import type { IssueSummary } from "../issues/issueTypes";
import type { GroupableFinding } from "./groupingTypes";

/**
 * Turns one IssueSummary from the live list the panel already receives into the plain
 * data deriveRoots needs. Returns null for an issue grouping cannot use: not contrast,
 * or evidence that never resolved, the same indeterminate case ADR-010 already treats
 * as no finding, so a resolved issue is filtered out here exactly because it carries
 * none. backgroundBinding is always null for now: nothing in the pipeline resolves a
 * background's own binding yet, only the foreground's, see ADR-019 on why that
 * asymmetry is deliberate for the signature and incidental for this one field.
 *
 * documentOrder is the issue's position in the list the sandbox sent, not a true
 * document-walk order; nothing assigns one yet. Stable enough for a deterministic
 * representative-instance tiebreak, section 3.5, not a promise of top-to-bottom order.
 */
export function assembleGroupableFinding(
  issue: IssueSummary,
  documentOrder: number
): GroupableFinding | null {
  const evidence = readContrastEvidence(issue.ruleId, issue.evidence);
  if (!evidence || evidence.foregroundBinding === undefined) {
    return null;
  }
  if (issue.screenId === undefined || issue.screenName === undefined) {
    return null;
  }

  return {
    issueId: issue.id,
    nodeId: issue.nodeId,
    nodeName: issue.nodeName,
    screenId: issue.screenId,
    screenName: issue.screenName,
    state: issue.state,
    severity: issue.severityAtLastDetection,
    measuredRatio: evidence.measuredRatio,
    requiredRatio: evidence.requiredRatio,
    foregroundHex: evidence.foregroundHex,
    backgroundHex: evidence.backgroundHex,
    foregroundBinding: evidence.foregroundBinding,
    backgroundBinding: null,
    documentOrder
  };
}

/** Assembles the whole list, dropping whatever a single issue's assembly could not use */
export function assembleGroupableFindings(issues: readonly IssueSummary[]): GroupableFinding[] {
  return issues
    .map((issue, index) => assembleGroupableFinding(issue, index))
    .filter((finding): finding is GroupableFinding => finding !== null);
}
