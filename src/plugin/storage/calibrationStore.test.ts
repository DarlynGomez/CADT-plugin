import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CalibrationProfile } from "../../shared/calibrationSchema";
import { saveCalibration } from "./calibrationStore";
import { STORAGE_KEY_PROFILE } from "./storageKeys";

const profile: CalibrationProfile = {
  schemaVersion: 1,
  completedAt: "2026-09-08T00:00:00.000Z",
  loggingConsent: false,
  answers: { projectType: "mobile-app", useEnvironments: ["low-light"] }
};

describe("saveCalibration", () => {
  const setPluginData = vi.fn();
  const setAsync = vi.fn();

  beforeEach(() => {
    setPluginData.mockReset();
    setAsync.mockReset();
    setAsync.mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubGlobal("figma", {
      root: { setPluginData },
      clientStorage: { setAsync }
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("writes the serialized profile to the file surface and the object to the user surface", async () => {
    const result = await saveCalibration(profile);

    expect(setPluginData).toHaveBeenCalledWith(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    expect(setAsync).toHaveBeenCalledWith(STORAGE_KEY_PROFILE, profile);
    expect(result).toEqual({ fileSaved: true, userSaved: true });
  });

  it("still reports success on the user surface when the file surface throws", async () => {
    setPluginData.mockImplementation(() => {
      throw new Error("Cannot write to internal and read-only nodes");
    });

    const result = await saveCalibration(profile);

    expect(setAsync).toHaveBeenCalledWith(STORAGE_KEY_PROFILE, profile);
    expect(result.userSaved).toBe(true);
    expect(result.fileSaved).toBe(false);
    expect(result.fileError).toBe("Cannot write to internal and read-only nodes");
  });

  it("still reports success on the file surface when the user surface rejects", async () => {
    setAsync.mockRejectedValue(new Error("clientStorage quota exceeded"));

    const result = await saveCalibration(profile);

    expect(setPluginData).toHaveBeenCalledWith(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    expect(result.fileSaved).toBe(true);
    expect(result.userSaved).toBe(false);
    expect(result.userError).toBe("clientStorage quota exceeded");
  });

  it("captures both reasons without throwing when every surface fails", async () => {
    setPluginData.mockImplementation(() => {
      throw new Error("file write blocked");
    });
    setAsync.mockRejectedValue(new Error("user write blocked"));

    const result = await saveCalibration(profile);

    expect(result).toEqual({
      fileSaved: false,
      userSaved: false,
      fileError: "file write blocked",
      userError: "user write blocked"
    });
  });
});
