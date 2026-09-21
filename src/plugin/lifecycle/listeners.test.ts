import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { scanAndSync } from "./scanAndSync";

vi.mock("./scanAndSync", () => ({ scanAndSync: vi.fn() }));

describe("registerDocumentChangeListener", () => {
  let documentChangeHandler: ((event: { documentChanges: unknown[] }) => void) | undefined;
  const on = vi.fn((eventName: string, handler: typeof documentChangeHandler) => {
    if (eventName === "documentchange") {
      documentChangeHandler = handler;
    }
  });

  beforeEach(() => {
    documentChangeHandler = undefined;
    vi.mocked(scanAndSync).mockClear();
    vi.useFakeTimers();
    vi.stubGlobal("figma", { on });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  async function fireAndFlush(documentChanges: unknown[]) {
    const { registerDocumentChangeListener } = await import("./listeners");
    registerDocumentChangeListener();
    documentChangeHandler?.({ documentChanges });
    await vi.advanceTimersByTimeAsync(300);
  }

  it("scans a node whose relevant property changed", async () => {
    await fireAndFlush([{ type: "PROPERTY_CHANGE", id: "1:1", properties: ["fills"] }]);
    expect(scanAndSync).toHaveBeenCalledWith(new Set(["1:1"]), "scan");
  });

  it("does not scan for an irrelevant property change such as a move or resize", async () => {
    await fireAndFlush([{ type: "PROPERTY_CHANGE", id: "1:1", properties: ["x", "y"] }]);
    expect(scanAndSync).not.toHaveBeenCalled();
  });

  it("always scans a created node, even with no property list", async () => {
    await fireAndFlush([{ type: "CREATE", id: "1:2" }]);
    expect(scanAndSync).toHaveBeenCalledWith(new Set(["1:2"]), "scan");
  });

  it("always scans a deleted node, so its issue can resolve", async () => {
    await fireAndFlush([{ type: "DELETE", id: "1:3" }]);
    expect(scanAndSync).toHaveBeenCalledWith(new Set(["1:3"]), "scan");
  });

  it("coalesces many rapid relevant changes into exactly one scan", async () => {
    await fireAndFlush([
      { type: "PROPERTY_CHANGE", id: "1:1", properties: ["fills"] },
      { type: "PROPERTY_CHANGE", id: "1:1", properties: ["characters"] },
      { type: "PROPERTY_CHANGE", id: "1:4", properties: ["fontSize"] }
    ]);
    expect(scanAndSync).toHaveBeenCalledTimes(1);
    expect(scanAndSync).toHaveBeenCalledWith(new Set(["1:1", "1:4"]), "scan");
  });

  describe("while a node is being previewed by Adjust", () => {
    const FIGMA_MIXED = Symbol("figma.mixed");

    function textNode(id: string) {
      return { id, fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }] } as unknown as TextNode;
    }

    beforeEach(() => {
      // previewState.ts holds genuine module-level singleton state (the active
      // preview), unlike listeners.ts itself; reset so it starts empty each test.
      vi.resetModules();
      vi.stubGlobal("figma", { on, mixed: FIGMA_MIXED });
    });

    it("skips a fill change on the previewed node, so a single passing click cannot be swept into a resolve", async () => {
      const { beginPreview } = await import("../adjust/adapter/previewState");
      await beginPreview(textNode("1:1"), { r: 1, g: 1, b: 1 });

      await fireAndFlush([{ type: "PROPERTY_CHANGE", id: "1:1", properties: ["fills"] }]);
      expect(scanAndSync).not.toHaveBeenCalled();
    });

    it("still scans an unrelated node while a different node is being previewed", async () => {
      const { beginPreview } = await import("../adjust/adapter/previewState");
      await beginPreview(textNode("1:1"), { r: 1, g: 1, b: 1 });

      await fireAndFlush([{ type: "PROPERTY_CHANGE", id: "1:9", properties: ["fills"] }]);
      expect(scanAndSync).toHaveBeenCalledWith(new Set(["1:9"]), "scan");
    });

    it("scans the node again once its preview is restored", async () => {
      const { beginPreview, restorePreview } = await import("../adjust/adapter/previewState");
      const node = textNode("1:1");
      await beginPreview(node, { r: 1, g: 1, b: 1 });
      await restorePreview();

      await fireAndFlush([{ type: "PROPERTY_CHANGE", id: "1:1", properties: ["fills"] }]);
      expect(scanAndSync).toHaveBeenCalledWith(new Set(["1:1"]), "scan");
    });

    it("scans apply's own write, since applyFill clears the tracked preview first", async () => {
      const { beginPreview, applyFill } = await import("../adjust/adapter/previewState");
      const node = textNode("1:1");
      await beginPreview(node, { r: 1, g: 1, b: 1 });
      await applyFill(node, [{ type: "SOLID", color: { r: 0, g: 0, b: 1 } }]);

      await fireAndFlush([{ type: "PROPERTY_CHANGE", id: "1:1", properties: ["fills"] }]);
      expect(scanAndSync).toHaveBeenCalledWith(new Set(["1:1"]), "scan");
    });
  });
});
