/**
 * Adjust's variable scope: offering it, scanning its consumers, and writing the
 * variable. Off by default: it edits shared design tokens, has not been run in Figma,
 * and is not part of the study protocol. False hides the option entirely on both sides
 * of the postMessage boundary. The code behind it stays; to verify it by hand, flip
 * this to true locally. See ADR-033
 */
export const FEATURE_VARIABLE_SCOPE = false;
