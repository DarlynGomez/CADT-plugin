import { contrastRatio } from "../../../shared/colour/contrastRatio";
import { rgbToHex } from "../../../shared/colour/colorHex";
import type { AdjustOptionChoice } from "../../../shared/adjustMessageTypes";
import type { RGBColor } from "../../../shared/issues/issueTypes";
import { logAdjustEvent } from "./adjustLogging";
import { captureAdjustLogState } from "./adjustLogCapture";
import { restorePreview } from "./previewState";

export interface ApplyVariableAdjustmentResult {
  ok: boolean;
  reason?: string;
}

function withPreservedAlpha(current: VariableValue | undefined, color: RGBColor): RGBA | RGB {
  if (current && typeof current === "object" && "a" in current) {
    return { ...color, a: current.a };
  }
  return color;
}

/**
 * The variable-scope apply path: writes the candidate colour to the variable's
 * current mode, not to any one node's fill, so every consumer changes at once.
 * Re-validates against the representative node's own requirement, the same floor
 * applyAdjustment.ts checks; the full consequence for every other consumer was
 * already shown to the designer before they chose to apply, GROUPING_SPEC.md
 * section 9, so it is not re-blocked here. See ADR-033.
 *
 * Restores any active preview first: preview writes a raw override fill, ADR-018,
 * which detaches the representative's own variable binding. Left in place, the
 * variable write below would silently miss the one node the designer was looking
 * at. Restoring returns it to its original, still-bound fill, so it picks the new
 * value back up the same way every other consumer does.
 */
export async function applyVariableAdjustment(
  representative: TextNode,
  variable: Variable,
  modeId: string,
  issueId: string,
  color: RGBColor,
  optionChosen: AdjustOptionChoice,
  wheelOpened: boolean,
  hexRejected: boolean,
  consumerCount: number
): Promise<ApplyVariableAdjustmentResult> {
  const before = await captureAdjustLogState(representative);
  if (!before) {
    return { ok: false, reason: "That node's contrast can no longer be evaluated." };
  }
  if (contrastRatio(color, before.background) < before.requiredRatio) {
    return { ok: false, reason: "That colour no longer meets the required contrast ratio." };
  }

  await restorePreview();
  variable.setValueForMode(modeId, withPreservedAlpha(variable.valuesByMode[modeId], color));
  figma.commitUndo();

  await logAdjustEvent({
    issueId,
    optionChosen,
    beforeHex: before.hex,
    beforeRatio: before.ratio,
    afterHex: rgbToHex(color),
    afterRatio: contrastRatio(color, before.background),
    wasBound: true,
    wheelOpened,
    hexRejected,
    abandoned: false,
    instanceCount: consumerCount,
    loggedAt: new Date().toISOString()
  });

  return { ok: true };
}
