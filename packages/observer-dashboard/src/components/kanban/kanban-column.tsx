"use client";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlarmClock,
  ArrowRight,
  BellRing,
  CheckCircle2,
  HelpCircle,
  PauseCircle,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/cn";
import { KanbanCard } from "@/components/kanban/kanban-card";
import { VIRTUALIZATION_THRESHOLD } from "@/components/dashboard/virtualized-run-list";
import type { UseBoardKeyboardResult } from "@/components/kanban/use-board-keyboard";
import {
  GROUP_ORDER,
  type BoardGroupKey,
  type BoardRun,
} from "@/components/kanban/column-model";

/**
 * A single board column — SPEC-vibekanban §3.2 (labels/tones), §6.2 (pill →
 * column focus), §7 (empty placeholders, virtualization), §8 (list semantics),
 * amended by UX-R2 §13.2b/§13.3 (owner gate 2026-07-05 run
 * 01KWRR8XAHFCDEGCRBRFHFF44W: 4-column taxonomy + color map).
 *
 * Header shows the column label and an HONEST count (§3.4): the number of
 * cards actually in this column post-partition. The Stalled column may carry
 * a tooltip explaining runs captured by Needs-you precedence — no silent
 * mismatch between pill counts (overlapping buckets) and column counts
 * (disjoint partition). The Done header carries an "N failed" chip whenever
 * the column hosts failed runs (§13.2b — failure is never silent).
 *
 * Color discipline (§13.3): header labels use the semantic --status-* tokens
 * (one hue, one meaning; brand magenta does no status duty; red is
 * terminal-only) and every colored label/badge pairs an icon with text —
 * never color alone (AC-41 deutan rule).
 *
 * Columns above VIRTUALIZATION_THRESHOLD items virtualize their card list with
 * the existing @tanstack/react-virtual dependency (same cutoff/pattern as
 * virtualized-run-list.tsx; stable runId item keys), scrolling independently
 * inside the column — never delegating to the page body.
 *
 * Frozen DOM contract (kanban-board.spec.ts): testid families
 * kanban-column-<key>, kanban-column-count-<key>, kanban-column-cards-<key>
 * (key ∈ needsyou|waiting|stalled|done per the §13.6 amendment), plus
 * data-focused/data-dimmed for the pill-focus treatment (AC-23).
 */

/** Estimated compact-card height (px) for initial virtual measurement (§5). */
const ESTIMATED_CARD_HEIGHT = 110;

/** Overscan matching the flat-list virtualization pattern. */
const OVERSCAN_COUNT = 3;

interface ColumnSpec {
  label: string;
  /** Optional sub-label under the header label (Working: "waiting / running"). */
  subLabel?: string;
  /** §7 quiet placeholder for always-visible columns (auto-hide columns omit it). */
  emptyText?: string;
  /** Column tone (§13.3): header accent class — a semantic --status-* token. */
  headerClass: string;
  /** All-clear/ok-tinted empty placeholder for the alarm column (§13.3: --status-ok). */
  emptyClass?: string;
  /** §13.3 / AC-41: every colored status label pairs an icon with its text. */
  icon: LucideIcon;
}

/**
 * Column labels/tones per §13.2b + §13.3 and empty placeholders per §7.
 * Header classes reference ONLY semantic status tokens (AC-38): no zinc
 * hardcodes, no brand --primary on a status surface, no alpha-diluted text.
 */
export const COLUMN_SPECS: Record<BoardGroupKey, ColumnSpec> = {
  needsyou: {
    label: "Needs you",
    emptyText: "Nothing needs you. All clear.",
    // §13.3: gold = needs action (theme-aware; ≥4.5:1 in both themes).
    headerClass: "text-status-attention",
    emptyClass: "text-status-ok",
    icon: BellRing,
  },
  waiting: {
    label: "Working",
    subLabel: "waiting / running",
    emptyText: "No runs in progress.",
    // §13.3: cyan = alive/working now — brand magenta exits status duty.
    headerClass: "text-status-alive",
    icon: Activity,
  },
  scheduled: {
    label: "Scheduled",
    subLabel: "sleeping / next tick",
    // §15.1: idle-HEALTHY (a forever-run between ticks) — a calm, de-emphasized
    // neutral header (AlarmClock). The overdue amber "resume" attention lives on
    // the card, never on the whole column (a scheduled run is not "attention").
    headerClass: "text-status-aged",
    icon: AlarmClock,
  },
  stalled: {
    label: "Stalled",
    subLabel: "no driver / quiet",
    // §13.3: amber-gray = stalled-but-recoverable — never red (red is terminal).
    headerClass: "text-status-stalled",
    icon: PauseCircle,
  },
  done: {
    label: "Done",
    emptyText: "No finished runs in the retention window.",
    // §13.3: Done header de-emphasizes with the aged token; the "N failed"
    // chip below carries the terminal-red alarm when failures exist.
    headerClass: "text-status-aged",
    icon: CheckCircle2,
  },
};

