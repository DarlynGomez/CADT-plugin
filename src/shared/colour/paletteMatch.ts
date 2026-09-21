import type { RGBColor } from "../issues/issueTypes";
import { contrastRatio } from "./contrastRatio";
import { CONTRAST_ADJUST_HEADROOM } from "./headroom";
import { rgbToHsl } from "./hsl";

/** One colour already present in the file, named by its binding where it has one */
export interface NamedColor {
  name: string | null;
  color: RGBColor;
}

function hueDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 1;
  return Math.min(diff, 1 - diff);
}

/**
 * Option B: the candidate closest in hue to current that clears requiredRatio plus
 * headroom against background, or null when none of the candidates pass
 */
export function paletteMatch(
  current: RGBColor,
  candidates: readonly NamedColor[],
  background: RGBColor,
  requiredRatio: number
): NamedColor | null {
  const target = requiredRatio + CONTRAST_ADJUST_HEADROOM;
  const currentHue = rgbToHsl(current).h;

  const passing = candidates.filter((candidate) => contrastRatio(candidate.color, background) >= target);
  if (passing.length === 0) {
    return null;
  }

  return passing.reduce((nearest, candidate) => {
    const candidateDistance = hueDistance(currentHue, rgbToHsl(candidate.color).h);
    const nearestDistance = hueDistance(currentHue, rgbToHsl(nearest.color).h);
    return candidateDistance < nearestDistance ? candidate : nearest;
  });
}
