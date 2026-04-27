"use client";
import { useState } from "react";
import { formatShortId } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

interface FriendlyIdProps {
  id: string;
  className?: string;
}

export function FriendlyId({ id, className }: FriendlyIdProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleCopy}
            className={cn(
              "inline-flex items-center rounded px-1.5 py-0.5 font-mono text-xs",
              "bg-background-secondary text-info/80",
              "hover:bg-background-tertiary hover:text-info transition-colors cursor-pointer",
              copied && "text-primary",
              className
            )}
          >
            {formatShortId(id)}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-mono text-xs">{copied ? <span className="text-primary font-semibold">Copied!</span> : id}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
