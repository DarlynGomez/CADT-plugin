import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const FIGMA_MIXED = Symbol("figma.mixed");

function solidWithVariable(variableId: string) {
  return { type: "SOLID", color: { r: 0, g: 0, b: 0 }, boundVariables: { color: { id: variableId } } };
}

function textNode(id: string, fills: unknown, fillStyleId: unknown = "") {
  return { id, fills, fillStyleId } as unknown as TextNode;
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("detectFillBinding", () => {
  it("detects a variable binding and counts other pages nodes sharing it", async () => {
    const getVariableByIdAsync = vi.fn().mockResolvedValue({ name: "sage/muted" });
    const node = textNode("1:1", [solidWithVariable("var:1")]);
    const same = textNode("1:2", [solidWithVariable("var:1")]);
    const different = textNode("1:3", [solidWithVariable("var:2")]);

    vi.stubGlobal("figma", {
      mixed: FIGMA_MIXED,
      variables: { getVariableByIdAsync },
      getStyleByIdAsync: vi.fn(),
      currentPage: { findAllWithCriteria: () => [node, same, different] }
    });

    const { detectFillBinding } = await import("./bindingLookup");
    const result = await detectFillBinding(node);

    expect(result).toEqual({ name: "sage/muted", usageCount: 1 });
  });

  it("detects a style binding and counts other nodes sharing it", async () => {
    const getStyleByIdAsync = vi.fn().mockResolvedValue({ name: "text/body" });
    const node = textNode("1:1", [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }], "style:1");
    const same = textNode("1:2", [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }], "style:1");
    const different = textNode("1:3", [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }], "style:2");

    vi.stubGlobal("figma", {
      mixed: FIGMA_MIXED,
      variables: { getVariableByIdAsync: vi.fn() },
      getStyleByIdAsync,
      currentPage: { findAllWithCriteria: () => [node, same, different] }
    });

    const { detectFillBinding } = await import("./bindingLookup");
    const result = await detectFillBinding(node);

    expect(result).toEqual({ name: "text/body", usageCount: 1 });
  });

  it("excludes the node itself from the usage count", async () => {
    const getVariableByIdAsync = vi.fn().mockResolvedValue({ name: "sage/muted" });
    const node = textNode("1:1", [solidWithVariable("var:1")]);

    vi.stubGlobal("figma", {
      mixed: FIGMA_MIXED,
      variables: { getVariableByIdAsync },
      getStyleByIdAsync: vi.fn(),
      currentPage: { findAllWithCriteria: () => [node] }
    });

    const { detectFillBinding } = await import("./bindingLookup");
    const result = await detectFillBinding(node);

    expect(result?.usageCount).toBe(0);
  });

  it("returns null when the fill is bound to neither a variable nor a style", async () => {
    const node = textNode("1:1", [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }], "");

    vi.stubGlobal("figma", {
      mixed: FIGMA_MIXED,
      variables: { getVariableByIdAsync: vi.fn() },
      getStyleByIdAsync: vi.fn(),
      currentPage: { findAllWithCriteria: () => [node] }
    });

    const { detectFillBinding } = await import("./bindingLookup");
    expect(await detectFillBinding(node)).toBeNull();
  });

  it("returns null when the node's fill is mixed", async () => {
    const node = textNode("1:1", FIGMA_MIXED);

    vi.stubGlobal("figma", {
      mixed: FIGMA_MIXED,
      variables: { getVariableByIdAsync: vi.fn() },
      getStyleByIdAsync: vi.fn(),
      currentPage: { findAllWithCriteria: () => [node] }
    });

    const { detectFillBinding } = await import("./bindingLookup");
    expect(await detectFillBinding(node)).toBeNull();
  });
});
