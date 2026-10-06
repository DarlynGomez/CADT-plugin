const SEPARATOR = ":";

/** Id is rule id plus node id, split on the first colon since node ids contain colons */
export function buildIssueId(ruleId: string, nodeId: string): string {
  return `${ruleId}${SEPARATOR}${nodeId}`;
}

export interface ParsedIssueId {
  ruleId: string;
  nodeId: string;
}

/** Returns null for a malformed id rather than throwing, so a bad stored record is skippable */
export function parseIssueId(issueId: string): ParsedIssueId | null {
  const separatorIndex = issueId.indexOf(SEPARATOR);
  if (separatorIndex <= 0 || separatorIndex === issueId.length - 1) {
    return null;
  }
  return {
    ruleId: issueId.slice(0, separatorIndex),
    nodeId: issueId.slice(separatorIndex + 1)
  };
}
