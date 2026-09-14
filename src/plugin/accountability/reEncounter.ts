/**
 * Runtime-only session state: which deferred issues are currently waiting for their
 * node to leave the selection before they can resurface. Never persisted. See
 * issueTypes.ts on why waitingForSelectionToLeave does not live on the stored Issue.
 */
export interface ReEncounterState {
  waitingForSelectionToLeave: ReadonlySet<string>;
}

export interface DeferredIssueRef {
  id: string;
  nodeId: string;
}

/**
 * Build the starting state. A deferred issue already selected at this moment is armed
 * immediately, exactly as if it had just been deferred, so reopening the plugin with
 * the node still selected does not resurface it on the spot. selectedNodeIds is
 * expected already expanded to include ancestors of the actual selection.
 */
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

/**
 * Decide which deferred issues resurface on a selection change. An issue whose node
 * has left the selection has its guard cleared. An issue whose node is selected and
 * whose guard is already clear resurfaces once, incrementing nothing itself (see
 * stateMachine.recordResurface for that), and re-arms its own guard so continued
 * selection does not resurface it again on the next event. No timers, no cooldown
 * constants: this is a pure function of the current selection and prior guard state.
 */
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
