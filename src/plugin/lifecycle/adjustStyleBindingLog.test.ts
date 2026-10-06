import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ISSUE_ID = "contrast:1:1";
const STYLE_ID = "S:1";
const PAGE = { type: "PAGE", backgrounds: [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }] };

/** A style bound text node, assumptions are in previewStyleBinding.test.ts */
function styledTextNode() {
  const state: { fills: unknown; fillStyleId: string } = {
    fills: [{ type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }],
    fillStyleId: STYLE_ID
  };
  return {
    id: "1:1",
    name: "Body copy",
    type: "TEXT",
    fontSize: 16,
    fontName: { family: "Inter", style: "Regular" },
    fontWeight: 400,
    opacity: 1,
    blendMode: "NORMAL",
    visible: true,
    parent: PAGE,
    get fills() {
      return state.fills;
    },
    set fills(next: unknown) {
      state.fills = next;
      state.fillStyleId = "";
    },
    get fillStyleId() {
      return state.fillStyleId;
    },
    setFillStyleIdAsync: async (next: string) => {
      state.fillStyleId = next;
    }
  };
}

function stubFigma(node: ReturnType<typeof styledTextNode>) {
  const pluginData: Record<string, string> = {
    "cadt.calibration.profile": JSON.stringify({
      schemaVersion: 1,
      completedAt: "2026-09-08T00:00:00.000Z",
      loggingConsent: true,
      answers: {}
    })
  };
  vi.stubGlobal("figma", {
    mixed: Symbol("figma.mixed"),
    getNodeByIdAsync: vi.fn(async (id: string) => (id === node.id ? node : null)),
    commitUndo: vi.fn(),
    loadFontAsync: vi.fn().mockResolvedValue(undefined),
    variables: { getVariableByIdAsync: vi.fn() },
    getStyleByIdAsync: vi.fn(async (id: string) =>
      id === STYLE_ID ? { name: "sage/muted" } : null
    ),
    root: {
      getPluginData: (key: string) => pluginData[key] ?? "",
      setPluginData: (key: string, value: string) => {
        pluginData[key] = value;
      }
    },
    clientStorage: { getAsync: vi.fn().mockResolvedValue(undefined) },
    currentPage: {
      findAll: (predicate: (candidate: unknown) => boolean) => [node].filter(predicate),
      findAllWithCriteria: () => [node]
    },
    ui: { postMessage: vi.fn() }
  });
  return pluginData;
}

beforeEach(() => {
  vi.resetModules();
  vi.spyOn(console, "log").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("the Adjust log for a style-bound fill", () => {
  it("records wasBound true when the apply follows a live preview", async () => {
    const node = styledTextNode();
    const pluginData = stubFigma(node);
    const { handleAdjustMessage } = await import("./adjustProtocol");
    const color = { r: 0, g: 0, b: 0.2 };

    await handleAdjustMessage(
      { type: "ADJUST_PREVIEW", issueId: ISSUE_ID, issueIds: [ISSUE_ID], color },
      vi.fn()
    );
    await handleAdjustMessage(
      {
        type: "ADJUST_APPLY",
        issueId: ISSUE_ID,
        issueIds: [ISSUE_ID],
        color,
        optionChosen: "a",
        wheelOpened: false,
        hexRejected: false
      },
      vi.fn()
    );

    const log = JSON.parse(pluginData["cadt.adjustLog.v1"]);
    expect(log).toHaveLength(1);
    expect(log[0].wasBound).toBe(true);
  });

  it("records wasBound true when no preview was active, as before", async () => {
    const node = styledTextNode();
    const pluginData = stubFigma(node);
    const { handleAdjustMessage } = await import("./adjustProtocol");

    await handleAdjustMessage(
      {
        type: "ADJUST_APPLY",
        issueId: ISSUE_ID,
        issueIds: [ISSUE_ID],
        color: { r: 0, g: 0, b: 0.2 },
        optionChosen: "a",
        wheelOpened: false,
        hexRejected: false
      },
      vi.fn()
    );

    expect(JSON.parse(pluginData["cadt.adjustLog.v1"])[0].wasBound).toBe(true);
  });
});
