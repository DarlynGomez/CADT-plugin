import type { Severity } from "../../shared/issues/issueTypes";

/**
 * Display values a card applies as custom properties, never as literals. See
 * DESIGN_SYSTEM.md section 8: fading is a display concern computed by a pure
 * function, severity and count in, display values out.
 */
export interface FadeDisplayValues {
  opacity: number;
  /** 0 (no shift) to 1 (fully at --color-warning), blended in the component's CSS */
  warningMix: number;
}

const LOW_OPACITY_FLOOR = 0.35;
const HIGH_VISIBILITY_FLOOR = 0.8;
// Halfway between the low and high floors: medium "sits between the two" per spec
// section 5.4, and this is the specific interpolation chosen to express that, not a
// value named in the spec itself.
const MEDIUM_OPACITY_FLOOR = (LOW_OPACITY_FLOOR + HIGH_VISIBILITY_FLOOR) / 2;
const ENCOUNTERS_TO_FLOOR = 5;

function progressToward(encounterCount: number): number {
  return Math.min(encounterCount / ENCOUNTERS_TO_FLOOR, 1);
}

/**
 * important never fades regardless of severity or count, so it is checked first and
 * short-circuits everything else. Nothing here ever reaches zero opacity.
 */
export function computeFade(
  severity: Severity,
  encounterCount: number,
  isImportant: boolean
): FadeDisplayValues {
  if (isImportant) {
    return { opacity: 1, warningMix: 0 };
  }

  const progress = progressToward(encounterCount);

  if (severity === "low") {
    return { opacity: 1 - progress * (1 - LOW_OPACITY_FLOOR), warningMix: 0 };
  }

  if (severity === "high") {
    // Does not meaningfully fade on opacity: holds the floor from the first encounter
    // rather than approaching it, and shifts toward the warning color instead.
    return { opacity: HIGH_VISIBILITY_FLOOR, warningMix: progress };
  }

  return {
    opacity: 1 - progress * (1 - MEDIUM_OPACITY_FLOOR),
    warningMix: progress * 0.5
  };
}
