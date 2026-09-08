import styles from "../components/StepShell.module.css";
import { StepShell } from "../components/StepShell";

interface WelcomeStepProps {
  totalSteps: number;
  direction: "forward" | "backward";
  initialOpen: boolean;
  onSkip: () => void;
  onStart: () => void;
}

export function WelcomeStep({
  totalSteps,
  direction,
  initialOpen,
  onSkip,
  onStart
}: WelcomeStepProps) {
  return (
    <StepShell
      heading="Let's set up how CADT works for you."
      totalSteps={totalSteps}
      direction={direction}
      initialOpen={initialOpen}
    >
      <p className={styles.body}>
        A few questions about what you are designing. This shapes which checks run and how much
        explanation you see. You can change any of it later in settings.
      </p>
      <div className={styles.actions}>
        <button
          className={`${styles.button} ${styles.secondaryButton}`}
          type="button"
          onClick={onSkip}
        >
          Skip for now, use defaults
        </button>
        <button className={styles.button} type="button" onClick={onStart}>
          Start
        </button>
      </div>
    </StepShell>
  );
}
