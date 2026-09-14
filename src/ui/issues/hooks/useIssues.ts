import { useCallback, useEffect, useState } from "react";

import { isIssue } from "../../../shared/issues/issueSchema";
import type { IssueSummary } from "../../../shared/issues/issueTypes";
import type { IssuesPluginMessage, UiToPluginMessage } from "../../../shared/messageTypes";

function isIssueSummary(value: unknown): boolean {
  if (!isIssue(value)) {
    return false;
  }
  return typeof (value as unknown as Record<string, unknown>).nodeName === "string";
}

function isIssuesMessage(value: unknown): value is IssuesPluginMessage {
  if (!value || typeof value !== "object") {
    return false;
  }
  const message = value as Record<string, unknown>;
  if (message.type === "ISSUES_UPDATED") {
    return Array.isArray(message.issues) && message.issues.every(isIssueSummary);
  }
  return (
    message.type === "ISSUE_ACTION_FAILED" &&
    typeof message.issueId === "string" &&
    typeof message.message === "string"
  );
}

function sendMessage(message: UiToPluginMessage) {
  window.parent.postMessage({ pluginMessage: message }, "*");
}

export interface ActionError {
  issueId: string;
  message: string;
}

/** Subscribes to the sandbox's issue list and exposes the six designer actions */
export function useIssues() {
  const [issues, setIssues] = useState<readonly IssueSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<ActionError | null>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const message = event.data?.pluginMessage;
      if (!isIssuesMessage(message)) {
        return;
      }
      if (message.type === "ISSUES_UPDATED") {
        setIssues(message.issues);
        setActionError(null);
        setLoading(false);
      } else {
        setActionError({ issueId: message.issueId, message: message.message });
      }
    }

    window.addEventListener("message", handleMessage);
    sendMessage({ type: "ISSUES_SUBSCRIBE" });
    // A silent sandbox must not leave the panel loading forever.
    const timeout = window.setTimeout(() => setLoading(false), 3000);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const deferIssue = useCallback((issueId: string) => {
    sendMessage({ type: "ISSUE_DEFER", issueId });
  }, []);

  const flagImportant = useCallback((issueId: string) => {
    sendMessage({ type: "ISSUE_FLAG_IMPORTANT", issueId });
  }, []);

  const reopenIssue = useCallback((issueId: string) => {
    sendMessage({ type: "ISSUE_REOPEN", issueId });
  }, []);

  const acknowledgeIssue = useCallback((issueId: string, reason: string) => {
    sendMessage({ type: "ISSUE_ACKNOWLEDGE", issueId, reason });
  }, []);

  const focusIssue = useCallback((issueId: string) => {
    sendMessage({ type: "ISSUE_FOCUS", issueId });
  }, []);

  return {
    issues,
    loading,
    actionError,
    deferIssue,
    flagImportant,
    reopenIssue,
    acknowledgeIssue,
    focusIssue
  };
}
