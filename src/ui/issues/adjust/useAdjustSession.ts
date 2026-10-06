import { useEffect, useRef, useState } from "react";

import type {
  AdjustOptionChoice,
  AdjustScopeChoice,
  AdjustVariableScope
} from "../../../shared/adjustMessageTypes";
import type { RGBColor } from "../../../shared/issues/issueTypes";
import type { FocusedOption } from "./components/OptionsList";

export type AdjustScope = AdjustScopeChoice;

interface UseAdjustSessionArgs {
  aiAssistanceLevel: number;
  optionA: RGBColor | null;
  scopeIds: readonly string[];
  applied: boolean;
  variableScope: AdjustVariableScope | null;
  preview: (color: RGBColor, issueIds: readonly string[]) => void;
  clearPreview: () => void;
  apply: (
    color: RGBColor,
    issueIds: readonly string[],
    optionChosen: AdjustOptionChoice,
    wheelOpened: boolean,
    hexRejected: boolean
  ) => void;
  abandon: (
    issueIds: readonly string[],
    scope: AdjustScope,
    wheelOpened: boolean,
    hexRejected: boolean
  ) => void;
  requestVariableConsequence: (variableId: string, color: RGBColor) => void;
  applyVariable: (
    variableId: string,
    color: RGBColor,
    optionChosen: AdjustOptionChoice,
    wheelOpened: boolean,
    hexRejected: boolean
  ) => void;
  onClose: () => void;
}

/** Focus, preview, scope and apply state for the popup */
export function useAdjustSession({
  aiAssistanceLevel,
  optionA,
  scopeIds,
  applied,
  variableScope,
  preview,
  clearPreview,
  apply,
  abandon,
  requestVariableConsequence,
  applyVariable,
  onClose
}: UseAdjustSessionArgs) {
  const [focused, setFocused] = useState<FocusedOption>(null);
  const [activeColor, setActiveColor] = useState<RGBColor | null>(null);
  const [wheelColor, setWheelColor] = useState<RGBColor | null>(null);
  const [wheelOpened, setWheelOpened] = useState(aiAssistanceLevel === 2);
  const [hexRejected, setHexRejected] = useState(false);
  const [scope, setScope] = useState<AdjustScope>("instances");
  const autoFocusedRef = useRef(false);

  // Recomputed on every colour change while this scope is selected
  useEffect(() => {
    if (scope === "variable" && activeColor && variableScope && !variableScope.remote) {
      requestVariableConsequence(variableScope.variableId, activeColor);
    }
  }, [scope, activeColor, variableScope, requestVariableConsequence]);

  useEffect(() => {
    if (applied) {
      onClose();
    }
  }, [applied, onClose]);

  // Safety net if the popup goes away without Apply
  // Does nothing when no preview is active
  useEffect(() => clearPreview, [clearPreview]);

  function focusOption(option: FocusedOption, color: RGBColor) {
    setFocused(option);
    setActiveColor(color);
    preview(color, scopeIds);
  }

  useEffect(() => {
    // Level 4 previews the first suggestion once
    // A ref guards it because Escape resets focus and would retrigger it
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
    abandon(scopeIds, scope, wheelOpened, hexRejected);
    onClose();
  }

  function handleApply() {
    if (!activeColor || !focused) {
      return;
    }
    if (scope === "variable" && variableScope && !variableScope.remote) {
      applyVariable(variableScope.variableId, activeColor, focused, wheelOpened, hexRejected);
    } else {
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
    scope,
    setScope,
    openWheel,
    focusOption,
    selectWheelColor,
    handleCancel,
    handleApply,
    handleKeyDown,
    onHexRejected: () => setHexRejected(true)
  };
}
