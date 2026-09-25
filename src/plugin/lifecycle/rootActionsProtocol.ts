import type { PluginToUiMessage } from "../../shared/messageTypes";
import type { RootMessage } from "../../shared/rootMessageTypes";
import { loadDecisions } from "../accountability/decisionStore";
import {
  deferRoot,
  ignoreRoot,
  markRootImportant,
  reopenRoot,
  restoreDeferredRoot,
  unmarkRootImportant,
  type GroupTransitionResult
} from "../accountability/groupActions";
import { loadIssues, saveIssues, type IssueRecordMap } from "../accountability/issueStore";
import { buildIssuesUpdatedMessage } from "./issueDisplay";
import { clearRootDecision, recordRootDecision } from "./rootDecisionEffects";

type Reply = (message: PluginToUiMessage) => void;

/** Validates both the message type and the shape its fields must carry */
export function isRootMessage(value: unknown): value is RootMessage {
  if (!value || typeof value !== "object") {
    return false;
  }
  const message = value as Record<string, unknown>;
  const hasIssueIds = () =>
    Array.isArray(message.issueIds) && message.issueIds.every((id) => typeof id === "string");

  switch (message.type) {
    case "ROOT_DEFER":
    case "ROOT_MARK_IMPORTANT":
    case "ROOT_UNMARK_IMPORTANT":
    case "ROOT_RESTORE_DEFERRED":
      return hasIssueIds();
    case "ROOT_REOPEN":
      return (
        hasIssueIds() &&
        typeof message.signature === "string" &&
        typeof message.clearDecision === "boolean"
      );
    case "ROOT_IGNORE":
      return (
        hasIssueIds() &&
        typeof message.reason === "string" &&
        typeof message.signature === "string" &&
        typeof message.fromDecisionOffer === "boolean"
      );
    default:
      return false;
  }
}

function failed(issueIds: readonly string[], message: string): PluginToUiMessage {
  return { type: "ROOT_ACTION_FAILED", issueIds, message };
}

function computeGroupResult(
  message: RootMessage,
  record: IssueRecordMap,
  at: string
): GroupTransitionResult {
  switch (message.type) {
    case "ROOT_DEFER":
      return deferRoot(record, message.issueIds);
    case "ROOT_MARK_IMPORTANT":
      return markRootImportant(record, message.issueIds);
    case "ROOT_UNMARK_IMPORTANT":
      return unmarkRootImportant(record, message.issueIds);
    case "ROOT_IGNORE":
      return ignoreRoot(record, message.issueIds, message.reason, at);
    case "ROOT_REOPEN":
      return reopenRoot(record, message.issueIds);
    case "ROOT_RESTORE_DEFERRED":
      return restoreDeferredRoot(record, message.issueIds);
  }
}

/** Handles every group-action message, per GROUPING_SPEC.md sections 3.3 and 3.4 */
export async function handleRootMessage(message: RootMessage, reply: Reply): Promise<void> {
  const record = await loadIssues();
  const at = new Date().toISOString();
  const result = computeGroupResult(message, record, at);

  const allFailed = result.outcomes.length > 0 && result.outcomes.every((outcome) => !outcome.ok);
  if (allFailed) {
    reply(
      failed(message.issueIds, result.outcomes[0].reason ?? "That action could not be completed.")
    );
    return;
  }

  const saveResult = saveIssues(result.record);
  if (!saveResult.saved) {
    reply(failed(message.issueIds, saveResult.error ?? "The change could not be saved."));
    return;
  }

  if (message.type === "ROOT_IGNORE") {
    recordRootDecision(message, result.record, loadDecisions(), at);
  }

  if (message.type === "ROOT_REOPEN" && message.clearDecision) {
    clearRootDecision(message.signature);
  }

  reply(await buildIssuesUpdatedMessage(result.record));
}
