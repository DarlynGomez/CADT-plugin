import type { AdjustOptionChoice } from "./adjustMessageTypes";
import type { RGBColor } from "./issues/issueTypes";

/** Facts about the bound variable, null when unbound or bound to a style */
export interface AdjustVariableScope {
  variableId: string;
  name: string;
  collectionName: string;
  modeName: string;
  /** A library variable cannot be edited from a consuming file */
  remote: boolean;
}

/** Asked on switching to variable scope and on each colour change after */
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

/** Writes to the variable for the current mode so every consumer changes in one undo step */
export interface AdjustApplyVariableMessage {
  type: "ADJUST_APPLY_VARIABLE";
  issueId: string;
  variableId: string;
  color: RGBColor;
  optionChosen: AdjustOptionChoice;
  wheelOpened: boolean;
  hexRejected: boolean;
}
