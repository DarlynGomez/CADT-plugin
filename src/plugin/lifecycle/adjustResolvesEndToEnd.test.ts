import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Proves ADJUST_SPEC.md section 10: applying moves the issue to resolved through the
 * normal detection path, because the finding stops being produced, not because the
 * Adjust flow marked it resolved directly. adjustProtocol.ts never imports issueStore
 * or stateMachine; this test proves the consequence, that a rescan after apply is what
 * actually resolves the issue, using the real scanAndSync and reconcileDetection.
 */
describe("applying an adjustment resolves the issue through the normal detection path", () => {
  let pluginData: Record<string, string> = {};
  const getPluginData = vi.fn((key: string) => pluginData[key] ?? "");
  const setPluginData = vi.fn((key: string, value: string) => {
    pluginData[key] = value;
  });
  const uiPostMessage = vi.fn();
  const commitUndo = vi.fn();

  const PAGE = { type: "PAGE", backgrounds: [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }] };
  const TEXT_NODE = {
    id: "1:1",
    name: "Footer copy",
    type: "TEXT",
    fontSize: 16,
    fontName: { family: "Inter", style: "Regular" },
    fontWeight: 400,
    // Near-white on white: a real, unambiguous contrast failure.
    fills: [{ type: "SOLID", color: { r: 0.95, g: 0.95, b: 0.95 } }],
    opacity: 1,
    blendMode: "NORMAL",
    visible: true,
    parent: PAGE
  };
  const getNodeByIdAsync = vi.fn(async (id: string) => (id === TEXT_NODE.id ? TEXT_NODE : null));

  beforeEach(() => {
    pluginData = {};
    getPluginData.mockClear();
    setPluginData.mockClear();
    uiPostMessage.mockClear();
    commitUndo.mockClear();
    getNodeByIdAsync.mockClear();
    TEXT_NODE.fills = [{ type: "SOLID", color: { r: 0.95, g: 0.95, b: 0.95 } }];
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.stubGlobal("figma", {
      mixed: Symbol("figma.mixed"),
      root: { getPluginData, setPluginData },
      getNodeByIdAsync,
      currentPage: {
        findAll: (predicate: (candidate: unknown) => boolean) => [TEXT_NODE].filter(predicate),
        findAllWithCriteria: () => [TEXT_NODE]
      },
      variables: { getVariableByIdAsync: vi.fn() },
      getStyleByIdAsync: vi.fn(),
      clientStorage: { getAsync: vi.fn().mockResolvedValue(undefined) },
      loadFontAsync: vi.fn().mockResolvedValue(undefined),
      commitUndo,
      ui: { postMessage: uiPostMessage }
    });
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("stays open immediately after apply, then resolves once a rescan sees the new fill", async () => {
    const { scanAndSync } = await import("./scanAndSync");
    const { handleAdjustMessage } = await import("./adjustProtocol");
    const { loadIssues } = await import("../accountability/issueStore");

    const ISSUE_ID = "contrast:1:1";

    // 1. Detect: the live failure creates a fresh, open issue.
    await scanAndSync(new Set([TEXT_NODE.id]), "detect");
    expect((await loadIssues())[ISSUE_ID].state).toBe("open");

    // 2. Apply a passing colour. This alone must not resolve the issue: adjustProtocol
    // never touches issueStore or stateMachine, only the node's fill.
    await handleAdjustMessage(
      {
        type: "ADJUST_APPLY",
        issueId: ISSUE_ID,
        color: { r: 0, g: 0, b: 0 },
        optionChosen: "a",
        wheelOpened: false,
        hexRejected: false
      },
      vi.fn()
    );
    expect(TEXT_NODE.fills).toEqual([{ type: "SOLID", color: { r: 0, g: 0, b: 0 }, opacity: 1 }]);
    expect(commitUndo).toHaveBeenCalledTimes(1);
    expect((await loadIssues())[ISSUE_ID].state).toBe("open");

    // 3. The rescan that a real documentchange event on "fills" would trigger (see
    // listeners.test.ts for that wiring in isolation) is what actually resolves it,
    // because the finding genuinely stops being produced.
    await scanAndSync(new Set([TEXT_NODE.id]), "rescan-after-apply");
    expect((await loadIssues())[ISSUE_ID].state).toBe("resolved");
  });
});
