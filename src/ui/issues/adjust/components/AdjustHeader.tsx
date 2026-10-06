import { X } from "lucide-react";

import styles from "../AdjustPopup.module.css";

interface AdjustHeaderProps {
  title: string;
  onClose: () => void;
}

/** Title row with one headline for the finding and a close button */
export function AdjustHeader({ title, onClose }: AdjustHeaderProps) {
  return (
    <div className={styles.header}>
      <h2 className={styles.title}>{title}</h2>
      <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
