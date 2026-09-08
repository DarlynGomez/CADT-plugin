import type { CalibrationProfile, CalibrationStorageEnvelope } from "./calibrationSchema";

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
  envelope: CalibrationStorageEnvelope | null;
}

/** Reports that the sandbox could not persist a calibration profile. */
export interface CalibrationSaveFailedMessage {
  type: "CALIBRATION_SAVE_FAILED";
  message: string;
}

/** Messages sent from the UI iframe to the plugin sandbox. */
export type UiToPluginMessage = CalibrationLoadMessage | CalibrationSaveMessage;

/** Messages sent from the plugin sandbox to the UI iframe. */
export type PluginToUiMessage = CalibrationLoadedMessage | CalibrationSaveFailedMessage;

/** Every message permitted across the plugin boundary. */
export type PluginMessage = UiToPluginMessage | PluginToUiMessage;
