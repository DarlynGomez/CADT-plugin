const AAA_NORMAL_TEXT = 7.0;
const AAA_LARGE_TEXT = 4.5;

/** AA always holds once a colour is shown, AAA uses the stricter level for the same text size */
export function passLevel(achievedRatio: number, requiredRatio: number): "AA" | "AAA" {
  const aaaThreshold = requiredRatio === 3.0 ? AAA_LARGE_TEXT : AAA_NORMAL_TEXT;
  return achievedRatio >= aaaThreshold ? "AAA" : "AA";
}
