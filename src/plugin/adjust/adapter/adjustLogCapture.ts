import { classifyTextSize } from "../../detection/rules/contrast/textSizeClass";
import { CONTRAST_THRESHOLD_LARGE_TEXT, CONTRAST_THRESHOLD_NORMAL_TEXT } from "../../detection/rules/contrast/thresholds";
import { rgbToHex } from "../../../shared/colour/colorHex";
import { contrastRatio } from "../../../shared/colour/contrastRatio";
import type { RGBColor } from "../../../shared/issues/issueTypes";
import { detectFillBinding } from "./bindingLookup";
import { resolveTextNodeSnapshot } from "../../lifecycle/resolveSnapshot";
import { originalFillsFor } from "./previewState";

export interface AdjustLogState {
  hex: string;
  ratio: number;
  bound: boolean;
  requiredRatio: number;
  background: RGBColor;
}

/**
 * The node's current colour, ratio, required ratio, and binding state, read once and
 * shared by both re-validation and the log entry's "before" fields, so apply and
 * abandon never fetch the snapshot twice for the same purpose
 */
export async function captureAdjustLogState(node: TextNode): Promise<AdjustLogState | null> {
  const snapshot = await resolveTextNodeSnapshot(node.id);
  if (
    !snapshot ||
    !snapshot.foreground ||
    snapshot.background === null ||
    snapshot.fontSizePx === null ||
    snapshot.isBold === null
  ) {
    return null;
  }

  const sizeClass = classifyTextSize(snapshot.fontSizePx, snapshot.isBold);
  const requiredRatio =
    sizeClass === "large" ? CONTRAST_THRESHOLD_LARGE_TEXT : CONTRAST_THRESHOLD_NORMAL_TEXT;
  const binding = await detectFillBinding(node);

  // A live preview has overwritten the fill and detached its binding, so "before"
  // comes from the captured original, never the node
  const original = originalFillsFor(node.id)?.find(
    (fill): fill is SolidPaint => fill.type === "SOLID"
  );
  const foreground = original ? original.color : snapshot.foreground;

  return {
    hex: rgbToHex(foreground),
    ratio: contrastRatio(foreground, snapshot.background),
    bound: binding !== null || Boolean(original?.boundVariables?.color),
    requiredRatio,
    background: snapshot.background
  };
}
