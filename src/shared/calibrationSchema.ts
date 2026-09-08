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
export interface CalibrationStorageEnvelope {
  scope: "file" | "user";
  profile: CalibrationProfile;
}
