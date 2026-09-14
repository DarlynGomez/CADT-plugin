import type { Severity } from "../../../../shared/issues/issueTypes";

const LOW_SEVERITY_FLOOR = 0.8;
const MEDIUM_SEVERITY_FLOOR = 0.5;

/**
 * Band a measured contrast ratio against its required threshold. The fraction achieved,
 * not the raw ratio, is what bands: a large-text pass at 3.2 and a normal-text pass at
 * 4.8 are both barely passing, so both should read as low severity when they fall short.
 *
 * Both edges are closed on their upper side by decision, not by however `>=` happened to
 * fall out: a fraction exactly at 0.8 reads as low, and exactly at 0.5 reads as medium.
 * An achieved fraction is a floating-point division, so a value intended to land exactly
 * on a boundary can round a hair to either side; that is a property of the input, not of
 * this function choosing the wrong comparison here.
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
