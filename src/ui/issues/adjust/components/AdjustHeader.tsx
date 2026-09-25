import { X } from "lucide-react";

import styles from "../AdjustPopup.module.css";

interface AdjustHeaderProps {
  title: string;
  subtitle: string;
  onClose: () => void;
}

/** The sheet's title row: a heading, the finding's node name, and a real close control */
export function AdjustHeader({ title, subtitle, onClose }: AdjustHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.headerText}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
      <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
