import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const FIGMA_MIXED = Symbol("figma.mixed");
const ORIGINAL_FILLS = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];

function textNode(id: string, fills: unknown = ORIGINAL_FILLS) {
  return { id, fills } as unknown as TextNode;
}

beforeEach(() => {
  vi.stubGlobal("figma", { mixed: FIGMA_MIXED });
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("beginPreview and restorePreview", () => {
  it("captures the original fill once and writes the candidate", async () => {
    const { beginPreview, activePreviewNodeId } = await import("./previewState");
    const node = textNode("1:1");

    await beginPreview(node, { r: 1, g: 0, b: 0 });

    expect(node.fills).toEqual([{ type: "SOLID", color: { r: 1, g: 0, b: 0 }, opacity: 1 }]);
    expect(activePreviewNodeId()).toBe("1:1");
  });

  it("does not re-capture on a second preview of the same node", async () => {
    const { beginPreview, restorePreview } = await import("./previewState");
    const node = textNode("1:1");

    await beginPreview(node, { r: 1, g: 0, b: 0 });
    await beginPreview(node, { r: 0, g: 1, b: 0 });
    await restorePreview();

    expect(node.fills).toEqual(ORIGINAL_FILLS);
  });

  it("restores exactly the original fill on restorePreview and clears the session", async () => {
    const { beginPreview, restorePreview, activePreviewNodeId } = await import("./previewState");
    const node = textNode("1:1");

    await beginPreview(node, { r: 1, g: 0, b: 0 });
    await restorePreview();

    expect(node.fills).toEqual(ORIGINAL_FILLS);
    expect(activePreviewNodeId()).toBeNull();
  });

  it("restoring with no active preview does nothing", async () => {
    const { restorePreview, activePreviewNodeId } = await import("./previewState");
    await expect(restorePreview()).resolves.toBeUndefined();
    expect(activePreviewNodeId()).toBeNull();
  });

  it("restores the previous node before starting a preview on a different node", async () => {
    const { beginPreview, activePreviewNodeId } = await import("./previewState");
    const nodeA = textNode("1:1");
    const nodeB = textNode("1:2", [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }]);

    await beginPreview(nodeA, { r: 1, g: 0, b: 0 });
    await beginPreview(nodeB, { r: 0, g: 0, b: 1 });

    expect(nodeA.fills).toEqual(ORIGINAL_FILLS);
    expect(activePreviewNodeId()).toBe("1:2");
  });

  it("throws rather than previewing a node whose fill is mixed", async () => {
    const { beginPreview } = await import("./previewState");
    const node = textNode("1:1", FIGMA_MIXED);
    await expect(beginPreview(node, { r: 1, g: 0, b: 0 })).rejects.toThrow();
  });
});

describe("restorePreviewSync", () => {
  it("restores the original fill synchronously, the path figma.on(\"close\") must use", async () => {
    const { beginPreview, restorePreviewSync, activePreviewNodeId } = await import("./previewState");
    const node = textNode("1:1");

    await beginPreview(node, { r: 1, g: 0, b: 0 });
    restorePreviewSync();

    expect(node.fills).toEqual(ORIGINAL_FILLS);
    expect(activePreviewNodeId()).toBeNull();
  });

  it("does nothing when nothing is being previewed", async () => {
    const { restorePreviewSync, activePreviewNodeId } = await import("./previewState");
    expect(() => restorePreviewSync()).not.toThrow();
    expect(activePreviewNodeId()).toBeNull();
  });
});

describe("applyFill", () => {
  it("writes the given fills for real and forgets the tracked preview without restoring", async () => {
    const { beginPreview, applyFill, activePreviewNodeId } = await import("./previewState");
    const node = textNode("1:1");

    await beginPreview(node, { r: 1, g: 0, b: 0 });
    await applyFill(node, [{ type: "SOLID", color: { r: 0, g: 1, b: 0 }, opacity: 1 }]);

    expect(node.fills).toEqual([{ type: "SOLID", color: { r: 0, g: 1, b: 0 }, opacity: 1 }]);
    expect(activePreviewNodeId()).toBeNull();
  });

  it("writes correctly even when nothing was previewed first", async () => {
    const { applyFill, activePreviewNodeId } = await import("./previewState");
    const node = textNode("1:1");

    await applyFill(node, [{ type: "SOLID", color: { r: 0, g: 1, b: 0 }, opacity: 1 }]);

    expect(node.fills).toEqual([{ type: "SOLID", color: { r: 0, g: 1, b: 0 }, opacity: 1 }]);
    expect(activePreviewNodeId()).toBeNull();
  });
});
