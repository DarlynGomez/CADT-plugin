import type { Severity } from "./issueTypes";

/**
 * Ordinal rank for the three severity bands, low to high. Shared by the state machine's
 * ADR-014 reopen check and grouping's decision-matching (spec section 3.4), since "did
 * severity get worse" is the same comparison in both places.
 */
export const SEVERITY_RANK: Record<Severity, number> = { low: 0, medium: 1, high: 2 };

/** Whether candidate is a worse band than baseline. False when equal or better. */
export function isSeverityWorse(candidate: Severity, baseline: Severity): boolean {
  return SEVERITY_RANK[candidate] > SEVERITY_RANK[baseline];
}
