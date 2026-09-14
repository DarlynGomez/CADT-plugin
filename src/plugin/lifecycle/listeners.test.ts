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
});
