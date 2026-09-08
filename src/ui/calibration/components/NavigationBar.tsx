import styles from "./StepShell.module.css";

interface NavigationBarProps {
  backLabel?: string;
  continueLabel?: string;
  onBack: () => void;
  onContinue: () => void;
  continueDisabled?: boolean;
}

export function NavigationBar({
  backLabel = "Back",
  continueLabel = "Continue",
  onBack,
  onContinue,
  continueDisabled = false
}: NavigationBarProps) {
  return (
    <nav className={styles.actions} aria-label="Step navigation">
      <button
        className={`${styles.button} ${styles.secondaryButton}`}
        type="button"
        onClick={onBack}
      >
        {backLabel}
      </button>
      <button
        className={styles.button}
        type="button"
        onClick={onContinue}
        disabled={continueDisabled}
      >
        {continueLabel}
      </button>
    </nav>
  );
}
