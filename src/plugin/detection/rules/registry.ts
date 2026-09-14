import { contrastRule } from "./contrast/contrastRule";
import type { Rule } from "./ruleTypes";

/** Every registered detection rule. Adding a rule is an edit to this list alone. */
export const RULES: readonly Rule[] = [contrastRule];
