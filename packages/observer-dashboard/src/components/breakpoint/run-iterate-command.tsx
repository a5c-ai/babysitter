"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * UX-R3 §14.5 (AC-60) — copyable, INERT `babysitter run:iterate <runId>`.
 *
 * The observer never runs the resume command (read-only contract): this
 * renders it as selectable/copyable instructions with a Copy affordance that
 * writes ONLY to the clipboard. Copy invokes NO server action / network write —
 * it is guidance, not a control. Reuses the copy-run-id clipboard pattern from
 * run-list.tsx's ActionHint (navigator.clipboard.writeText, transient
 * "copied" state, sr-only live announcement).
 */
export function RunIterateCommand({
  runId,
  className,
}: {
  runId: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const command = `babysitter run:iterate ${runId}`;

  const copy = (e: React.MouseEvent) => {
    // Never let this bubble into the card's stretched overlay link, and never
    // submit a form — it is inert guidance, not an action.
    e.preventDefault();
    e.stopPropagation();
    try {
      navigator.clipboard?.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be unavailable (non-secure context) — non-fatal
    }
  };

  return (
    <div
      data-testid="kanban-bp-run-iterate"
      className={cn("relative z-10 flex items-center gap-2 min-w-0", className)}
    >
      {/* Selectable command text — the observer STATES the command, never runs it. */}
      <code
        data-testid="kanban-bp-run-iterate-text"
        className="min-w-0 flex-1 select-all truncate rounded border border-border bg-background px-2 py-1 font-mono text-[11px] text-foreground"
        title={command}
      >
        {command}
      </code>
      <button
        type="button"
        onClick={copy}
        data-testid="kanban-bp-run-iterate-copy"
        className="flex shrink-0 items-center gap-1 text-[10px] text-foreground-muted transition-colors hover:text-foreground"
        aria-label="Copy the resume command (babysitter run:iterate). The observer never runs it"
        title="Copy the resume command, then run it yourself in a terminal"
      >
        {copied ? (
          <Check className="h-3 w-3" aria-hidden="true" focusable="false" />
        ) : (
          <Copy className="h-3 w-3" aria-hidden="true" focusable="false" />
        )}
        {copied ? "copied" : "copy"}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Resume command copied" : ""}
      </span>
    </div>
  );
}
