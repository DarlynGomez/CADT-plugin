import type { AdjustMessage, AdjustReplyMessage } from "../../shared/adjustMessageTypes";
import { parseIssueId } from "../../shared/issues/issueId";
import { logAdjustEvent } from "../adjust/adapter/adjustLogging";
import { detectFillBinding } from "../adjust/adapter/bindingLookup";
import { collectFilePalette } from "../adjust/adapter/filePalette";
import { restorePreview, beginPreview } from "../adjust/adapter/previewState";
import { applyAdjustment } from "../adjust/adapter/applyAdjustment";
import { captureAdjustLogState } from "../adjust/adapter/adjustLogCapture";

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

  switch (message.type) {
    case "ADJUST_CLEAR_PREVIEW":
      return true;
    case "ADJUST_OPTIONS_REQUEST":
      return typeof message.issueId === "string";
    case "ADJUST_PREVIEW":
      return typeof message.issueId === "string" && hasColor();
    case "ADJUST_APPLY":
      return (
        typeof message.issueId === "string" &&
        hasColor() &&
        hasSessionFlags() &&
        (message.optionChosen === "a" ||
          message.optionChosen === "b" ||
          message.optionChosen === "c")
      );
    case "ADJUST_ABANDONED":
      return typeof message.issueId === "string" && hasSessionFlags();
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

/** Handles every adjust message, per ADJUST_SPEC.md sections 5 and 9 */
export async function handleAdjustMessage(message: AdjustMessage, reply: Reply): Promise<void> {
  if (message.type === "ADJUST_CLEAR_PREVIEW") {
    await restorePreview();
    reply({ type: "ADJUST_CLEARED" });
    return;
  }

  const node = await resolveTextNode(message.issueId);
  if (!node) {
    if (message.type !== "ADJUST_ABANDONED") {
      reply(failed(message.issueId, "That node no longer exists in this file."));
    }
    return;
  }

  if (message.type === "ADJUST_OPTIONS_REQUEST") {
    const [palette, binding] = await Promise.all([collectFilePalette(), detectFillBinding(node)]);
    reply({ type: "ADJUST_OPTIONS_READY", issueId: message.issueId, palette, binding });
    return;
  }

  if (message.type === "ADJUST_PREVIEW") {
    await beginPreview([node], message.color);
    reply({ type: "ADJUST_PREVIEWED", issueId: message.issueId });
    return;
  }

  if (message.type === "ADJUST_ABANDONED") {
    const before = await captureAdjustLogState(node);
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
      loggedAt: new Date().toISOString()
    });
    return;
  }

  // ADJUST_APPLY
  const result = await applyAdjustment(
    node,
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
  reply({ type: "ADJUST_APPLIED", issueId: message.issueId });
}
