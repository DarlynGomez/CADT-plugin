import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Whole loop: detect, defer, reselect, resurface once, ignore and stay ignored
 * Only the Figma API is mocked, with a real in-memory plugin data store shared across calls
 */
describe("the accountability loop end to end", () => {
  let pluginData: Record<string, string> = {};
  let selection: unknown[] = [];
  const getPluginData = vi.fn((key: string) => pluginData[key] ?? "");
  const setPluginData = vi.fn((key: string, value: string) => {
    pluginData[key] = value;
  });
  const uiPostMessage = vi.fn();

  const PAGE = { type: "PAGE", backgrounds: [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }] };
  const TEXT_NODE = {
    id: "1:1",
    name: "Footer copy",
    type: "TEXT",
    fontSize: 16,
    fontName: { family: "Inter", style: "Regular" },
    // Near white on white, a real contrast failure
    fills: [{ type: "SOLID", color: { r: 0.95, g: 0.95, b: 0.95 } }],
    opacity: 1,
    blendMode: "NORMAL",
    visible: true,
    parent: PAGE
  };
  const getNodeByIdAsync = vi.fn(async (id: string) => (id === TEXT_NODE.id ? TEXT_NODE : null));
  const currentPage = {
    get selection() {
      return selection;
    },
    set selection(value: unknown[]) {
      selection = value;
    }
  };

  beforeEach(() => {
    pluginData = {};
    selection = [];
    getPluginData.mockClear();
    setPluginData.mockClear();
    getNodeByIdAsync.mockClear();
    uiPostMessage.mockClear();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.stubGlobal("figma", {
      mixed: Symbol("figma.mixed"),
      root: { getPluginData, setPluginData },
      getNodeByIdAsync,
      currentPage,
      viewport: { scrollAndZoomIntoView: vi.fn() },
      ui: { postMessage: uiPostMessage }
    });
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("detects, defers, resurfaces exactly once per return, and stays ignored forever after", async () => {
    const { scanAndSync } = await import("./scanAndSync");
    const { handleIssueMessage } = await import("./issuesProtocol");
    const { handleSelectionChange } = await import("./selectionListener");
    const { loadIssues } = await import("../accountability/issueStore");

    const ISSUE_ID = "contrast:1:1";
    const reply = vi.fn();

    // Detect, the live failure creates a fresh open issue
    await scanAndSync(new Set([TEXT_NODE.id]), "detect");
    expect((await loadIssues())[ISSUE_ID]).toMatchObject({ state: "open", encounterCount: 0 });

    // Defer while the node is still selected
    selection = [TEXT_NODE];
    await handleIssueMessage({ type: "ISSUE_DEFER", issueId: ISSUE_ID }, reply);
    expect((await loadIssues())[ISSUE_ID].state).toBe("deferred");
    expect(reply).not.toHaveBeenCalledWith(expect.objectContaining({ type: "ISSUE_ACTION_FAILED" }));

    // Still selected, so it must not resurface just because it was deferred
    await handleSelectionChange();
    expect((await loadIssues())[ISSUE_ID].encounterCount).toBe(0);

    // Reselect, leaving and returning is the resurface
    selection = [];
    await handleSelectionChange();
    selection = [TEXT_NODE];
    await handleSelectionChange();
    expect((await loadIssues())[ISSUE_ID]).toMatchObject({ state: "deferred", encounterCount: 1 });

    // Exactly one, more events on the same unbroken selection do not recount
    await handleSelectionChange();
    await handleSelectionChange();
    expect((await loadIssues())[ISSUE_ID].encounterCount).toBe(1);

    // Ignore with a reason
    await handleIssueMessage(
      { type: "ISSUE_IGNORE", issueId: ISSUE_ID, reason: "Client approved the muted footer" },
      reply
    );
    const ignored = (await loadIssues())[ISSUE_ID];
    expect(ignored.state).toBe("ignored");
    expect(ignored.ignoredReason).toBe("Client approved the muted footer");

    // Confirm it never returns, the same failure is detected again
    await scanAndSync(new Set([TEXT_NODE.id]), "rescan");
    expect((await loadIssues())[ISSUE_ID].state).toBe("ignored");

    // Leaving and returning to the selection does not resurface it
    // Ignored issues are left out of re-encounter matching
    selection = [];
    await handleSelectionChange();
    selection = [TEXT_NODE];
    await handleSelectionChange();
    const final = (await loadIssues())[ISSUE_ID];
    expect(final.state).toBe("ignored");
    expect(final.encounterCount).toBe(1);
  });
});
