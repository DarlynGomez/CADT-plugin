import type { PluginToUiMessage } from "../../shared/messageTypes";
import type { RootMessage } from "../../shared/rootMessageTypes";
import {
  loadDecisions,
  recordDecision,
  saveDecisions,
  type DecisionRecordMap
} from "../accountability/decisionStore";
import {
  deferRoot,
  ignoreRoot,
  markRootImportant,
  reopenRoot,
  unmarkRootImportant,
  type GroupTransitionResult
} from "../accountability/groupActions";
import { loadIssues, saveIssues, type IssueRecordMap } from "../accountability/issueStore";
import { buildIssuesUpdatedMessage } from "./issueDisplay";

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
    case "ROOT_REOPEN":
      return hasIssueIds();
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
  }
}

/**
 * GROUPING_SPEC.md 3.4: a root's ignore action also records a decision. Severity comes
 * from the just-updated record rather than a live re-evaluation: ignoreIssue
 * already set severityAtIgnore on every instance that succeeded, and every
 * instance in a root shares one severity by construction of the signature, so any one
 * of them stands for the root.
 */
function recordRootDecision(
  message: Extract<RootMessage, { type: "ROOT_IGNORE" }>,
  updatedRecord: IssueRecordMap,
  decisions: DecisionRecordMap,
  at: string
): void {
  const severityAtDecision = message.issueIds
    .map((id) => updatedRecord[id]?.severityAtIgnore)
    .find((severity) => severity !== undefined);
  if (!severityAtDecision) {
    return;
  }

  const updatedDecisions = recordDecision(decisions, {
    signature: message.signature,
    reason: message.reason,
    recordedAt: at,
    severityAtDecision
  });
  const saveResult = saveDecisions(updatedDecisions);
  if (!saveResult.saved) {
    console.error("ROOT_IGNORE: decision could not be saved", saveResult.error);
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

  reply(await buildIssuesUpdatedMessage(result.record));
}
