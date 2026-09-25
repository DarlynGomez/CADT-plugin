import type { Severity } from "../../shared/issues/issueTypes";

const CONTEXT_BY_SEVERITY: Record<Severity, string> = {
  high: "This is unreadable for many users, including people with low vision or anyone reading the screen in bright light.",
  medium: "This falls noticeably short of the accessible contrast guideline for readable text.",
  low: "This narrowly misses the accessible contrast guideline; a small adjustment would clear it."
};

/**
 * GROUPING_SPEC.md 6.3 item 7's "Why this surfaced" popover. Bands on severity, the
 * same computeSeverity bands every other part of the panel already uses, rather than
 * re-deriving a shortfall threshold here.
 */
export function whySurfacedContext(severity: Severity): string {
  return CONTEXT_BY_SEVERITY[severity];
}