/**
 * §13.2/AC-37 column meanings — one-line plain-language definitions rendered
 * by the header "?" popover, so the taxonomy explains itself on the board.
 */
export const COLUMN_DEFINITIONS: Record<BoardGroupKey, string> = {
  needsyou: "Needs you: a run is waiting for YOUR answer.",
  waiting: "Working: a live driver is attached and making progress.",
  scheduled:
    "Scheduled: a forever-run sleeping between ticks; healthy, not stalled. Overdue wakes show an amber resume hint.",
  stalled:
    "Stalled and recoverable: no live driver or quiet >1h; resume to continue.",
  done: "Done and terminal: completed or failed; failed runs carry a red failed badge.",
};

/**
 * §13.2/AC-37: the header "?" affordance. A plain toggle button (keyboard
 * reachable) opening a small popover that defines every board column in one
 * line. Closes on Escape and on any outside pointer press. Read-only chrome.
 */
function ColumnInfoPopover({ columnKey }: { columnKey: BoardGroupKey }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  // Close on pointer presses outside the affordance while open.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <span
      ref={rootRef}
      className="relative inline-flex"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        data-testid={`kanban-column-info-${columnKey}`}
        aria-label="What do the board columns mean?"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center rounded text-foreground-muted hover:text-foreground-secondary transition-colors"
      >
        <HelpCircle className="h-3 w-3" aria-hidden="true" focusable="false" />
      </button>
      {open && (
        <div
          data-testid="kanban-column-definitions"
          role="note"
          aria-label="Column definitions"
          className="absolute left-0 top-full z-30 mt-1.5 w-72 rounded-md border border-border bg-background-secondary p-2.5 shadow-md"
        >
          <ul className="flex flex-col gap-1.5">
            {GROUP_ORDER.map((key) => (
              <li
                key={key}
                className="text-xs leading-snug text-foreground-secondary"
              >
                {COLUMN_DEFINITIONS[key]}
              </li>
            ))}
          </ul>
        </div>
      )}
    </span>
  );
}

export interface KanbanColumnProps {
  columnKey: BoardGroupKey;
  runs: BoardRun[];
  /**
   * Header count override. Defaults to the number of rendered cards
   * (`runs.length`) — the disjoint card count every non-idle scenario uses.
   * SESSIONS-CHIP-SPEC AC5 passes a reconciled count for the Working lane when
   * idle sessions are collapsed (the drop equals exactly the idle count).
   */
  count?: number;
  /** Count-honesty tooltip (§3.4) — e.g. stalled runs captured by Needs-you. */
  countTooltip?: string | null;
  /** §6.2 pill focus: this column is highlighted and scrolled into view. */
  focused?: boolean;
  /** §6.2 pill focus: another column is focused — dim this one. */
  dimmed?: boolean;
  /** §8 roving tabindex wiring (from useBoardKeyboard), passed to every card. */
  keyboard?: UseBoardKeyboardResult;
  /**
   * §7 fetch-window tail: when set, render a "View all in list →" row that
   * switches to list view with this column's status filter pre-applied.
   */
  onViewAllInList?: () => void;
}

