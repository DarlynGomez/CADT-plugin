import type { AdjustFillBinding } from "../../../../shared/adjustMessageTypes";
import styles from "./ScopeSection.module.css";

interface ScopeSectionProps {
  /** How many instances this apply would actually write. Selected, or just the representative. */
  scopeCount: number;
  totalInstances: number;
  binding: AdjustFillBinding | null;
}

/**
 * GROUPING_SPEC.md section 8: states the apply scope plainly, one line, so a group
 * change is never a silent default. "Update the variable" is section 9, a different
 * and larger act deferred to a later slice; shown here, disabled, so the designer
 * knows it exists rather than wondering why it is missing.
 */
export function ScopeSection({ scopeCount, totalInstances, binding }: ScopeSectionProps) {
  const layerWord = scopeCount === 1 ? "layer" : "layers";
  const remaining = totalInstances - scopeCount;

  return (
    <div className={styles.section}>
      <p className={styles.heading}>2. Choose adjustment scope</p>
      <div className={styles.option}>
        <span className={styles.radio} data-checked="true" aria-hidden="true" />
        <div className={styles.optionBody}>
          <span className={styles.optionLabel}>Only these layers</span>
          <span className={styles.optionDetail}>
            Changes {scopeCount} {layerWord}.
            {remaining > 0 && ` ${remaining} more in this group left unchanged.`}
          </span>
        </div>
      </div>
      {binding && (
        <div className={styles.option} data-disabled="true">
          <span className={styles.radio} aria-hidden="true" />
          <div className={styles.optionBody}>
            <span className={styles.optionLabel}>Update {binding.name} itself</span>
            <span className={styles.optionDetail}>
              Not available yet. Edit this variable in its own definition for now.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
