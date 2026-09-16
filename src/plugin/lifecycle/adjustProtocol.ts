import { classifyTextSize } from "../detection/rules/contrast/textSizeClass";
import { CONTRAST_THRESHOLD_LARGE_TEXT, CONTRAST_THRESHOLD_NORMAL_TEXT } from "../detection/rules/contrast/thresholds";
import { contrastRatio } from "../detection/rules/contrast/contrastRatio";
import type { AdjustMessage, AdjustReplyMessage } from "../../shared/adjustMessageTypes";
import { parseIssueId } from "../../shared/issues/issueId";
import { applyFill, restorePreview, beginPreview } from "../adjust/adapter/previewState";
import { solidFill } from "../adjust/adapter/paintWriter";
import { resolveTextNodeSnapshot } from "./resolveSnapshot";

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

  switch (message.type) {
    case "ADJUST_CLEAR_PREVIEW":
      return true;
    case "ADJUST_PREVIEW":
    case "ADJUST_APPLY":
      return typeof message.issueId === "string" && hasColor();
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

/**
 * Re-derives the ratio a candidate colour needs against the node's current background,
 * never trusting the colour the UI sent. Uses the base requiredRatio, not the padded
 * generation target: the sandbox's job is refusing an outright failure, not enforcing
 * the UI's own headroom policy
 */
async function meetsRequiredRatio(node: TextNode, colorRgb: { r: number; g: number; b: number }): Promise<boolean> {
  const snapshot = await resolveTextNodeSnapshot(node.id);
  if (!snapshot || snapshot.background === null || snapshot.fontSizePx === null || snapshot.isBold === null) {
    return false;
  }
  const sizeClass = classifyTextSize(snapshot.fontSizePx, snapshot.isBold);
  const requiredRatio =
    sizeClass === "large" ? CONTRAST_THRESHOLD_LARGE_TEXT : CONTRAST_THRESHOLD_NORMAL_TEXT;
  return contrastRatio(colorRgb, snapshot.background) >= requiredRatio;
}

/** Handles the three adjust messages, per ADJUST_SPEC.md section 5 */
export async function handleAdjustMessage(message: AdjustMessage, reply: Reply): Promise<void> {
  if (message.type === "ADJUST_CLEAR_PREVIEW") {
    await restorePreview();
    reply({ type: "ADJUST_CLEARED" });
    return;
  }

  const node = await resolveTextNode(message.issueId);
  if (!node) {
    reply(failed(message.issueId, "That node no longer exists in this file."));
    return;
  }

  if (message.type === "ADJUST_PREVIEW") {
    await beginPreview(node, message.color);
    reply({ type: "ADJUST_PREVIEWED", issueId: message.issueId });
    return;
  }

  // ADJUST_APPLY
  if (!(await meetsRequiredRatio(node, message.color))) {
    await restorePreview();
    reply(failed(message.issueId, "That colour no longer meets the required contrast ratio."));
    return;
  }

  await applyFill(node, solidFill(message.color));
  figma.commitUndo();
  reply({ type: "ADJUST_APPLIED", issueId: message.issueId });
}
