import { contrastRatio } from "../../../shared/colour/contrastRatio";
import { CONTRAST_ADJUST_HEADROOM } from "../../../shared/colour/headroom";
import { hslToRgb } from "../../../shared/colour/hsl";
import { pointToHueSaturation } from "../../../shared/colour/wheelGeometry";
import type { RGBColor } from "../../../shared/issues/issueTypes";

// Faded rather than hidden: the boundary stays visible instead of the constraint
// becoming a fence. See ADJUST_SPEC.md section 3
const FADED_ALPHA = 0.25;

function toByte(channel: number): number {
  return Math.round(Math.min(1, Math.max(0, channel)) * 255);
}

/**
 * Paints one frame of the wheel into imageData: every pixel's hue and saturation come
 * from its position on the disc at the given lightness, faded when it fails
 * requiredRatio plus headroom against background rather than hidden
 *
 * Reads width and height back from imageData itself rather than trusting a requested
 * size, since a mismatched buffer silently discards writes past its actual length
 */
export function paintWheelFrame(
  imageData: ImageData,
  lightness: number,
  background: RGBColor,
  requiredRatio: number
): void {
  const { width, height, data } = imageData;
  const target = requiredRatio + CONTRAST_ADJUST_HEADROOM;
  const radius = Math.min(width, height) / 2;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const point = { x: (x - radius) / radius, y: (y - radius) / radius };
      const distance = Math.hypot(point.x, point.y);

      if (distance > 1) {
        data[index + 3] = 0;
        continue;
      }

      const { hue, saturation } = pointToHueSaturation(point);
      const color = hslToRgb(hue, saturation, lightness);
      const passes = contrastRatio(color, background) >= target;

      data[index] = toByte(color.r);
      data[index + 1] = toByte(color.g);
      data[index + 2] = toByte(color.b);
      data[index + 3] = toByte(passes ? 1 : FADED_ALPHA);
    }
  }
}
