const HUE_STEP = 1 / 72;
const HUE_STEP_LARGE = 1 / 24;
const SATURATION_STEP = 0.02;
const SATURATION_STEP_LARGE = 0.1;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export interface WheelKeyMove {
  hue: number;
  saturation: number;
}

/**
 * The next hue and saturation for one arrow key press, or null for an unhandled key
 * Left and right change hue, up and down change saturation, shift takes larger steps
 */
export function applyWheelKey(
  key: string,
  shift: boolean,
  hue: number,
  saturation: number
): WheelKeyMove | null {
  const hueStep = shift ? HUE_STEP_LARGE : HUE_STEP;
  const saturationStep = shift ? SATURATION_STEP_LARGE : SATURATION_STEP;

  switch (key) {
    case "ArrowLeft":
      return { hue: (hue - hueStep + 1) % 1, saturation };
    case "ArrowRight":
      return { hue: (hue + hueStep) % 1, saturation };
    case "ArrowUp":
      return { hue, saturation: clamp01(saturation + saturationStep) };
    case "ArrowDown":
      return { hue, saturation: clamp01(saturation - saturationStep) };
    default:
      return null;
  }
}
