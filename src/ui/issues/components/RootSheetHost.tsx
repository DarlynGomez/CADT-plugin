import type { Root } from "../../../shared/grouping/groupingTypes";
import type { IssueSummary } from "../../../shared/issues/issueTypes";
import type { SheetTarget } from "../hooks/useRootSheet";
import { AdjustPopup } from "../adjust/AdjustPopup";
import { IgnoreSheet } from "./IgnoreSheet";
import { SheetOverlay } from "./SheetOverlay";

interface RootSheetHostProps {
  sheet: SheetTarget | null;
  /** Every non-decided root, unfiltered by the active state filter: a sheet opened
   *  under one filter must not go missing if the designer switches filters while it
   *  is still open. */
  roots: readonly Root[];
  issuesById: ReadonlyMap<string, IssueSummary>;
  aiAssistanceLevel: number | null;
  onCloseAdjust: () => void;
  onCancelIgnore: () => void;
  onRecordIgnore: (root: Root, reason: string) => void;
}

/**
 * ADR-027: renders whichever sheet is open as one panel-covering overlay, found by
 * signature rather than nested inside the card that opened it, since a card only lives
 * in the scrolling list while the sheet must cover the whole panel.
 */
export function RootSheetHost({
  sheet,
  roots,
  issuesById,
  aiAssistanceLevel,
  onCloseAdjust,
  onCancelIgnore,
  onRecordIgnore
}: RootSheetHostProps) {
  if (!sheet) {
    return null;
  }
  const root = roots.find((candidate) => candidate.signature === sheet.signature);
  if (!root) {
    return null;
  }

  if (sheet.kind === "adjust") {
    const representativeIssue = issuesById.get(root.representativeIssueId);
    if (!representativeIssue) {
      return null;
    }
    return (
      <SheetOverlay>
        <AdjustPopup
          issue={representativeIssue}
          aiAssistanceLevel={aiAssistanceLevel ?? 1}
          onClose={onCloseAdjust}
        />
      </SheetOverlay>
    );
  }

  return (
    <SheetOverlay>
      <IgnoreSheet
        instanceCount={root.instances.length}
        onRecord={(reason) => onRecordIgnore(root, reason)}
        onCancel={onCancelIgnore}
      />
    </SheetOverlay>
  );
}
