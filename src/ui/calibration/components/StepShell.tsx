import type { ReactNode } from "react";

import { useStepFocus } from "../hooks/useStepFocus";
import type { NavigationDirection } from "../types";
import { ProgressRule } from "./ProgressRule";
import styles from "./StepShell.module.css";

interface StepShellProps {
  children: ReactNode;
  heading: string;
  step?: number;
  totalSteps: number;
  progressValue?: number;
  direction?: NavigationDirection;
  initialOpen?: boolean;
}

export function StepShell({
  children,
  heading,
  step,
  totalSteps,
  progressValue = step ?? 0,
  direction = "forward",
  initialOpen = false
}: StepShellProps) {
  const counter = step === undefined ? undefined : `Step ${step} of ${totalSteps}`;
  const headingRef = useStepFocus(`${heading}-${step ?? "non-question"}`);

  return (
    <main
      className={`${styles.shell} ${
        direction === "backward" ? styles.backward : styles.forward
      } ${initialOpen ? styles.initialOpen : ""}`}
    >
      <ProgressRule value={progressValue} max={totalSteps} />
      <div className={styles.content}>
        <h1 className={styles.heading} ref={headingRef} tabIndex={-1}>
          {counter && <span className={styles.visuallyHidden}>{counter}. </span>}
          {heading}
        </h1>
        {children}
      </div>
    </main>
  );
}
