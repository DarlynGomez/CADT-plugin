import {
  deferIssue,
  flagImportant,
  ignoreIssue,
  reopenIssue,
  type TransitionOutcome
} from "./stateMachine";
import type { IssueRecordMap } from "./issueStore";
import type { Issue } from "../../shared/issues/issueTypes";

export interface GroupActionOutcome {
  issueId: string;
  ok: boolean;
  reason?: string;
}

export interface GroupTransitionResult {
  record: IssueRecordMap;
  outcomes: readonly GroupActionOutcome[];
}

/**
 * GROUPING_SPEC.md 3.3: every group action is a set of ordinary per-instance
 * transitions through the existing state machine, nothing bypasses it. One outcome per
 * requested issueId, so a caller can tell "not eligible in this state" apart from "no
 * longer exists" without inspecting the record itself
 */
function applyToEach(
  record: IssueRecordMap,
  issueIds: readonly string[],
  transition: (issue: Issue) => TransitionOutcome
): GroupTransitionResult {
  let updated = record;
  const outcomes: GroupActionOutcome[] = [];
  for (const issueId of issueIds) {
    const issue = updated[issueId];
    if (!issue) {
      outcomes.push({ issueId, ok: false, reason: "That issue no longer exists." });
      continue;
    }
    const result = transition(issue);
    if (!result.ok) {
      outcomes.push({ issueId, ok: false, reason: result.reason });
      continue;
    }
    updated = { ...updated, [issueId]: result.issue };
    outcomes.push({ issueId, ok: true });
  }
  return { record: updated, outcomes };
}

/** Every open instance in the root becomes deferred; important instances are left alone */
export function deferRoot(
  record: IssueRecordMap,
  issueIds: readonly string[]
): GroupTransitionResult {
  const eligible = issueIds.filter((id) => record[id]?.state === "open");
  return applyToEach(record, eligible, deferIssue);
}

/** Every instance becomes important; the state machine's own transitions decide which are eligible */
export function markRootImportant(
  record: IssueRecordMap,
  issueIds: readonly string[]
): GroupTransitionResult {
  return applyToEach(record, issueIds, flagImportant);
}

/** Unmarking returns important instances to open, and only those: not deferred or ignored ones */
export function unmarkRootImportant(
  record: IssueRecordMap,
  issueIds: readonly string[]
): GroupTransitionResult {
  const eligible = issueIds.filter((id) => record[id]?.state === "important");
  return applyToEach(record, eligible, reopenIssue);
}

/** One reason, applied to every instance the designer includes */
export function ignoreRoot(
  record: IssueRecordMap,
  issueIds: readonly string[],
  reason: string,
  at: string
): GroupTransitionResult {
  return applyToEach(record, issueIds, (issue) => ignoreIssue(issue, reason, at));
}

/** Section 6.5's Decisions-view Reopen control: only ignored instances return to open */
export function reopenRoot(
  record: IssueRecordMap,
  issueIds: readonly string[]
): GroupTransitionResult {
  const eligible = issueIds.filter((id) => record[id]?.state === "ignored");
  return applyToEach(record, eligible, reopenIssue);
}

/** The deferred card's restore control: only deferred instances return to open */
export function restoreDeferredRoot(
  record: IssueRecordMap,
  issueIds: readonly string[]
): GroupTransitionResult {
  const eligible = issueIds.filter((id) => record[id]?.state === "deferred");
  return applyToEach(record, eligible, reopenIssue);
}
