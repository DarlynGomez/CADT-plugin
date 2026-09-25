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

export interface AdjustOptionsReadyMessage {
  type: "ADJUST_OPTIONS_READY";
  issueId: string;
  palette: readonly AdjustPaletteColor[];
  binding: AdjustFillBinding | null;
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

/** Every inbound adjust message the sandbox handles */
export type AdjustMessage =
  | AdjustOptionsRequestMessage
  | AdjustPreviewMessage
  | AdjustClearPreviewMessage
  | AdjustApplyMessage
  | AdjustAbandonedMessage;

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
  | AdjustActionFailedMessage;
