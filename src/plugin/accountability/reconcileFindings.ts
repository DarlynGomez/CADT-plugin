import { buildIssueId } from "../../shared/issues/issueId";
import type { Finding } from "../../shared/issues/issueTypes";
import { RULES } from "../detection/rules/registry";
import type { IssueRecordMap } from "./issueStore";
import { createIssue, reconcileDetection } from "./stateMachine";

/**
 * Applies one scan to the record, for the scanned nodes only
 * A missing finding marks the issue resolved instead of deleting it
 * Ignored issues are handled by the state machine
 */
export function reconcileScanResults(
  record: IssueRecordMap,
  scannedNodeIds: ReadonlySet<string>,
  findings: readonly Finding[],
  detectedAt: string
): IssueRecordMap {
  const findingByIssueId = new Map(
    findings.map((finding) => [buildIssueId(finding.ruleId, finding.nodeId), finding])
  );
  const updated: IssueRecordMap = { ...record };

  for (const nodeId of scannedNodeIds) {
    for (const rule of RULES) {
      const issueId = buildIssueId(rule.id, nodeId);
      const finding = findingByIssueId.get(issueId);
      const existing = updated[issueId];

      if (finding) {
        updated[issueId] = existing
          ? reconcileDetection(existing, finding.severity, detectedAt)
          : createIssue(issueId, rule.id, nodeId, finding.severity, detectedAt);
      } else if (existing) {
        updated[issueId] = reconcileDetection(existing, null, detectedAt);
      }
    }
  }

  return updated;
}
