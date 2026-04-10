/**
 * MessagePane — scrollable message area for the Babysitter TUI.
 *
 * Filters messages by verbosity level and renders each through the Message
 * component.  Uses flexGrow=1 to fill available vertical space.
 *
 * Verbosity filtering:
 *   minimal  → show only "user" and "assistant" messages
 *   normal   → also show "tool_call" and "subagent" messages
 *   verbose  → show everything (system + error included)
 *
 * Scroll support: PageUp / PageDown (or Up/Down arrows) shift a scroll offset
 * so the user can review earlier messages.  The offset is tracked as a count
 * of messages to skip from the bottom (0 = newest at bottom).
 *
 * Box/Text are obtained from InkContext via useInk() — no prop drilling.
 */

import React, { useState } from "react";
import { useSession } from "../hooks/useSession.js";
import { useTheme } from "../hooks/useTheme.js";
import { useInk } from "../contexts/InkContext.js";
import type { InkKey } from "../contexts/InkContext.js";
import { Message } from "./Message.js";
import type { TuiMessage, VerbosityLevel, MessageKind } from "../types.js";

// ---------------------------------------------------------------------------
// Verbosity filter
// ---------------------------------------------------------------------------

export const VERBOSITY_ALLOWED: Record<VerbosityLevel, ReadonlySet<MessageKind>> = {
  minimal: new Set(["user", "assistant"]),
  normal: new Set(["user", "assistant", "tool_call", "subagent"]),
  verbose: new Set(["user", "assistant", "tool_call", "subagent", "system", "error"]),
};

export function filterMessages(
  messages: readonly TuiMessage[],
  verbosity: VerbosityLevel,
): TuiMessage[] {
  const allowed = VERBOSITY_ALLOWED[verbosity];
  return messages.filter((m) => allowed.has(m.content.kind));
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of messages to show per "page" for scroll purposes. */
const VIEWPORT_SIZE = 20;
/** How many messages PageUp/PageDown jumps. */
const PAGE_STEP = 10;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MessagePaneProps {
  // No props — all data comes from context
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyPane({ color, hasRun }: { color: string; hasRun: boolean }): React.JSX.Element {
  const { Box, Text } = useInk();
  const text = hasRun
    ? "Waiting for messages…"
    : "No active run. Pass --run-id to observe a run, or start a new one.";

  return React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    { flexGrow: 1, justifyContent: "center", alignItems: "center" },
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color, dimColor: true },
      text,
    ),
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MessagePane(_props: MessagePaneProps): React.JSX.Element {
  const { state } = useSession();
  const { colors } = useTheme();
  const { Box, Text, useInput } = useInk();

  // scrollOffset: number of messages hidden at the bottom (0 = auto-scroll to newest)
  const [scrollOffset, setScrollOffset] = useState(0);

  const visible = filterMessages(state.messages, state.verbosity);
  const hasRun = state.runId !== null;

  // Keyboard scroll handling
  useInput(
    (input: string, key: InkKey) => {
      if (visible.length === 0) return;
      const maxOffset = Math.max(0, visible.length - VIEWPORT_SIZE);

      if (key.pageUp) {
        setScrollOffset((prev) => Math.min(prev + PAGE_STEP, maxOffset));
      } else if (key.pageDown) {
        setScrollOffset((prev) => Math.max(prev - PAGE_STEP, 0));
      } else if (key.upArrow) {
        setScrollOffset((prev) => Math.min(prev + 1, maxOffset));
      } else if (key.downArrow) {
        setScrollOffset((prev) => Math.max(prev - 1, 0));
      } else if (input === "g") {
        // 'g' = go to top
        setScrollOffset(maxOffset);
      } else if (input === "G") {
        // 'G' = go to bottom
        setScrollOffset(0);
      }
    },
  );

  if (visible.length === 0) {
    return React.createElement(EmptyPane, {
      color: colors.muted,
      hasRun,
    });
  }

  // Apply scroll window: take messages from end minus offset
  const clampedOffset = Math.min(scrollOffset, Math.max(0, visible.length - 1));
  const endIdx = visible.length - clampedOffset;
  const startIdx = Math.max(0, endIdx - VIEWPORT_SIZE);
  const windowedMessages = visible.slice(startIdx, endIdx);

  const messageElements = windowedMessages.map((msg) =>
    React.createElement(Message, {
      key: msg.id,
      message: msg,
    }),
  );

  // Scroll indicator shown when not at the bottom
  const scrollIndicator =
    clampedOffset > 0
      ? React.createElement(
          Box as React.ComponentType<Record<string, unknown>>,
          { justifyContent: "center" },
          React.createElement(
            Text as React.ComponentType<Record<string, unknown>>,
            { color: colors.muted, dimColor: true },
            `↑ ${String(clampedOffset)} more message${clampedOffset !== 1 ? "s" : ""} below — PageDown / ↓ to scroll`,
          ),
        )
      : null;

  // Top overflow indicator
  const overflowIndicator =
    startIdx > 0
      ? React.createElement(
          Box as React.ComponentType<Record<string, unknown>>,
          { justifyContent: "center" },
          React.createElement(
            Text as React.ComponentType<Record<string, unknown>>,
            { color: colors.muted, dimColor: true },
            `↑ ${String(startIdx)} earlier message${startIdx !== 1 ? "s" : ""} — PageUp / ↑ to scroll`,
          ),
        )
      : null;

  return React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    {
      flexDirection: "column",
      flexGrow: 1,
      overflow: "hidden",
      paddingX: 1,
    },
    overflowIndicator,
    ...messageElements,
    scrollIndicator,
  );
}
