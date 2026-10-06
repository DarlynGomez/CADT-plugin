/**
 * Property names the rules care about, as plain strings
 * Fills, text, font, visibility, opacity and parent, a reparent can change the background
 * Moves and resizes never trigger a rescan
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
