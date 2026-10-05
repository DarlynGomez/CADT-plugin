/**
 * Adjust's variable scope: offering it, scanning its consumers, and writing the
 * variable. The study build sets this to false, which hides the option entirely
 * on both sides of the postMessage boundary. The code behind it stays; see ADR-033
 */
export const FEATURE_VARIABLE_SCOPE = true;
