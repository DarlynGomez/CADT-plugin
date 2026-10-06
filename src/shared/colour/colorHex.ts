import type { RGBColor } from "../issues/issueTypes";

function toHexByte(channel: number): string {
  return Math.round(channel * 255)
    .toString(16)
    .padStart(2, "0");
}

/** Channels from 0 to 1 as an uppercase hex string like #RRGGBB */
export function rgbToHex(color: RGBColor): string {
  return `#${toHexByte(color.r)}${toHexByte(color.g)}${toHexByte(color.b)}`.toUpperCase();
}
