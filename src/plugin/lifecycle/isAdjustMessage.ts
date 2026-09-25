import type { AdjustMessage } from "../../shared/adjustMessageTypes";

/** Validates both the message type and the shape its fields must carry */
export function isAdjustMessage(value: unknown): value is AdjustMessage {
  if (!value || typeof value !== "object") {
    return false;
  }
  const message = value as Record<string, unknown>;
  const hasColor = () =>
    typeof message.color === "object" &&
    message.color !== null &&
    typeof (message.color as Record<string, unknown>).r === "number";
  const hasSessionFlags = () =>
    typeof message.wheelOpened === "boolean" && typeof message.hexRejected === "boolean";
  const hasIssueIds = () =>
    Array.isArray(message.issueIds) &&
    message.issueIds.length > 0 &&
    message.issueIds.every((id) => typeof id === "string");

  switch (message.type) {
    case "ADJUST_CLEAR_PREVIEW":
      return true;
    case "ADJUST_OPTIONS_REQUEST":
      return typeof message.issueId === "string";
    case "ADJUST_PREVIEW":
      return typeof message.issueId === "string" && hasIssueIds() && hasColor();
    case "ADJUST_APPLY":
      return (
        typeof message.issueId === "string" &&
        hasIssueIds() &&
        hasColor() &&
        hasSessionFlags() &&
        (message.optionChosen === "a" ||
          message.optionChosen === "b" ||
          message.optionChosen === "c")
      );
    case "ADJUST_ABANDONED":
      return typeof message.issueId === "string" && hasIssueIds() && hasSessionFlags();
    case "ADJUST_VARIABLE_CONSEQUENCE_REQUEST":
      return (
        typeof message.issueId === "string" &&
        typeof message.variableId === "string" &&
        hasColor()
      );
    case "ADJUST_APPLY_VARIABLE":
      return (
        typeof message.issueId === "string" &&
        typeof message.variableId === "string" &&
        hasColor() &&
        hasSessionFlags() &&
        (message.optionChosen === "a" ||
          message.optionChosen === "b" ||
          message.optionChosen === "c")
      );
    default:
      return false;
  }
}
