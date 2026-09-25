import type { AdjustMessage, AdjustReplyMessage } from "../../shared/adjustMessageTypes";
import { parseIssueId } from "../../shared/issues/issueId";
import { logAdjustEvent } from "../adjust/adapter/adjustLogging";
import { detectFillBinding } from "../adjust/adapter/bindingLookup";
import { collectFilePalette } from "../adjust/adapter/filePalette";
import { restorePreview, beginPreview } from "../adjust/adapter/previewState";
import { applyAdjustment } from "../adjust/adapter/applyAdjustment";
import { captureAdjustLogState } from "../adjust/adapter/adjustLogCapture";
import { scanAndSync } from "./scanAndSync";

type Reply = (message: AdjustReplyMessage) => void;

export function isAdjustMessage(value: unknown): value is AdjustMessage {
  if (!value || typeof value !== "object") {
    return false;
  }
  const message = value as Record<string, unknown>;
  const hasColor = () =>
    typeof message.color === "object" &&
    message.color !== null &&
    typeof (message.color as Record<string, unknown>).r === "number";
  const hasSessionFlags = () =>
    typeof message.wheelOpened === "boolean" && typeof message.hexRejected === "boolean";
  const hasIssueIds = () =>
    Array.isArray(message.issueIds) &&
    message.issueIds.length > 0 &&
    message.issueIds.every((id) => typeof id === "string");

  switch (message.type) {
    case "ADJUST_CLEAR_PREVIEW":
      return true;
    case "ADJUST_OPTIONS_REQUEST":
      return typeof message.issueId === "string";
    case "ADJUST_PREVIEW":
      return typeof message.issueId === "string" && hasIssueIds() && hasColor();
    case "ADJUST_APPLY":
      return (
        typeof message.issueId === "string" &&
        hasIssueIds() &&
        hasColor() &&
        hasSessionFlags() &&
        (message.optionChosen === "a" ||
          message.optionChosen === "b" ||
          message.optionChosen === "c")
      );
    case "ADJUST_ABANDONED":
      return typeof message.issueId === "string" && hasIssueIds() && hasSessionFlags();
    default:
      return false;
  }
}

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
    const [palette, binding] = await Promise.all([collectFilePalette(), detectFillBinding(node)]);
    reply({ type: "ADJUST_OPTIONS_READY", issueId: message.issueId, palette, binding });
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
