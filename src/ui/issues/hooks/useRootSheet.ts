import { useCallback, useState } from "react";

export type RootSheetKind = "adjust" | "ignore";

export interface SheetTarget {
  signature: string;
  kind: RootSheetKind;
}

/** Which root, if any, has an open Adjust or Ignore sheet. At most one at a time. */
export function useRootSheet() {
  const [sheet, setSheet] = useState<SheetTarget | null>(null);

  const openAdjust = useCallback((signature: string) => {
    setSheet({ signature, kind: "adjust" });
  }, []);

  const openIgnore = useCallback((signature: string) => {
    setSheet({ signature, kind: "ignore" });
  }, []);

  const closeSheet = useCallback(() => setSheet(null), []);

  return { sheet, openAdjust, openIgnore, closeSheet };
}
