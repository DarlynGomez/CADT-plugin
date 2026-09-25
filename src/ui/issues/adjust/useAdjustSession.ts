import { useEffect, useRef, useState } from "react";

import type { AdjustOptionChoice } from "../../../shared/adjustMessageTypes";
import type { RGBColor } from "../../../shared/issues/issueTypes";
import type { FocusedOption } from "./components/OptionsList";

interface UseAdjustSessionArgs {
  aiAssistanceLevel: number;
  optionA: RGBColor | null;
  scopeIds: readonly string[];
  applied: boolean;
  preview: (color: RGBColor, issueIds: readonly string[]) => void;
  clearPreview: () => void;
  apply: (
    color: RGBColor,
    issueIds: readonly string[],
    optionChosen: AdjustOptionChoice,
    wheelOpened: boolean,
    hexRejected: boolean
  ) => void;
  abandon: (issueIds: readonly string[], wheelOpened: boolean, hexRejected: boolean) => void;
  onClose: () => void;
}

/**
 * Owns the popup's focus, preview, and apply session state: which option is focused,
 * the colour that follows from it, the wheel's own chosen colour, and the two session
 * flags the log entry needs. Split out of AdjustPopup.tsx to keep it under 150 lines.
 */
export function useAdjustSession({
  aiAssistanceLevel,
  optionA,
  scopeIds,
  applied,
  preview,
  clearPreview,
  apply,
  abandon,
  onClose
}: UseAdjustSessionArgs) {
  const [focused, setFocused] = useState<FocusedOption>(null);
  const [activeColor, setActiveColor] = useState<RGBColor | null>(null);
  const [wheelColor, setWheelColor] = useState<RGBColor | null>(null);
  const [wheelOpened, setWheelOpened] = useState(aiAssistanceLevel === 2);
  const [hexRejected, setHexRejected] = useState(false);
  const autoFocusedRef = useRef(false);

  useEffect(() => {
    if (applied) {
      onClose();
    }
  }, [applied, onClose]);

  // Safety net if this popup disappears without an explicit Apply, for example the
  // issue resolving out from under it; a no-op when nothing is active.
  useEffect(() => clearPreview, [clearPreview]);

  function focusOption(option: FocusedOption, color: RGBColor) {
    setFocused(option);
    setActiveColor(color);
    preview(color, scopeIds);
  }

  useEffect(() => {
    // Level 4 pre-focuses and previews the first suggestion once. A ref guards this,
    // not focused===null: Escape sets focused back to null, and re-triggering from
    // that would silently undo it. See ADJUST_SPEC.md section 2.
    if (aiAssistanceLevel === 4 && optionA && !autoFocusedRef.current) {
      autoFocusedRef.current = true;
      focusOption("a", optionA);
    }
  }, [aiAssistanceLevel, optionA]);

  function openWheel() {
    setWheelOpened(true);
    if (wheelColor) {
      focusOption("c", wheelColor);
    } else {
      setFocused("c");
    }
  }

  function selectWheelColor(color: RGBColor | null) {
    setWheelColor(color);
    if (color) {
      focusOption("c", color);
    } else {
      setActiveColor(null);
    }
  }

  function handleCancel() {
    clearPreview();
    abandon(scopeIds, wheelOpened, hexRejected);
    onClose();
  }

  function handleApply() {
    if (activeColor && focused) {
      apply(activeColor, scopeIds, focused, wheelOpened, hexRejected);
    }
  }

  /** Clears the preview and collapses any inline expansion, such as the wheel */
  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key !== "Escape") return;
    clearPreview();
    setFocused(null);
    setActiveColor(null);
  }

  return {
    focused,
    activeColor,
    wheelColor,
    openWheel,
    focusOption,
    selectWheelColor,
    handleCancel,
    handleApply,
    handleKeyDown,
    onHexRejected: () => setHexRejected(true)
  };
}
