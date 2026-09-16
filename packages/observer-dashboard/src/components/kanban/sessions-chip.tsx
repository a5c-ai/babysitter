"use client";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * SESSIONS-CHIP-SPEC (frozen 2026-07-09) AC3/AC4 — the single MUTED, secondary
 * "⚡ N sessions" chip that discloses the idle-session (bare/0-task) count kept
 * out of the board columns, with a reveal toggle.
 *
 * Muted/secondary (AC3): reuses the SessionPill's neutral tokens
 * (bg-background-secondary + text-foreground-muted) so it never competes with
 * the needs-you / alarm surface — it is NOT an alert (no role="alert", no
 * assertive live region) and carries no brand/attention hue. `data-tone="muted"`
 * is the frozen contract attribute.
 *
 * Read-only chrome (contract LAW): the toggle only flips local visibility; it
 * writes nothing back.
 */
export interface SessionsChipProps {
  /** AC3: the exact idle-session count (N). */
  count: number;
  /** AC4: whether the idle-session cards are currently revealed on the board. */
  revealed: boolean;
  onToggle: () => void;
}

export function SessionsChip({ count, revealed, onToggle }: SessionsChipProps) {
  const RevealIcon = revealed ? EyeOff : Eye;
  return (
    <span
      data-testid="kanban-sessions-chip"
      data-tone="muted"
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-background-secondary px-3 py-1",
        "text-xs font-medium text-foreground-muted select-none"
      )}
    >
      {/* AC3: exact "⚡ N session(s)" text — reads sensibly at small and large N. */}
      <span className="tabular-nums" aria-hidden="false">
        {"⚡"} {count} {count === 1 ? "session" : "sessions"}
      </span>
      <button
        type="button"
        data-testid="kanban-sessions-toggle"
        aria-pressed={revealed}
        aria-label={revealed ? "Hide idle sessions" : "Reveal idle sessions"}
        onClick={onToggle}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
          "text-foreground-muted hover:text-foreground-secondary hover:bg-background-tertiary transition-colors"
        )}
      >
        <RevealIcon className="h-3 w-3 shrink-0" aria-hidden="true" focusable="false" />
        {revealed ? "Hide" : "Reveal"}
      </button>
    </span>
  );
}
