import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CalibrationProfile } from "../../shared/calibrationSchema";
import { useCalibrationPersistence } from "./useCalibrationPersistence";

const profile: CalibrationProfile = {
  schemaVersion: 1,
  completedAt: "2026-09-08T00:00:00.000Z",
  loggingConsent: false,
  answers: { example: "value" }
};

function emit(message: unknown) {
  window.dispatchEvent(new MessageEvent("message", { data: { pluginMessage: message } }));
}

describe("useCalibrationPersistence", () => {
  it("loads only a profile and sends no storage scope into the UI", async () => {
    const postMessage = vi.spyOn(window.parent, "postMessage");
    const { result } = renderHook(() => useCalibrationPersistence());

    expect(postMessage).toHaveBeenCalledWith({ pluginMessage: { type: "CALIBRATION_LOAD" } }, "*");

    await act(async () => {
      emit({ type: "CALIBRATION_LOADED", profile, resolvedScope: "file" });
    });

    expect(result.current.loadedProfile).toEqual(profile);
    expect(result.current.loadedProfile).not.toHaveProperty("scope");
    expect(result.current.resolvedScope).toBe("file");
    postMessage.mockRestore();
  });

  it("exposes the saved profile so the app can hand off to the returning-user surface", async () => {
    const { result } = renderHook(() => useCalibrationPersistence());

    await act(async () => {
      const save = result.current.saveProfile(profile);
      emit({ type: "CALIBRATION_SAVED" });
      expect(await save).toBe(true);
    });

    expect(result.current.loadedProfile).toEqual(profile);
  });

  it("reports save failure and sends the same profile again for retry", async () => {
    const postMessage = vi.spyOn(window.parent, "postMessage");
    const { result } = renderHook(() => useCalibrationPersistence());

    await act(async () => {
      const save = result.current.saveProfile(profile);
      emit({
        type: "CALIBRATION_SAVE_FAILED",
        message: "The setup could not be saved. Check your connection and retry."
      });
      expect(await save).toBe(false);
    });

    expect(result.current.saveError).toBe(
      "The setup could not be saved. Check your connection and retry."
    );

    await act(async () => {
      const retry = result.current.saveProfile(profile);
      emit({ type: "CALIBRATION_SAVED" });
      expect(await retry).toBe(true);
    });

    expect(result.current.saveError).toBeNull();
    expect(postMessage).toHaveBeenLastCalledWith(
      { pluginMessage: { type: "CALIBRATION_SAVE", profile } },
      "*"
    );
    postMessage.mockRestore();
  });
});
