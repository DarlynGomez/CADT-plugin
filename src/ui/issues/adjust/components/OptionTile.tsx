import type { RGBColor } from "../../../../shared/issues/issueTypes";
import { RatioBadge } from "./RatioBadge";
import styles from "./OptionTile.module.css";

export interface OptionTileProps {
  label: string;
  reason: string;
  sampleText: string;
  color: RGBColor;
  hex: string;
  achievedRatio: number;
  requiredRatio: number;
  focused: boolean;
  onFocus: () => void;
  onActivate: () => void;
}

function toCssColor(color: RGBColor): string {
  return `rgb(${Math.round(color.r * 255)} ${Math.round(color.g * 255)} ${Math.round(color.b * 255)})`;
}

/**
 * ADJUST_SPEC.md section 7's amended layout: a circular specimen swatch on the left,
 * the label, ratio badge, and a one line reason stacked to its right, a checkmark
 * trailing when selected. Selection is an inset ring, never a border width change,
 * since that shifts every pixel inside a full-width card just as visibly as it did
 * across three tiles in a row.
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
  // The candidate colour is arbitrary data, not a design token: there is no palette
  // entry for a colour the file or the designer supplied. Sanctioned per CLAUDE.md
  // rule 5, alongside fade values and computed origins.
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
          <RatioBadge achievedRatio={achievedRatio} requiredRatio={requiredRatio} />
        </span>
        <span className={styles.reason}>{reason}</span>
        <span className={styles.hex}>{hex}</span>
      </span>
      {focused && (
        <svg className={styles.check} viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <path
            d="M3.5 8.5 6.5 11.5 12.5 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
