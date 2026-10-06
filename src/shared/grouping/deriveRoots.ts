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

/** Groups findings by root signature, pure and never stored */
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
    // Pick the representative that suits the view showing this root
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
