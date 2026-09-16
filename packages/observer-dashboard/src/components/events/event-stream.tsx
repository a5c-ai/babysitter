"use client";
import { useState, useMemo, useRef, useEffect, useCallback, memo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EventItem } from "./event-item";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/utils";
import { ChevronUp } from "lucide-react";
import type { JournalEvent, EventType } from "@/types";

const filterOptions: { label: string; value: EventType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Tasks", value: "EFFECT_REQUESTED" },
  { label: "Results", value: "EFFECT_RESOLVED" },
  { label: "Errors", value: "RUN_FAILED" },
];

const EVENTS_PER_PAGE = 20;

/** Group consecutive same-type events into summary rows */
interface EventGroup {
  type: "single";
  event: JournalEvent;
}
interface EventGroupCollapsed {
  type: "group";
  eventType: string;
  events: JournalEvent[];
  count: number;
}
type GroupedEntry = EventGroup | EventGroupCollapsed;

function groupConsecutiveEvents(events: JournalEvent[]): GroupedEntry[] {
  if (events.length === 0) return [];

  const result: GroupedEntry[] = [];
  let i = 0;

  while (i < events.length) {
    let j = i + 1;
    // Count consecutive events of same type
    while (j < events.length && events[j].type === events[i].type) {
      j++;
    }
    const count = j - i;
    if (count >= 3) {
      // Group 3+ consecutive same-type events
      result.push({
        type: "group",
        eventType: events[i].type,
        events: events.slice(i, j),
        count,
      });
    } else {
      // Show individually
      for (let k = i; k < j; k++) {
        result.push({ type: "single", event: events[k] });
      }
    }
    i = j;
  }

  return result;
}

interface EventStreamProps {
  events: JournalEvent[];
  onEventClick?: (event: JournalEvent) => void;
}

