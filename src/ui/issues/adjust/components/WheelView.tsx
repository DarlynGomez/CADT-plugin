import { useState } from "react";
import { Check, Palette } from "lucide-react";

import { rgbToHex } from "../../../../shared/colour/colorHex";
import { contrastRatio } from "../../../../shared/colour/contrastRatio";
import { passLevel } from "../../../../shared/colour/passLevel";
import type { RGBColor } from "../../../../shared/issues/issueTypes";
import { BackgroundAncestorCallout } from "./BackgroundAncestorCallout";
import { ColorWheel } from "./ColorWheel";
import { HexField } from "./HexField";
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
 * The wheel expanded under the third card, or alone at the lowest help level
 * Adds the ratio readout, pass pill and background callout, the wheel itself is unchanged
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

  const ratio = contrastRatio(currentColor, background);
  const level = passLevel(ratio, requiredRatio);
  const backgroundHex = rgbToHex(background);

  return (
    <div className={styles.wheelView}>
      <BackgroundAncestorCallout
        backgroundAncestorName={backgroundAncestorName}
        backgroundHex={backgroundHex}
      />

      <div className={styles.card}>
        <p className={styles.cardTitle}>
          <Palette size={14} aria-hidden="true" />
          Choose your own
        </p>
        <div className={styles.grid}>
          <ColorWheel
            background={background}
            requiredRatio={requiredRatio}
            initialColor={initialColor}
            onColorChange={handleColorChange}
          />

          <div className={styles.ratioRow}>
            <span className={styles.ratioText}>
              <span className={styles.ratioLabel}>Ratio</span>
              <span className={styles.ratioValue}>{ratio.toFixed(2)}:1</span>
            </span>
            <span className={styles.passPill}>
              <Check size={12} aria-hidden="true" strokeWidth={2.5} />
              {level}
            </span>
          </div>

          <div className={styles.swatchRow}>
            <span className={styles.swatch} style={{ backgroundColor: rgbToHex(currentColor) }} />
            <div className={styles.hexFieldWrap}>
              <HexField
                background={background}
                requiredRatio={requiredRatio}
                onColorChange={handleColorChange}
                onRejected={onHexRejected}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
