import type { RGBColor } from "../issues/issueTypes";
import { contrastRatio, relativeLuminance } from "./contrastRatio";
import { CONTRAST_ADJUST_HEADROOM } from "./headroom";
import { hslToRgb, rgbToHsl } from "./hsl";

const SEARCH_STEPS = 40;

/** Least lightness change on the same hue that passes, searching only the side that helps */
export function keepHue(current: RGBColor, background: RGBColor, requiredRatio: number): RGBColor {
  const target = requiredRatio + CONTRAST_ADJUST_HEADROOM;
  if (contrastRatio(current, background) >= target) {
    return current;
  }

  const { h, s, l } = rgbToHsl(current);
  const goDarker = relativeLuminance(current) <= relativeLuminance(background);
  const passes = (lightness: number): boolean =>
    contrastRatio(hslToRgb(h, s, lightness), background) >= target;

  let passLightness = goDarker ? 0 : 1;
  let failLightness = l;

  if (!passes(passLightness)) {
    return hslToRgb(h, s, passLightness);
  }

  for (let step = 0; step < SEARCH_STEPS; step += 1) {
    const mid = (passLightness + failLightness) / 2;
    if (passes(mid)) {
      passLightness = mid;
    } else {
      failLightness = mid;
    }
  }

  return hslToRgb(h, s, passLightness);
}
