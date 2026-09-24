import type { IssueRecordMap } from "../accountability/issueStore";
import { RULES } from "../detection/rules/registry";
import type { Issue, IssueSummary } from "../../shared/issues/issueTypes";
import { resolveTextNodeSnapshot } from "./resolveSnapshot";

async function enrichForDisplay(issue: Issue): Promise<IssueSummary> {
  const snapshot = await resolveTextNodeSnapshot(issue.nodeId);
  if (!snapshot) {
    return { ...issue, nodeName: "(node not found)" };
  }

  const rule = RULES.find((registered) => registered.id === issue.ruleId);
  const finding = rule ? rule.evaluate(snapshot) : null;
  return {
    ...issue,
    nodeName: snapshot.nodeName,
    screenId: snapshot.screenId,
    screenName: snapshot.screenName,
    evidence: finding?.evidence
  };
}

/**
 * Build the panel's view of the record: node name, screen identity, and evidence, the
 * measured ratio against the required one for contrast, recomputed live rather than
 * trusted from a stale persisted value, since section 5.5 stores none of them
 */
export async function buildDisplayList(record: IssueRecordMap): Promise<IssueSummary[]> {
  return Promise.all(Object.values(record).map(enrichForDisplay));
}
