import { useEffect, useRef, useState } from "react";

import { keepHue } from "../../../shared/colour/keepHue";
import { parseHex } from "../../../shared/colour/hexInput";
import { paletteMatch } from "../../../shared/colour/paletteMatch";
import type { IssueSummary, RGBColor } from "../../../shared/issues/issueTypes";
import { readContrastEvidence } from "./adjustEvidence";
import styles from "./AdjustPopup.module.css";
import { AdjustActions } from "./components/AdjustActions";
import { BindingNotice } from "./components/BindingNotice";
import { TilesView, type FocusedOption } from "./components/TilesView";
import { WheelView } from "./components/WheelView";
import { useAdjustMessages } from "./useAdjustMessages";

interface AdjustPopupProps {
  issue: IssueSummary;
  /** The raw 1 to 4 calibration answer for "How much should CADT do on its own?" */
  aiAssistanceLevel: number;
  onClose: () => void;
}

/** Three tiles, or at the "explain" level the wheel directly. Gating happens in IssueActions */
export function AdjustPopup({ issue, aiAssistanceLevel, onClose }: AdjustPopupProps) {
  const evidence = readContrastEvidence(issue.ruleId, issue.evidence);
  const background = evidence ? parseHex(evidence.backgroundHex) : null;
  const current = evidence ? parseHex(evidence.foregroundHex) : null;
  const optionA = evidence && background && current ? keepHue(current, background, evidence.requiredRatio) : null;

  const { options, applied, preview, clearPreview, apply, abandon } = useAdjustMessages(issue.id);
  const [view, setView] = useState<"tiles" | "wheel">(aiAssistanceLevel === 2 ? "wheel" : "tiles");
  const [focused, setFocused] = useState<FocusedOption>(null);
  const [activeColor, setActiveColor] = useState<RGBColor | null>(null);
  const [wheelColor, setWheelColor] = useState<RGBColor | null>(null);
  const [wheelOpened, setWheelOpened] = useState(false);
  const [hexRejected, setHexRejected] = useState(false);
  const thirdTileRef = useRef<HTMLButtonElement>(null);
  const autoFocusedRef = useRef(false);

  useEffect(() => {
    if (applied) {
      onClose();
    }
  }, [applied, onClose]);

  // Safety net if this popup disappears without an explicit Apply, for example the
  // issue resolving out from under it; a no-op when nothing is active.
  useEffect(() => clearPreview, [clearPreview]);

  useEffect(() => {
    // Level 4 pre-focuses and previews the first suggestion once. A ref guards this,
    // not focused===null: Escape sets focused back to null, and re-triggering from
    // that would silently undo it. See spec section 2.
    if (aiAssistanceLevel === 4 && optionA && !autoFocusedRef.current) {
      autoFocusedRef.current = true;
      focusOption("a", optionA);
    }
  }, [aiAssistanceLevel, optionA]);

  if (!evidence || !background || !current || !optionA) {
    return null;
  }

  const optionB = options ? paletteMatch(current, options.palette, background, evidence.requiredRatio) : null;

  function openWheel() {
    setWheelOpened(true);
    setView("wheel");
  }

  function focusOption(option: FocusedOption, color: RGBColor) {
    setFocused(option);
    setActiveColor(color);
    preview(color);
  }

  function selectWheelColor(color: RGBColor | null) {
    setWheelColor(color);
    setFocused(color ? "c" : focused);
    setActiveColor(color);
    if (color) {
      preview(color);
    }
  }

  function handleCancel() {
    clearPreview();
    abandon(wheelOpened, hexRejected);
    onClose();
  }

  function handleApply() {
    if (activeColor && focused) {
      apply(activeColor, focused, wheelOpened, hexRejected);
    }
  }

  function backToTiles() {
    setView("tiles");
    thirdTileRef.current?.focus();
  }

  /** Clears the preview; also returns to tiles if the wheel is open */
  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key !== "Escape") return;
    clearPreview();
    setFocused(null);
    setActiveColor(null);
    if (view === "wheel") {
      backToTiles();
    }
  }

  return (
    <div className={styles.popup} onKeyDown={handleKeyDown}>
      {options?.binding && <BindingNotice binding={options.binding} />}

      {view === "tiles" ? (
        <div className={styles.tiles}>
          <TilesView
            sampleText={issue.nodeName}
            background={background}
            requiredRatio={evidence.requiredRatio}
            optionA={optionA}
            optionB={optionB}
            wheelColor={wheelColor}
            focused={focused}
            onFocusOption={focusOption}
            onOpenWheel={openWheel}
            thirdTileRef={thirdTileRef}
          />
        </div>
      ) : (
        <WheelView
          background={background}
          requiredRatio={evidence.requiredRatio}
          initialColor={wheelColor ?? current}
          onColorChange={selectWheelColor}
          onHexRejected={() => setHexRejected(true)}
          onBack={backToTiles}
        />
      )}

      <AdjustActions canApply={Boolean(activeColor)} onCancel={handleCancel} onApply={handleApply} />
    </div>
  );
}
