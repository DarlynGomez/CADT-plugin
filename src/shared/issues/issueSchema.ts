import type { Issue, IssueState } from "./issueTypes";

const VALID_STATES: ReadonlySet<string> = new Set([
  "open",
  "deferred",
  "acknowledged",
  "important",
  "resolved"
]);
const VALID_SEVERITIES: ReadonlySet<string> = new Set(["low", "medium", "high"]);

function isValidState(value: unknown): value is IssueState {
  return typeof value === "string" && VALID_STATES.has(value);
}

/** Exactly the fields spec section 5.5 says to store; ruleId and nodeId live in the map key */
export type PersistedIssueFields = Omit<Issue, "id" | "ruleId" | "nodeId">;

function hasValidPersistedFields(issue: Record<string, unknown>): boolean {
  const hasRequiredFields =
    isValidState(issue.state) &&
    typeof issue.severityAtLastDetection === "string" &&
    VALID_SEVERITIES.has(issue.severityAtLastDetection) &&
    typeof issue.encounterCount === "number" &&
    typeof issue.lastDetectedAt === "string";

  if (!hasRequiredFields) {
    return false;
  }
  if (issue.acknowledgedReason !== undefined && typeof issue.acknowledgedReason !== "string") {
    return false;
  }
  if (issue.acknowledgedAt !== undefined && typeof issue.acknowledgedAt !== "string") {
    return false;
  }
  if (
    issue.severityAtAcknowledgment !== undefined &&
    (typeof issue.severityAtAcknowledgment !== "string" ||
      !VALID_SEVERITIES.has(issue.severityAtAcknowledgment))
  ) {
    return false;
  }
  if (
    issue.changedSinceAcknowledgment !== undefined &&
    typeof issue.changedSinceAcknowledgment !== "boolean"
  ) {
    return false;
  }
  return true;
}

/** Structural validation for the on-disk shape: section 5.5's fields, nothing more */
export function isPersistedIssueFields(value: unknown): value is PersistedIssueFields {
  if (!value || typeof value !== "object") {
    return false;
  }
  return hasValidPersistedFields(value as Record<string, unknown>);
}

/** Structural validation for a full, reconstructed issue, id/ruleId/nodeId included */
export function isIssue(value: unknown): value is Issue {
  if (!value || typeof value !== "object") {
    return false;
  }
  const issue = value as Record<string, unknown>;
  if (
    typeof issue.id !== "string" ||
    typeof issue.ruleId !== "string" ||
    typeof issue.nodeId !== "string"
  ) {
    return false;
  }
  return hasValidPersistedFields(issue);
}
