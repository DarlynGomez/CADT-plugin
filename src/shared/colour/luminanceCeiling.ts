import type { RGBColor } from "../issues/issueTypes";
import { relativeLuminance } from "./contrastRatio";

/**
 * The maximum relative luminance a foreground can have, against this background, while
 * still meeting requiredRatio, for a foreground on the darker side of the background
 *
 * Derived from the WCAG ratio formula: ratio = (background + 0.05) / (foreground + 0.05)
 * when foreground is the darker one, so foreground <= (background + 0.05) / ratio - 0.05
 * at the boundary. A negative result means no darker-side luminance reaches the ratio
 */
export function luminanceCeiling(background: RGBColor, requiredRatio: number): number {
  return (relativeLuminance(background) + 0.05) / requiredRatio - 0.05;
}
