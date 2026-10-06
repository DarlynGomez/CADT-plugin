import type { RGBColor } from "../../../shared/issues/issueTypes";
import {
  evaluateConsumer,
  summarizeVariableConsequence,
  type VariableConsequence
} from "../../../shared/colour/variableConsequence";
import { snapshotTextNode } from "../../detection/adapter/snapshot";

/** Snapshots each consumer once and summarizes, computed for the colour on screen */
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
