import { useEffect, useRef } from "react";

import type { RGBColor } from "../../../shared/issues/issueTypes";
import { computeCanvasBufferSize } from "./canvasSizing";
import { paintWheelFrame } from "./paintWheel";

/**
 * Repaints the wheel canvas whenever lightness, background, or requiredRatio change,
 * coalesced with requestAnimationFrame so a fast-moving lightness slider does not
 * trigger a repaint per input event
 */
export function useWheelPaint(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  lightness: number,
  background: RGBColor,
  requiredRatio: number
): void {
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }
    frameRef.current = requestAnimationFrame(() => {
      const cssSize = canvas.getBoundingClientRect().width;
      const buffer = computeCanvasBufferSize(cssSize, window.devicePixelRatio || 1);
      canvas.width = buffer.width;
      canvas.height = buffer.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      paintWheelFrame(imageData, lightness, background, requiredRatio);
      ctx.putImageData(imageData, 0, 0);
    });

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [canvasRef, lightness, background, requiredRatio]);
}
