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
 * GROUPING_SPEC.md 3.4: a root's ignore action also records a decision. Severity comes
 * from the just-updated record rather than a live re-evaluation: ignoreIssue
 * already set severityAtIgnore on every instance that succeeded, and every
 * instance in a root shares one severity by construction of the signature, so any one
 * of them stands for the root.
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
 * ADR-032: called only when the caller says this reopen leaves nothing ignored under
 * `signature` behind, a full restore. Clearing the decision then stops the offer to
 * reapply it from immediately re-appearing on the very root the designer just
 * restored. A partial restore never reaches this: the decision still describes the
 * instances that remain ignored.
 */
export function clearRootDecision(signature: string): void {
  const saveResult = saveDecisions(removeDecision(loadDecisions(), signature));
  if (!saveResult.saved) {
    console.error("ROOT_REOPEN: decision could not be cleared", saveResult.error);
  }
}
