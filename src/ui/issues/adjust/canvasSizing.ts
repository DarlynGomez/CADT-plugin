export interface CanvasBufferSize {
  width: number;
  height: number;
}

export function computeCanvasBufferSize(cssSize: number, devicePixelRatio: number): CanvasBufferSize {
  const ratio = Math.round(devicePixelRatio) || 1;
  const size = Math.round(cssSize) * ratio;
  return { width: size, height: size };
}
