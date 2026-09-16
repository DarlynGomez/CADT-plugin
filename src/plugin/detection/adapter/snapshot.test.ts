import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const FIGMA_MIXED = Symbol("figma.mixed");

beforeEach(() => {
  vi.stubGlobal("figma", { mixed: FIGMA_MIXED });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function textNode(overrides: Record<string, unknown> = {}) {
  const page = { type: "PAGE", backgrounds: [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }] };
  return {
    id: "1:1",
    name: "Body copy",
    type: "TEXT",
    fontSize: 16,
    fontName: { family: "Inter", style: "Regular" },
    fontWeight: 400,
    fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
    opacity: 1,
    blendMode: "NORMAL",
    visible: true,
    parent: page,
    ...overrides
  } as unknown as TextNode;
}

describe("snapshotTextNode", () => {
  it("assembles a full snapshot with no indeterminate reasons for a resolvable node", async () => {
    const { snapshotTextNode } = await import("./snapshot");
    const snapshot = snapshotTextNode(textNode());

    expect(snapshot).toEqual({
      nodeId: "1:1",
      nodeName: "Body copy",
      nodeType: "TEXT",
      foreground: { r: 0, g: 0, b: 0 },
      foregroundAlpha: 1,
      background: { r: 1, g: 1, b: 1 },
      backgroundAlpha: 1,
      backgroundSource: { kind: "page" },
      fontSizePx: 16,
      isBold: false,
      fontStyleName: "Regular",
      indeterminateReasons: []
    });
  });

  it("names the ancestor that supplied the background, not just the page fallback", async () => {
    const { snapshotTextNode } = await import("./snapshot");
    const page = { type: "PAGE", backgrounds: [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }] };
    const card = {
      type: "FRAME",
      id: "2:2",
      name: "Card",
      fills: [{ type: "SOLID", color: { r: 0.9, g: 0.9, b: 0.9 } }],
      parent: page
    };
    const snapshot = snapshotTextNode(textNode({ parent: card }));

    expect(snapshot.background).toEqual({ r: 0.9, g: 0.9, b: 0.9 });
    expect(snapshot.backgroundSource).toEqual({ kind: "node", nodeId: "2:2", nodeName: "Card" });
  });

  it("nulls fontStyleName when the font name is mixed, even if the numeric weight resolved", async () => {
    const { snapshotTextNode } = await import("./snapshot");
    const snapshot = snapshotTextNode(textNode({ fontName: FIGMA_MIXED }));
    expect(snapshot.fontStyleName).toBeNull();
  });

  it("prefers the numeric fontWeight over the style name when it resolves", async () => {
    const { snapshotTextNode } = await import("./snapshot");
    const snapshot = snapshotTextNode(
      textNode({ fontWeight: 700, fontName: { family: "Inter", style: "Regular" } })
    );
    expect(snapshot.isBold).toBe(true);
  });

  it("reads a non-bold numeric fontWeight even against a misleading style name", async () => {
    const { snapshotTextNode } = await import("./snapshot");
    const snapshot = snapshotTextNode(
      textNode({ fontWeight: 400, fontName: { family: "Inter", style: "Bold" } })
    );
    expect(snapshot.isBold).toBe(false);
  });

  it("falls back to the style name heuristic when fontWeight is mixed", async () => {
    const { snapshotTextNode } = await import("./snapshot");
    const snapshot = snapshotTextNode(
      textNode({ fontWeight: FIGMA_MIXED, fontName: { family: "Inter", style: "Bold" } })
    );
    expect(snapshot.isBold).toBe(true);
  });

  it("nulls the font size and records the reason when it is mixed", async () => {
    const { snapshotTextNode } = await import("./snapshot");
    const snapshot = snapshotTextNode(textNode({ fontSize: FIGMA_MIXED }));

    expect(snapshot.fontSizePx).toBeNull();
    expect(snapshot.indeterminateReasons).toContain("font-size-mixed");
  });

  it("nulls the bold determination and records the reason when the font weight and name are both mixed", async () => {
    const { snapshotTextNode } = await import("./snapshot");
    const snapshot = snapshotTextNode(
      textNode({ fontWeight: FIGMA_MIXED, fontName: FIGMA_MIXED })
    );

    expect(snapshot.isBold).toBeNull();
    expect(snapshot.indeterminateReasons).toContain("font-name-mixed");
  });

  it("propagates color resolution reasons and blanks both colors", async () => {
    const { snapshotTextNode } = await import("./snapshot");
    const snapshot = snapshotTextNode(textNode({ fills: FIGMA_MIXED }));

    expect(snapshot.foreground).toBeNull();
    expect(snapshot.background).toBeNull();
    expect(snapshot.indeterminateReasons).toContain("fill-mixed");
  });

  it("can carry multiple independent indeterminate reasons at once", async () => {
    const { snapshotTextNode } = await import("./snapshot");
    const snapshot = snapshotTextNode(textNode({ fontSize: FIGMA_MIXED, fills: FIGMA_MIXED }));

    expect(snapshot.indeterminateReasons).toEqual(
      expect.arrayContaining(["font-size-mixed", "fill-mixed"])
    );
  });
});
