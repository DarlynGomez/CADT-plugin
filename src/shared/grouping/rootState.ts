import type { IssueState } from "../issues/issueTypes";
import type { RootDisplayState, RootStateBreakdown } from "./groupingTypes";

export interface DerivedRootState {
  displayState: RootDisplayState;
  breakdown: RootStateBreakdown;
}

/**
 * Important wins, then open, then deferred, all ignored or resolved means decided
 * The breakdown always counts every real state
 */
export function deriveRootState(states: readonly IssueState[]): DerivedRootState {
  const breakdown: Partial<Record<IssueState, number>> = {};
  for (const state of states) {
    breakdown[state] = (breakdown[state] ?? 0) + 1;
  }

  const displayState: RootDisplayState = breakdown.important
    ? "important"
    : breakdown.open
      ? "open"
      : breakdown.deferred
        ? "deferred"
        : "decided";

  return { displayState, breakdown };
}
