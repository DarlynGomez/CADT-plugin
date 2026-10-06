import { LARGE_TEXT_MIN_BOLD_SIZE_PX, LARGE_TEXT_MIN_SIZE_PX } from "./thresholds";

/** Large text gets the relaxed 3.0 threshold and everything else needs 4.5 */
export type TextSizeClass = "large" | "normal";

// Keywords have no spaces because the style name is stripped of spaces first
// Extrabold and ultrabold already contain bold
const BOLD_STYLE_KEYWORDS = ["bold", "black", "heavy", "ultra"];

// Plain bold would also match semibold and demibold, which are below the 700 floor
const NOT_BOLD_STYLE_KEYWORDS = ["semibold", "demibold", "demi", "medium", "book"];

/**
 * A guess from the style name, used when the numeric weight is mixed
 * Spaces are stripped so Semi Bold does not slip past the semibold check
 */
export function isBoldStyleName(styleName: string): boolean {
  const normalized = styleName.toLowerCase().replace(/\s+/g, "");
  if (NOT_BOLD_STYLE_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return false;
  }
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
