import type { IssueState } from "../issues/issueTypes";
import type { RootDisplayState, RootStateBreakdown } from "./groupingTypes";

export interface DerivedRootState {
  displayState: RootDisplayState;
  breakdown: RootStateBreakdown;
}

/**
 * Spec section 3.2's precedence over one root's instance states: any important wins
 * outright, then any open, then any deferred; a root whose instances are every one
 * acknowledged or resolved has left the working set and moved to the Decisions view.
 * The breakdown always reflects every instance's real state, even when the displayed
 * state was decided by only one of them, so a mixed root can say "98 open, 3 deferred"
 * rather than hiding the mix.
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
