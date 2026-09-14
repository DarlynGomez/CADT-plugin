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
      background: { r: 1, g: 1, b: 1 },
      fontSizePx: 16,
      isBold: false,
      indeterminateReasons: []
    });
  });

  it("reads a bold style name into isBold", async () => {
    const { snapshotTextNode } = await import("./snapshot");
    const snapshot = snapshotTextNode(
      textNode({ fontName: { family: "Inter", style: "Bold" } })
    );
    expect(snapshot.isBold).toBe(true);
  });

  it("nulls the font size and records the reason when it is mixed", async () => {
    const { snapshotTextNode } = await import("./snapshot");
    const snapshot = snapshotTextNode(textNode({ fontSize: FIGMA_MIXED }));

    expect(snapshot.fontSizePx).toBeNull();
    expect(snapshot.indeterminateReasons).toContain("font-size-mixed");
  });

  it("nulls the bold determination and records the reason when the font name is mixed", async () => {
    const { snapshotTextNode } = await import("./snapshot");
    const snapshot = snapshotTextNode(textNode({ fontName: FIGMA_MIXED }));

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
