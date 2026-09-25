const AAA_NORMAL_TEXT = 7.0;
const AAA_LARGE_TEXT = 4.5;

/**
 * AA always applies once a colour is shown at all, since nothing renders unless it
 * already clears requiredRatio. AAA is judged against the stricter level for the same
 * size class the finding used, derived from requiredRatio rather than needing its own
 * field. Shared by RatioBadge and the wheel's own pass pill, WheelView.tsx.
 */
export function passLevel(achievedRatio: number, requiredRatio: number): "AA" | "AAA" {
  const aaaThreshold = requiredRatio === 3.0 ? AAA_LARGE_TEXT : AAA_NORMAL_TEXT;
  return achievedRatio >= aaaThreshold ? "AAA" : "AA";
}
