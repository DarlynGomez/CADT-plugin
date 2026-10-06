import type { RGBColor } from "../issues/issueTypes";
import { relativeLuminance } from "./contrastRatio";

/** Highest luminance a darker foreground can have and still pass, negative when none can */
export function luminanceCeiling(background: RGBColor, requiredRatio: number): number {
  return (relativeLuminance(background) + 0.05) / requiredRatio - 0.05;
}
