/**
 * Message — polymorphic renderer for a single TuiMessage.
 *
 * Dispatches on message.content.kind and renders the appropriate sub-layout.
 * Tool calls are shown in collapsed form (expandable in a future iteration).
 * Subagent status uses renderStatusSymbol from the existing ANSI badge module,
 * but the ANSI escape codes are stripped so Ink can own the coloring.
 *
 * Box/Text are obtained from InkContext via useInk() — no prop drilling.
 */

import React from "react";
import { useTheme } from "../hooks/useTheme.js";
import { useInk } from "../contexts/InkContext.js";
import { stripAnsi } from "../../colors.js";
import { renderStatusSymbol } from "../../components/StatusBadge.js";
import {
  briefArgs,
  getMessageIcon,
  getMessageColor,
  shouldShowTimestamp,
  formatToolCallSummary,
  formatToolOutput,
  formatShellOutput,
  formatTimestamp,
  parseMarkdownLite,
} from "../helpers.js";
import type { MarkdownSpan } from "../helpers.js";
import type { TuiMessage, RunStatus, ThemeColors } from "../types.js";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MessageProps {
  message: TuiMessage;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map RunStatus → StatusBadge StatusType (they mostly align). */
function runStatusToBadgeStatus(
  status: RunStatus,
): "running" | "completed" | "failed" | "waiting" | "pending" {
  switch (status) {
    case "running":
      return "running";
    case "complete":
      return "completed";
    case "failed":
      return "failed";
    case "waiting_effect":
      return "waiting";
    case "idle":
      return "pending";
  }
}


// ---------------------------------------------------------------------------
// Sub-renderers (all obtain Box/Text via useInk)
// ---------------------------------------------------------------------------

function UserMessage({
  text,
  colors,
}: { text: string; colors: ThemeColors }): React.JSX.Element {
  const { Box, Text } = useInk();
  const icon = getMessageIcon("user");
  const color = getMessageColor("user", colors);
  return React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    { flexDirection: "row", gap: 1 },
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color, bold: true },
      `${icon} You:`,
    ),
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: colors.foreground, wrap: "wrap" },
      text,
    ),
  );
}

/** Render a single MarkdownSpan as an Ink Text element. */
function renderSpan(
  span: MarkdownSpan,
  idx: number,
  colors: ThemeColors,
  Box: React.ComponentType<Record<string, unknown>>,
  Text: React.ComponentType<Record<string, unknown>>,
): React.JSX.Element {
  switch (span.style) {
    case "bold":
      return React.createElement(Text, { key: `s-${idx}`, color: colors.foreground, bold: true, wrap: "wrap" }, span.text);
    case "italic":
      return React.createElement(Text, { key: `s-${idx}`, color: colors.foreground, italic: true, wrap: "wrap" }, span.text);
    case "code":
      return React.createElement(Text, { key: `s-${idx}`, color: colors.primary, dimColor: true, wrap: "wrap" }, span.text);
    case "codeBlock": {
      const langTag = span.language
        ? React.createElement(Text, { key: `lang-${idx}`, color: colors.muted, dimColor: true }, `[${span.language}]\n`)
        : null;
      return React.createElement(
        Box as React.ComponentType<Record<string, unknown>>,
        { key: `cb-${idx}`, flexDirection: "column", paddingLeft: 1, marginY: 0 },
        langTag,
        React.createElement(Text, { color: colors.muted, wrap: "wrap" }, span.text),
      );
    }
    case "blockquote":
      return React.createElement(
        Box as React.ComponentType<Record<string, unknown>>,
        { key: `bq-${idx}`, flexDirection: "row", gap: 1 },
        React.createElement(Text, { color: colors.muted, dimColor: true }, "│"),
        React.createElement(Text, { color: colors.muted, italic: true, wrap: "wrap" }, span.text),
      );
    case "listItem":
      return React.createElement(
        Box as React.ComponentType<Record<string, unknown>>,
        { key: `li-${idx}`, flexDirection: "row", gap: 1, paddingLeft: 1 },
        React.createElement(Text, { color: colors.muted }, "•"),
        React.createElement(Text, { color: colors.foreground, wrap: "wrap" }, span.text),
      );
    default:
      return React.createElement(Text, { key: `s-${idx}`, color: colors.foreground, wrap: "wrap" }, span.text);
  }
}

function AssistantMessage({
  text,
  streaming,
  colors,
}: {
  text: string;
  streaming?: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
}): React.JSX.Element {
  const { Box, Text } = useInk();

  // Parse markdown for non-streaming messages (streaming may have incomplete markdown)
  const spans = streaming ? null : parseMarkdownLite(text);

  // If we have parsed spans, render them with formatting
  if (spans && spans.length > 0) {
    const renderedSpans = spans.map((span, idx) =>
      renderSpan(span, idx, colors, Box as React.ComponentType<Record<string, unknown>>, Text as React.ComponentType<Record<string, unknown>>),
    );

    return React.createElement(
      Box as React.ComponentType<Record<string, unknown>>,
      { flexDirection: "column", gap: 0 },
      ...renderedSpans,
    );
  }

  // Fallback: plain text (for streaming or empty)
  return React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    { flexDirection: "row", gap: 0 },
    streaming
      ? React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: colors.muted },
          "… ",
        )
      : null,
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: colors.foreground, wrap: "wrap" },
      text,
    ),
  );
}

