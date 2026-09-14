import {
  applySelectionChange,
  initializeReEncounterState,
  markDeferred,
  type DeferredIssueRef,
  type ReEncounterState
} from "../accountability/reEncounter";
import { recordResurface } from "../accountability/stateMachine";
import type { PluginToUiMessage } from "../../shared/messageTypes";
import { loadIssues, saveIssues, type IssueRecordMap } from "../accountability/issueStore";
import { buildDisplayList } from "./issueDisplay";

let reEncounterState: ReEncounterState = { waitingForSelectionToLeave: new Set() };

function collectDescendantIds(node: BaseNode, ids: Set<string>): void {
  ids.add(node.id);
  if ("children" in node) {
    for (const child of node.children) {
      collectDescendantIds(child, ids);
    }
  }
}

/**
 * The ids that count as "selected" for re-encounter purposes: every selected node
 * plus all of its descendants. Spec 5.3 resurfaces a deferred issue when its node OR
 * AN ANCESTOR of its node is selected; expanding each selected node downward, rather
 * than walking each issue's node upward, is what makes a plain `.has(issue.nodeId)`
 * check in reEncounter.ts correct for the ancestor case.
 */
function collectSelectedIdsIncludingDescendants(): Set<string> {
  const ids = new Set<string>();
  for (const node of figma.currentPage.selection) {
    collectDescendantIds(node, ids);
  }
  return ids;
}

function deferredRefs(record: IssueRecordMap): DeferredIssueRef[] {
  return Object.values(record)
    .filter((issue) => issue.state === "deferred")
    .map((issue) => ({ id: issue.id, nodeId: issue.nodeId }));
}

/** Called once at startup so a node still selected on reopen does not resurface instantly */
export async function initializeReEncounterFromCurrentSelection(): Promise<void> {
  const record = await loadIssues();
  reEncounterState = initializeReEncounterState(
    collectSelectedIdsIncludingDescendants(),
    deferredRefs(record)
  );
}

/** Called by the DEFER handler so deferring while still selected does not resurface it instantly */
export function markIssueDeferred(issueId: string): void {
  reEncounterState = markDeferred(reEncounterState, issueId);
}

export async function handleSelectionChange(): Promise<void> {
  const record = await loadIssues();
  const outcome = applySelectionChange(
    reEncounterState,
    collectSelectedIdsIncludingDescendants(),
    deferredRefs(record)
  );
  reEncounterState = outcome.state;

  if (outcome.resurfacedIssueIds.length === 0) {
    return;
  }

  let updated = record;
  for (const issueId of outcome.resurfacedIssueIds) {
    const issue = updated[issueId];
    if (issue) {
      updated = { ...updated, [issueId]: recordResurface(issue) };
    }
  }

  const saveResult = saveIssues(updated);
  if (!saveResult.saved) {
    console.error("selectionchange: failed to persist resurfaced issues", saveResult.error);
    return;
  }

  const message: PluginToUiMessage = { type: "ISSUES_UPDATED", issues: await buildDisplayList(updated) };
  figma.ui.postMessage(message);
}

export function registerSelectionChangeListener(): void {
  figma.on("selectionchange", () => {
    void handleSelectionChange();
  });
}
