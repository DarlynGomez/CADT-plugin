import { describe, expect, it } from "vitest";

import { resolveColors, type ChainLayer, type PaintLayer } from "./colorResolution";

const WHITE = { r: 1, g: 1, b: 1 };
const BLACK = { r: 0, g: 0, b: 0 };

function solidLayer(color = BLACK, overrides: Partial<ChainLayer> = {}): ChainLayer {
  const fill: PaintLayer = { kind: "solid", color, opacity: 1 };
  return { fill, nodeOpacity: 1, blendMode: "NORMAL", visible: true, ...overrides };
}

function emptyLayer(overrides: Partial<ChainLayer> = {}): ChainLayer {
  return { fill: { kind: "empty" }, nodeOpacity: 1, blendMode: "NORMAL", visible: true, ...overrides };
}

describe("resolveColors", () => {
  it("resolves a solid text fill against an immediate solid ancestor", () => {
    const result = resolveColors([solidLayer(BLACK), solidLayer(WHITE)]);
    expect(result).toEqual({ foreground: BLACK, background: WHITE, indeterminateReasons: [] });
  });

  it("walks past unpainted ancestors to find the first solid fill", () => {
    const result = resolveColors([solidLayer(BLACK), emptyLayer(), emptyLayer(), solidLayer(WHITE)]);
    expect(result.background).toEqual(WHITE);
    expect(result.indeterminateReasons).toEqual([]);
  });

  it("falls back to the page background when no ancestor has a fill", () => {
    const page = solidLayer(WHITE);
    const result = resolveColors([solidLayer(BLACK), emptyLayer(), page]);
    expect(result.background).toEqual(WHITE);
  });

  it("is indeterminate when the text fill is mixed", () => {
    const result = resolveColors([{ ...emptyLayer(), fill: "mixed" }, solidLayer(WHITE)]);
    expect(result.foreground).toBeNull();
    expect(result.background).toBeNull();
    expect(result.indeterminateReasons).toContain("fill-mixed");
  });

  it("is indeterminate when the text fill is a gradient, image, or video", () => {
    const result = resolveColors([
      { ...emptyLayer(), fill: { kind: "unresolvable" } },
      solidLayer(WHITE)
    ]);
    expect(result.indeterminateReasons).toContain("fill-unresolvable");
  });

  it("is indeterminate when an ancestor's fill blocks resolution with a gradient", () => {
    const result = resolveColors([solidLayer(BLACK), { ...emptyLayer(), fill: { kind: "unresolvable" } }]);
    expect(result.indeterminateReasons).toContain("fill-unresolvable");
  });

  it("is indeterminate when the text node's own paint opacity is below 1", () => {
    const partial: PaintLayer = { kind: "solid", color: BLACK, opacity: 0.5 };
    const result = resolveColors([{ ...emptyLayer(), fill: partial }, solidLayer(WHITE)]);
    expect(result.indeterminateReasons).toContain("opacity-below-one");
  });

  it("is indeterminate when an ancestor's node opacity is below 1", () => {
    const result = resolveColors([solidLayer(BLACK), solidLayer(WHITE, { nodeOpacity: 0.9 })]);
    expect(result.indeterminateReasons).toContain("opacity-below-one");
  });

  it("is indeterminate when a non-normal blend mode appears anywhere in the chain", () => {
    const result = resolveColors([solidLayer(BLACK, { blendMode: "MULTIPLY" }), solidLayer(WHITE)]);
    expect(result.indeterminateReasons).toContain("blend-mode");
  });

  it("is indeterminate when the text node or an ancestor is invisible", () => {
    const result = resolveColors([solidLayer(BLACK), solidLayer(WHITE, { visible: false })]);
    expect(result.indeterminateReasons).toContain("node-invisible");
  });

  it("is indeterminate when no background resolves anywhere in the chain, including the page", () => {
    const result = resolveColors([solidLayer(BLACK), emptyLayer(), emptyLayer()]);
    expect(result.indeterminateReasons).toContain("no-background-resolved");
  });

  it("is indeterminate for a text node with no fill at all", () => {
    const result = resolveColors([emptyLayer(), solidLayer(WHITE)]);
    expect(result.indeterminateReasons).toContain("no-foreground-fill");
  });

  it("reports missing-node-data for an empty chain rather than throwing", () => {
    const result = resolveColors([]);
    expect(result).toEqual({
      foreground: null,
      background: null,
      indeterminateReasons: ["missing-node-data"]
    });
  });
});
