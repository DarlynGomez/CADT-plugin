export interface CanvasBufferSize {
  width: number;
  height: number;
}

/**
 * Integer canvas buffer dimensions from a square CSS size and a device pixel ratio
 *
 * Both inputs get rounded before multiplying, not after: a fractional device pixel
 * ratio makes every pixel index fractional, and a write to a fractional index on a
 * typed array is silently discarded, producing a canvas that paints nothing while hit
 * testing still works perfectly
 */
export function computeCanvasBufferSize(cssSize: number, devicePixelRatio: number): CanvasBufferSize {
  const ratio = Math.round(devicePixelRatio) || 1;
  const size = Math.round(cssSize) * ratio;
  return { width: size, height: size };
}
