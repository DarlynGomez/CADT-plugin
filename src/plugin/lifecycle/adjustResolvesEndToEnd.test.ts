import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Proves ADJUST_SPEC.md section 10: applying moves the issue to resolved through the
 * normal detection path, because the finding stops being produced, not because the
 * Adjust flow marks it resolved directly. adjustProtocol.ts never imports stateMachine
 * and never flips an Issue's state itself; ADJUST_APPLY's own handler calls the real
 * scanAndSync as its last step (GROUPING_SPEC.md section 8's "the panel must never
 * show a resolved instance as still open"), so resolution is immediate rather than
 * waiting on the separate documentchange listener, but it is still detection, run
 * through the same reconcileScanResults every other trigger uses, that resolves it.
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

  it("resolves the issue by the time ADJUST_APPLY replies, since apply rescans itself", async () => {
    const { scanAndSync } = await import("./scanAndSync");
    const { handleAdjustMessage } = await import("./adjustProtocol");
    const { loadIssues } = await import("../accountability/issueStore");

    const ISSUE_ID = "contrast:1:1";

    // 1. Detect: the live failure creates a fresh, open issue.
    await scanAndSync(new Set([TEXT_NODE.id]), "detect");
    expect((await loadIssues())[ISSUE_ID].state).toBe("open");

    // 2. Apply a passing colour. adjustProtocol.ts never flips Issue.state itself;
    // its own rescan of exactly this node, the same reconcileScanResults every other
    // trigger uses, is what resolves it, and it has already happened by the time
    // handleAdjustMessage returns.
    await handleAdjustMessage(
      {
        type: "ADJUST_APPLY",
        issueId: ISSUE_ID,
        issueIds: [ISSUE_ID],
        color: { r: 0, g: 0, b: 0 },
        optionChosen: "a",
        wheelOpened: false,
        hexRejected: false
      },
      vi.fn()
    );
    expect(TEXT_NODE.fills).toEqual([{ type: "SOLID", color: { r: 0, g: 0, b: 0 }, opacity: 1 }]);
    expect(commitUndo).toHaveBeenCalledTimes(1);
    expect((await loadIssues())[ISSUE_ID].state).toBe("resolved");
  });

  it("pushes ISSUES_UPDATED itself for a group apply, not waiting on documentchange", async () => {
    const SECOND_NODE = { ...TEXT_NODE, id: "1:2", name: "Second instance" };
    const getNodeByIdAsyncBoth = vi.fn(async (id: string) => {
      if (id === TEXT_NODE.id) return TEXT_NODE;
      if (id === SECOND_NODE.id) return SECOND_NODE;
      return null;
    });
    vi.stubGlobal("figma", {
      mixed: Symbol("figma.mixed"),
      root: { getPluginData, setPluginData },
      getNodeByIdAsync: getNodeByIdAsyncBoth,
      currentPage: {
        findAll: (predicate: (candidate: unknown) => boolean) =>
          [TEXT_NODE, SECOND_NODE].filter(predicate),
        findAllWithCriteria: () => [TEXT_NODE, SECOND_NODE]
      },
      variables: { getVariableByIdAsync: vi.fn() },
      getStyleByIdAsync: vi.fn(),
      clientStorage: { getAsync: vi.fn().mockResolvedValue(undefined) },
      loadFontAsync: vi.fn().mockResolvedValue(undefined),
      commitUndo,
      ui: { postMessage: uiPostMessage }
    });

    const { scanAndSync } = await import("./scanAndSync");
    const { handleAdjustMessage } = await import("./adjustProtocol");
    const { loadIssues } = await import("../accountability/issueStore");

    const FIRST_ID = "contrast:1:1";
    const SECOND_ID = "contrast:1:2";

    await scanAndSync(new Set([TEXT_NODE.id, SECOND_NODE.id]), "detect");
    expect((await loadIssues())[FIRST_ID].state).toBe("open");
    expect((await loadIssues())[SECOND_ID].state).toBe("open");

    uiPostMessage.mockClear();
    await handleAdjustMessage(
      {
        type: "ADJUST_APPLY",
        issueId: FIRST_ID,
        issueIds: [FIRST_ID, SECOND_ID],
        color: { r: 0, g: 0, b: 0 },
        optionChosen: "a",
        wheelOpened: false,
        hexRejected: false
      },
      vi.fn()
    );

    // The refresh happens as part of handling ADJUST_APPLY itself, before the reply,
    // so the panel is never left showing either instance as still open.
    const pushed = uiPostMessage.mock.calls.map((call) => call[0]);
    const latest = pushed[pushed.length - 1] as { issues: Array<{ id: string; state: string }> };
    expect(latest.issues.find((issue) => issue.id === FIRST_ID)?.state).toBe("resolved");
    expect(latest.issues.find((issue) => issue.id === SECOND_ID)?.state).toBe("resolved");
  });
});
