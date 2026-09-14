/**
 * Property names, as plain strings rather than Figma's own NodeChangeProperty type, that
 * the registered rules care about. Contrast reads fills, characters, fontSize, fontName,
 * visible, opacity, and parent (a reparent can change the resolved background). A move
 * or resize, x, y, width, height, never reaches here as a reason to rescan.
 */
const RELEVANT_PROPERTIES = new Set<string>([
  "fills",
  "characters",
  "fontSize",
  "fontName",
  "visible",
  "opacity",
  "parent"
]);

/** Whether a PROPERTY_CHANGE naming these properties should trigger a rescan */
export function isRelevantPropertyChange(changedProperties: readonly string[]): boolean {
  return changedProperties.some((property) => RELEVANT_PROPERTIES.has(property));
}
