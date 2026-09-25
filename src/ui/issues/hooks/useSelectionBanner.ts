import { useCallback, useState } from "react";

import type { Root } from "../../../shared/grouping/groupingTypes";

/** GROUPING_SPEC.md 5.1: the "Showing on canvas" banner's count and its two actions */
export function useSelectionBanner(
  showOnCanvas: (nodeIds: string[]) => void,
  restoreSelection: () => void
) {
  const [showingCount, setShowingCount] = useState<number | null>(null);

  const show = useCallback(
    (root: Root) => {
      showOnCanvas(root.instances.map((instance) => instance.nodeId));
      setShowingCount(root.instances.length);
    },
    [showOnCanvas]
  );

  const restore = useCallback(() => {
    restoreSelection();
    setShowingCount(null);
  }, [restoreSelection]);

  return { showingCount, show, restore };
}
