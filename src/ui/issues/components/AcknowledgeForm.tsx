import { useId, useState } from "react";

import styles from "./AcknowledgeForm.module.css";

interface AcknowledgeFormProps {
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}

/** Requires a reason before it can be submitted; the state machine enforces this too */
export function AcknowledgeForm({ onSubmit, onCancel }: AcknowledgeFormProps) {
  const [reason, setReason] = useState("");
  const fieldId = useId();
  const trimmed = reason.trim();

  return (
    <form
      className={styles.acknowledgeForm}
      onSubmit={(event) => {
        event.preventDefault();
        if (trimmed.length > 0) {
          onSubmit(trimmed);
        }
      }}
    >
      <label className={styles.acknowledgeLabel} htmlFor={fieldId}>
        Reason for this decision
      </label>
      <textarea
        id={fieldId}
        className={styles.acknowledgeField}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        required
      />
      <div className={styles.acknowledgeActions}>
        <button
          className={`${styles.actionButton} ${styles.secondaryButton}`}
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button className={styles.actionButton} type="submit" disabled={trimmed.length === 0}>
          Acknowledge
        </button>
      </div>
    </form>
  );
}
