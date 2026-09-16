import { contrastRatio, relativeLuminance } from "../../plugin/detection/rules/contrast/contrastRatio";
import type { RGBColor } from "../issues/issueTypes";
import { CONTRAST_ADJUST_HEADROOM } from "./headroom";
import { hslToRgb, rgbToHsl } from "./hsl";

const SEARCH_STEPS = 40;

/**
 * Option A: same hue and saturation as current, the least lightness change that clears
 * requiredRatio plus headroom against background. Returns current unchanged when it
 * already clears the padded target
 *
 * Searches only the side of the current lightness that can help: darker when current
 * already sits darker than background, lighter otherwise, since moving the other way
 * only shrinks the ratio further. If neither extreme (pure black or pure white on this
 * hue and saturation) reaches the target, holds the closest extreme rather than
 * returning a colour that still fails
 */
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
