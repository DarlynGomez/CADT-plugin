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
 * The full apply path: re-validate against the representative node's current
 * background, write every node in the scope for real, commit exactly one undo step,
 * and log the before and after state once with the instance count. Composes the
 * adapter pieces so adjustProtocol.ts stays a thin message router.
 *
 * GROUPING_SPEC.md section 8: a group apply is the same fill write ADR-017 permits,
 * many times, committed as one undo step rather than one per node
 */
export async function applyAdjustment(
  nodes: readonly TextNode[],
  issueId: string,
  color: RGBColor,
  optionChosen: AdjustOptionChoice,
  wheelOpened: boolean,
  hexRejected: boolean
): Promise<ApplyAdjustmentResult> {
  const before = await captureAdjustLogState(nodes[0]);
  if (!before) {
    return { ok: false, reason: "That node's contrast can no longer be evaluated." };
  }
  if (contrastRatio(color, before.background) < before.requiredRatio) {
    await restorePreview();
    return { ok: false, reason: "That colour no longer meets the required contrast ratio." };
  }

  await Promise.all(nodes.map((node) => applyFill(node, solidFill(color))));
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
    instanceCount: nodes.length,
    loggedAt: new Date().toISOString()
  });

  return { ok: true };
}
