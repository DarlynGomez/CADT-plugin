import { buildIssueId } from "../../shared/issues/issueId";
import type { Finding } from "../../shared/issues/issueTypes";
import { RULES } from "../detection/rules/registry";
import type { IssueRecordMap } from "./issueStore";
import { createIssue, reconcileDetection } from "./stateMachine";

/**
 * Reconcile one scan's findings against the persisted record, for exactly the node
 * ids that were scanned. A finding creates a new issue or updates an existing one; the
 * absence of one for an already-tracked (rule, node) pair resolves that issue rather
 * than deleting its record, per section 5.1. A node outside the scanned set is left
 * completely untouched: no signal this pass, no verdict this pass.
 *
 * Ignored issues are handled by reconcileDetection itself (ADR-014): a same or
 * better severity leaves the ignore standing, so a finding for an already
 * ignored issue does not reappear in the active list just because it recurred.
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
