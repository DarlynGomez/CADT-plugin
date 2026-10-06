import type {
  AdjustApplyVariableMessage,
  AdjustVariableConsequenceReadyMessage,
  AdjustVariableConsequenceRequestMessage,
  AdjustVariableScope
} from "./adjustVariableMessageTypes";
import type { RGBColor } from "./issues/issueTypes";

export type {
  AdjustVariableScope,
  AdjustVariableConsequenceRequestMessage,
  AdjustVariableConsequenceReadyMessage,
  AdjustApplyVariableMessage
} from "./adjustVariableMessageTypes";

/** Which scope the sheet had selected: the checked layers, or the bound variable itself */
export type AdjustScopeChoice = "instances" | "variable";

/** Which of the three options a chosen or applied colour came from */
export type AdjustOptionChoice = "a" | "b" | "c";

/** Asks for the file palette and binding info for one finding */
export interface AdjustOptionsRequestMessage {
  type: "ADJUST_OPTIONS_REQUEST";
  issueId: string;
}

/** One colour already present in the file, named by its binding where it has one */
export interface AdjustPaletteColor {
  color: RGBColor;
  name: string | null;
}

/** Whether the fill is bound, and how many other nodes on the page share the binding */
export interface AdjustFillBinding {
  name: string;
  usageCount: number;
}

export interface AdjustOptionsReadyMessage {
  type: "ADJUST_OPTIONS_READY";
  issueId: string;
  palette: readonly AdjustPaletteColor[];
  binding: AdjustFillBinding | null;
  variableScope: AdjustVariableScope | null;
}

/** Live preview of one colour, issueId only matches replies and issueIds is what gets written */
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

/** Writes to every node in issueIds as one undo step, the last three fields feed the log */
export interface AdjustApplyMessage {
  type: "ADJUST_APPLY";
  issueId: string;
  issueIds: string[];
  color: RGBColor;
  optionChosen: AdjustOptionChoice;
  wheelOpened: boolean;
  hexRejected: boolean;
}

/** Popup closed without applying, logged as a result and not an error */
export interface AdjustAbandonedMessage {
  type: "ADJUST_ABANDONED";
  issueId: string;
  issueIds: string[];
  scope: AdjustScopeChoice;
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

/** An action was rejected, the message says why */
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
