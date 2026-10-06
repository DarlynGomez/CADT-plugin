import type { Severity } from "./issueTypes";

/** Rank of each severity band from low to high */
export const SEVERITY_RANK: Record<Severity, number> = { low: 0, medium: 1, high: 2 };

/** True when candidate is a worse band than baseline */
export function isSeverityWorse(candidate: Severity, baseline: Severity): boolean {
  return SEVERITY_RANK[candidate] > SEVERITY_RANK[baseline];
}
