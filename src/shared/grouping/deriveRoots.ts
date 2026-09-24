import { buildRootSignature } from "../issues/rootSignature";
import { deriveRootState } from "./rootState";
import {
  DECISIONS_ELIGIBLE_STATES,
  pickRepresentativeInstance,
  TO_REVIEW_ELIGIBLE_STATES
} from "./representativeInstance";
import type { GroupableFinding, Root } from "./groupingTypes";

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
    const { displayState, breakdown } = deriveRootState(
      instances.map((instance) => instance.state)
    );
    // A root is only ever shown in one view at a time, so its one representative always
    // matches whichever view that is: Decisions once every instance is decided, To review
    // otherwise
    const eligibleStates =
      displayState === "decided" ? DECISIONS_ELIGIBLE_STATES : TO_REVIEW_ELIGIBLE_STATES;
    const representative = pickRepresentativeInstance(
      instances,
      eligibleStates,
      designerSelectionOrder
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
