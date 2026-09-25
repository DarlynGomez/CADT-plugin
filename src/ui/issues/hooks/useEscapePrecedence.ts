import { useEffect } from "react";

import type { SheetTarget } from "./useRootSheet";

/**
 * GROUPING_SPEC.md 5.1: Escape restores the selection, but only when no sheet is open.
 * The ignore sheet closes on its own Escape; the Adjust popup already handles
 * Escape internally, so this listener deliberately does nothing for it. Innermost open
 * surface wins.
 */
export function useEscapePrecedence(
  sheet: SheetTarget | null,
  closeSheet: () => void,
  showingCount: number | null,
  restoreShownSelection: () => void
) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }
      if (sheet?.kind === "ignore") {
        closeSheet();
        return;
      }
      if (sheet?.kind === "adjust") {
        return;
      }
      if (showingCount !== null) {
        restoreShownSelection();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sheet, closeSheet, showingCount, restoreShownSelection]);
}
