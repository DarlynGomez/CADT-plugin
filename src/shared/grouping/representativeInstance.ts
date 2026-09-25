import type { IssueState } from "../issues/issueTypes";
import type { GroupableFinding } from "./groupingTypes";

/** Spec section 3.5: the root card, Adjust's single-instance fallback */
export const TO_REVIEW_ELIGIBLE_STATES: ReadonlySet<IssueState> = new Set([
  "open",
  "important",
  "deferred"
]);

/** Spec section 3.5: the Decisions view's specimen */
export const DECISIONS_ELIGIBLE_STATES: ReadonlySet<IssueState> = new Set(["ignored", "resolved"]);

/**
 * Spec section 3.5, one picker for every caller: the eligible instance the designer
 * most recently selected themselves, otherwise the first eligible one in document
 * order. designerSelectionOrder is node ids, most recent first, and must contain only
 * selections the designer made, a plugin-set selection is never eligible, the same rule
 * that keeps it out of re-encounter (section 5.2). Markers, MARKERS_SPEC.md 5.3, narrow
 * pool to one screen before calling this; every other caller passes a root's full
 * instance list
 */
export function pickRepresentativeInstance(
  pool: readonly GroupableFinding[],
  eligibleStates: ReadonlySet<IssueState>,
  designerSelectionOrder: readonly string[]
): GroupableFinding {
  const eligible = pool.filter((instance) => eligibleStates.has(instance.state));
  if (eligible.length === 0) {
    throw new Error("pickRepresentativeInstance: no instance in the pool is in an eligible state");
  }

  let best: GroupableFinding | null = null;
  let bestRank = Infinity;
  for (const instance of eligible) {
    const rank = designerSelectionOrder.indexOf(instance.nodeId);
    if (rank !== -1 && rank < bestRank) {
      best = instance;
      bestRank = rank;
    }
  }
  return (
    best ??
    eligible.reduce((earliest, instance) =>
      instance.documentOrder < earliest.documentOrder ? instance : earliest
    )
  );
}