export const EventStream = memo(function EventStream({ events, onEventClick }: EventStreamProps) {
  const [filter, setFilter] = useState<EventType | "all">("all");
  const [visibleCount, setVisibleCount] = useState(EVENTS_PER_PAGE);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const prevEventCount = useRef(events.length);

  // Summary stats across all events (unfiltered)
  const stats = useMemo(() => {
    let tasks = 0;
    let completed = 0;
    let errors = 0;
    for (const e of events) {
      if (e.type === "EFFECT_REQUESTED") tasks++;
      if (e.type === "EFFECT_RESOLVED") {
        const p = e.payload as Record<string, unknown>;
        if (p.status === "error") errors++;
        else completed++;
      }
      if (e.type === "RUN_FAILED") errors++;
    }
    // Elapsed from first to last event
    let elapsed: number | null = null;
    if (events.length >= 2) {
      const first = new Date(events[0].ts).getTime();
      const last = new Date(events[events.length - 1].ts).getTime();
      elapsed = Math.abs(last - first);
    }
    return { tasks, completed, errors, elapsed };
  }, [events]);

  const filtered = useMemo(() => {
    return filter === "all" ? events : events.filter((e) => e.type === filter);
  }, [events, filter]);

  // Show newest first
  const reversed = useMemo(() => [...filtered].reverse(), [filtered]);

  // Limit visible events
  const visible = useMemo(() => reversed.slice(0, visibleCount), [reversed, visibleCount]);

  // Group consecutive same-type events
  const grouped = useMemo(() => groupConsecutiveEvents(visible), [visible]);

  const remainingCount = reversed.length - visibleCount;

  // Auto-scroll to top (newest) when new events arrive
  useEffect(() => {
    if (events.length > prevEventCount.current && autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    prevEventCount.current = events.length;
  }, [events.length, autoScroll]);

  // Detect user scroll to pause auto-scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    // If user scrolled away from top, pause auto-scroll
    setAutoScroll(target.scrollTop < 10);
  }, []);

  const toggleGroup = useCallback((index: number) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  // Reset visible count when filter changes
  useEffect(() => {
    setVisibleCount(EVENTS_PER_PAGE);
    setExpandedGroups(new Set());
  }, [filter]);

  return (
    <div data-testid="event-stream" className="flex flex-col h-full">
      <div className="shrink-0 border-b border-border p-3 bg-background-secondary/30">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium text-foreground-muted uppercase tracking-wider">Event Stream</h3>
          <span className="text-xs leading-tight text-secondary font-mono tabular-nums">
            {filtered.length} events
          </span>
        </div>
        <div className="flex items-center gap-1">
          {filterOptions.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-md px-2.5 py-1 min-h-[44px] text-xs leading-tight font-medium transition-all duration-200",
                filter === f.value
                  ? "bg-primary/15 text-primary border border-primary/25 shadow-event-filter-active"
                  : "text-foreground-muted hover:text-foreground-secondary hover:bg-muted/50 border border-transparent"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        {/* Summary stats bar */}
        {events.length > 0 && (
          <div className="flex items-center gap-2 mt-2 text-xs leading-tight font-mono text-foreground-muted tabular-nums">
            <span>Tasks: <span className="text-foreground-secondary">{stats.tasks}</span></span>
            <span className="text-border">|</span>
            <span>Completed: <span className="text-success">{stats.completed}</span></span>
            <span className="text-border">|</span>
            <span>Errors: <span className={stats.errors > 0 ? "text-error" : "text-foreground-secondary"}>{stats.errors}</span></span>
            {stats.elapsed != null && stats.elapsed > 0 && (
              <>
                <span className="text-border">|</span>
                <span>Elapsed: <span className="text-secondary/80">{formatDuration(stats.elapsed)}</span></span>
              </>
            )}
          </div>
        )}
      </div>
      <ScrollArea className="flex-1" ref={scrollRef} onScrollCapture={handleScroll}>
        <div className="py-1">
          {grouped.map((entry, idx) => {
            if (entry.type === "single") {
              return (
                <EventItem
                  key={entry.event.id || entry.event.seq}
                  event={entry.event}
                  onClick={() => onEventClick?.(entry.event)}
                />
              );
            }

            // Collapsed group
            const isExpanded = expandedGroups.has(idx);
            const config = typeLabel(entry.eventType);
            return (
              <div key={`group-${idx}`}>
                <button
                  onClick={() => toggleGroup(idx)}
                  className="w-full text-left px-3 py-1.5 hover:bg-background-secondary rounded transition-colors flex items-center gap-2"
                >
                  <span className={cn(
                    "inline-block h-1.5 w-1.5 rounded-full shrink-0",
                    config.dotColor
                  )} />
                  <span className="text-xs leading-tight text-foreground-muted font-medium tabular-nums">
                    {entry.count}x
                  </span>
                  <span className="text-xs text-foreground-secondary">{config.label}</span>
                  <ChevronUp className={cn(
                    "h-3 w-3 text-foreground-muted ml-auto transition-transform",
                    !isExpanded && "rotate-180"
                  )} />
                </button>
                {isExpanded && entry.events.map((event) => (
                  <EventItem
                    key={event.id || event.seq}
                    event={event}
                    onClick={() => onEventClick?.(event)}
                  />
                ))}
              </div>
            );
          })}
          {remainingCount > 0 && (
            <button
              onClick={() => setVisibleCount((v) => v + EVENTS_PER_PAGE)}
              className="w-full py-2 text-xs leading-tight text-foreground-muted hover:text-primary hover:bg-background-secondary hover:shadow-neon-glow-primary-xs transition-all"
            >
              Show {Math.min(remainingCount, EVENTS_PER_PAGE)} more ({remainingCount} remaining)
            </button>
          )}
          {reversed.length === 0 && (
            <div className="text-xs text-foreground-muted text-center py-8">No events yet</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
});

function typeLabel(type: string): { label: string; dotColor: string } {
  switch (type) {
    case "EFFECT_REQUESTED": return { label: "Requested", dotColor: "bg-foreground-muted" };
    case "EFFECT_RESOLVED": return { label: "Resolved", dotColor: "bg-success" };
    case "RUN_COMPLETED": return { label: "Completed", dotColor: "bg-success" };
    case "RUN_FAILED": return { label: "Failed", dotColor: "bg-error" };
    case "RUN_CREATED": return { label: "Created", dotColor: "bg-primary" };
    default: return { label: type, dotColor: "bg-foreground-muted" };
  }
}
