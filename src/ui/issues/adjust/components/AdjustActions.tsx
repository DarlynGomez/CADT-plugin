import styles from "../AdjustPopup.module.css";

interface AdjustActionsProps {
  canApply: boolean;
  onCancel: () => void;
  onApply: () => void;
}

/** Cancel restores and abandons; Apply commits whatever is currently previewed */
export function AdjustActions({ canApply, onCancel, onApply }: AdjustActionsProps) {
  return (
    <div className={styles.actions}>
      <button type="button" className={styles.cancel} onClick={onCancel}>
        Cancel
      </button>
      <button type="button" className={styles.apply} onClick={onApply} disabled={!canApply}>
        Apply
      </button>
    </div>
  );
}
