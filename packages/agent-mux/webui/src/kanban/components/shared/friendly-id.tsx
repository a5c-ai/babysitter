"use client";
import { useState } from "react";
import { formatShortId } from "@/lib/utils";
import { Tooltip } from "@a5c-ai/compendium";
import { cx } from "@a5c-ai/compendium";

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
    <Tooltip text={copied ? "Copied!" : id}>
      <button
        onClick={handleCopy}
        className={cx(
          "inline-flex items-center rounded px-1.5 py-0.5 font-mono text-xs",
          "bg-background-secondary text-info/80",
          "hover:bg-background-tertiary hover:text-info transition-colors cursor-pointer",
          copied && "text-primary",
          className
        )}
      >
        {formatShortId(id)}
      </button>
    </Tooltip>
  );
}
