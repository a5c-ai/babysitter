"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { formatShortId } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SessionPillProps {
  sessionId?: string;
  active?: boolean;
  className?: string;
}

export function SessionPill({ sessionId, active = false, className }: SessionPillProps) {
  const [copied, setCopied] = useState(false);

  if (!sessionId) return null;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-full bg-background-secondary px-2.5 py-0.5 text-xs font-mono text-foreground-muted cursor-pointer transition-all hover:bg-background-tertiary select-none",
              active && "shadow-neon-glow-cyan-sm",
              className
            )}
            onClick={handleCopy}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                active ? "bg-secondary shadow-[0_0_6px_var(--secondary)] animate-pulse-dot" : "bg-foreground-muted/40"
              )}
            />
            {formatShortId(sessionId, 4)}
            {copied && (
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-primary px-2 py-0.5 text-xs leading-tight font-sans font-medium text-primary-foreground whitespace-nowrap animate-slide-in-right">
                Copied!
              </span>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-mono text-xs">
            {copied ? "Copied!" : `Session: ${sessionId}`}
          </p>
          {!copied && (
            <p className="text-foreground-muted text-xs leading-tight mt-0.5">Click to copy</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
