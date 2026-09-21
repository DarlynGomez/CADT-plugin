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
 * One tile: a sample of the node's own text in the candidate colour, its hex, a
 * label, a one line reason, and the ratio badge pinned to the bottom edge. Selection
 * is an inset ring, never a border width change, since that shifts every pixel inside
 * the tile across all three in a row
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
  const sampleStyle = { color: toCssColor(color) };

  return (
    <button
      type="button"
      className={`${styles.tile} ${focused ? styles.focused : ""}`}
      aria-pressed={focused}
      onFocus={onFocus}
      onClick={onActivate}
    >
      <span className={styles.sample} style={sampleStyle}>
        {sampleText}
      </span>
      <span className={styles.hex}>{hex}</span>
      <span className={styles.label}>{label}</span>
      <span className={styles.reason}>{reason}</span>
      <RatioBadge achievedRatio={achievedRatio} requiredRatio={requiredRatio} />
    </button>
  );
}
