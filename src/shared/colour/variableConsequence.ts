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

/** Judges one consumer against the proposed colour, null when it cannot be measured */
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

/** Newly failing means passing now and failing after, layers already failing are not counted */
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