function ToolCallMessage({
  toolName,
  input,
  elapsedMs,
  output,
  colors,
}: {
  toolName: string;
  input: unknown;
  elapsedMs?: number;
  output?: unknown;
  colors: ThemeColors;
}): React.JSX.Element {
  const { Box, Text } = useInk();
  const color = getMessageColor("tool_call", colors);
  const summary = formatToolCallSummary(
    toolName,
    input,
    elapsedMs,
    typeof output === "string" ? output : undefined,
  );
  const outputLines = formatToolOutput(output);

  return React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    { flexDirection: "column" },
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color, wrap: "wrap" },
      summary,
    ),
    outputLines.length > 0
      ? React.createElement(
          Box as React.ComponentType<Record<string, unknown>>,
          { paddingLeft: 2, flexDirection: "column" },
          ...outputLines.slice(0, 10).map((line, idx) =>
            React.createElement(
              Text as React.ComponentType<Record<string, unknown>>,
              { key: `out-${idx}`, color: colors.muted, dimColor: true, wrap: "wrap" },
              line,
            ),
          ),
          outputLines.length > 10
            ? React.createElement(
                Text as React.ComponentType<Record<string, unknown>>,
                { color: colors.muted, dimColor: true },
                `... ${outputLines.length - 10} more lines`,
              )
            : null,
        )
      : null,
  );
}

function SubagentMessage({
  label,
  status,
  agentId,
  colors,
}: {
  label: string;
  status: RunStatus;
  agentId: string;
  colors: ThemeColors;
}): React.JSX.Element {
  const { Box, Text } = useInk();
  const badgeStatus = runStatusToBadgeStatus(status);
  // renderStatusSymbol returns ANSI-colored text; strip codes so Ink owns style
  const symbol = stripAnsi(renderStatusSymbol(badgeStatus));
  const icon = getMessageIcon("subagent");
  const color = getMessageColor("subagent", colors);

  return React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    { flexDirection: "row", gap: 1 },
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color },
      icon,
    ),
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: colors.subagent, bold: true },
      label,
    ),
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: colors.muted },
      agentId,
    ),
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: colors.muted },
      symbol,
    ),
  );
}

function SystemMessage({
  text,
  colors,
}: {
  text: string;
  colors: ThemeColors;
}): React.JSX.Element {
  const { Text } = useInk();
  const icon = getMessageIcon("system");
  const color = getMessageColor("system", colors);
  return React.createElement(
    Text as React.ComponentType<Record<string, unknown>>,
    { color, dimColor: true, wrap: "wrap" },
    icon ? `${icon} ${text}` : text,
  );
}

function ErrorMessage({
  message,
  detail,
  colors,
}: {
  message: string;
  detail?: string;
  colors: ThemeColors;
}): React.JSX.Element {
  const { Box, Text } = useInk();
  const icon = getMessageIcon("error");
  const color = getMessageColor("error", colors);
  return React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    { flexDirection: "column" },
    React.createElement(
      Box as React.ComponentType<Record<string, unknown>>,
      { flexDirection: "row", gap: 1 },
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color, bold: true },
        icon,
      ),
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color, wrap: "wrap" },
        message,
      ),
    ),
    detail
      ? React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: colors.muted, wrap: "wrap" },
          detail,
        )
      : null,
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function Message({ message }: MessageProps): React.JSX.Element {
  const theme = useTheme();
  const { Box, Text } = useInk();
  const { colors } = theme;
  const { content } = message;

  let inner: React.ReactNode;

  switch (content.kind) {
    case "user":
      inner = React.createElement(UserMessage, {
        text: content.text,
        colors,
      });
      break;

    case "assistant":
      inner = React.createElement(AssistantMessage, {
        text: content.text,
        streaming: content.streaming,
        colors,
      });
      break;

    case "tool_call":
      inner = React.createElement(ToolCallMessage, {
        toolName: content.toolName,
        input: content.input,
        elapsedMs: content.elapsedMs,
        output: content.output,
        colors,
      });
      break;

    case "subagent":
      inner = React.createElement(SubagentMessage, {
        label: content.label,
        status: content.status,
        agentId: content.agentId,
        colors,
      });
      break;

    case "system":
      inner = React.createElement(SystemMessage, {
        text: content.text,
        colors,
      });
      break;

    case "error":
      inner = React.createElement(ErrorMessage, {
        message: content.message,
        detail: content.detail,
        colors,
      });
      break;

    default: {
      // Exhaustiveness guard — unknown future kinds render as plain text
      const _exhaustive: never = content;
      void _exhaustive;
      // Text is already destructured above (hooks must not be conditional)
      inner = React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: colors.muted },
        "[unknown message kind]",
      );
    }
  }

  // Timestamp rendering for user/assistant/error messages
  const showTimestamp = shouldShowTimestamp(content.kind);
  const timestamp = showTimestamp && message.timestamp
    ? formatTimestamp(message.timestamp)
    : null;

  return React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    { flexDirection: "row", paddingY: 0, gap: 1 },
    inner,
    timestamp
      ? React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: colors.muted, dimColor: true },
          timestamp,
        )
      : null,
  );
}

/**
 * Render shell-like tool output (stdout/stderr/exitCode) using formatShellOutput.
 * Exposed for use by MessagePane or other components that have access to raw shell data.
 */
export function renderShellOutput(
  stdout: string,
  stderr: string,
  exitCode: number,
): { lines: string[]; hasError: boolean } {
  return formatShellOutput(stdout, stderr, exitCode);
}
