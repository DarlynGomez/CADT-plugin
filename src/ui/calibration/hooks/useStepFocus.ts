import { useEffect, useRef } from "react";

/** Move focus to the current step heading after the rendered step changes */
export function useStepFocus(stepKey: string) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [stepKey]);

  return headingRef;
}
