import type { Severity } from "../../../../shared/issues/issueTypes";

const LOW_SEVERITY_FLOOR = 0.8;
const MEDIUM_SEVERITY_FLOOR = 0.5;

/**
 * Bands the fraction of the required ratio achieved, not the raw ratio
 * So a large text 3.2 and a normal text 4.8 both read as low when they fall short
 * Edges close on the upper side, exactly 0.8 reads low and exactly 0.5 reads medium
 * Floating point division can land a hair either side of an edge
 */
export function computeSeverity(measuredRatio: number, requiredRatio: number): Severity {
  const achievedFraction = measuredRatio / requiredRatio;
  if (achievedFraction >= LOW_SEVERITY_FLOOR) {
    return "low"; // inclusive: exactly 0.8 is low
  }
  if (achievedFraction >= MEDIUM_SEVERITY_FLOOR) {
    return "medium"; // inclusive: exactly 0.5 is medium
  }
  return "high"; // exclusive below 0.5
}
