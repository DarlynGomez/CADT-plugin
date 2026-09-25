import { useCallback, useState } from "react";

import type { Root } from "../../../shared/grouping/groupingTypes";

function instanceIds(root: Root): string[] {
  return root.instances.map((instance) => instance.issueId);
}

/** GROUPING_SPEC.md 6.4: per-root Adjust selection, keyed by signature, nothing pre-selected */
export function useInstanceSelection() {
  const [selectedInstances, setSelectedInstances] = useState<
    Readonly<Record<string, ReadonlySet<string>>>
  >({});

  const toggleInstanceSelected = useCallback((signature: string, issueId: string) => {
    setSelectedInstances((prev) => {
      const current = new Set(prev[signature] ?? []);
      if (current.has(issueId)) {
        current.delete(issueId);
      } else {
        current.add(issueId);
      }
      return { ...prev, [signature]: current };
    });
  }, []);

  const selectAllInstances = useCallback((root: Root) => {
    setSelectedInstances((prev) => {
      const current = prev[root.signature] ?? new Set<string>();
      const allSelected = current.size === root.instances.length && root.instances.length > 0;
      return {
        ...prev,
        [root.signature]: allSelected ? new Set<string>() : new Set(instanceIds(root))
      };
    });
  }, []);

  return { selectedInstances, toggleInstanceSelected, selectAllInstances };
}
