import type { NavigationDirection, ScaleQuestion } from "../types";

import styles from "../components/StepShell.module.css";
import { NavigationBar } from "../components/NavigationBar";
import { StepShell } from "../components/StepShell";

interface ScaleStepProps {
  question: ScaleQuestion;
  step: number;
  totalSteps: number;
  value?: number;
  onBack: () => void;
  onChange: (value: number) => void;
  onContinue: () => void;
  direction: NavigationDirection;
}

export function ScaleStep({
  question,
  step,
  totalSteps,
  value = question.defaultValue,
  onBack,
  onChange,
  onContinue,
  direction
}: ScaleStepProps) {
  const selectedOption = question.options[value - 1];

  return (
    <StepShell heading={question.prompt} step={step} totalSteps={totalSteps} direction={direction}>
      {question.helperText && <p className={styles.body}>{question.helperText}</p>}
      <label className={styles.scale}>
        <span>{selectedOption?.label}</span>
        <input
          aria-label={question.prompt}
          aria-valuetext={selectedOption?.label}
          type="range"
          min={1}
          max={question.options.length}
          step={1}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </label>
      <NavigationBar onBack={onBack} onContinue={onContinue} />
    </StepShell>
  );
}
