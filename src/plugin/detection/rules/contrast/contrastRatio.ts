/** A color in the 0 to 1 range per channel, matching Figma's own Paint.color shape */
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/** One sRGB channel, linearized per the WCAG 2.1 relative luminance formula */
function linearizeChannel(channel: number): number {
  return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

/** WCAG 2.1 relative luminance of a color, in the range 0 (black) to 1 (white) */
export function relativeLuminance(color: RGBColor): number {
  const r = linearizeChannel(color.r);
  const g = linearizeChannel(color.g);
  const b = linearizeChannel(color.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.1 contrast ratio between two colors, always 1 (no contrast) to 21 (black on white) */
export function contrastRatio(a: RGBColor, b: RGBColor): number {
  const luminanceA = relativeLuminance(a);
  const luminanceB = relativeLuminance(b);
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Whether a measured ratio meets a required WCAG threshold, boundary value inclusive */
export function passesContrastThreshold(ratio: number, requiredRatio: number): boolean {
  return ratio >= requiredRatio;
}
