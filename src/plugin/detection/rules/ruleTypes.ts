import type { Finding, NodeSnapshot } from "../../../shared/issues/issueTypes";

/**
 * A rule takes a plain snapshot and returns a finding or nothing
 * Adding one is a new module here plus a line in the registry
 */
export interface Rule {
  readonly id: string;
  evaluate(snapshot: NodeSnapshot): Finding | null;
}
