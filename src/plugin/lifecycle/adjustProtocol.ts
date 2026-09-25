import type { AdjustMessage, AdjustReplyMessage } from "../../shared/adjustMessageTypes";
import { parseIssueId } from "../../shared/issues/issueId";
import { logAdjustEvent } from "../adjust/adapter/adjustLogging";
import { detectFillBinding } from "../adjust/adapter/bindingLookup";
import { collectFilePalette } from "../adjust/adapter/filePalette";
import { restorePreview, beginPreview } from "../adjust/adapter/previewState";
import { applyAdjustment } from "../adjust/adapter/applyAdjustment";
import { captureAdjustLogState } from "../adjust/adapter/adjustLogCapture";
import { resolveVariableScope } from "../adjust/adapter/variableScope";
import { handleApplyVariable, handleVariableConsequenceRequest } from "./adjustVariableProtocol";
import { scanAndSync } from "./scanAndSync";

type Reply = (message: AdjustReplyMessage) => void;

function failed(issueId: string, message: string): AdjustReplyMessage {
  return { type: "ADJUST_ACTION_FAILED", issueId, message };
}

async function resolveTextNode(issueId: string): Promise<TextNode | null> {
  const parsed = parseIssueId(issueId);
  if (!parsed) {
    return null;
  }
  const node = await figma.getNodeByIdAsync(parsed.nodeId);
  return node && node.type === "TEXT" ? node : null;
}

/** Resolves every id, skipping any node that no longer exists rather than failing */
async function resolveTextNodes(issueIds: readonly string[]): Promise<TextNode[]> {
  const nodes = await Promise.all(issueIds.map(resolveTextNode));
  return nodes.filter((node): node is TextNode => node !== null);
}

/** Handles every adjust message, per ADJUST_SPEC.md sections 5 and 9 */
export async function handleAdjustMessage(message: AdjustMessage, reply: Reply): Promise<void> {
  if (message.type === "ADJUST_CLEAR_PREVIEW") {
    await restorePreview();
    reply({ type: "ADJUST_CLEARED" });
    return;
  }

  if (message.type === "ADJUST_OPTIONS_REQUEST") {
    const node = await resolveTextNode(message.issueId);
    if (!node) {
      reply(failed(message.issueId, "That node no longer exists in this file."));
      return;
    }
    const [palette, binding, variableScope] = await Promise.all([
      collectFilePalette(),
      detectFillBinding(node),
      resolveVariableScope(node)
    ]);
    reply({ type: "ADJUST_OPTIONS_READY", issueId: message.issueId, palette, binding, variableScope });
    return;
  }

  if (message.type === "ADJUST_VARIABLE_CONSEQUENCE_REQUEST") {
    await handleVariableConsequenceRequest(message, reply);
    return;
  }

  if (message.type === "ADJUST_APPLY_VARIABLE") {
    const representative = await resolveTextNode(message.issueId);
    if (!representative) {
      reply(failed(message.issueId, "That node no longer exists in this file."));
      return;
    }
    await handleApplyVariable(message, representative, reply);
    return;
  }

  // ADJUST_PREVIEW, ADJUST_APPLY, ADJUST_ABANDONED all carry issueIds: the scope
  const nodes = await resolveTextNodes(message.issueIds);
  if (nodes.length === 0) {
    if (message.type !== "ADJUST_ABANDONED") {
      reply(failed(message.issueId, "That node no longer exists in this file."));
    }
    return;
  }

  if (message.type === "ADJUST_PREVIEW") {
    await beginPreview(nodes, message.color);
    reply({ type: "ADJUST_PREVIEWED", issueId: message.issueId });
    return;
  }

  if (message.type === "ADJUST_ABANDONED") {
    const before = await captureAdjustLogState(nodes[0]);
    await logAdjustEvent({
      issueId: message.issueId,
      optionChosen: null,
      beforeHex: before?.hex ?? "",
      beforeRatio: before?.ratio ?? 0,
      afterHex: null,
      afterRatio: null,
      wasBound: before?.bound ?? false,
      wheelOpened: message.wheelOpened,
      hexRejected: message.hexRejected,
      abandoned: true,
      instanceCount: nodes.length,
      loggedAt: new Date().toISOString()
    });
    return;
  }

  // ADJUST_APPLY
  const result = await applyAdjustment(
    nodes,
    message.issueId,
    message.color,
    message.optionChosen,
    message.wheelOpened,
    message.hexRejected
  );
  if (!result.ok) {
    reply(failed(message.issueId, result.reason ?? "That colour could not be applied."));
    return;
  }
  // Rescans and pushes ISSUES_UPDATED synchronously, rather than waiting on the
  // debounced documentchange listener: for a multi-node group apply, the panel must
  // show every resolved instance the moment the sheet closes, not on the next
  // organic scan. See listeners.ts for why applyFill already lets this write through.
  await scanAndSync(new Set(nodes.map((node) => node.id)), "rescan-after-apply");
  reply({ type: "ADJUST_APPLIED", issueId: message.issueId });
}
