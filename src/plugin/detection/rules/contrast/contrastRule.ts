import type { Finding, NodeSnapshot } from "../../../../shared/issues/issueTypes";
import type { Rule } from "../ruleTypes";
import { contrastRatio } from "./contrastRatio";
import { computeSeverity } from "./severity";
import { CONTRAST_THRESHOLD_LARGE_TEXT, CONTRAST_THRESHOLD_NORMAL_TEXT } from "./thresholds";
import { classifyTextSize } from "./textSizeClass";

const RULE_ID = "contrast";

/**
 * Composes the phase 9 pure modules over a snapshot and stays thin: every real
 * decision lives in contrastRatio, textSizeClass, or severity, not here. A finding
 * exists only when the measured ratio actually falls short of what is required.
 */
export const contrastRule: Rule = {
  id: RULE_ID,

  evaluate(snapshot: NodeSnapshot): Finding | null {
    if (snapshot.indeterminateReasons.length > 0) {
      return null;
    }
    if (
      snapshot.foreground === null ||
      snapshot.background === null ||
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
      measuredRatio,
      requiredRatio
    };
  }
};
