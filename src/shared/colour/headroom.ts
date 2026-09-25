/**
 * Added on top of a finding's requiredRatio so a generated fix clears the boundary with
 * room to spare rather than landing exactly on it
 *
 * A result at exactly the threshold passes only until something nudges it back under,
 * for example the font size dropping enough to lose the large-text allowance, at which
 * point ADR-014 reopens the issue as changed since it was ignored. This margin exists so
 * a generated fix does not immediately re-trigger that path
 */
export const CONTRAST_ADJUST_HEADROOM = 0.15;
