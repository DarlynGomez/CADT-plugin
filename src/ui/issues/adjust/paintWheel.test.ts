import { describe, expect, it } from "vitest";

import { paintWheelFrame } from "./paintWheel";

const WHITE = { r: 1, g: 1, b: 1 };

function blankImageData(size: number): ImageData {
  return { width: size, height: size, data: new Uint8ClampedArray(size * size * 4) } as ImageData;
}

describe("paintWheelFrame", () => {
  it("makes a corner outside the disc fully transparent", () => {
    const imageData = blankImageData(10);
    paintWheelFrame(imageData, 0.5, WHITE, 4.5);
    // top-left corner pixel is outside the inscribed circle
    expect(imageData.data[3]).toBe(0);
  });

  it("gives the centre point full alpha or the faded alpha, never anything else", () => {
    const imageData = blankImageData(10);
    paintWheelFrame(imageData, 0.5, WHITE, 4.5);
    const centreIndex = (5 * 10 + 5) * 4;
    const alpha = imageData.data[centreIndex + 3];
    expect([255, Math.round(0.25 * 255)]).toContain(alpha);
  });

  it("marks a very dark lightness as passing against a white background", () => {
    const imageData = blankImageData(4);
    paintWheelFrame(imageData, 0.05, WHITE, 4.5);
    // near the centre, a very dark pixel should clear 4.5 against white easily
    const index = (2 * 4 + 2) * 4;
    expect(imageData.data[index + 3]).toBe(255);
  });

  it("marks a near-white lightness as failing against a white background", () => {
    const imageData = blankImageData(4);
    paintWheelFrame(imageData, 0.98, WHITE, 4.5);
    const index = (2 * 4 + 2) * 4;
    expect(imageData.data[index + 3]).toBeLessThan(255);
  });

  it("reads width and height from imageData itself rather than a separate size argument", () => {
    const imageData = blankImageData(6);
    expect(() => paintWheelFrame(imageData, 0.5, WHITE, 4.5)).not.toThrow();
    expect(imageData.data.length).toBe(6 * 6 * 4);
  });
});
