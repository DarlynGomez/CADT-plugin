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
    const { beginPreview, activePreviewNodeIds } = await import("./previewState");
    const node = textNode("1:1");

    await beginPreview([node], { r: 1, g: 0, b: 0 });

    expect(node.fills).toEqual([{ type: "SOLID", color: { r: 1, g: 0, b: 0 }, opacity: 1 }]);
    expect(activePreviewNodeIds()).toEqual(new Set(["1:1"]));
  });

  it("does not re-capture on a second preview of the same node set", async () => {
    const { beginPreview, restorePreview } = await import("./previewState");
    const node = textNode("1:1");

    await beginPreview([node], { r: 1, g: 0, b: 0 });
    await beginPreview([node], { r: 0, g: 1, b: 0 });
    await restorePreview();

    expect(node.fills).toEqual(ORIGINAL_FILLS);
  });

  it("restores exactly the original fill on restorePreview and clears the session", async () => {
    const { beginPreview, restorePreview, activePreviewNodeIds } = await import("./previewState");
    const node = textNode("1:1");

    await beginPreview([node], { r: 1, g: 0, b: 0 });
    await restorePreview();

    expect(node.fills).toEqual(ORIGINAL_FILLS);
    expect(activePreviewNodeIds().size).toBe(0);
  });

  it("restoring with no active preview does nothing", async () => {
    const { restorePreview, activePreviewNodeIds } = await import("./previewState");
    await expect(restorePreview()).resolves.toBeUndefined();
    expect(activePreviewNodeIds().size).toBe(0);
  });

  it("restores the previous set before starting a preview on a different set", async () => {
    const { beginPreview, activePreviewNodeIds } = await import("./previewState");
    const nodeA = textNode("1:1");
    const nodeB = textNode("1:2", [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }]);

    await beginPreview([nodeA], { r: 1, g: 0, b: 0 });
    await beginPreview([nodeB], { r: 0, g: 0, b: 1 });

    expect(nodeA.fills).toEqual(ORIGINAL_FILLS);
    expect(activePreviewNodeIds()).toEqual(new Set(["1:2"]));
  });

  it("throws rather than previewing a node whose fill is mixed", async () => {
    const { beginPreview } = await import("./previewState");
    const node = textNode("1:1", FIGMA_MIXED);
    await expect(beginPreview([node], { r: 1, g: 0, b: 0 })).rejects.toThrow();
  });
});

describe("multi-node preview, GROUPING_SPEC.md section 8", () => {
  // A fresh set per test: beginPreview mutates fills in place, so a shared fixture
  // reused across tests would carry one test's leftover preview into the next.
  function makeTwelve() {
    return Array.from({ length: 12 }, (_, i) =>
      textNode(`1:${i + 1}`, [{ type: "SOLID", color: { r: 0, g: 0, b: i / 20 } }])
    );
  }

  it("previews all twelve nodes with one captured original fill each", async () => {
    const { beginPreview, activePreviewNodeIds } = await import("./previewState");
    const twelve = makeTwelve();

    await beginPreview(twelve, { r: 1, g: 0, b: 0 });

    for (const node of twelve) {
      expect(node.fills).toEqual([{ type: "SOLID", color: { r: 1, g: 0, b: 0 }, opacity: 1 }]);
    }
    expect(activePreviewNodeIds().size).toBe(12);
  });

  it("restores all twelve nodes to their own distinct original fills", async () => {
    const { beginPreview, restorePreview } = await import("./previewState");
    const twelve = makeTwelve();

    await beginPreview(twelve, { r: 1, g: 0, b: 0 });
    await restorePreview();

    twelve.forEach((node, i) => {
      expect(node.fills).toEqual([{ type: "SOLID", color: { r: 0, g: 0, b: i / 20 } }]);
    });
  });

  it('restores all twelve nodes synchronously, for figma.on("close")', async () => {
    const { beginPreview, restorePreviewSync } = await import("./previewState");
    const twelve = makeTwelve();

    await beginPreview(twelve, { r: 1, g: 0, b: 0 });
    restorePreviewSync();

    twelve.forEach((node, i) => {
      expect(node.fills).toEqual([{ type: "SOLID", color: { r: 0, g: 0, b: i / 20 } }]);
    });
  });
});

describe("restorePreviewSync", () => {
  it('restores the original fill synchronously, the path figma.on("close") must use', async () => {
    const { beginPreview, restorePreviewSync, activePreviewNodeIds } =
      await import("./previewState");
    const node = textNode("1:1");

    await beginPreview([node], { r: 1, g: 0, b: 0 });
    restorePreviewSync();

    expect(node.fills).toEqual(ORIGINAL_FILLS);
    expect(activePreviewNodeIds().size).toBe(0);
  });

  it("does nothing when nothing is being previewed", async () => {
    const { restorePreviewSync, activePreviewNodeIds } = await import("./previewState");
    expect(() => restorePreviewSync()).not.toThrow();
    expect(activePreviewNodeIds().size).toBe(0);
  });
});

describe("applyFill", () => {
  it("writes the given fills for real and forgets the tracked preview without restoring", async () => {
    const { beginPreview, applyFill, activePreviewNodeIds } = await import("./previewState");
    const node = textNode("1:1");

    await beginPreview([node], { r: 1, g: 0, b: 0 });
    await applyFill(node, [{ type: "SOLID", color: { r: 0, g: 1, b: 0 }, opacity: 1 }]);

    expect(node.fills).toEqual([{ type: "SOLID", color: { r: 0, g: 1, b: 0 }, opacity: 1 }]);
    expect(activePreviewNodeIds().size).toBe(0);
  });

  it("writes correctly even when nothing was previewed first", async () => {
    const { applyFill, activePreviewNodeIds } = await import("./previewState");
    const node = textNode("1:1");

    await applyFill(node, [{ type: "SOLID", color: { r: 0, g: 1, b: 0 }, opacity: 1 }]);

    expect(node.fills).toEqual([{ type: "SOLID", color: { r: 0, g: 1, b: 0 }, opacity: 1 }]);
    expect(activePreviewNodeIds().size).toBe(0);
  });
});
