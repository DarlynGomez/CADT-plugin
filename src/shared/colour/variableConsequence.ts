import { contrastRatio } from "./contrastRatio";
import type { RGBColor } from "../issues/issueTypes";
import { classifyTextSize } from "../../plugin/detection/rules/contrast/textSizeClass";
import {
  CONTRAST_THRESHOLD_LARGE_TEXT,
  CONTRAST_THRESHOLD_NORMAL_TEXT
} from "../../plugin/detection/rules/contrast/thresholds";

export interface ConsumerSnapshot {
  foreground: RGBColor | null;
  background: RGBColor | null;
  fontSizePx: number | null;
  isBold: boolean | null;
}

export interface ConsumerOutcome {
  nodeName: string;
  currentlyPasses: boolean;
  wouldPass: boolean;
}

/**
 * GROUPING_SPEC.md section 9: "the consequence is computed, not assumed." One
 * consumer, given its own current fill and background, evaluated against the same
 * candidate colour every other consumer is. Null for an indeterminate consumer
 * (mixed fill, unresolved background, and so on): excluded from the count entirely,
 * the same as detection excludes it from ever becoming a finding.
 */
export function evaluateConsumer(
  snapshot: ConsumerSnapshot,
  nodeName: string,
  proposedColor: RGBColor
): ConsumerOutcome | null {
  if (
    !snapshot.foreground ||
    !snapshot.background ||
    snapshot.fontSizePx === null ||
    snapshot.isBold === null
  ) {
    return null;
  }

  const sizeClass = classifyTextSize(snapshot.fontSizePx, snapshot.isBold);
  const requiredRatio =
    sizeClass === "large" ? CONTRAST_THRESHOLD_LARGE_TEXT : CONTRAST_THRESHOLD_NORMAL_TEXT;

  return {
    nodeName,
    currentlyPasses: contrastRatio(snapshot.foreground, snapshot.background) >= requiredRatio,
    wouldPass: contrastRatio(proposedColor, snapshot.background) >= requiredRatio
  };
}

export interface VariableConsequence {
  totalConsumers: number;
  newlyFailingCount: number;
  newlyFailingNames: readonly string[];
}

/**
 * "Newly failing" is currently passing and would not: a consumer already failing is
 * not this change's doing, and stays out of the count, so the sheet's number is
 * exactly the harm this specific edit would cause, GROUPING_SPEC.md section 9's
 * "3 would newly fail."
 */
export function summarizeVariableConsequence(
  outcomes: readonly ConsumerOutcome[]
): VariableConsequence {
  const newlyFailing = outcomes.filter((outcome) => outcome.currentlyPasses && !outcome.wouldPass);
  return {
    totalConsumers: outcomes.length,
    newlyFailingCount: newlyFailing.length,
    newlyFailingNames: newlyFailing.map((outcome) => outcome.nodeName)
  };
}
