import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const FIGMA_MIXED = Symbol("figma.mixed");
const STYLE_ID = "S:1";
const STYLE_PAINTS = [{ type: "SOLID", color: { r: 0.2, g: 0.4, b: 0.3 } }];

/**
 * A node like Figma dynamic page files, fillStyleId has no setter
 * Assumed and not verified in Figma, writing fills detaches the style
 */
function styledNode(id: string, styleId: string | symbol = STYLE_ID) {
  const state: { fills: unknown; fillStyleId: string | symbol } = {
    fills: STYLE_PAINTS,
    fillStyleId: styleId
  };
  const setFillStyleIdAsync = vi.fn(async (next: string) => {
    state.fillStyleId = next;
    state.fills = STYLE_PAINTS;
  });
  const node = {
    id,
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
    setFillStyleIdAsync
  };
  return { node: node as unknown as TextNode, setFillStyleIdAsync };
}

beforeEach(() => {
  vi.stubGlobal("figma", { mixed: FIGMA_MIXED });
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("preview and a fill style", () => {
  it("restores both the fills and the fill style after a preview is cleared", async () => {
    const { beginPreview, restorePreview } = await import("./previewState");
    const { node } = styledNode("1:1");

    await beginPreview([node], { r: 1, g: 0, b: 0 });
    await restorePreview();

    expect(node.fillStyleId).toBe(STYLE_ID);
    expect(node.fills).toEqual(STYLE_PAINTS);
  });

  it("re-attaches the style through setFillStyleIdAsync, since fillStyleId has no setter", async () => {
    const { beginPreview, restorePreview } = await import("./previewState");
    const { node, setFillStyleIdAsync } = styledNode("1:1");

    await beginPreview([node], { r: 1, g: 0, b: 0 });
    await restorePreview();

    expect(setFillStyleIdAsync).toHaveBeenCalledWith(STYLE_ID);
  });

  it("restores the fills synchronously on close and starts re-attaching the style", async () => {
    const { beginPreview, restorePreviewSync } = await import("./previewState");
    const { node, setFillStyleIdAsync } = styledNode("1:1");

    await beginPreview([node], { r: 1, g: 0, b: 0 });
    restorePreviewSync();

    expect(node.fills).toEqual(STYLE_PAINTS);
    expect(setFillStyleIdAsync).toHaveBeenCalledWith(STYLE_ID);
    await Promise.resolve();
    expect(node.fillStyleId).toBe(STYLE_ID);
  });

  it("does not touch the style of a node that never had one", async () => {
    const { beginPreview, restorePreview } = await import("./previewState");
    const { node, setFillStyleIdAsync } = styledNode("1:1", "");

    await beginPreview([node], { r: 1, g: 0, b: 0 });
    await restorePreview();

    expect(setFillStyleIdAsync).not.toHaveBeenCalled();
  });

  it("treats a mixed style id as no style rather than trying to restore a symbol", async () => {
    const { beginPreview, restorePreview } = await import("./previewState");
    const { node, setFillStyleIdAsync } = styledNode("1:1", FIGMA_MIXED);

    await beginPreview([node], { r: 1, g: 0, b: 0 });
    await restorePreview();

    expect(setFillStyleIdAsync).not.toHaveBeenCalled();
  });

  it("remembers each node's own original style id while a preview is active", async () => {
    const { beginPreview, originalFillStyleIdFor } = await import("./previewState");
    const a = styledNode("1:1", "S:1");
    const b = styledNode("1:2", "S:2");

    await beginPreview([a.node, b.node], { r: 1, g: 0, b: 0 });

    expect(originalFillStyleIdFor("1:1")).toBe("S:1");
    expect(originalFillStyleIdFor("1:2")).toBe("S:2");
    expect(originalFillStyleIdFor("9:9")).toBeNull();
  });
});
