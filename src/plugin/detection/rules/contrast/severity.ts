import type { Severity } from "../../../../shared/issues/issueTypes";

const LOW_SEVERITY_FLOOR = 0.8;
const MEDIUM_SEVERITY_FLOOR = 0.5;

/**
 * Band a measured contrast ratio against its required threshold. The fraction achieved,
 * not the raw ratio, is what bands: a large-text pass at 3.2 and a normal-text pass at
 * 4.8 are both barely passing, so both should read as low severity when they fall short.
 */
export function computeSeverity(measuredRatio: number, requiredRatio: number): Severity {
  const achievedFraction = measuredRatio / requiredRatio;
  if (achievedFraction >= LOW_SEVERITY_FLOOR) {
    return "low";
  }
  if (achievedFraction >= MEDIUM_SEVERITY_FLOOR) {
    return "medium";
  }
  return "high";
}
