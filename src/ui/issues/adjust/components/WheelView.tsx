import { useState } from "react";

import { rgbToHex } from "../../../../shared/colour/colorHex";
import { contrastRatio } from "../../../../shared/colour/contrastRatio";
import type { RGBColor } from "../../../../shared/issues/issueTypes";
import { ColorWheel } from "./ColorWheel";
import { HexField } from "./HexField";
import { RatioBadge } from "./RatioBadge";
import styles from "./WheelView.module.css";

interface WheelViewProps {
  background: RGBColor;
  backgroundAncestorName: string;
  requiredRatio: number;
  initialColor: RGBColor;
  onColorChange: (color: RGBColor | null) => void;
  onHexRejected: () => void;
}

/**
 * The wheel, expanded inline under the third option card (or shown alone at the
 * "Flag and explain" calibration level). ADJUST_SPEC.md section 3C: chrome restyled to
 * the mockup, a live ratio readout and a background-ancestor callout around the wheel;
 * the wheel's own fade rendering and snap-on-click behaviour, ColorWheel.tsx, untouched.
 */
export function WheelView({
  background,
  backgroundAncestorName,
  requiredRatio,
  initialColor,
  onColorChange,
  onHexRejected
}: WheelViewProps) {
  const [currentColor, setCurrentColor] = useState(initialColor);

  function handleColorChange(color: RGBColor | null) {
    if (color) {
      setCurrentColor(color);
    }
    onColorChange(color);
  }

  return (
    <div className={styles.wheelView}>
      <p className={styles.ancestor}>
        Inspecting background ancestor: <strong>{backgroundAncestorName}</strong>
      </p>

      <ColorWheel
        background={background}
        requiredRatio={requiredRatio}
        initialColor={initialColor}
        onColorChange={handleColorChange}
      />

      <div className={styles.readout}>
        <span className={styles.swatch} style={{ backgroundColor: rgbToHex(currentColor) }} />
        <span className={styles.hex}>{rgbToHex(currentColor)}</span>
        <RatioBadge
          achievedRatio={contrastRatio(currentColor, background)}
          requiredRatio={requiredRatio}
        />
      </div>

      <HexField
        background={background}
        requiredRatio={requiredRatio}
        onColorChange={handleColorChange}
        onRejected={onHexRejected}
      />
    </div>
  );
}
