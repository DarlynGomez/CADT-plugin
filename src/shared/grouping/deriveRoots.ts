import { buildRootSignature } from "../issues/rootSignature";
import { deriveRootState } from "./rootState";
import type { GroupableFinding, Root } from "./groupingTypes";

/**
 * Spec section 3.5: the instance among the root's own that the designer most recently
 * selected themselves, if any of them appear in designerSelectionOrder; otherwise the
 * first instance in document order. designerSelectionOrder is node ids, most recent
 * first, and must contain only selections the designer made: a plugin-set selection is
 * never eligible, the same rule that keeps it out of re-encounter (section 5.2).
 */
function pickRepresentative(
  instances: readonly GroupableFinding[],
  designerSelectionOrder: readonly string[]
): GroupableFinding {
  let best: GroupableFinding | null = null;
  let bestRank = Infinity;
  for (const instance of instances) {
    const rank = designerSelectionOrder.indexOf(instance.nodeId);
    if (rank !== -1 && rank < bestRank) {
      best = instance;
      bestRank = rank;
    }
  }
  return (
    best ??
    instances.reduce((earliest, instance) =>
      instance.documentOrder < earliest.documentOrder ? instance : earliest
    )
  );
}

function distinctBackgroundBindings(instances: readonly GroupableFinding[]): string[] {
  return [
    ...new Set(
      instances
        .map((instance) => instance.backgroundBinding)
        .filter((binding): binding is string => binding !== null)
    )
  ];
}

/**
 * The full finding list, grouped by root signature. Pure: the same list always produces
 * the same roots, and nothing here is stored, see ADR-019. This is the one place
 * findings are folded into roots; the panel and any future plugin logic both call it
 * over the same data rather than each computing their own view.
 */
export function deriveRoots(
  findings: readonly GroupableFinding[],
  designerSelectionOrder: readonly string[] = []
): Root[] {
  const bySignature = new Map<string, GroupableFinding[]>();
  for (const finding of findings) {
    const signature = buildRootSignature({
      foregroundHex: finding.foregroundHex,
      backgroundHex: finding.backgroundHex,
      foregroundBinding: finding.foregroundBinding,
      requiredRatio: finding.requiredRatio
    });
    const group = bySignature.get(signature);
    if (group) {
      group.push(finding);
    } else {
      bySignature.set(signature, [finding]);
    }
  }

  const roots: Root[] = [];
  for (const [signature, instances] of bySignature) {
    const representative = pickRepresentative(instances, designerSelectionOrder);
    const { displayState, breakdown } = deriveRootState(
      instances.map((instance) => instance.state)
    );

    roots.push({
      signature,
      foregroundHex: representative.foregroundHex,
      backgroundHex: representative.backgroundHex,
      foregroundBinding: representative.foregroundBinding,
      requiredRatio: representative.requiredRatio,
      instances,
      representativeIssueId: representative.issueId,
      backgroundBindings: distinctBackgroundBindings(instances),
      displayState,
      stateBreakdown: breakdown
    });
  }

  return roots;
}
