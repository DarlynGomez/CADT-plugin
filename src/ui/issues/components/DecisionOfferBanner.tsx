import styles from "./DecisionOfferBanner.module.css";

interface DecisionOfferBannerProps {
  reason: string;
  onApply: () => void;
}

/**
 * GROUPING_SPEC.md 3.4: "Matches your earlier decision: [reason]. Apply the same
 * reason?" Never applied automatically, one confirmation away. Only ever shown on an
 * open root, the caller's job to decide, this component just renders the offer.
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
