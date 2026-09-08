import { useState } from "react";

import { consentScreen } from "../data/questions";
import styles from "../components/StepShell.module.css";
import { StepShell } from "../components/StepShell";

interface ConsentStepProps {
  totalSteps: number;
  direction: "forward" | "backward";
  onBack: () => void;
  onConsent: (value: boolean) => void;
}

export function ConsentStep({ totalSteps, direction, onBack, onConsent }: ConsentStepProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <StepShell heading={consentScreen.heading} totalSteps={totalSteps} direction={direction}>
      <p className={styles.body}>{consentScreen.body}</p>
      <button
        className={`${styles.button} ${styles.secondaryButton}`}
        type="button"
        onClick={() => setDetailsOpen((isOpen) => !isOpen)}
        aria-expanded={detailsOpen}
      >
        {consentScreen.detailsLabel}
      </button>
      {detailsOpen && <p className={styles.body}>{consentScreen.details}</p>}
      <div className={styles.actions}>
        <button
          className={`${styles.button} ${styles.secondaryButton}`}
          type="button"
          onClick={onBack}
        >
          Back
        </button>
        <div className={styles.actions}>
          <button className={styles.button} type="button" onClick={() => onConsent(true)}>
            {consentScreen.allowLabel}
          </button>
          <button className={styles.button} type="button" onClick={() => onConsent(false)}>
            {consentScreen.declineLabel}
          </button>
        </div>
      </div>
    </StepShell>
  );
}
