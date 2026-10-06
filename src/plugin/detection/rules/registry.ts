import { contrastRule } from "./contrast/contrastRule";
import type { Rule } from "./ruleTypes";

/** Every registered rule, adding one means editing this list */
export const RULES: readonly Rule[] = [contrastRule];
