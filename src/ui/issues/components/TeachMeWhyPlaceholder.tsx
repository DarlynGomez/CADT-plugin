import styles from "./TeachMeWhyPlaceholder.module.css";

/**
 * GROUPING_SPEC.md 6.1: the tab's slot is reserved, but the curriculum itself is not
 * built in this slice, per CLAUDE.md's scope list. Plain and short on purpose: this is
 * not the place to describe a feature that does not exist yet.
 */
export function TeachMeWhyPlaceholder() {
  return (
    <div className={styles.placeholder}>
      <p className={styles.text}>Teach Me Why is coming soon.</p>
    </div>
  );
}
