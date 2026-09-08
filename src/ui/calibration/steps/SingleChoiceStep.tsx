import type { CSSProperties } from "react";

import type { NavigationDirection, SingleQuestion } from "../types";

import styles from "../components/StepShell.module.css";
import { NavigationBar } from "../components/NavigationBar";
import { StepShell } from "../components/StepShell";

interface SingleChoiceStepProps {
  question: SingleQuestion;
  step: number;
  totalSteps: number;
  value?: string;
  onBack: () => void;
  onChange: (value: string) => void;
  onContinue: () => void;
  direction: NavigationDirection;
}

export function SingleChoiceStep({
  question,
  step,
  totalSteps,
  value,
  onBack,
  onChange,
  onContinue,
  direction
}: SingleChoiceStepProps) {
  return (
    <StepShell heading={question.prompt} step={step} totalSteps={totalSteps} direction={direction}>
      <fieldset className={styles.choiceGroup}>
        <legend className={styles.visuallyHidden}>{question.prompt}</legend>
        {question.options.map((option, optionIndex) => {
          // CSS custom properties carry the token-based stagger delay into the motion layer
          const choiceStyle = {
            "--stagger-delay": `calc(${optionIndex} * var(--stagger-step))`
          } as CSSProperties;

          return (
            <label className={styles.choice} key={option.value} style={choiceStyle}>
              <input
                type="radio"
                name={question.id}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
              />
              <span>{option.label}</span>
              {value === option.value && (
                <span className={styles.checkGlyph} aria-hidden="true">
                  ✓
                </span>
              )}
            </label>
          );
        })}
      </fieldset>
      <NavigationBar onBack={onBack} onContinue={onContinue} continueDisabled={!value} />
    </StepShell>
  );
}
