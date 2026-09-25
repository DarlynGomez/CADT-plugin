import type { NamedColor } from "../../../../shared/colour/paletteMatch";
import type { RGBColor } from "../../../../shared/issues/issueTypes";
import { OptionsList, type FocusedOption } from "./OptionsList";
import styles from "./AdjustBody.module.css";
import { WheelView } from "./WheelView";

const COUNT_WORD: Record<number, string> = { 2: "two", 3: "three" };

interface AdjustBodyProps {
  /** ADJUST_SPEC.md section 2: "Flag and explain" opens straight into the wheel, no options */
  aiAssistanceLevel: number;
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
  onColorChange: (color: RGBColor | null) => void;
  onHexRejected: () => void;
}

/** The wheel-only entry point, or the three option cards, split out to keep AdjustPopup under 150 lines */
export function AdjustBody({
  aiAssistanceLevel,
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
  onColorChange,
  onHexRejected
}: AdjustBodyProps) {
  if (aiAssistanceLevel === 2) {
    return (
      <WheelView
        background={background}
        backgroundAncestorName={backgroundAncestorName}
        requiredRatio={requiredRatio}
        initialColor={wheelColor ?? optionA}
        onColorChange={onColorChange}
        onHexRejected={onHexRejected}
      />
    );
  }

  const count = optionB ? 3 : 2;

  return (
    <div className={styles.body}>
      <p className={styles.intro}>
        Select one of {COUNT_WORD[count]} intentional contrast adjustments:
      </p>
      <OptionsList
        sampleText={sampleText}
        background={background}
        backgroundAncestorName={backgroundAncestorName}
        requiredRatio={requiredRatio}
        optionA={optionA}
        optionB={optionB}
        wheelColor={wheelColor}
        focused={focused}
        onFocusOption={onFocusOption}
        onOpenWheel={onOpenWheel}
        onColorChange={onColorChange}
        onHexRejected={onHexRejected}
      />
    </div>
  );
}
