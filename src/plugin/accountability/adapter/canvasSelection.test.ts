import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const NODE_A = { id: "1:1", type: "TEXT" };
const NODE_B = { id: "1:2", type: "TEXT" };

function stubFigma() {
  let selection: unknown[] = [];
  const scrollAndZoomIntoView = vi.fn();
  const getNodeByIdAsync = vi.fn(async (id: string) =>
    [NODE_A, NODE_B].find((node) => node.id === id) ?? null
  );
  const currentPage = {
    get selection() {
      return selection;
    },
    set selection(value: unknown[]) {
      selection = value;
    }
  };
  vi.stubGlobal("figma", {
    getNodeByIdAsync,
    currentPage,
    viewport: { scrollAndZoomIntoView }
  });
  return { currentPage, scrollAndZoomIntoView, getNodeByIdAsync };
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("selectAndZoomToFit", () => {
  it("selects the resolved nodes and zooms to fit them", async () => {
    const { currentPage, scrollAndZoomIntoView } = stubFigma();
    const { selectAndZoomToFit } = await import("./canvasSelection");

    await selectAndZoomToFit(["1:1", "1:2"]);

    expect(currentPage.selection).toEqual([NODE_A, NODE_B]);
    expect(scrollAndZoomIntoView).toHaveBeenCalledWith([NODE_A, NODE_B]);
  });

  it("drops ids that no longer resolve rather than throwing", async () => {
    const { currentPage } = stubFigma();
    const { selectAndZoomToFit } = await import("./canvasSelection");

    const result = await selectAndZoomToFit(["1:1", "9:9"]);

    expect(result).toEqual([NODE_A]);
    expect(currentPage.selection).toEqual([NODE_A]);
  });

  it("marks the selection it sets, consumable exactly once", async () => {
    stubFigma();
    const { selectAndZoomToFit, consumePluginSetSelectionMarker } = await import(
      "./canvasSelection"
    );

    await selectAndZoomToFit(["1:1"]);

    expect(consumePluginSetSelectionMarker()).toBe(true);
    expect(consumePluginSetSelectionMarker()).toBe(false);
  });
});

describe("selectResolvedNodesAndZoom", () => {
  it("selects and zooms without a lookup, and marks the selection", async () => {
    stubFigma();
    const { selectResolvedNodesAndZoom, consumePluginSetSelectionMarker } = await import(
      "./canvasSelection"
    );

    selectResolvedNodesAndZoom([NODE_A as unknown as SceneNode]);

    expect(consumePluginSetSelectionMarker()).toBe(true);
  });
});

describe("restoreSelection", () => {
  it("selects the resolved nodes without zooming", async () => {
    const { currentPage, scrollAndZoomIntoView } = stubFigma();
    const { restoreSelection } = await import("./canvasSelection");

    await restoreSelection(["1:1"]);

    expect(currentPage.selection).toEqual([NODE_A]);
    expect(scrollAndZoomIntoView).not.toHaveBeenCalled();
  });

  it("also marks the selection it sets", async () => {
    stubFigma();
    const { restoreSelection, consumePluginSetSelectionMarker } = await import(
      "./canvasSelection"
    );

    await restoreSelection(["1:1"]);

    expect(consumePluginSetSelectionMarker()).toBe(true);
  });
});

describe("recordDesignerSelection and getStoredSelectionToRestore", () => {
  it("returns what was last recorded", async () => {
    const { recordDesignerSelection, getStoredSelectionToRestore } = await import(
      "./canvasSelection"
    );

    recordDesignerSelection(["1:1", "1:2"]);

    expect(getStoredSelectionToRestore()).toEqual(["1:1", "1:2"]);
  });

  it("is unaffected by a plugin-set selection: only recordDesignerSelection changes it", async () => {
    stubFigma();
    const { recordDesignerSelection, getStoredSelectionToRestore, selectAndZoomToFit } =
      await import("./canvasSelection");

    recordDesignerSelection(["1:1"]);
    await selectAndZoomToFit(["1:2"]);

    expect(getStoredSelectionToRestore()).toEqual(["1:1"]);
  });
});
