import { contrastRatio } from "../../../shared/colour/contrastRatio";
import { rgbToHex } from "../../../shared/colour/colorHex";
import type { AdjustOptionChoice } from "../../../shared/adjustMessageTypes";
import type { RGBColor } from "../../../shared/issues/issueTypes";
import { logAdjustEvent } from "./adjustLogging";
import { solidFill } from "./paintWriter";
import { applyFill, restorePreview } from "./previewState";
import { captureAdjustLogState } from "./adjustLogCapture";

export interface ApplyAdjustmentResult {
  ok: boolean;
  reason?: string;
}

/**
 * The full apply path: re-validate against the node's current background, write for
 * real, commit one undo step, and log the before and after state. Composes the
 * adapter pieces so adjustProtocol.ts stays a thin message router
 */
export async function applyAdjustment(
  node: TextNode,
  issueId: string,
  color: RGBColor,
  optionChosen: AdjustOptionChoice,
  wheelOpened: boolean,
  hexRejected: boolean
): Promise<ApplyAdjustmentResult> {
  const before = await captureAdjustLogState(node);
  if (!before) {
    return { ok: false, reason: "That node's contrast can no longer be evaluated." };
  }
  if (contrastRatio(color, before.background) < before.requiredRatio) {
    await restorePreview();
    return { ok: false, reason: "That colour no longer meets the required contrast ratio." };
  }

  await applyFill(node, solidFill(color));
  figma.commitUndo();

  await logAdjustEvent({
    issueId,
    optionChosen,
    beforeHex: before.hex,
    beforeRatio: before.ratio,
    afterHex: rgbToHex(color),
    afterRatio: contrastRatio(color, before.background),
    wasBound: before.bound,
    wheelOpened,
    hexRejected,
    abandoned: false,
    loggedAt: new Date().toISOString()
  });

  return { ok: true };
}
