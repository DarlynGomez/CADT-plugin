const SEPARATOR = ":";

/**
 * The only place issue ids are built or parsed. issueId = ruleId + ":" + nodeId.
 * Figma node ids already contain colons (for example "1:23"), so parsing splits on
 * only the first colon; everything after it, colons included, is the node id.
 */
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
