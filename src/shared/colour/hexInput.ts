import type { RGBColor } from "../issues/issueTypes";
import { contrastRatio } from "./contrastRatio";
import { CONTRAST_ADJUST_HEADROOM } from "./headroom";
import { keepHue } from "./keepHue";

export type HexInputResult =
  | { kind: "valid"; color: RGBColor }
  | { kind: "malformed" }
  | {
      kind: "fails-contrast";
      color: RGBColor;
      achievedRatio: number;
      requiredRatio: number;
      /** The nearest passing colour on the same hue, or null when none exists */
      nearestOnHue: RGBColor | null;
    };

const HEX_PATTERN = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function expandShortHex(hex: string): string {
  return hex.length === 3
    ? hex
        .split("")
        .map((channel) => channel + channel)
        .join("")
    : hex;
}

/** Parses a hex string (3 or 6 digit, with or without a leading hash) to an RGBColor */
export function parseHex(input: string): RGBColor | null {
  const match = HEX_PATTERN.exec(input.trim());
  if (!match) {
    return null;
  }
  const full = expandShortHex(match[1]);
  return {
    r: parseInt(full.slice(0, 2), 16) / 255,
    g: parseInt(full.slice(2, 4), 16) / 255,
    b: parseInt(full.slice(4, 6), 16) / 255
  };
}

/** A failing hex is rejected with its ratio, never silently corrected */
export function validateHexInput(
  input: string,
  background: RGBColor,
  requiredRatio: number
): HexInputResult {
  const color = parseHex(input);
  if (!color) {
    return { kind: "malformed" };
  }

  const target = requiredRatio + CONTRAST_ADJUST_HEADROOM;
  const achievedRatio = contrastRatio(color, background);
  if (achievedRatio >= target) {
    return { kind: "valid", color };
  }

  const nearest = keepHue(color, background, requiredRatio);
  const nearestOnHue = contrastRatio(nearest, background) >= target ? nearest : null;

  return { kind: "fails-contrast", color, achievedRatio, requiredRatio, nearestOnHue };
}
