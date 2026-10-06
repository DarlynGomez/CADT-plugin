import type { Severity } from "../../shared/issues/issueTypes";

const CONTEXT_BY_SEVERITY: Record<Severity, string> = {
  high: "This is unreadable for many users, including people with low vision or anyone reading the screen in bright light.",
  medium: "This falls noticeably short of the accessible contrast guideline for readable text.",
  low: "This narrowly misses the accessible contrast guideline; a small adjustment would clear it."
};

/**
 * Plain context for the why this surfaced popover
 * Keyed by severity so it matches the bands used elsewhere in the panel
 */
export function whySurfacedContext(severity: Severity): string {
  return CONTEXT_BY_SEVERITY[severity];
}
