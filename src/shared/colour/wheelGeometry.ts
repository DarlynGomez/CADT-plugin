/** A point on the unit disc, independent of pixel size or device ratio */
export interface WheelPoint {
  x: number;
  y: number;
}

const FULL_TURN = 2 * Math.PI;

/** Hue (a fraction of a turn, 0 to 1) and saturation (0 to 1) to a point on the unit disc */
export function hueSaturationToPoint(hue: number, saturation: number): WheelPoint {
  const angle = hue * FULL_TURN;
  return { x: saturation * Math.cos(angle), y: saturation * Math.sin(angle) };
}

/** The inverse of hueSaturationToPoint. Saturation is clamped to 1 for a point outside the disc */
export function pointToHueSaturation(point: WheelPoint): { hue: number; saturation: number } {
  const saturation = Math.min(1, Math.hypot(point.x, point.y));
  const angle = Math.atan2(point.y, point.x);
  const hue = (angle < 0 ? angle + FULL_TURN : angle) / FULL_TURN;
  return { hue, saturation };
}
