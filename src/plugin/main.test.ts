import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEY_PROFILE } from "./storage/storageKeys";

const showUI = vi.fn();
const notify = vi.fn();
const closePlugin = vi.fn();
const setPluginData = vi.fn();
const getPluginData = vi.fn(() => "");
const getAsync = vi.fn(async () => undefined);
const setAsync = vi.fn(async () => undefined);
const deleteAsync = vi.fn(async () => undefined);
const uiPostMessage =
  vi.fn<(message: { type?: string; message?: string; pluginMessage?: unknown }) => void>();

const ui: {
  onmessage: ((message: unknown) => Promise<void> | void) | null;
  postMessage: typeof uiPostMessage;
} = { onmessage: null, postMessage: uiPostMessage };

function stubFigma(command: string | undefined) {
  ui.onmessage = null;
  vi.stubGlobal("__html__", "<html>calibration</html>");
  vi.stubGlobal("figma", {
    command,
    root: { setPluginData, getPluginData },
    clientStorage: { getAsync, setAsync, deleteAsync },
    ui,
    showUI,
    notify,
    closePlugin
  });
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("plugin entry routing", () => {
  it("always opens the UI at 460x680 for the normal command", async () => {
    stubFigma("open");
    await import("./main");

    expect(showUI).toHaveBeenCalledWith("<html>calibration</html>", { width: 460, height: 680 });
    expect(closePlugin).not.toHaveBeenCalled();
  });

  it("opens the UI even when no command is supplied", async () => {
    stubFigma(undefined);
    await import("./main");

    expect(showUI).toHaveBeenCalledWith("<html>calibration</html>", { width: 460, height: 680 });
  });

  it("runs the reset command instead of the UI, then closes the plugin", async () => {
    stubFigma("reset-calibration");
    await import("./main");

    await vi.waitFor(() => expect(closePlugin).toHaveBeenCalledTimes(1));
    expect(showUI).not.toHaveBeenCalled();
    expect(setPluginData).toHaveBeenCalledWith(STORAGE_KEY_PROFILE, "");
    expect(deleteAsync).toHaveBeenCalledWith(STORAGE_KEY_PROFILE);
    expect(notify).toHaveBeenCalledWith("Cleared user calibration and file calibration", undefined);
  });

  it("names the failing surface and its reason when reset partially fails", async () => {
    stubFigma("reset-calibration");
    deleteAsync.mockRejectedValueOnce(new Error("clientStorage unavailable"));
    await import("./main");

    await vi.waitFor(() => expect(closePlugin).toHaveBeenCalledTimes(1));
    const [message, options] = notify.mock.calls[0];
    expect(message).toContain("User calibration not cleared: clientStorage unavailable.");
    expect(message).toContain("File calibration cleared.");
    expect(options).toEqual({ error: true });
  });
});

describe("sandbox to UI message envelope", () => {
  const profile = {
    schemaVersion: 1,
    completedAt: "2026-09-08T00:00:00.000Z",
    loggingConsent: false,
    answers: { projectType: "mobile-app" }
  };

  it("replies to a load with a bare payload, not one wrapped in pluginMessage", async () => {
    stubFigma("open");
    await import("./main");

    expect(typeof ui.onmessage).toBe("function");
    await ui.onmessage?.({ type: "CALIBRATION_LOAD" });

    expect(uiPostMessage).toHaveBeenCalledTimes(1);
    const payload = uiPostMessage.mock.calls[0][0];
    // figma.ui.postMessage(payload) is delivered to the UI as
    // event.data.pluginMessage === payload. Wrapping it here hides the type.
    expect(payload).toMatchObject({ type: "CALIBRATION_LOADED", profile: null });
    expect(payload).not.toHaveProperty("pluginMessage");
  });

  it("acknowledges a save with a bare CALIBRATION_SAVED payload", async () => {
    stubFigma("open");
    await import("./main");

    await ui.onmessage?.({ type: "CALIBRATION_SAVE", profile });

    expect(setPluginData).toHaveBeenCalledWith(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    expect(setAsync).toHaveBeenCalledWith(STORAGE_KEY_PROFILE, profile);
    const types = uiPostMessage.mock.calls.map((call) => call[0]?.type);
    expect(types).toContain("CALIBRATION_SAVED");
    for (const call of uiPostMessage.mock.calls) {
      expect(call[0]).not.toHaveProperty("pluginMessage");
    }
  });

  it("still acknowledges the save when only one surface accepts it", async () => {
    stubFigma("open");
    setPluginData.mockImplementationOnce(() => {
      throw new Error("read-only document");
    });
    await import("./main");

    await ui.onmessage?.({ type: "CALIBRATION_SAVE", profile });

    const types = uiPostMessage.mock.calls.map((call) => call[0]?.type);
    expect(types).toContain("CALIBRATION_SAVED");
    expect(types).not.toContain("CALIBRATION_SAVE_FAILED");
  });

  it("reports the underlying reason when every surface rejects the save", async () => {
    stubFigma("open");
    setPluginData.mockImplementationOnce(() => {
      throw new Error("read-only document");
    });
    setAsync.mockRejectedValueOnce(new Error("clientStorage unavailable"));
    await import("./main");

    await ui.onmessage?.({ type: "CALIBRATION_SAVE", profile });

    const payload = uiPostMessage.mock.calls.at(-1)?.[0];
    expect(payload).toMatchObject({ type: "CALIBRATION_SAVE_FAILED" });
    expect(payload?.message).toContain("clientStorage unavailable");
    expect(payload).not.toHaveProperty("pluginMessage");
  });

  it("rejects an invalid profile with a failure reply instead of dropping it", async () => {
    stubFigma("open");
    await import("./main");

    await ui.onmessage?.({ type: "CALIBRATION_SAVE", profile: { schemaVersion: "nope" } });

    const payload = uiPostMessage.mock.calls.at(-1)?.[0];
    expect(payload).toMatchObject({ type: "CALIBRATION_SAVE_FAILED" });
    expect(setPluginData).not.toHaveBeenCalled();
    expect(setAsync).not.toHaveBeenCalled();
  });
});
