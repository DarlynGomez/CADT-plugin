import { describe, expect, it } from "vitest";

import { computeCanvasBufferSize } from "./canvasSizing";

describe("computeCanvasBufferSize", () => {
  it("returns an integer size for a whole device pixel ratio", () => {
    expect(computeCanvasBufferSize(200, 2)).toEqual({ width: 400, height: 400 });
  });

  it("rounds a fractional device pixel ratio before multiplying", () => {
    // 2.5 would leave every pixel index fractional if used directly; round first
    const result = computeCanvasBufferSize(200, 2.5);
    expect(Number.isInteger(result.width)).toBe(true);
    expect(Number.isInteger(result.height)).toBe(true);
  });

  it("rounds a fractional CSS size", () => {
    const result = computeCanvasBufferSize(199.6, 1);
    expect(Number.isInteger(result.width)).toBe(true);
  });

  it("treats a zero or missing ratio as 1 rather than collapsing to a zero buffer", () => {
    expect(computeCanvasBufferSize(200, 0)).toEqual({ width: 200, height: 200 });
  });
});
