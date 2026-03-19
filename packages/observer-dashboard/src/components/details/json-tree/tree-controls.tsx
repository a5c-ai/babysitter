"use client";

import React from "react";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ */
/*  Input / Output toggle                                               */
/* ------------------------------------------------------------------ */

interface DataToggleProps {
  showInput: boolean;
  onToggle: (showInput: boolean) => void;
}

/** Input/Output tab toggle for switching between task input and result data */
export function DataToggle({ showInput, onToggle }: DataToggleProps) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <button
        type="button"
        onClick={() => onToggle(true)}
        className={cn(
          "text-xs px-3 py-1 min-h-[44px] rounded transition-colors",
          showInput
            ? "bg-primary-muted text-primary"
            : "text-foreground-muted hover:text-foreground-secondary"
        )}
      >
        Input
      </button>
      <button
        type="button"
        onClick={() => onToggle(false)}
        className={cn(
          "text-xs px-3 py-1 min-h-[44px] rounded transition-colors",
          !showInput
            ? "bg-primary-muted text-primary"
            : "text-foreground-muted hover:text-foreground-secondary"
        )}
      >
        Output
      </button>
    </div>
  );
}

export type { DataToggleProps };
