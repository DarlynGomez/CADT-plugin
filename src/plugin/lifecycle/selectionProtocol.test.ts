import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const NODE = { id: "1:1", type: "TEXT" };

describe("isSelectionMessage", () => {
  it("accepts SHOW_ON_CANVAS with an array of string node ids", async () => {
    const { isSelectionMessage } = await import("./selectionProtocol");
    expect(isSelectionMessage({ type: "SHOW_ON_CANVAS", nodeIds: ["1:1", "1:2"] })).toBe(true);
    expect(isSelectionMessage({ type: "SHOW_ON_CANVAS", nodeIds: [] })).toBe(true);
    expect(isSelectionMessage({ type: "SHOW_ON_CANVAS", nodeIds: [1] })).toBe(false);
    expect(isSelectionMessage({ type: "SHOW_ON_CANVAS" })).toBe(false);
  });

  it("accepts RESTORE_SELECTION with no other fields", async () => {
    const { isSelectionMessage } = await import("./selectionProtocol");
    expect(isSelectionMessage({ type: "RESTORE_SELECTION" })).toBe(true);
  });

  it("rejects an unrecognized type and non-objects", async () => {
    const { isSelectionMessage } = await import("./selectionProtocol");
    expect(isSelectionMessage({ type: "ROOT_DEFER" })).toBe(false);
    expect(isSelectionMessage(null)).toBe(false);
  });
});

describe("handleSelectionMessage", () => {
  let selection: unknown[] = [];
  const scrollAndZoomIntoView = vi.fn();
  const getNodeByIdAsync = vi.fn(async () => NODE);
  const currentPage = {
    get selection() {
      return selection;
    },
    set selection(value: unknown[]) {
      selection = value;
    }
  };

  beforeEach(() => {
    selection = [];
    scrollAndZoomIntoView.mockClear();
    getNodeByIdAsync.mockClear();
    vi.stubGlobal("figma", { getNodeByIdAsync, currentPage, viewport: { scrollAndZoomIntoView } });
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("selects and zooms to the given nodes on SHOW_ON_CANVAS", async () => {
    const { handleSelectionMessage } = await import("./selectionProtocol");
    await handleSelectionMessage({ type: "SHOW_ON_CANVAS", nodeIds: ["1:1"] });

    expect(selection).toEqual([NODE]);
    expect(scrollAndZoomIntoView).toHaveBeenCalledWith([NODE]);
  });

  it("restores the stored designer selection on RESTORE_SELECTION, empty when nothing was recorded", async () => {
    const { handleSelectionMessage } = await import("./selectionProtocol");
    await handleSelectionMessage({ type: "RESTORE_SELECTION" });

    expect(selection).toEqual([]);
    expect(scrollAndZoomIntoView).not.toHaveBeenCalled();
  });

  it("restores exactly what the designer last selected themselves", async () => {
    const { handleSelectionMessage } = await import("./selectionProtocol");
    const { recordDesignerSelection } = await import("../accountability/adapter/canvasSelection");

    recordDesignerSelection(["1:1"]);
    await handleSelectionMessage({ type: "RESTORE_SELECTION" });

    expect(selection).toEqual([NODE]);
  });
});
