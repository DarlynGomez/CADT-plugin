import type { RGBColor } from "../../../../shared/issues/issueTypes";
import { RatioBadge } from "./RatioBadge";
import styles from "./OptionTile.module.css";

export interface OptionTileProps {
  label: string;
  reason: string;
  sampleText: string;
  color: RGBColor;
  hex: string;
  /** Null before a colour has actually been chosen, the wheel option on first open */
  achievedRatio: number | null;
  requiredRatio: number;
  focused: boolean;
  onFocus: () => void;
  onActivate: () => void;
}

function toCssColor(color: RGBColor): string {
  return `rgb(${Math.round(color.r * 255)} ${Math.round(color.g * 255)} ${Math.round(color.b * 255)})`;
}

/**
 * Swatch on the left, then label, ratio badge and a one line reason, check mark when selected
 * Selection is an inset ring so the card never shifts
 */
export function OptionTile({
  label,
  reason,
  sampleText,
  color,
  hex,
  achievedRatio,
  requiredRatio,
  focused,
  onFocus,
  onActivate
}: OptionTileProps) {
  // Candidate colours are arbitrary data and not tokens, so an inline style is allowed here
  const swatchStyle = { backgroundColor: toCssColor(color) };

  return (
    <button
      type="button"
      className={`${styles.tile} ${focused ? styles.focused : ""}`}
      aria-pressed={focused}
      onFocus={onFocus}
      onClick={onActivate}
    >
      <span
        className={styles.swatch}
        style={swatchStyle}
        role="img"
        aria-label={`${sampleText} rendered in ${hex}`}
      />
      <span className={styles.body}>
        <span className={styles.labelRow}>
          <span className={styles.label}>{label}</span>
          {achievedRatio !== null && (
            <RatioBadge achievedRatio={achievedRatio} requiredRatio={requiredRatio} />
          )}
        </span>
        <span className={styles.reason}>{reason}</span>
      </span>
      {focused && (
        <svg className={styles.check} viewBox="0 0 16 16" width="20" height="20" aria-hidden="true">
          <path
            d="M3.5 8.5 6.5 11.5 12.5 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