export function KanbanColumn({
  columnKey,
  runs,
  count,
  countTooltip,
  focused = false,
  dimmed = false,
  keyboard,
  onViewAllInList,
}: KanbanColumnProps) {
  // Displayed header count: caller override, else the rendered-card count.
  const displayCount = count ?? runs.length;
  const spec = COLUMN_SPECS[columnKey];
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const HeaderIcon = spec.icon;

  // §13.2b: the Done header renders the "N failed" chip whenever it hosts
  // failed runs — merging failed into Done must never silence failures.
  const failedCount =
    columnKey === "done"
      ? runs.filter((run) => run.status === "failed").length
      : 0;

  // §6.2: clicking a status pill focuses the corresponding column — scroll it
  // into view (the highlight ring is applied via data-focused styling below).
  useEffect(() => {
    if (focused) {
      sectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [focused]);

  // §7: virtualize above the shared threshold with stable runId item keys.
  const virtualize = runs.length >= VIRTUALIZATION_THRESHOLD;
  const virtualizer = useVirtualizer({
    count: runs.length,
    getScrollElement: () => cardsRef.current,
    estimateSize: () => ESTIMATED_CARD_HEIGHT,
    overscan: OVERSCAN_COUNT,
    getItemKey: (index) => runs[index]?.runId ?? index,
    enabled: virtualize,
  });

  return (
    <section
      ref={sectionRef}
      data-testid={`kanban-column-${columnKey}`}
      data-focused={focused ? "true" : undefined}
      data-dimmed={dimmed ? "true" : undefined}
      className={cn(
        "flex flex-col min-w-[280px] w-[280px] shrink-0 rounded-lg border border-border bg-background-secondary/40",
        // Alarm surface tone (§3.2): the Needs-you column glows.
        columnKey === "needsyou" && "border-warning/30",
        // The terminal column is visually de-emphasized.
        columnKey === "done" && "opacity-80",
        // §6.2 focus/dim treatment: highlight ring vs opacity dim.
        focused && "ring-2 ring-primary/60",
        dimmed && "opacity-40"
      )}
    >
      {/* Header: icon + label + honest count (§3.4); AC-41: never color alone. */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b border-border"
        title={countTooltip ?? undefined}
      >
        <span
          data-testid={`kanban-column-label-${columnKey}`}
          // §13.5/AC-49: the absorbed-count disclosure is programmatically
          // associated with the header, not hover-title-only — the label's
          // accessible description carries the "+N more …" text.
          aria-describedby={
            countTooltip ? `kanban-absorbed-${columnKey}` : undefined
          }
          className={cn(
            "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide",
            spec.headerClass
          )}
        >
          <HeaderIcon
            className="h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
            focusable="false"
          />
          {spec.label}
        </span>
        {countTooltip && (
          // §13.5/AC-49: screen-reader-visible copy of the count-honesty
          // tooltip (the hover title above), referenced by aria-describedby.
          <span
            id={`kanban-absorbed-${columnKey}`}
            data-testid={`kanban-absorbed-${columnKey}`}
            className="sr-only"
          >
            {countTooltip}
          </span>
        )}
        {spec.subLabel && (
          <span className="text-[10px] text-foreground-muted">{spec.subLabel}</span>
        )}
        {/* §13.2/AC-37: one-line column definitions behind a "?" affordance. */}
        <ColumnInfoPopover columnKey={columnKey} />
        {failedCount > 0 && (
          // §13.2b/AC-36: red is terminal-only — the chip is the ONLY red on
          // the Done header, icon + text (AC-41), full-strength token (AC-38).
          <span
            data-testid="kanban-done-failed-chip"
            data-status-badge
            className="flex items-center gap-1 rounded-full bg-status-failed-muted border border-status-failed/30 px-1.5 py-px text-[10px] leading-tight font-semibold text-status-failed"
          >
            <XCircle className="h-3 w-3 shrink-0" aria-hidden="true" focusable="false" />
            {failedCount} failed
          </span>
        )}
        <span
          data-testid={`kanban-column-count-${columnKey}`}
          className="ml-auto rounded-full bg-background-secondary px-1.5 py-px text-xs leading-tight font-semibold tabular-nums text-foreground-muted"
        >
          {displayCount}
        </span>
      </div>

      {/* Independently scrolling card area (§7: viewport-bound, never the page body). */}
      <div
        ref={cardsRef}
        data-testid={`kanban-column-cards-${columnKey}`}
        role="list"
        aria-label={`${spec.label}, ${runs.length} ${runs.length === 1 ? "run" : "runs"}`}
        className={cn(
          "p-2 overflow-y-auto max-h-[calc(100vh-260px)]",
          !virtualize && "flex flex-col gap-2"
        )}
      >
        {runs.length === 0 && spec.emptyText ? (
          // §7 quiet per-column placeholder — never a blank void.
          <p className={cn("px-2 py-6 text-center text-xs text-foreground-muted", spec.emptyClass)}>
            {spec.emptyText}
          </p>
        ) : !virtualize ? (
          runs.map((run) => (
            <KanbanCard key={run.runId} run={run} keyboard={keyboard} />
          ))
        ) : (
          // Virtualized card list (pattern from virtualized-run-list.tsx):
          // only visible cards + overscan render; header count stays honest.
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const run = runs[virtualRow.index];
              if (!run) return null;
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div style={{ paddingBottom: 8 }}>
                    <KanbanCard run={run} keyboard={keyboard} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* §7 fetch-window tail: the 500-run window may be hiding runs from any
          column — offer the complete flat list with this filter pre-applied. */}
      {onViewAllInList && (
        <button
          type="button"
          data-testid={`kanban-column-tail-${columnKey}`}
          onClick={onViewAllInList}
          className="flex items-center justify-center gap-1 border-t border-border px-3 py-1.5 text-xs font-medium text-foreground-muted hover:text-foreground-secondary hover:bg-background-secondary transition-colors rounded-b-lg"
        >
          View all in list
          <ArrowRight className="h-3 w-3" aria-hidden="true" focusable="false" />
        </button>
      )}
    </section>
  );
}
