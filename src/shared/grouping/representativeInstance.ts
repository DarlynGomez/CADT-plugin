import type { IssueState } from "../issues/issueTypes";
import type { GroupableFinding } from "./groupingTypes";

/** Used by the root card and the single instance adjust fallback */
export const TO_REVIEW_ELIGIBLE_STATES: ReadonlySet<IssueState> = new Set([
  "open",
  "important",
  "deferred"
]);

/** Used by the decisions view */
export const DECISIONS_ELIGIBLE_STATES: ReadonlySet<IssueState> = new Set(["ignored", "resolved"]);

/** Last selected eligible instance, else first in document order, plugin selections never count */
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
