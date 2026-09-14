import { LARGE_TEXT_MIN_BOLD_SIZE_PX, LARGE_TEXT_MIN_SIZE_PX } from "./thresholds";

/** WCAG large text gets the relaxed 3.0 threshold; everything else needs 4.5 */
export type TextSizeClass = "large" | "normal";

const BOLD_STYLE_KEYWORDS = ["bold", "black", "heavy", "semibold"];

/**
 * Figma exposes a font style name rather than a numeric weight, so this is a heuristic,
 * not an exact reading of the weight. A style outside these keywords, for example
 * "Medium" or "Condensed", is treated as not bold, which can undercount edge-weight fonts.
 */
export function isBoldStyleName(styleName: string): boolean {
  const normalized = styleName.toLowerCase();
  return BOLD_STYLE_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

/** Classify a font size and weight per the WCAG 2.1 definition of large text */
export function classifyTextSize(fontSizePx: number, isBold: boolean): TextSizeClass {
  if (fontSizePx >= LARGE_TEXT_MIN_SIZE_PX) {
    return "large";
  }
  if (isBold && fontSizePx >= LARGE_TEXT_MIN_BOLD_SIZE_PX) {
    return "large";
  }
  return "normal";
}
