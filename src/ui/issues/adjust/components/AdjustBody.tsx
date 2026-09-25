import type { NamedColor } from "../../../../shared/colour/paletteMatch";
import type { RGBColor } from "../../../../shared/issues/issueTypes";
import styles from "./AdjustBody.module.css";
import { TilesView, type FocusedOption } from "./TilesView";
import { WheelView } from "./WheelView";

interface AdjustBodyProps {
  view: "tiles" | "wheel";
  sampleText: string;
  background: RGBColor;
  backgroundAncestorName: string;
  requiredRatio: number;
  optionA: RGBColor;
  optionB: NamedColor | null;
  wheelColor: RGBColor | null;
  focused: FocusedOption;
  onFocusOption: (option: FocusedOption, color: RGBColor) => void;
  onOpenWheel: () => void;
  thirdTileRef: React.RefObject<HTMLButtonElement | null>;
  initialWheelColor: RGBColor;
  onColorChange: (color: RGBColor | null) => void;
  onHexRejected: () => void;
  onBack: () => void;
}

/** The tiles-or-wheel switch, split out of AdjustPopup.tsx to keep it under 150 lines */
export function AdjustBody({
  view,
  sampleText,
  background,
  backgroundAncestorName,
  requiredRatio,
  optionA,
  optionB,
  wheelColor,
  focused,
  onFocusOption,
  onOpenWheel,
  thirdTileRef,
  initialWheelColor,
  onColorChange,
  onHexRejected,
  onBack
}: AdjustBodyProps) {
  if (view === "tiles") {
    return (
      <div className={styles.tiles}>
        <TilesView
          sampleText={sampleText}
          background={background}
          requiredRatio={requiredRatio}
          optionA={optionA}
          optionB={optionB}
          wheelColor={wheelColor}
          focused={focused}
          onFocusOption={onFocusOption}
          onOpenWheel={onOpenWheel}
          thirdTileRef={thirdTileRef}
        />
      </div>
    );
  }

  return (
    <WheelView
      background={background}
      backgroundAncestorName={backgroundAncestorName}
      requiredRatio={requiredRatio}
      initialColor={initialWheelColor}
      onColorChange={onColorChange}
      onHexRejected={onHexRejected}
      onBack={onBack}
    />
  );
}
