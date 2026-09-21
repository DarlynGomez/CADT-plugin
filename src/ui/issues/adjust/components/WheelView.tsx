import type { RGBColor } from "../../../../shared/issues/issueTypes";
import { ColorWheel } from "./ColorWheel";
import { HexField } from "./HexField";
import styles from "./WheelView.module.css";

interface WheelViewProps {
  background: RGBColor;
  requiredRatio: number;
  initialColor: RGBColor;
  onColorChange: (color: RGBColor | null) => void;
  onBack: () => void;
  onHexRejected: () => void;
}

/** The wheel, expanded over the tiles inside the same panel, with a back control */
export function WheelView({
  background,
  requiredRatio,
  initialColor,
  onColorChange,
  onBack,
  onHexRejected
}: WheelViewProps) {
  return (
    <div className={styles.wheelView}>
      <button type="button" className={styles.back} onClick={onBack}>
        Back
      </button>
      <ColorWheel
        background={background}
        requiredRatio={requiredRatio}
        initialColor={initialColor}
        onColorChange={onColorChange}
      />
      <HexField
        background={background}
        requiredRatio={requiredRatio}
        onColorChange={onColorChange}
        onRejected={onHexRejected}
      />
    </div>
  );
}
