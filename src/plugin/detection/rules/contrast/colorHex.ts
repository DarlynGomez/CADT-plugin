import type { RGBColor } from "../../../../shared/issues/issueTypes";

function toHexByte(channel: number): string {
  return Math.round(channel * 255)
    .toString(16)
    .padStart(2, "0");
}

/** RGBColor's 0 to 1 float channels as an uppercase "#RRGGBB" string, for evidence display only */
export function rgbToHex(color: RGBColor): string {
  return `#${toHexByte(color.r)}${toHexByte(color.g)}${toHexByte(color.b)}`.toUpperCase();
}
