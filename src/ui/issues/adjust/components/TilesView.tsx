import { rgbToHex } from "../../../../shared/colour/colorHex";
import { contrastRatio } from "../../../../shared/colour/contrastRatio";
import type { NamedColor } from "../../../../shared/colour/paletteMatch";
import type { RGBColor } from "../../../../shared/issues/issueTypes";
import { OptionTile } from "./OptionTile";
import styles from "./TilesView.module.css";

export type FocusedOption = "a" | "b" | "c" | null;

interface TilesViewProps {
  sampleText: string;
  background: RGBColor;
  requiredRatio: number;
  optionA: RGBColor;
  optionB: NamedColor | null;
  wheelColor: RGBColor | null;
  focused: FocusedOption;
  onFocusOption: (option: FocusedOption, color: RGBColor) => void;
  onOpenWheel: () => void;
  thirdTileRef: React.RefObject<HTMLButtonElement | null>;
}

/** The three tiles: keep your colour, from your file, and choose your own */
export function TilesView({
  sampleText,
  background,
  requiredRatio,
  optionA,
  optionB,
  wheelColor,
  focused,
  onFocusOption,
  onOpenWheel,
  thirdTileRef
}: TilesViewProps) {
  return (
    <>
      <OptionTile
        label="Keep your colour"
        reason="Same hue and saturation, the least change that passes"
        sampleText={sampleText}
        color={optionA}
        hex={rgbToHex(optionA)}
        achievedRatio={contrastRatio(optionA, background)}
        requiredRatio={requiredRatio}
        focused={focused === "a"}
        onFocus={() => onFocusOption("a", optionA)}
        onActivate={() => onFocusOption("a", optionA)}
      />
      {optionB && (
        <OptionTile
          label="From your file"
          reason={`Already in use as ${optionB.name ?? "an unnamed colour"}`}
          sampleText={sampleText}
          color={optionB.color}
          hex={rgbToHex(optionB.color)}
          achievedRatio={contrastRatio(optionB.color, background)}
          requiredRatio={requiredRatio}
          focused={focused === "b"}
          onFocus={() => onFocusOption("b", optionB.color)}
          onActivate={() => onFocusOption("b", optionB.color)}
        />
      )}
      {wheelColor ? (
        <OptionTile
          label="Choose your own"
          reason="Chosen on the wheel"
          sampleText={sampleText}
          color={wheelColor}
          hex={rgbToHex(wheelColor)}
          achievedRatio={contrastRatio(wheelColor, background)}
          requiredRatio={requiredRatio}
          focused={focused === "c"}
          onFocus={onOpenWheel}
          onActivate={onOpenWheel}
        />
      ) : (
        <button
          ref={thirdTileRef}
          type="button"
          className={styles.placeholderTile}
          onClick={onOpenWheel}
        >
          Choose your own
        </button>
      )}
    </>
  );
}
