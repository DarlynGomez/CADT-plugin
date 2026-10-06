/** Session only state, deferred issues waiting for their node to leave the selection */
export interface ReEncounterState {
  waitingForSelectionToLeave: ReadonlySet<string>;
}

export interface DeferredIssueRef {
  id: string;
  nodeId: string;
}

/** A deferred issue already selected starts armed so reopening the plugin does not resurface it */
export function initializeReEncounterState(
  selectedNodeIds: ReadonlySet<string>,
  deferredIssues: readonly DeferredIssueRef[]
): ReEncounterState {
  const waiting = new Set<string>();
  for (const issue of deferredIssues) {
    if (selectedNodeIds.has(issue.nodeId)) {
      waiting.add(issue.id);
    }
  }
  return { waitingForSelectionToLeave: waiting };
}

/** Arm the guard on defer, so deferring while still selected does not resurface it instantly */
export function markDeferred(state: ReEncounterState, issueId: string): ReEncounterState {
  const waiting = new Set(state.waitingForSelectionToLeave);
  waiting.add(issueId);
  return { waitingForSelectionToLeave: waiting };
}

/** Drop the guard, for example when an issue leaves the deferred state entirely */
export function forgetIssue(state: ReEncounterState, issueId: string): ReEncounterState {
  if (!state.waitingForSelectionToLeave.has(issueId)) {
    return state;
  }
  const waiting = new Set(state.waitingForSelectionToLeave);
  waiting.delete(issueId);
  return { waitingForSelectionToLeave: waiting };
}

export interface ReEncounterOutcome {
  state: ReEncounterState;
  resurfacedIssueIds: readonly string[];
}

/** Resurfaces a selected issue once then re-arms, clears the guard when its node leaves */
export function applySelectionChange(
  state: ReEncounterState,
  selectedNodeIds: ReadonlySet<string>,
  deferredIssues: readonly DeferredIssueRef[]
): ReEncounterOutcome {
  const waiting = new Set(state.waitingForSelectionToLeave);
  const resurfaced: string[] = [];

  for (const issue of deferredIssues) {
    const isSelected = selectedNodeIds.has(issue.nodeId);
    if (!isSelected) {
      waiting.delete(issue.id);
      continue;
    }
    if (!waiting.has(issue.id)) {
      resurfaced.push(issue.id);
      waiting.add(issue.id);
    }
  }

  return { state: { waitingForSelectionToLeave: waiting }, resurfacedIssueIds: resurfaced };
}
