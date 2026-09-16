import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ISSUE_ID = "contrast:1:1";
const WHITE_PAGE = { type: "PAGE", backgrounds: [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }] };

function textNode(overrides: Record<string, unknown> = {}) {
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
    parent: WHITE_PAGE,
    ...overrides
  };
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isAdjustMessage", () => {
  it("accepts ADJUST_CLEAR_PREVIEW with no other fields", async () => {
    const { isAdjustMessage } = await import("./adjustProtocol");
    expect(isAdjustMessage({ type: "ADJUST_CLEAR_PREVIEW" })).toBe(true);
  });

  it.each(["ADJUST_PREVIEW", "ADJUST_APPLY"])("requires issueId and a colour for %s", async (type) => {
    const { isAdjustMessage } = await import("./adjustProtocol");
    expect(isAdjustMessage({ type, issueId: ISSUE_ID, color: { r: 0, g: 0, b: 0 } })).toBe(true);
    expect(isAdjustMessage({ type, issueId: ISSUE_ID })).toBe(false);
    expect(isAdjustMessage({ type, color: { r: 0, g: 0, b: 0 } })).toBe(false);
  });

  it("rejects an unrecognized type and non-objects", async () => {
    const { isAdjustMessage } = await import("./adjustProtocol");
    expect(isAdjustMessage({ type: "ISSUE_DEFER" })).toBe(false);
    expect(isAdjustMessage(null)).toBe(false);
  });
});

describe("handleAdjustMessage", () => {
  function stubFigma(node: ReturnType<typeof textNode>) {
    const commitUndo = vi.fn();
    const getNodeByIdAsync = vi.fn().mockImplementation(async (id: string) => (id === node.id ? node : null));
    vi.stubGlobal("figma", {
      mixed: Symbol("figma.mixed"),
      getNodeByIdAsync,
      commitUndo,
      loadFontAsync: vi.fn().mockResolvedValue(undefined)
    });
    return { commitUndo, getNodeByIdAsync };
  }

  it("previews a passing colour on the node and replies ADJUST_PREVIEWED", async () => {
    const node = textNode();
    stubFigma(node);
    const { handleAdjustMessage } = await import("./adjustProtocol");
    const reply = vi.fn();

    await handleAdjustMessage(
      { type: "ADJUST_PREVIEW", issueId: ISSUE_ID, color: { r: 0, g: 0, b: 0.2 } },
      reply
    );

    expect(node.fills).toEqual([{ type: "SOLID", color: { r: 0, g: 0, b: 0.2 }, opacity: 1 }]);
    expect(reply).toHaveBeenCalledWith({ type: "ADJUST_PREVIEWED", issueId: ISSUE_ID });
  });

  it("restores on clear and replies ADJUST_CLEARED", async () => {
    const node = textNode();
    stubFigma(node);
    const { handleAdjustMessage } = await import("./adjustProtocol");
    const reply = vi.fn();

    await handleAdjustMessage(
      { type: "ADJUST_PREVIEW", issueId: ISSUE_ID, color: { r: 0, g: 0, b: 0.2 } },
      reply
    );
    await handleAdjustMessage({ type: "ADJUST_CLEAR_PREVIEW" }, reply);

    expect(node.fills).toEqual([{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }]);
    expect(reply).toHaveBeenCalledWith({ type: "ADJUST_CLEARED" });
  });

  it("applies a passing colour for real and commits one undo step", async () => {
    const node = textNode();
    const { commitUndo } = stubFigma(node);
    const { handleAdjustMessage } = await import("./adjustProtocol");
    const reply = vi.fn();

    await handleAdjustMessage(
      { type: "ADJUST_APPLY", issueId: ISSUE_ID, color: { r: 0, g: 0, b: 0.2 } },
      reply
    );

    expect(node.fills).toEqual([{ type: "SOLID", color: { r: 0, g: 0, b: 0.2 }, opacity: 1 }]);
    expect(commitUndo).toHaveBeenCalledTimes(1);
    expect(reply).toHaveBeenCalledWith({ type: "ADJUST_APPLIED", issueId: ISSUE_ID });
  });

  it("refuses to apply a colour that no longer meets the required ratio, and does not commit undo", async () => {
    const node = textNode();
    const { commitUndo } = stubFigma(node);
    const { handleAdjustMessage } = await import("./adjustProtocol");
    const reply = vi.fn();

    const failingColor = { r: 0.9, g: 0.9, b: 0.9 }; // near white, fails against a white background
    await handleAdjustMessage({ type: "ADJUST_APPLY", issueId: ISSUE_ID, color: failingColor }, reply);

    expect(node.fills).toEqual([{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }]);
    expect(commitUndo).not.toHaveBeenCalled();
    expect(reply).toHaveBeenCalledWith(
      expect.objectContaining({ type: "ADJUST_ACTION_FAILED", issueId: ISSUE_ID })
    );
  });

  it("replies with a failure when the node no longer exists", async () => {
    stubFigma(textNode());
    const { handleAdjustMessage } = await import("./adjustProtocol");
    const reply = vi.fn();

    await handleAdjustMessage(
      { type: "ADJUST_PREVIEW", issueId: "contrast:gone", color: { r: 0, g: 0, b: 0 } },
      reply
    );

    expect(reply).toHaveBeenCalledWith(
      expect.objectContaining({ type: "ADJUST_ACTION_FAILED", issueId: "contrast:gone" })
    );
  });
});
