import type { RGBColor } from "../issues/issueTypes";

/** Hue as a fraction of a turn (0 to 1), saturation and lightness 0 to 1 */
export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

/** Standard RGB (0 to 1) to HSL conversion, hue in turns rather than degrees */
export function rgbToHsl(color: RGBColor): HSLColor {
  const { r, g, b } = color;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l };
  }

  const delta = max - min;
  const s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let h: number;
  if (max === r) {
    h = (g - b) / delta + (g < b ? 6 : 0);
  } else if (max === g) {
    h = (b - r) / delta + 2;
  } else {
    h = (r - g) / delta + 4;
  }

  return { h: h / 6, s, l };
}

function hueToChannel(p: number, q: number, hueInput: number): number {
  let hue = hueInput;
  if (hue < 0) hue += 1;
  if (hue > 1) hue -= 1;
  if (hue < 1 / 6) return p + (q - p) * 6 * hue;
  if (hue < 1 / 2) return q;
  if (hue < 2 / 3) return p + (q - p) * (2 / 3 - hue) * 6;
  return p;
}

/** Standard HSL to RGB (0 to 1) conversion, the inverse of rgbToHsl */
export function hslToRgb(h: number, s: number, l: number): RGBColor {
  if (s === 0) {
    return { r: l, g: l, b: l };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: hueToChannel(p, q, h + 1 / 3),
    g: hueToChannel(p, q, h),
    b: hueToChannel(p, q, h - 1 / 3)
  };
}
