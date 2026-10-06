import { useEffect } from "react";

import type { SheetTarget } from "./useRootSheet";

/**
 * Escape restores the selection only when no sheet is open
 * The ignore sheet and the adjust popup handle their own Escape so the innermost wins
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
