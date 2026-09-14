import type { CalibrationProfile } from "./calibrationSchema";
import type { IssueSummary } from "./issues/issueTypes";

/** Requests that the sandbox persist a completed calibration profile */
export interface CalibrationSaveMessage {
  type: "CALIBRATION_SAVE";
  profile: CalibrationProfile;
}

/** Requests that the sandbox load the applicable calibration profile */
export interface CalibrationLoadMessage {
  type: "CALIBRATION_LOAD";
}

/** Returns the profile selected by the sandbox's storage resolution rule */
export interface CalibrationLoadedMessage {
  type: "CALIBRATION_LOADED";
  profile: CalibrationProfile | null;
  resolvedScope: "file" | "user" | null;
}

/** Reports that the sandbox could not persist a calibration profile. */
export interface CalibrationSaveFailedMessage {
  type: "CALIBRATION_SAVE_FAILED";
  message: string;
}

export interface CalibrationSavedMessage {
  type: "CALIBRATION_SAVED";
}

/** Requests the current issue list. The sandbox replies with ISSUES_UPDATED. */
export interface IssuesSubscribeMessage {
  type: "ISSUES_SUBSCRIBE";
}

/** Puts an issue off; it will resurface on re-encounter */
export interface IssueDeferMessage {
  type: "ISSUE_DEFER";
  issueId: string;
}

/** Documents a final decision. Reason is required and enforced again in the state machine. */
export interface IssueAcknowledgeMessage {
  type: "ISSUE_ACKNOWLEDGE";
  issueId: string;
  reason: string;
}

/** Flags an issue as steady: always shown, never fades */
export interface IssueFlagImportantMessage {
  type: "ISSUE_FLAG_IMPORTANT";
  issueId: string;
}

/** Returns an issue to open, only ever an explicit designer action */
export interface IssueReopenMessage {
  type: "ISSUE_REOPEN";
  issueId: string;
}

/** Selects the issue's node and scrolls it into view. Creates nothing on the canvas. */
export interface IssueFocusMessage {
  type: "ISSUE_FOCUS";
  issueId: string;
}

/** Every inbound message the accountability panel sends */
export type IssueMessage =
  | IssuesSubscribeMessage
  | IssueDeferMessage
  | IssueAcknowledgeMessage
  | IssueFlagImportantMessage
  | IssueReopenMessage
  | IssueFocusMessage;

/** The full current issue list. Always the complete list, never a delta. See ADR-012. */
export interface IssuesUpdatedMessage {
  type: "ISSUES_UPDATED";
  issues: readonly IssueSummary[];
}

/** An issue action was rejected; message explains why for display, not just logging */
export interface IssueActionFailedMessage {
  type: "ISSUE_ACTION_FAILED";
  issueId: string;
  message: string;
}

/** Every outbound message the accountability panel receives */
export type IssuesPluginMessage = IssuesUpdatedMessage | IssueActionFailedMessage;

/** Messages sent from the UI iframe to the plugin sandbox. */
export type UiToPluginMessage = CalibrationLoadMessage | CalibrationSaveMessage | IssueMessage;

/** Messages sent from the plugin sandbox to the UI iframe. */
export type PluginToUiMessage =
  | CalibrationLoadedMessage
  | CalibrationSaveFailedMessage
  | CalibrationSavedMessage
  | IssuesUpdatedMessage
  | IssueActionFailedMessage;

/** Every message permitted across the plugin boundary. */
export type PluginMessage = UiToPluginMessage | PluginToUiMessage;
