import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function stubFigmaWithOn() {
  const handlers: Record<string, () => void> = {};
  vi.stubGlobal("figma", {
    mixed: Symbol("figma.mixed"),
    on: (event: string, handler: () => void) => {
      handlers[event] = handler;
    }
  });
  return handlers;
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("registerAdjustCloseRestore", () => {
  it("restores the original fill synchronously when the plugin closes mid preview", async () => {
    const handlers = stubFigmaWithOn();
    const { beginPreview } = await import("../adjust/adapter/previewState");
    const { registerAdjustCloseRestore } = await import("./adjustLifecycle");
    registerAdjustCloseRestore();

    const node = {
      id: "1:1",
      fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }]
    } as unknown as TextNode;
    await beginPreview(node, { r: 1, g: 0, b: 0 });
    expect(node.fills).toEqual([{ type: "SOLID", color: { r: 1, g: 0, b: 0 }, opacity: 1 }]);

    // figma.on("close") cannot await anything, so this must be a synchronous call
    handlers.close();

    expect(node.fills).toEqual([{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }]);
  });

  it("does nothing on close when nothing was being previewed", async () => {
    const handlers = stubFigmaWithOn();
    const { registerAdjustCloseRestore } = await import("./adjustLifecycle");
    registerAdjustCloseRestore();

    expect(() => handlers.close()).not.toThrow();
  });
});

describe("registerAdjustSelectionRestore", () => {
  it("restores the original fill when selection changes", async () => {
    const handlers = stubFigmaWithOn();
    const { beginPreview } = await import("../adjust/adapter/previewState");
    const { registerAdjustSelectionRestore } = await import("./adjustLifecycle");
    registerAdjustSelectionRestore();

    const node = {
      id: "1:1",
      fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }]
    } as unknown as TextNode;
    await beginPreview(node, { r: 1, g: 0, b: 0 });

    handlers.selectionchange();
    await Promise.resolve();

    expect(node.fills).toEqual([{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }]);
  });

  it("does nothing on selection change when nothing was being previewed", async () => {
    const handlers = stubFigmaWithOn();
    const { registerAdjustSelectionRestore } = await import("./adjustLifecycle");
    registerAdjustSelectionRestore();

    expect(() => handlers.selectionchange()).not.toThrow();
  });
});
