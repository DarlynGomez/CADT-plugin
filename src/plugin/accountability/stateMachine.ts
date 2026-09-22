import type { Issue, IssueState, Severity } from "../../shared/issues/issueTypes";
import { isSeverityWorse } from "../../shared/issues/severityRank";

export type TransitionOutcome = { ok: true; issue: Issue } | { ok: false; reason: string };

function rejected(reason: string): TransitionOutcome {
  return { ok: false, reason };
}

function accepted(issue: Issue): TransitionOutcome {
  return { ok: true, issue };
}

/** A brand new issue: always starts open, with no encounters yet */
export function createIssue(
  id: string,
  ruleId: string,
  nodeId: string,
  severity: Severity,
  detectedAt: string
): Issue {
  return {
    id,
    ruleId,
    nodeId,
    state: "open",
    severityAtLastDetection: severity,
    encounterCount: 0,
    lastDetectedAt: detectedAt
  };
}

const DEFERRABLE_FROM: ReadonlySet<IssueState> = new Set(["open", "important"]);
const FLAGGABLE_FROM: ReadonlySet<IssueState> = new Set(["open", "deferred"]);
const ACKNOWLEDGABLE_FROM: ReadonlySet<IssueState> = new Set(["open", "deferred", "important"]);
const REOPENABLE_FROM: ReadonlySet<IssueState> = new Set(["deferred", "important", "acknowledged"]);

/** open or important to deferred: put off, not dismissed */
export function deferIssue(issue: Issue): TransitionOutcome {
  if (!DEFERRABLE_FROM.has(issue.state)) {
    return rejected(`Cannot defer an issue in state '${issue.state}'`);
  }
  return accepted({ ...issue, state: "deferred" });
}

/** open or deferred to important: designer-flagged, steady, never fades */
export function flagImportant(issue: Issue): TransitionOutcome {
  if (!FLAGGABLE_FROM.has(issue.state)) {
    return rejected(`Cannot flag an issue in state '${issue.state}' as important`);
  }
  return accepted({ ...issue, state: "important" });
}

/**
 * open, deferred, or important to acknowledged. Requires a non-empty reason, enforced
 * here and not only in the UI, so a malformed message cannot bypass the invariant.
 */
export function acknowledgeIssue(issue: Issue, reason: string, at: string): TransitionOutcome {
  if (!ACKNOWLEDGABLE_FROM.has(issue.state)) {
    return rejected(`Cannot acknowledge an issue in state '${issue.state}'`);
  }
  if (reason.trim().length === 0) {
    return rejected("Acknowledgment requires a non-empty reason");
  }
  return accepted({
    ...issue,
    state: "acknowledged",
    acknowledgedReason: reason,
    acknowledgedAt: at,
    severityAtAcknowledgment: issue.severityAtLastDetection,
    changedSinceAcknowledgment: false
  });
}

/** deferred, important, or acknowledged back to open, only by an explicit designer action */
export function reopenIssue(issue: Issue): TransitionOutcome {
  if (!REOPENABLE_FROM.has(issue.state)) {
    return rejected(`Cannot reopen an issue in state '${issue.state}'`);
  }
  return accepted({ ...issue, state: "open" });
}

/** A deferred issue's node was selected again after the guard cleared. See reEncounter.ts. */
export function recordResurface(issue: Issue): Issue {
  return { ...issue, encounterCount: issue.encounterCount + 1 };
}

/**
 * Reconcile a fresh detection pass against an existing issue record. Nothing here ever
 * closes an issue because the tool decided to: resolved only happens because the
 * finding genuinely stopped, and reopening from resolved keeps the same record rather
 * than creating a new one, so its history survives. See spec section 5.1.
 *
 * Acknowledged is the one state a fresh finding can override, and only one way: a
 * worse severity band than the one acknowledged reopens the issue once, marked
 * changedSinceAcknowledgment. Same or better severity leaves the acknowledgment
 * standing. This is ADR-014, flagged there as a judgment call, not settled.
 */
export function reconcileDetection(
  issue: Issue,
  latestSeverity: Severity | null,
  detectedAt: string
): Issue {
  if (latestSeverity === null) {
    return issue.state === "resolved" ? issue : { ...issue, state: "resolved" };
  }

  if (issue.state === "resolved") {
    return {
      ...issue,
      state: "open",
      severityAtLastDetection: latestSeverity,
      lastDetectedAt: detectedAt
    };
  }

  if (issue.state === "acknowledged") {
    const worsened = issue.severityAtAcknowledgment
      ? isSeverityWorse(latestSeverity, issue.severityAtAcknowledgment)
      : false;
    return {
      ...issue,
      state: worsened ? "open" : "acknowledged",
      changedSinceAcknowledgment: worsened ? true : issue.changedSinceAcknowledgment,
      severityAtLastDetection: latestSeverity,
      lastDetectedAt: detectedAt
    };
  }

  return { ...issue, severityAtLastDetection: latestSeverity, lastDetectedAt: detectedAt };
}
