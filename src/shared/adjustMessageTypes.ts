import type { RGBColor } from "./issues/issueTypes";

/** Which of the three options a chosen or applied colour came from */
export type AdjustOptionChoice = "a" | "b" | "c";

/** Requests the file palette and binding disclosure for one finding's node */
export interface AdjustOptionsRequestMessage {
  type: "ADJUST_OPTIONS_REQUEST";
  issueId: string;
}

/** One colour already present in the file, named by its binding where it has one */
export interface AdjustPaletteColor {
  color: RGBColor;
  name: string | null;
}

/** Whether the node's fill is bound, and how many other page nodes share that binding */
export interface AdjustFillBinding {
  name: string;
  usageCount: number;
}

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

export interface AdjustOptionsReadyMessage {
  type: "ADJUST_OPTIONS_READY";
  issueId: string;
  palette: readonly AdjustPaletteColor[];
  binding: AdjustFillBinding | null;
  variableScope: AdjustVariableScope | null;
}

/**
 * Requests a live preview of one candidate colour. `issueId` is the representative,
 * used only to correlate replies with the open popup; `issueIds` is the actual scope
 * to write, GROUPING_SPEC.md section 8's "preview scope is apply scope" (with nothing
 * selected, that scope is just the representative, so the two arrays may match)
 */
export interface AdjustPreviewMessage {
  type: "ADJUST_PREVIEW";
  issueId: string;
  issueIds: string[];
  color: RGBColor;
}

/** Restores the original fill, clearing whatever preview is active */
export interface AdjustClearPreviewMessage {
  type: "ADJUST_CLEAR_PREVIEW";
}

/**
 * Writes the given colour for real, to every node in `issueIds`, and commits it as one
 * undo step. The three trailing fields exist only for the log entry: which tile it came
 * from, and whether the wheel or a rejected hex played any part in this session. See
 * ADJUST_SPEC.md section 9 and GROUPING_SPEC.md section 8
 */
export interface AdjustApplyMessage {
  type: "ADJUST_APPLY";
  issueId: string;
  issueIds: string[];
  color: RGBColor;
  optionChosen: AdjustOptionChoice;
  wheelOpened: boolean;
  hexRejected: boolean;
}

/** The popup closed without applying anything; logged as a result, not an error */
export interface AdjustAbandonedMessage {
  type: "ADJUST_ABANDONED";
  issueId: string;
  issueIds: string[];
  wheelOpened: boolean;
  hexRejected: boolean;
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

/** Every inbound adjust message the sandbox handles */
export type AdjustMessage =
  | AdjustOptionsRequestMessage
  | AdjustPreviewMessage
  | AdjustClearPreviewMessage
  | AdjustApplyMessage
  | AdjustAbandonedMessage
  | AdjustVariableConsequenceRequestMessage
  | AdjustApplyVariableMessage;

export interface AdjustPreviewedMessage {
  type: "ADJUST_PREVIEWED";
  issueId: string;
}

export interface AdjustClearedMessage {
  type: "ADJUST_CLEARED";
}

export interface AdjustAppliedMessage {
  type: "ADJUST_APPLIED";
  issueId: string;
}

/** An adjust action was rejected; message explains why for display, not just logging */
export interface AdjustActionFailedMessage {
  type: "ADJUST_ACTION_FAILED";
  issueId: string;
  message: string;
}

/** Every outbound adjust reply */
export type AdjustReplyMessage =
  | AdjustOptionsReadyMessage
  | AdjustPreviewedMessage
  | AdjustClearedMessage
  | AdjustAppliedMessage
  | AdjustActionFailedMessage
  | AdjustVariableConsequenceReadyMessage;
