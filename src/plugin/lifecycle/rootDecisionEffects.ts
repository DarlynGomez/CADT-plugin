import {
  loadDecisions,
  recordDecision,
  removeDecision,
  saveDecisions,
  type DecisionRecordMap
} from "../accountability/decisionStore";
import type { IssueRecordMap } from "../accountability/issueStore";
import type { RootMessage } from "../../shared/rootMessageTypes";

/**
 * Ignoring a root also records a decision
 * Severity comes from the updated record because every instance shares one
 */
export function recordRootDecision(
  message: Extract<RootMessage, { type: "ROOT_IGNORE" }>,
  updatedRecord: IssueRecordMap,
  decisions: DecisionRecordMap,
  at: string
): void {
  const severityAtDecision = message.issueIds
    .map((id) => updatedRecord[id]?.severityAtIgnore)
    .find((severity) => severity !== undefined);
  if (!severityAtDecision) {
    return;
  }

  const updatedDecisions = recordDecision(decisions, {
    signature: message.signature,
    reason: message.reason,
    recordedAt: at,
    severityAtDecision
  });
  const saveResult = saveDecisions(updatedDecisions);
  if (!saveResult.saved) {
    console.error("ROOT_IGNORE: decision could not be saved", saveResult.error);
  }
}

/**
 * Called only after a full restore, when nothing stays ignored under the signature
 * Clearing the decision stops the offer from reappearing on the root just restored
 */
export function clearRootDecision(signature: string): void {
  const saveResult = saveDecisions(removeDecision(loadDecisions(), signature));
  if (!saveResult.saved) {
    console.error("ROOT_REOPEN: decision could not be cleared", saveResult.error);
  }
}
