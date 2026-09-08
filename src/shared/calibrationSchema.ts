/** A value collected by one calibration question */
export type CalibrationAnswer = string | readonly string[] | number;

/** The completed calibration data shared above the storage layer */
export interface CalibrationProfile {
  schemaVersion: number;
  completedAt: string;
  loggingConsent: boolean;
  answers: Readonly<Record<string, CalibrationAnswer>>;
}

/** A sandbox-only wrapper that records where a profile was persisted */
export function isCalibrationProfile(value: unknown): value is CalibrationProfile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const profile = value as Record<string, unknown>;
  return (
    typeof profile.schemaVersion === "number" &&
    typeof profile.completedAt === "string" &&
    typeof profile.loggingConsent === "boolean" &&
    typeof profile.answers === "object" &&
    profile.answers !== null &&
    !Array.isArray(profile.answers)
  );
}
