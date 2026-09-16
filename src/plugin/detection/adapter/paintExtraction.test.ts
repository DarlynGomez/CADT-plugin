import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const FIGMA_MIXED = Symbol("figma.mixed");

beforeEach(() => {
  vi.stubGlobal("figma", { mixed: FIGMA_MIXED });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function node(overrides: Record<string, unknown>): BaseNode {
  return { id: "1:1", name: "Layer", ...overrides } as unknown as BaseNode;
}

describe("extractNodeLayer", () => {
  it("resolves a node's first visible solid fill", async () => {
    const { extractNodeLayer } = await import("./paintExtraction");
    const layer = extractNodeLayer(
      node({
        fills: [{ type: "SOLID", color: { r: 1, g: 0, b: 0 }, opacity: 0.8 }],
        opacity: 1,
        blendMode: "NORMAL",
        visible: true
      })
    );
    expect(layer).toEqual({
      fill: { kind: "solid", color: { r: 1, g: 0, b: 0 }, opacity: 0.8 },
      nodeOpacity: 1,
      blendMode: "NORMAL",
      visible: true,
      source: { kind: "node", nodeId: "1:1", nodeName: "Layer" }
    });
  });

  it("skips an invisible fill in favor of the next visible one", async () => {
    const { extractNodeLayer } = await import("./paintExtraction");
    const layer = extractNodeLayer(
      node({
        fills: [
          { type: "SOLID", color: { r: 0, g: 0, b: 0 }, visible: false },
          { type: "SOLID", color: { r: 1, g: 1, b: 1 } }
        ]
      })
    );
    expect(layer.fill).toEqual({ kind: "solid", color: { r: 1, g: 1, b: 1 }, opacity: 1 });
  });

  it("reports mixed fills as mixed", async () => {
    const { extractNodeLayer } = await import("./paintExtraction");
    const layer = extractNodeLayer(node({ fills: FIGMA_MIXED }));
    expect(layer.fill).toBe("mixed");
  });

  it("reports a gradient, image, or video fill as unresolvable", async () => {
    const { extractNodeLayer } = await import("./paintExtraction");
    const layer = extractNodeLayer(node({ fills: [{ type: "GRADIENT_LINEAR" }] }));
    expect(layer.fill).toEqual({ kind: "unresolvable" });
  });

  it("treats a node with no fills property, such as a group, as empty", async () => {
    const { extractNodeLayer } = await import("./paintExtraction");
    const layer = extractNodeLayer(node({}));
    expect(layer.fill).toEqual({ kind: "empty" });
    expect(layer.nodeOpacity).toBe(1);
    expect(layer.blendMode).toBe("NORMAL");
    expect(layer.visible).toBe(true);
  });

  it("treats an empty fills array as empty", async () => {
    const { extractNodeLayer } = await import("./paintExtraction");
    const layer = extractNodeLayer(node({ fills: [] }));
    expect(layer.fill).toEqual({ kind: "empty" });
  });

  it("names the node itself in source, as an id and name pair for evidence display", async () => {
    const { extractNodeLayer } = await import("./paintExtraction");
    const layer = extractNodeLayer(node({ id: "3:4", name: "Description text" }));
    expect(layer.source).toEqual({ kind: "node", nodeId: "3:4", nodeName: "Description text" });
  });
});

describe("extractPageBackgroundLayer", () => {
  it("reads backgrounds rather than fills, defaulting to normal and visible", async () => {
    const { extractPageBackgroundLayer } = await import("./paintExtraction");
    const page = { backgrounds: [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }] };
    const layer = extractPageBackgroundLayer(page as unknown as PageNode);
    expect(layer).toEqual({
      fill: { kind: "solid", color: { r: 1, g: 1, b: 1 }, opacity: 1 },
      nodeOpacity: 1,
      blendMode: "NORMAL",
      visible: true,
      source: { kind: "page" }
    });
  });
});
