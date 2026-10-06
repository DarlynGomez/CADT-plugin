import type { AdjustFillBinding } from "../../../../shared/adjustMessageTypes";
import styles from "../AdjustPopup.module.css";

interface BindingNoticeProps {
  binding: AdjustFillBinding;
}

/** Tells the designer about the binding and its usage, it does not block */
export function BindingNotice({ binding }: BindingNoticeProps) {
  return (
    <p className={styles.binding}>
      Bound to {binding.name}, used in {binding.usageCount} other place{binding.usageCount === 1 ? "" : "s"}{" "}
      on this page. Changing it here detaches this instance.
    </p>
  );
}
