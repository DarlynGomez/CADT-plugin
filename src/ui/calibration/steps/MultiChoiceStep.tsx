import type { CSSProperties } from "react";

import type { MultiQuestion, NavigationDirection } from "../types";

import styles from "../components/StepShell.module.css";
import { NavigationBar } from "../components/NavigationBar";
import { StepShell } from "../components/StepShell";

interface MultiChoiceStepProps {
  question: MultiQuestion;
  step: number;
  totalSteps: number;
  value?: readonly string[];
  onBack: () => void;
  onChange: (value: readonly string[]) => void;
  onContinue: () => void;
  direction: NavigationDirection;
}

export function MultiChoiceStep({
  question,
  step,
  totalSteps,
  value = [],
  onBack,
  onChange,
  onContinue,
  direction
}: MultiChoiceStepProps) {
  function toggleOption(optionValue: string) {
    const nextValue = value.includes(optionValue)
      ? value.filter((selectedValue) => selectedValue !== optionValue)
      : [...value, optionValue];
    onChange(nextValue);
  }

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
                type="checkbox"
                name={question.id}
                value={option.value}
                checked={value.includes(option.value)}
                onChange={() => toggleOption(option.value)}
              />
              <span>{option.label}</span>
              {value.includes(option.value) && (
                <span className={styles.checkGlyph} aria-hidden="true">
                  ✓
                </span>
              )}
            </label>
          );
        })}
      </fieldset>
      <NavigationBar onBack={onBack} onContinue={onContinue} />
    </StepShell>
  );
}
