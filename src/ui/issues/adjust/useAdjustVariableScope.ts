import { useCallback, useEffect, useState } from "react";

import type {
  AdjustOptionChoice,
  AdjustReplyMessage,
  AdjustVariableScope
} from "../../../shared/adjustMessageTypes";
import type { RGBColor } from "../../../shared/issues/issueTypes";
import type { UiToPluginMessage } from "../../../shared/messageTypes";

function sendMessage(message: UiToPluginMessage) {
  window.parent.postMessage({ pluginMessage: message }, "*");
}

function isAdjustReply(value: unknown): value is AdjustReplyMessage {
  if (!value || typeof value !== "object") {
    return false;
  }
  const type = (value as Record<string, unknown>).type;
  return typeof type === "string" && type.startsWith("ADJUST_");
}

export interface VariableConsequenceData {
  totalConsumers: number;
  newlyFailingCount: number;
  newlyFailingNames: readonly string[];
}

/**
 * GROUPING_SPEC.md section 9: the variable scope's static facts, arriving on the same
 * ADJUST_OPTIONS_READY reply useAdjustMessages.ts already requests, and the live,
 * per-colour consequence, requested separately since it depends on the candidate
 * colour rather than the node alone. A sibling of useAdjustMessages.ts, not a part of
 * it, so neither file needs to grow past 150 lines.
 */
export function useAdjustVariableScope(issueId: string) {
  const [variableScope, setVariableScope] = useState<AdjustVariableScope | null>(null);
  const [variableConsequence, setVariableConsequence] = useState<VariableConsequenceData | null>(
    null
  );

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const message = event.data?.pluginMessage;
      if (!isAdjustReply(message)) {
        return;
      }
      if (message.type === "ADJUST_OPTIONS_READY" && message.issueId === issueId) {
        setVariableScope(message.variableScope);
      } else if (
        message.type === "ADJUST_VARIABLE_CONSEQUENCE_READY" &&
        message.issueId === issueId
      ) {
        setVariableConsequence({
          totalConsumers: message.totalConsumers,
          newlyFailingCount: message.newlyFailingCount,
          newlyFailingNames: message.newlyFailingNames
        });
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [issueId]);

  const requestVariableConsequence = useCallback(
    (variableId: string, color: RGBColor) => {
      setVariableConsequence(null);
      sendMessage({ type: "ADJUST_VARIABLE_CONSEQUENCE_REQUEST", issueId, variableId, color });
    },
    [issueId]
  );

  const applyVariable = useCallback(
    (
      variableId: string,
      color: RGBColor,
      optionChosen: AdjustOptionChoice,
      wheelOpened: boolean,
      hexRejected: boolean
    ) => {
      sendMessage({
        type: "ADJUST_APPLY_VARIABLE",
        issueId,
        variableId,
        color,
        optionChosen,
        wheelOpened,
        hexRejected
      });
    },
    [issueId]
  );

  return { variableScope, variableConsequence, requestVariableConsequence, applyVariable };
}
