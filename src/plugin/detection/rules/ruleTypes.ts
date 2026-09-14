import type { Finding, NodeSnapshot } from "../../../shared/issues/issueTypes";

/**
 * A detection rule: a plain snapshot in, a finding or nothing out. Never touches a
 * Figma type, never reads a Figma node. Adding a rule is a new module here plus one
 * line in registry.ts, nothing else.
 */
export interface Rule {
  readonly id: string;
  evaluate(snapshot: NodeSnapshot): Finding | null;
}
