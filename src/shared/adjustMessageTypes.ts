import type { RGBColor } from "./issues/issueTypes";

/** Requests a live preview of one candidate colour on the finding's node */
export interface AdjustPreviewMessage {
  type: "ADJUST_PREVIEW";
  issueId: string;
  color: RGBColor;
}

/** Restores the original fill, clearing whatever preview is active */
export interface AdjustClearPreviewMessage {
  type: "ADJUST_CLEAR_PREVIEW";
}

/** Writes the given colour for real and commits it as one undo step */
export interface AdjustApplyMessage {
  type: "ADJUST_APPLY";
  issueId: string;
  color: RGBColor;
}

/** Every inbound adjust message the sandbox handles */
export type AdjustMessage = AdjustPreviewMessage | AdjustClearPreviewMessage | AdjustApplyMessage;

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
  | AdjustPreviewedMessage
  | AdjustClearedMessage
  | AdjustAppliedMessage
  | AdjustActionFailedMessage;
