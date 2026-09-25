import { useMemo } from "react";

import { assembleGroupableFindings } from "../../../shared/grouping/assembleFinding";
import { deriveRoots } from "../../../shared/grouping/deriveRoots";
import type { Root, RootDecision } from "../../../shared/grouping/groupingTypes";
import { computeHeadline } from "../../../shared/grouping/headline";
import { type GroupBy, sectionRoots } from "../../../shared/grouping/sectionRoots";
import type { IssueSummary } from "../../../shared/issues/issueTypes";
import type { StateFilter } from "../components/FilterBar";

const DISPLAY_ORDER: Record<Root["displayState"], number> = {
  important: 0,
  open: 1,
  deferred: 2,
  decided: 3
};

function sortByPrecedence(roots: readonly Root[]): Root[] {
  return [...roots].sort((a, b) => DISPLAY_ORDER[a.displayState] - DISPLAY_ORDER[b.displayState]);
}

function matchesFilter(root: Root, filter: StateFilter): boolean {
  if (filter === "all") {
    return root.displayState !== "decided";
  }
  if (filter === "pinned") {
    return root.displayState === "important";
  }
  return root.displayState === "deferred";
}

/**
 * Wraps the pure grouping domain over the live issue and decision records. Findings
 * and the unsectioned root list are derived once and reused for the headline, the
 * filter counts, and the sectioned list, so every view of the panel looks at the same
 * underlying roots. Ignored roots never flow through filteredSections: they render
 * through DecisionsView.tsx, which the "ignored" filter selects instead.
 */
export function useRoots(
  issues: readonly IssueSummary[],
  decisions: Readonly<Record<string, RootDecision>>,
  groupBy: GroupBy,
  stateFilter: StateFilter
) {
  const findings = useMemo(() => assembleGroupableFindings(issues), [issues]);
  const allRoots = useMemo(() => deriveRoots(findings), [findings]);
  const headline = useMemo(() => computeHeadline(allRoots), [allRoots]);

  const reviewRoots = useMemo(
    () => allRoots.filter((root) => root.displayState !== "decided"),
    [allRoots]
  );

  const counts = useMemo(
    () => ({
      all: reviewRoots.length,
      pinned: allRoots.filter((root) => root.displayState === "important").length,
      deferred: allRoots.filter((root) => root.displayState === "deferred").length,
      ignored: allRoots.filter((root) => root.displayState === "decided").length
    }),
    [allRoots, reviewRoots]
  );

  const decisionRoots = useMemo(
    () => allRoots.filter((root) => root.displayState === "decided"),
    [allRoots]
  );

  const filteredSections = useMemo(
    () =>
      sectionRoots(findings, groupBy)
        .map((section) => ({
          ...section,
          roots: sortByPrecedence(section.roots.filter((root) => matchesFilter(root, stateFilter)))
        }))
        .filter((section) => section.roots.length > 0),
    [findings, groupBy, stateFilter]
  );

  const issuesById = useMemo(() => new Map(issues.map((issue) => [issue.id, issue])), [issues]);

  return {
    decisions,
    headline,
    counts,
    reviewRoots,
    filteredSections,
    decisionRoots,
    issuesById
  };
}
