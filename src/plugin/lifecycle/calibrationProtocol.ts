import { isCalibrationProfile } from "../../shared/calibrationSchema";
import type {
  CalibrationLoadMessage,
  CalibrationSaveMessage,
  PluginToUiMessage
} from "../../shared/messageTypes";
import { resolveCalibration, saveCalibration } from "../storage/calibrationStore";

type Reply = (message: PluginToUiMessage) => void;
type CalibrationMessage = CalibrationLoadMessage | CalibrationSaveMessage;

export function isCalibrationMessage(value: unknown): value is CalibrationMessage {
  if (!value || typeof value !== "object") {
    return false;
  }
  const message = value as Record<string, unknown>;
  return message.type === "CALIBRATION_LOAD" || message.type === "CALIBRATION_SAVE";
}

async function handleLoad(reply: Reply): Promise<void> {
  try {
    const resolution = await resolveCalibration();
    reply({
      type: "CALIBRATION_LOADED",
      profile: resolution?.profile ?? null,
      resolvedScope: resolution?.scope ?? null
    });
  } catch (error) {
    console.error("Calibration load failed, falling back to first run calibration", error);
    reply({ type: "CALIBRATION_LOADED", profile: null, resolvedScope: null });
  }
}

async function handleSave(message: CalibrationSaveMessage, reply: Reply): Promise<void> {
  if (!isCalibrationProfile(message.profile)) {
    console.error("Rejected a CALIBRATION_SAVE with an invalid profile", message.profile);
    reply({
      type: "CALIBRATION_SAVE_FAILED",
      message: "The setup could not be saved: the answers were not in a valid shape."
    });
    return;
  }

  const saveResult = await saveCalibration(message.profile);
  if (!saveResult.fileSaved && !saveResult.userSaved) {
    const detail =
      [saveResult.fileError, saveResult.userError].filter(Boolean).join("; ") ||
      "unknown storage error";
    console.error("Calibration save failed on every surface", saveResult);
    reply({ type: "CALIBRATION_SAVE_FAILED", message: `The setup could not be saved: ${detail}` });
    return;
  }

  if (!saveResult.fileSaved || !saveResult.userSaved) {
    console.warn("Calibration saved to only one surface", saveResult);
  }
  reply({ type: "CALIBRATION_SAVED" });

  try {
    // Re-resolve so the UI hands off to the returning-user surface with the
    // sandbox's scope decision rather than one guessed above the storage layer.
    const resolution = await resolveCalibration();
    if (resolution) {
      reply({
        type: "CALIBRATION_LOADED",
        profile: resolution.profile,
        resolvedScope: resolution.scope
      });
    }
  } catch (error) {
    // The write already succeeded, so the UI keeps the profile it authored. A
    // failed re-resolve only costs the returning-user screen its scope label.
    console.error("Calibration re-resolve after save failed", error);
  }
}

/** Handles CALIBRATION_LOAD and CALIBRATION_SAVE, the only two calibration messages */
export async function handleCalibrationMessage(
  message: CalibrationMessage,
  reply: Reply
): Promise<void> {
  if (message.type === "CALIBRATION_LOAD") {
    await handleLoad(reply);
    return;
  }
  await handleSave(message, reply);
}
