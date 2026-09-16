import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.stubGlobal("figma", { mixed: Symbol("figma.mixed") });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("buildAncestorChain", () => {
  it("collects each ancestor in order and ends with the page background", async () => {
    const { buildAncestorChain } = await import("./ancestorChain");

    const page = {
      type: "PAGE",
      backgrounds: [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }]
    };
    const frame = { type: "FRAME", id: "1:1", name: "Frame", fills: [], parent: page };
    const textNode = { type: "TEXT", parent: frame };

    const chain = buildAncestorChain(textNode as unknown as SceneNode);

    expect(chain).toEqual([
      {
        fill: { kind: "empty" },
        nodeOpacity: 1,
        blendMode: "NORMAL",
        visible: true,
        source: { kind: "node", nodeId: "1:1", nodeName: "Frame" }
      },
      {
        fill: { kind: "solid", color: { r: 1, g: 1, b: 1 }, opacity: 1 },
        nodeOpacity: 1,
        blendMode: "NORMAL",
        visible: true,
        source: { kind: "page" }
      }
    ]);
  });

  it("walks through a node type with no fills property, such as a group", async () => {
    const { buildAncestorChain } = await import("./ancestorChain");

    const page = { type: "PAGE", backgrounds: [] };
    const group = { type: "GROUP", id: "1:2", name: "Group", parent: page };
    const textNode = { type: "TEXT", parent: group };

    const chain = buildAncestorChain(textNode as unknown as SceneNode);

    expect(chain[0].fill).toEqual({ kind: "empty" });
    expect(chain[1].fill).toEqual({ kind: "empty" });
  });

  it("names the ancestor node in each layer's source, for evidence display", async () => {
    const { buildAncestorChain } = await import("./ancestorChain");

    const page = { type: "PAGE", backgrounds: [] };
    const frame = { type: "FRAME", id: "1:3", name: "Card", fills: [], parent: page };
    const textNode = { type: "TEXT", parent: frame };

    const chain = buildAncestorChain(textNode as unknown as SceneNode);

    expect(chain[0].source).toEqual({ kind: "node", nodeId: "1:3", nodeName: "Card" });
    expect(chain[1].source).toEqual({ kind: "page" });
  });

  it("returns just the page layer when the node's parent is the page itself", async () => {
    const { buildAncestorChain } = await import("./ancestorChain");

    const page = { type: "PAGE", backgrounds: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }] };
    const textNode = { type: "TEXT", parent: page };

    const chain = buildAncestorChain(textNode as unknown as SceneNode);

    expect(chain).toHaveLength(1);
    expect(chain[0].fill).toEqual({ kind: "solid", color: { r: 0, g: 0, b: 0 }, opacity: 1 });
  });

  it("returns an empty chain when the node has no parent", async () => {
    const { buildAncestorChain } = await import("./ancestorChain");
    const textNode = { type: "TEXT", parent: null };
    expect(buildAncestorChain(textNode as unknown as SceneNode)).toEqual([]);
  });
});
