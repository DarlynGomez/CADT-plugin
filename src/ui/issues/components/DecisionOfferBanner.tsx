import styles from "./DecisionOfferBanner.module.css";

interface DecisionOfferBannerProps {
  reason: string;
  onApply: () => void;
}

/**
 * Offers the earlier reason, one confirmation to apply and never automatic
 * The caller decides when to show it, only for open roots
 */
export function DecisionOfferBanner({ reason, onApply }: DecisionOfferBannerProps) {
  return (
    <div className={styles.banner} role="status">
      <p className={styles.text}>
        Matches your earlier decision: <span className={styles.reason}>{reason}</span>
      </p>
      <button type="button" className={styles.applyButton} onClick={onApply}>
        Apply the same reason
      </button>
    </div>
  );
}
