import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const LEGACY_ENTRY = {
  issueId: "contrast:1:1",
  optionChosen: "a" as const,
  beforeHex: "#888888",
  beforeRatio: 3.5,
  afterHex: "#595959",
  afterRatio: 7,
  wasBound: false,
  wheelOpened: false,
  hexRejected: false,
  abandoned: false,
  instanceCount: 1,
  loggedAt: "2026-09-20T00:00:00.000Z"
};

const NEW_ENTRY = { ...LEGACY_ENTRY, issueId: "contrast:2:2", scope: "variable" as const };

function stubFigma(stored: unknown) {
  const pluginData: Record<string, string> = {
    "cadt.adjustLog.v1": JSON.stringify(stored),
    "cadt.calibration.profile": JSON.stringify({
      schemaVersion: 1,
      completedAt: "2026-09-08T00:00:00.000Z",
      loggingConsent: true,
      answers: {}
    })
  };
  vi.stubGlobal("figma", {
    root: {
      getPluginData: (key: string) => pluginData[key] ?? "",
      setPluginData: (key: string, value: string) => {
        pluginData[key] = value;
      }
    },
    clientStorage: { getAsync: vi.fn().mockResolvedValue(undefined) }
  });
  return pluginData;
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loading the Adjust log", () => {
  it("keeps an entry written before the scope field existed and reads it as scope instances", async () => {
    stubFigma([LEGACY_ENTRY]);
    const { loadAdjustLog } = await import("./adjustLogging");

    const log = loadAdjustLog();

    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ issueId: "contrast:1:1", scope: "instances" });
  });

  it("leaves an entry that already has a scope exactly as stored", async () => {
    stubFigma([NEW_ENTRY]);
    const { loadAdjustLog } = await import("./adjustLogging");

    expect(loadAdjustLog()[0].scope).toBe("variable");
  });

  it("does not drop old entries when a new one is appended", async () => {
    const pluginData = stubFigma([LEGACY_ENTRY]);
    const { logAdjustEvent } = await import("./adjustLogging");

    await logAdjustEvent(NEW_ENTRY);

    const stored = JSON.parse(pluginData["cadt.adjustLog.v1"]);
    expect(stored).toHaveLength(2);
    expect(stored[0].issueId).toBe("contrast:1:1");
    expect(stored[1].scope).toBe("variable");
  });

  it("does not write an inferred scope back onto an old entry", async () => {
    const pluginData = stubFigma([LEGACY_ENTRY]);
    const { logAdjustEvent } = await import("./adjustLogging");

    await logAdjustEvent(NEW_ENTRY);

    expect(JSON.parse(pluginData["cadt.adjustLog.v1"])[0]).not.toHaveProperty("scope");
  });

  it("returns an empty log for an empty or unreadable store", async () => {
    stubFigma("not an array");
    const { loadAdjustLog } = await import("./adjustLogging");

    expect(loadAdjustLog()).toEqual([]);
  });
});
