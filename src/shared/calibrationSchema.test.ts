import { describe, expect, it } from "vitest";

import { isCalibrationProfile } from "./calibrationSchema";

describe("CalibrationProfile schema", () => {
  it("accepts the saved profile shape", () => {
    expect(
      isCalibrationProfile({
        schemaVersion: 1,
        completedAt: "2026-09-08T00:00:00.000Z",
        loggingConsent: true,
        answers: { answer: "value" }
      })
    ).toBe(true);
  });

  it("rejects malformed profiles and storage scope", () => {
    expect(isCalibrationProfile({ schemaVersion: 1, answers: {}, scope: "file" })).toBe(false);
    expect(isCalibrationProfile(null)).toBe(false);
  });
});
