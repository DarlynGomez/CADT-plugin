import type { RGBColor } from "../../../shared/issues/issueTypes";
import {
  evaluateConsumer,
  summarizeVariableConsequence,
  type VariableConsequence
} from "../../../shared/colour/variableConsequence";
import { snapshotTextNode } from "../../detection/adapter/snapshot";

/**
 * Snapshots every consumer once and folds the results through the pure summary.
 * GROUPING_SPEC.md section 9: computed fresh for the candidate colour actually on
 * screen, never assumed from the one node the popup opened on.
 */
export async function scanVariableConsequence(
  consumers: readonly TextNode[],
  proposedColor: RGBColor
): Promise<VariableConsequence> {
  const outcomes = [];
  for (const node of consumers) {
    const snapshot = await snapshotTextNode(node);
    const outcome = evaluateConsumer(snapshot, node.name, proposedColor);
    if (outcome) {
      outcomes.push(outcome);
    }
  }
  return summarizeVariableConsequence(outcomes);
}
