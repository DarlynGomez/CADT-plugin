import { isCalibrationProfile } from "../shared/calibrationSchema";
import { resolveCalibration, saveCalibration } from "./storage/calibrationStore";
import { resetCalibration, type CalibrationResetResult } from "./storage/resetCalibration";

const RESET_COMMAND = "reset-calibration";
const UI_WIDTH = 460;
const UI_HEIGHT = 680;

// figma.ui.postMessage takes the payload directly; Figma delivers it to the UI
// as event.data.pluginMessage. Do not wrap it in { pluginMessage: ... } here.

async function handleUiMessage(rawMessage: unknown): Promise<void> {
  if (!rawMessage || typeof rawMessage !== "object") {
    console.warn("Dropped a plugin message that was not an object", rawMessage);
    return;
  }

  const message = rawMessage as Record<string, unknown>;

  if (message.type === "CALIBRATION_LOAD") {
    try {
      const resolution = await resolveCalibration();
      figma.ui.postMessage({
        type: "CALIBRATION_LOADED",
        profile: resolution?.profile ?? null,
        resolvedScope: resolution?.scope ?? null
      });
    } catch (error) {
      console.error("Calibration load failed, falling back to first run calibration", error);
      figma.ui.postMessage({ type: "CALIBRATION_LOADED", profile: null, resolvedScope: null });
    }
    return;
  }

  if (message.type === "CALIBRATION_SAVE") {
    if (!isCalibrationProfile(message.profile)) {
      console.error("Rejected a CALIBRATION_SAVE with an invalid profile", message.profile);
      figma.ui.postMessage({
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
      figma.ui.postMessage({
        type: "CALIBRATION_SAVE_FAILED",
        message: `The setup could not be saved: ${detail}`
      });
      return;
    }

    if (!saveResult.fileSaved || !saveResult.userSaved) {
      console.warn("Calibration saved to only one surface", saveResult);
    }
    figma.ui.postMessage({ type: "CALIBRATION_SAVED" });

    try {
      // Re-resolve so the UI hands off to the returning-user surface with the
      // sandbox's scope decision rather than one guessed above the storage layer.
      const resolution = await resolveCalibration();
      if (resolution) {
        figma.ui.postMessage({
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
    return;
  }

  console.warn("Dropped an unrecognized plugin message", message.type);
}

/** Build a notification that names which reset surface failed and why */
function describeResetOutcome(result: CalibrationResetResult): string {
  if (result.fileCleared && result.userCleared) {
    return "Cleared user calibration and file calibration";
  }

  const parts = [
    result.userCleared
      ? "User calibration cleared."
      : `User calibration not cleared: ${result.userError ?? "unknown error"}.`,
    result.fileCleared
      ? "File calibration cleared."
      : `File calibration not cleared: ${result.fileError ?? "unknown error"}.`
  ];
  return parts.join(" ");
}

/** Run the development reset command: clear both surfaces, report the result, then close */
export async function runReset(): Promise<void> {
  try {
    const result = await resetCalibration();
    const fullyCleared = result.fileCleared && result.userCleared;
    figma.notify(describeResetOutcome(result), fullyCleared ? undefined : { error: true });
  } catch (error) {
    console.error("Calibration reset failed unexpectedly", error);
    const message = error instanceof Error && error.message ? error.message : String(error);
    figma.notify(`Reset failed: ${message}`, { error: true });
  } finally {
    figma.closePlugin();
  }
}

/** Normal startup: wire the message router and open the calibration UI */
export function startCalibrationUi(): void {
  figma.ui.onmessage = handleUiMessage;
  figma.showUI(__html__, { width: UI_WIDTH, height: UI_HEIGHT });
}

if (figma.command === RESET_COMMAND) {
  void runReset();
} else {
  startCalibrationUi();
}
