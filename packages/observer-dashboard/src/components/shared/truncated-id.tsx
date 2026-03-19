'use client';
import { useState } from 'react';
import { formatShortId } from '@/lib/utils';
import { cn } from '@/lib/cn';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TruncatedIdProps {
  id: string;
  chars?: number;
  className?: string;
}

export function TruncatedId({ id, chars = 4, className }: TruncatedIdProps) {
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
            className={cn(
              'inline-flex items-center justify-center rounded px-2 py-1 min-h-[44px] min-w-[44px] font-mono text-xs',
              'bg-background-secondary text-info/80',
              'hover:bg-background-tertiary hover:text-info',
              'cursor-pointer transition-colors select-none',
              copied && 'text-primary',
              className
            )}
            onClick={handleCopy}
            role="button"
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCopy(e as unknown as React.MouseEvent); } }}
          >
            {formatShortId(id, chars)}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-mono text-xs">{copied ? <span className="text-primary font-semibold">Copied!</span> : id}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
