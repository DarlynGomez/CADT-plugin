import { STORAGE_KEY_PROFILE } from "./storageKeys";

/** Per-surface outcome of a calibration reset, including the reason a surface failed */
export interface CalibrationResetResult {
  fileCleared: boolean;
  userCleared: boolean;
  fileError?: string;
  userError?: string;
}

function describeError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error);
}

/**
 * Clears both calibration surfaces for development testing
 * Cleared independently so one failure is still reported next to the other success
 */
export async function resetCalibration(): Promise<CalibrationResetResult> {
  const result: CalibrationResetResult = { fileCleared: false, userCleared: false };

  try {
    // Plugin data is per file and travels to collaborators
    figma.root.setPluginData(STORAGE_KEY_PROFILE, "");
    result.fileCleared = true;
  } catch (error) {
    result.fileError = describeError(error);
    console.error("resetCalibration: figma.root.setPluginData failed", error);
  }

  try {
    // clientStorage is per user across all files
    await figma.clientStorage.deleteAsync(STORAGE_KEY_PROFILE);
    result.userCleared = true;
  } catch (error) {
    result.userError = describeError(error);
    console.error("resetCalibration: figma.clientStorage.deleteAsync failed", error);
  }

  return result;
}
