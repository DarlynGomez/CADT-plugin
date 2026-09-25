import type { BackgroundSource, Finding, NodeSnapshot } from "../../../../shared/issues/issueTypes";
import type { Rule } from "../ruleTypes";
import { contrastRatio } from "../../../../shared/colour/contrastRatio";
import { rgbToHex } from "../../../../shared/colour/colorHex";
import { computeSeverity } from "./severity";
import { CONTRAST_THRESHOLD_LARGE_TEXT, CONTRAST_THRESHOLD_NORMAL_TEXT } from "./thresholds";
import { classifyTextSize, type TextSizeClass } from "./textSizeClass";

const RULE_ID = "contrast";

/**
 * Contrast's rule-specific evidence. measuredRatio and requiredRatio drive severity;
 * everything else lets the ratio be checked against its own inputs, not trusted on faith
 */
export interface ContrastEvidence {
  measuredRatio: number;
  requiredRatio: number;
  foregroundHex: string;
  foregroundAlpha: number;
  /** GROUPING_SPEC.md 3.1's signature field. Null when unbound */
  foregroundBinding: string | null;
  backgroundHex: string;
  backgroundAlpha: number;
  backgroundSource: BackgroundSource;
  fontSizePx: number;
  isBold: boolean;
  /** Null when the font name itself was mixed */
  fontStyleName: string | null;
  sizeClass: TextSizeClass;
}

/**
 * Composes the phase 9 pure modules over a snapshot and stays thin: every real
 * decision lives in contrastRatio, textSizeClass, or severity, not here. A finding
 * exists only when the measured ratio actually falls short of what is required.
 */
export const contrastRule = {
  id: RULE_ID,

  evaluate(snapshot: NodeSnapshot): Finding<ContrastEvidence> | null {
    if (snapshot.indeterminateReasons.length > 0) {
      return null;
    }
    if (
      snapshot.foreground === null ||
      snapshot.foregroundAlpha === null ||
      snapshot.background === null ||
      snapshot.backgroundAlpha === null ||
      snapshot.backgroundSource === null ||
      snapshot.fontSizePx === null ||
      snapshot.isBold === null
    ) {
      return null;
    }

    const sizeClass = classifyTextSize(snapshot.fontSizePx, snapshot.isBold);
    const requiredRatio =
      sizeClass === "large" ? CONTRAST_THRESHOLD_LARGE_TEXT : CONTRAST_THRESHOLD_NORMAL_TEXT;
    const measuredRatio = contrastRatio(snapshot.foreground, snapshot.background);

    if (measuredRatio >= requiredRatio) {
      return null;
    }

    return {
      ruleId: RULE_ID,
      nodeId: snapshot.nodeId,
      severity: computeSeverity(measuredRatio, requiredRatio),
      evidence: {
        measuredRatio,
        requiredRatio,
        foregroundHex: rgbToHex(snapshot.foreground),
        foregroundAlpha: snapshot.foregroundAlpha,
        foregroundBinding: snapshot.foregroundBinding,
        backgroundHex: rgbToHex(snapshot.background),
        backgroundAlpha: snapshot.backgroundAlpha,
        backgroundSource: snapshot.backgroundSource,
        fontSizePx: snapshot.fontSizePx,
        isBold: snapshot.isBold,
        fontStyleName: snapshot.fontStyleName,
        sizeClass
      }
    };
  }
} satisfies Rule;
