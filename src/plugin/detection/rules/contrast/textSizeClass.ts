import { LARGE_TEXT_MIN_BOLD_SIZE_PX, LARGE_TEXT_MIN_SIZE_PX } from "./thresholds";

/** WCAG large text gets the relaxed 3.0 threshold; everything else needs 4.5 */
export type TextSizeClass = "large" | "normal";

// Keywords have no internal spaces: the style name is space-stripped before matching
// "extrabold" and "ultrabold" already contain "bold", so they need no separate entry
const BOLD_STYLE_KEYWORDS = ["bold", "black", "heavy", "ultra"];

// "bold" as a substring would also match semibold and demibold, both below the 700 floor
const NOT_BOLD_STYLE_KEYWORDS = ["semibold", "demibold", "demi", "medium", "book"];

/**
 * A heuristic, not an exact weight reading, since Figma exposes a style name here
 * Fallback for when the numeric fontWeight is mixed; see resolveIsBold in snapshot.ts
 * Whitespace is stripped, not just lowercased: "Semi Bold" would otherwise miss the
 * "semibold" exclusion while still matching the bare "bold" substring
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
