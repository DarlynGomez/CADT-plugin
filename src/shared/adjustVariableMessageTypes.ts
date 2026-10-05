import type { AdjustOptionChoice } from "./adjustMessageTypes";
import type { RGBColor } from "./issues/issueTypes";

/**
 * GROUPING_SPEC.md section 9's static facts about the foreground's bound variable,
 * independent of any candidate colour: null when the foreground is unbound, or bound
 * to a style rather than a variable, since only a variable can be this scope's target.
 */
export interface AdjustVariableScope {
  variableId: string;
  name: string;
  collectionName: string;
  modeName: string;
  /** A library variable cannot be edited from a consuming file */
  remote: boolean;
}

/**
 * GROUPING_SPEC.md section 9: "the consequence is computed, not assumed." Requested
 * whenever the designer switches to the variable scope, or changes their candidate
 * colour while it is already selected, so the sheet's count reflects exactly the
 * colour that would actually be written.
 */
export interface AdjustVariableConsequenceRequestMessage {
  type: "ADJUST_VARIABLE_CONSEQUENCE_REQUEST";
  issueId: string;
  variableId: string;
  color: RGBColor;
}

export interface AdjustVariableConsequenceReadyMessage {
  type: "ADJUST_VARIABLE_CONSEQUENCE_READY";
  issueId: string;
  totalConsumers: number;
  newlyFailingCount: number;
  newlyFailingNames: readonly string[];
}

/**
 * Writes the candidate colour to the variable's current mode, not to any one node's
 * fill: every consumer of that variable changes. Commits one undo step, same as a
 * multi-instance ADJUST_APPLY. See ADR-033.
 */
export interface AdjustApplyVariableMessage {
  type: "ADJUST_APPLY_VARIABLE";
  issueId: string;
  variableId: string;
  color: RGBColor;
  optionChosen: AdjustOptionChoice;
  wheelOpened: boolean;
  hexRejected: boolean;
}
