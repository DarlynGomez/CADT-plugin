import type {
  AdjustApplyVariableMessage,
  AdjustReplyMessage,
  AdjustVariableConsequenceRequestMessage
} from "../../shared/adjustMessageTypes";
import { applyVariableAdjustment } from "../adjust/adapter/applyVariableAdjustment";
import { findVariableConsumers } from "../adjust/adapter/variableConsumers";
import { scanVariableConsequence } from "../adjust/adapter/variableConsequenceScan";
import { scanAndSync } from "./scanAndSync";

type Reply = (message: AdjustReplyMessage) => void;

function failed(issueId: string, message: string): AdjustReplyMessage {
  return { type: "ADJUST_ACTION_FAILED", issueId, message };
}

/** GROUPING_SPEC.md section 9: computed fresh for the exact candidate colour on screen */
export async function handleVariableConsequenceRequest(
  message: AdjustVariableConsequenceRequestMessage,
  reply: Reply
): Promise<void> {
  const consumers = findVariableConsumers(message.variableId);
  const consequence = await scanVariableConsequence(consumers, message.color);
  reply({ type: "ADJUST_VARIABLE_CONSEQUENCE_READY", issueId: message.issueId, ...consequence });
}

/**
 * Writes the candidate colour to the variable itself, then rescans every consumer so
 * the panel reflects every instance that changed, not only the one the sheet opened
 * on. See ADR-030 for the same "apply rescans itself" reasoning applied to a single
 * variable write instead of a set of direct fill writes.
 */
export async function handleApplyVariable(
  message: AdjustApplyVariableMessage,
  representative: TextNode,
  reply: Reply
): Promise<void> {
  const variable = await figma.variables.getVariableByIdAsync(message.variableId);
  if (!variable || variable.remote) {
    reply(failed(message.issueId, "That variable can no longer be edited from this file."));
    return;
  }

  const collection = await figma.variables.getVariableCollectionByIdAsync(
    variable.variableCollectionId
  );
  if (!collection) {
    reply(failed(message.issueId, "That variable's collection could not be found."));
    return;
  }
  const modeId = representative.resolvedVariableModes[collection.id] ?? collection.defaultModeId;

  const consumers = findVariableConsumers(message.variableId);
  const result = await applyVariableAdjustment(
    representative,
    variable,
    modeId,
    message.issueId,
    message.color,
    message.optionChosen,
    message.wheelOpened,
    message.hexRejected,
    consumers.length
  );
  if (!result.ok) {
    reply(failed(message.issueId, result.reason ?? "That colour could not be applied."));
    return;
  }

  await scanAndSync(new Set(consumers.map((node) => node.id)), "rescan-after-variable-apply");
  reply({ type: "ADJUST_APPLIED", issueId: message.issueId });
}
