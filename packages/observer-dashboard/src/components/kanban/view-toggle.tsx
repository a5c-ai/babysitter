"use client";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Board/List view toggle — SPEC-vibekanban §6.1.
 *
 * A two-segment control (Board | List) hosted in the RunFilterBar row. The
 * persisted view state lives in page.tsx (usePersistedState under
 * "observer:dashboard-view", default "board"); this component is a controlled
 * presentation of it. No tablist role — simple buttons with aria-pressed,
 * fully keyboard operable (§8).
 */

export type DashboardView = "board" | "list";

export interface ViewToggleProps {
  view: DashboardView;
  onViewChange: (view: DashboardView) => void;
}

const segments: { label: string; value: DashboardView; Icon: typeof LayoutGrid }[] = [
  { label: "Board", value: "board", Icon: LayoutGrid },
  { label: "List", value: "list", Icon: List },
];

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="inline-flex items-center rounded-md border border-border bg-background-secondary p-0.5">
      {segments.map(({ label, value, Icon }) => (
        <button
          key={value}
          data-testid={`view-toggle-${value}`}
          aria-pressed={view === value}
          onClick={() => onViewChange(value)}
          title={value === "board" ? "Board view: one column per triage bucket" : "List view: project grid and flat run lists"}
          className={cn(
            "rounded px-2.5 py-1.5 min-h-[40px] text-xs inline-flex items-center gap-1.5 transition-all",
            // UX-R3 §14.2 (owner gate 2026-07-06, option a): active segment is
            // NEUTRAL (foreground ink + subtle foreground/7% fill + 2px
            // underline + weight 600), never magenta.
            view === value
              ? "bg-foreground/[0.07] text-foreground font-semibold border-b-2 border-foreground shadow-sm"
              : "font-medium text-foreground-muted hover:text-foreground-secondary"
          )}
        >
          {/* a11y-icons-not-hidden: decorative icons hidden from AT. */}
          <Icon className="h-3 w-3" aria-hidden="true" focusable="false" />
          {label}
        </button>
      ))}
    </div>
  );
}
