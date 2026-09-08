import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetCalibration } from "./resetCalibration";
import { STORAGE_KEY_PROFILE } from "./storageKeys";

describe("resetCalibration", () => {
  const setPluginData = vi.fn();
  const deleteAsync = vi.fn();

  beforeEach(() => {
    setPluginData.mockReset();
    deleteAsync.mockReset();
    deleteAsync.mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("figma", {
      root: { setPluginData },
      clientStorage: { deleteAsync }
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("clears both the file and user calibration surfaces", async () => {
    const result = await resetCalibration();

    expect(setPluginData).toHaveBeenCalledWith(STORAGE_KEY_PROFILE, "");
    expect(deleteAsync).toHaveBeenCalledWith(STORAGE_KEY_PROFILE);
    expect(result).toEqual({ fileCleared: true, userCleared: true });
  });

  it("reports a file reset failure while the user reset still succeeds", async () => {
    setPluginData.mockImplementation(() => {
      throw new Error("Cannot write to internal and read-only nodes");
    });

    const result = await resetCalibration();

    expect(deleteAsync).toHaveBeenCalledWith(STORAGE_KEY_PROFILE);
    expect(result.userCleared).toBe(true);
    expect(result.fileCleared).toBe(false);
    expect(result.fileError).toBe("Cannot write to internal and read-only nodes");
    expect(result.userError).toBeUndefined();
  });

  it("reports a user reset failure while the file reset still succeeds", async () => {
    deleteAsync.mockRejectedValue(new Error("clientStorage unavailable"));

    const result = await resetCalibration();

    expect(setPluginData).toHaveBeenCalledWith(STORAGE_KEY_PROFILE, "");
    expect(result.fileCleared).toBe(true);
    expect(result.userCleared).toBe(false);
    expect(result.userError).toBe("clientStorage unavailable");
    expect(result.fileError).toBeUndefined();
  });

  it("reports both failures without throwing", async () => {
    setPluginData.mockImplementation(() => {
      throw new Error("file write blocked");
    });
    deleteAsync.mockRejectedValue(new Error("user delete blocked"));

    const result = await resetCalibration();

    expect(result).toEqual({
      fileCleared: false,
      userCleared: false,
      fileError: "file write blocked",
      userError: "user delete blocked"
    });
  });
});
