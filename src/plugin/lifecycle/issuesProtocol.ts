import { parseIssueId } from "../../shared/issues/issueId";
import type { Issue } from "../../shared/issues/issueTypes";
import type { IssueMessage, PluginToUiMessage } from "../../shared/messageTypes";
import { loadIssues, saveIssues, type IssueRecordMap } from "../accountability/issueStore";
import { buildDisplayList } from "./issueDisplay";
import { markIssueDeferred } from "./selectionListener";
import {
  acknowledgeIssue,
  deferIssue,
  flagImportant,
  reopenIssue,
  type TransitionOutcome
} from "../accountability/stateMachine";

type Reply = (message: PluginToUiMessage) => void;

/** Validates both the message type and the shape its fields must carry */
export function isIssueMessage(value: unknown): value is IssueMessage {
  if (!value || typeof value !== "object") {
    return false;
  }
  const message = value as Record<string, unknown>;

  switch (message.type) {
    case "ISSUES_SUBSCRIBE":
      return true;
    case "ISSUE_DEFER":
    case "ISSUE_FLAG_IMPORTANT":
    case "ISSUE_REOPEN":
    case "ISSUE_FOCUS":
      return typeof message.issueId === "string";
    case "ISSUE_ACKNOWLEDGE":
      return typeof message.issueId === "string" && typeof message.reason === "string";
    default:
      return false;
  }
}

function actionFailed(issueId: string, message: string): PluginToUiMessage {
  return { type: "ISSUE_ACTION_FAILED", issueId, message };
}

async function replyWithFullList(reply: Reply): Promise<void> {
  const record = await loadIssues();
  reply({ type: "ISSUES_UPDATED", issues: await buildDisplayList(record) });
}

/**
 * Load the record, apply a designer-initiated transition to one issue, and save.
 * On success the reply is the full updated list, per ADR-012. On a rejected
 * transition or a failed save, the reply is ISSUE_ACTION_FAILED and nothing is
 * saved, so the UI never shows a change that did not actually persist.
 */
async function applyTransition(
  issueId: string,
  reply: Reply,
  transition: (record: IssueRecordMap) => TransitionOutcome | { ok: false; reason: string },
  onSaved?: () => void
): Promise<void> {
  const record = await loadIssues();
  const result = transition(record);

  if (!result.ok) {
    reply(actionFailed(issueId, result.reason));
    return;
  }

  const updated: IssueRecordMap = { ...record, [issueId]: result.issue };
  const saveResult = saveIssues(updated);
  if (!saveResult.saved) {
    reply(actionFailed(issueId, saveResult.error ?? "The change could not be saved."));
    return;
  }

  onSaved?.();
  reply({ type: "ISSUES_UPDATED", issues: await buildDisplayList(updated) });
}

function transitionFor(record: IssueRecordMap, issueId: string, apply: (issue: Issue) => TransitionOutcome) {
  const issue = record[issueId];
  if (!issue) {
    return { ok: false as const, reason: "That issue no longer exists." };
  }
  return apply(issue);
}

/** Selects the node and scrolls it into view. Never creates or modifies a canvas node. */
async function focusIssue(issueId: string, reply: Reply): Promise<void> {
  const parsed = parseIssueId(issueId);
  if (!parsed) {
    reply(actionFailed(issueId, "That issue id could not be read."));
    return;
  }

  const node = await figma.getNodeByIdAsync(parsed.nodeId);
  if (!node || node.type === "DOCUMENT" || node.type === "PAGE") {
    reply(actionFailed(issueId, "That node no longer exists in this file."));
    return;
  }

  figma.currentPage.selection = [node];
  figma.viewport.scrollAndZoomIntoView([node]);
}

/** Handles the six inbound issue messages, per spec section 6 */
export async function handleIssueMessage(message: IssueMessage, reply: Reply): Promise<void> {
  switch (message.type) {
    case "ISSUES_SUBSCRIBE":
      await replyWithFullList(reply);
      return;
    case "ISSUE_DEFER":
      // On defer, arm the re-encounter guard so an issue whose node is still selected
      // does not resurface the instant selection changes elsewhere and back. See
      // spec section 5.3.
      await applyTransition(
        message.issueId,
        reply,
        (record) => transitionFor(record, message.issueId, deferIssue),
        () => markIssueDeferred(message.issueId)
      );
      return;
    case "ISSUE_FLAG_IMPORTANT":
      await applyTransition(message.issueId, reply, (record) =>
        transitionFor(record, message.issueId, flagImportant)
      );
      return;
    case "ISSUE_REOPEN":
      await applyTransition(message.issueId, reply, (record) =>
        transitionFor(record, message.issueId, reopenIssue)
      );
      return;
    case "ISSUE_ACKNOWLEDGE":
      await applyTransition(message.issueId, reply, (record) =>
        transitionFor(record, message.issueId, (issue) =>
          acknowledgeIssue(issue, message.reason, new Date().toISOString())
        )
      );
      return;
    case "ISSUE_FOCUS":
      await focusIssue(message.issueId, reply);
      return;
  }
}
