import type { AdjustFillBinding } from "../../../../shared/adjustMessageTypes";
import styles from "../AdjustPopup.module.css";

interface BindingNoticeProps {
  binding: AdjustFillBinding;
}

/** Disclosure, not a veto: names the binding and its page-scoped usage, per section 6 */
export function BindingNotice({ binding }: BindingNoticeProps) {
  return (
    <p className={styles.binding}>
      Bound to {binding.name}, used in {binding.usageCount} other place{binding.usageCount === 1 ? "" : "s"}{" "}
      on this page. Changing it here detaches this instance.
    </p>
  );
}
