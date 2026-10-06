import styles from "./TeachMeWhyPlaceholder.module.css";

/**
 * The tab slot is reserved but the content is not built yet
 * Kept plain and short on purpose
 */
export function TeachMeWhyPlaceholder() {
  return (
    <div className={styles.placeholder}>
      <p className={styles.text}>Teach Me Why is coming soon.</p>
    </div>
  );
}
