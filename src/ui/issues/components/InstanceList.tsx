import { Eye } from "lucide-react";

import type { GroupableFinding } from "../../../shared/grouping/groupingTypes";
import { InstanceRow } from "./InstanceRow";
import styles from "./InstanceList.module.css";

interface InstanceListProps {
  instances: readonly GroupableFinding[];
  representativeIssueId: string;
  selectedIds: ReadonlySet<string>;
  onToggleSelected: (issueId: string) => void;
  onSelectAll: () => void;
  onShowOnCanvas: () => void;
  onLocate: (issueId: string) => void;
}

/** The representative, section 3.5, first; the rest keep their existing relative order */
function representativeFirst(
  instances: readonly GroupableFinding[],
  representativeIssueId: string
): GroupableFinding[] {
  const representative = instances.find((i) => i.issueId === representativeIssueId);
  if (!representative) {
    return [...instances];
  }
  return [representative, ...instances.filter((i) => i.issueId !== representativeIssueId)];
}

/**
 * GROUPING_SPEC.md 6.4: nothing pre-selected, real controls, and a fixed-height,
 * internally scrolling container so a long list never stalls the panel. Scrolling over
 * paging, matching the mockup: every row is still a real, focusable element in the DOM
 * the whole time it exists, without the extra Previous/Next controls a pager needs.
 * The representative sorts first and reads "(Current)": it is the instance a
 * single-instance Adjust targets, section 8.
 */
export function InstanceList({
  instances,
  representativeIssueId,
  selectedIds,
  onToggleSelected,
  onSelectAll,
  onShowOnCanvas,
  onLocate
}: InstanceListProps) {
  const ordered = representativeFirst(instances, representativeIssueId);
  const allSelected = selectedIds.size === instances.length && instances.length > 0;

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <span className={styles.count}>
          {selectedIds.size} of {instances.length} selected for Adjust
        </span>
        <div className={styles.toolbarActions}>
          <button type="button" className={styles.toolbarButton} onClick={onShowOnCanvas}>
            <Eye size={12} aria-hidden="true" />
            <span>
              Focus {instances.length} {instances.length === 1 ? "layer" : "layers"}
            </span>
          </button>
          <button type="button" className={styles.toolbarButton} onClick={onSelectAll}>
            {allSelected ? "Deselect all" : "Select all"}
          </button>
        </div>
      </div>

      <ul className={styles.list}>
        {ordered.map((instance) => (
          <InstanceRow
            key={instance.issueId}
            instance={instance}
            isCurrent={instance.issueId === representativeIssueId}
            selected={selectedIds.has(instance.issueId)}
            onToggleSelected={() => onToggleSelected(instance.issueId)}
            onLocate={() => onLocate(instance.issueId)}
          />
        ))}
      </ul>
    </div>
  );
}
