'use client';
import { useState } from 'react';
import { formatShortId } from '@/lib/utils';
import { cn } from '@/lib/cn';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TruncatedIdProps {
  id: string;
  chars?: number;
  className?: string;
  /**
   * Override the visible truncated text (defaults to formatShortId(id, chars)).
   * The FULL id is always what gets copied and shown on hover — this only
   * controls the rendered fragment (e.g. head-truncated `01KX4TCZ` short-ids).
   */
  display?: string;
  /**
   * 'chip' (default) — the original padded 44px-target chip.
   * 'inline' — lean text for dense rows (kanban card row 3, flat-list rows,
   * the run-detail breadcrumb): inherits surrounding typography, adds a
   * dotted-underline hover affordance, and sits at z-10 so it stays clickable
   * above stretched-overlay row links (a11y-nested-interactive-copy-btn).
   */
  variant?: 'chip' | 'inline';
}

export function TruncatedId({ id, chars = 4, className, display, variant = 'chip' }: TruncatedIdProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            // Native title as a belt-and-braces full-id hover (owner UX ask:
            // "hover or another way to copy the all run id") — the Radix
            // tooltip below is the primary affordance.
            title={id}
            className={cn(
              variant === 'chip'
                ? [
                    'inline-flex items-center justify-center rounded px-2 py-1 min-h-[44px] min-w-[44px] font-mono text-xs',
                    'bg-background-secondary text-info/80',
                    'hover:bg-background-tertiary hover:text-info',
                  ]
                : [
                    'relative z-10 inline-flex items-center font-mono',
                    'hover:underline decoration-dotted underline-offset-2',
                  ],
              'cursor-pointer transition-colors select-none',
              copied && 'text-primary',
              className
            )}
            onClick={handleCopy}
            role="button"
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCopy(e as unknown as React.MouseEvent); } }}
          >
            {display ?? formatShortId(id, chars)}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-mono text-xs">{copied ? <span className="text-primary font-semibold">Copied!</span> : id}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
