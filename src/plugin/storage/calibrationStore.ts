import { isCalibrationProfile, type CalibrationProfile } from "../../shared/calibrationSchema";
import { STORAGE_KEY_PROFILE } from "./storageKeys";

export interface CalibrationResolution {
  scope: "file" | "user";
  profile: CalibrationProfile;
}

function parseProfile(value: string | undefined): CalibrationProfile | null {
  if (!value) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return isCalibrationProfile(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function readFileProfile(): Promise<CalibrationResolution | null> {
  const profile = parseProfile(figma.root.getPluginData(STORAGE_KEY_PROFILE));
  return profile ? { scope: "file", profile } : null;
}

async function readUserProfile(): Promise<CalibrationResolution | null> {
  const profile = await figma.clientStorage.getAsync(STORAGE_KEY_PROFILE);
  return isCalibrationProfile(profile) ? { scope: "user", profile } : null;
}

/** Resolve file-first calibration while the ownership rule remains provisional and pending advisor input */
export async function resolveCalibration(): Promise<CalibrationResolution | null> {
  const [fileProfile, userProfile] = await Promise.all([readFileProfile(), readUserProfile()]);
  return fileProfile ?? userProfile ?? null;
}

/** Outcome of persisting a profile to the two storage surfaces */
export interface CalibrationSaveResult {
  fileSaved: boolean;
  userSaved: boolean;
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
 * Write the profile to both persistence surfaces independently. The save counts
 * as successful when either surface accepts it, so one surface failing (a
 * read-only document, a clientStorage quota, a runtime restriction) does not
 * block the designer. Each failure is captured with its reason.
 */
export async function saveCalibration(
  profile: CalibrationProfile
): Promise<CalibrationSaveResult> {
  const result: CalibrationSaveResult = { fileSaved: false, userSaved: false };

  try {
    // Per file, travels to collaborators.
    figma.root.setPluginData(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    result.fileSaved = true;
  } catch (error) {
    result.fileError = describeError(error);
    console.error("saveCalibration: figma.root.setPluginData failed", error);
  }

  try {
    // Per user, across every file they open.
    await figma.clientStorage.setAsync(STORAGE_KEY_PROFILE, profile);
    result.userSaved = true;
  } catch (error) {
    result.userError = describeError(error);
    console.error("saveCalibration: figma.clientStorage.setAsync failed", error);
  }

  return result;
}
