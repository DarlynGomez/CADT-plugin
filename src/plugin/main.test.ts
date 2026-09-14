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

// Detection lifecycle surface: an empty page, no selection, and no documentchange
// activity is enough for these calibration-focused tests, which do not exercise live
// detection itself. currentPage.selection must exist even though it is empty: the
// re-encounter startup wiring reads it unconditionally, and a missing property would
// throw where these tests would only ever see it as a silently swallowed rejection.
const loadAllPagesAsync = vi.fn(async () => undefined);
const documentChangeOn = vi.fn();
const findAllWithCriteria = vi.fn(() => []);
const getNodeByIdAsync = vi.fn(async () => null);
const scrollAndZoomIntoView = vi.fn();

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
    closePlugin,
    loadAllPagesAsync,
    on: documentChangeOn,
    currentPage: { findAllWithCriteria, selection: [] },
    getNodeByIdAsync,
    viewport: { scrollAndZoomIntoView }
  });
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(console, "log").mockImplementation(() => undefined);
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

  it("starts the detection lifecycle alongside the calibration UI on normal startup", async () => {
    stubFigma("open");
    await import("./main");

    // getPluginData is only reached once loadAllPagesAsync, both listener
    // registrations, and the re-encounter startup read have all completed without
    // throwing, so waiting for it is a stronger completion signal than waiting for
    // the listener registration alone.
    await vi.waitFor(() => expect(getPluginData).toHaveBeenCalled());
    expect(documentChangeOn).toHaveBeenCalledWith("documentchange", expect.any(Function));
    expect(documentChangeOn).toHaveBeenCalledWith("selectionchange", expect.any(Function));
    expect(loadAllPagesAsync).toHaveBeenCalledTimes(1);
    // Guards against a startup step throwing and being silently swallowed by main.ts's
    // top-level .catch, which would otherwise pass this test for the wrong reason.
    expect(console.error).not.toHaveBeenCalled();
  });

  it("exports the issue list to the console then closes, without opening the UI", async () => {
    stubFigma("export-issues");
    await import("./main");

    await vi.waitFor(() => expect(closePlugin).toHaveBeenCalledTimes(1));
    expect(showUI).not.toHaveBeenCalled();
    expect(getPluginData).toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith("Exported 0 issue(s) to the console");
  });

  it("does not start the detection lifecycle for the reset command", async () => {
    stubFigma("reset-calibration");
    await import("./main");

    await vi.waitFor(() => expect(closePlugin).toHaveBeenCalledTimes(1));
    expect(loadAllPagesAsync).not.toHaveBeenCalled();
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

  it("routes an issue message to the issues protocol handler with a bare reply", async () => {
    stubFigma("open");
    await import("./main");

    await ui.onmessage?.({ type: "ISSUES_SUBSCRIBE" });

    expect(uiPostMessage).toHaveBeenCalledWith({ type: "ISSUES_UPDATED", issues: [] });
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
