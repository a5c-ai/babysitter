"use client";

import React, { useState } from "react";
import { ChevronRight, Copy, Check } from "lucide-react";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ */
/*  CopyButton                                                         */
/* ------------------------------------------------------------------ */

/** Unified copy button -- size='sm' for inline JSON values, size='md' for metadata/findings */
export function CopyButton({ value, size = "md", className: extraClass }: { value: string; size?: "sm" | "md"; className?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }).catch(() => {});
  };

  const sizeClasses = size === "sm"
    ? "h-4 w-4"
    : "min-h-[44px] min-w-[44px]";
  const iconClasses = size === "sm"
    ? "h-2.5 w-2.5"
    : "h-3 w-3";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center justify-center rounded text-foreground-muted hover:text-primary hover:bg-primary-muted transition-all",
        sizeClasses,
        size === "sm" && "opacity-0 group-hover/json-row:opacity-100 ml-1",
        size === "md" && "shrink-0",
        extraClass,
      )}
      title="Copy"
    >
      {copied ? <Check className={cn(iconClasses, "text-success")} /> : <Copy className={iconClasses} />}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Primitive value renderer -- neon brand colors                       */
/* ------------------------------------------------------------------ */

const PrimitiveValue = React.memo(function PrimitiveValue({ value }: { value: unknown }) {
  if (value === null) {
    return <span className="text-foreground-muted italic">null</span>;
  }
  if (value === undefined) {
    return <span className="text-foreground-muted italic">undefined</span>;
  }
  if (typeof value === "string") {
    return <span className="text-success">&quot;{value}&quot;</span>;
  }
  if (typeof value === "number") {
    return <span className="text-warning">{String(value)}</span>;
  }
  if (typeof value === "boolean") {
    return <span className="text-primary">{String(value)}</span>;
  }
  // Fallback for anything unexpected
  return <span className="text-foreground-secondary">{String(value)}</span>;
});

PrimitiveValue.displayName = "PrimitiveValue";

/* ------------------------------------------------------------------ */
/*  Recursive JSON node                                                */
/* ------------------------------------------------------------------ */

interface JsonNodeProps {
  /** The key name to display (null for root or array elements) */
  keyName: string | null;
  /** The value to render */
  value: unknown;
  /** Whether to default to expanded */
  defaultExpanded?: boolean;
  /** Whether this is the last item in its parent (controls trailing comma) */
  isLast?: boolean;
}

const JsonNode = React.memo(function JsonNode({ keyName, value, defaultExpanded, isLast = true }: JsonNodeProps) {
  const isObject = value !== null && typeof value === "object" && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isExpandable = isObject || isArray;

  // Determine default expanded state based on size thresholds
  const [expanded, setExpanded] = useState((): boolean => {
    if (defaultExpanded !== undefined) return defaultExpanded;
    if (isObject) {
      return Object.keys(value as Record<string, unknown>).length <= 10;
    }
    if (isArray) {
      return (value as unknown[]).length <= 5;
    }
    return true;
  });

  const toggle = () => setExpanded((prev) => !prev);

  // Key label prefix -- neon cyan for keys
  const keyLabel = keyName !== null ? (
    <>
      <span className="text-secondary">{keyName}</span>
      <span className="text-foreground-muted">: </span>
    </>
  ) : null;

  // Leaf / primitive node
  if (!isExpandable) {
    const copyVal = typeof value === "string" ? value : JSON.stringify(value);
    return (
      <div className="group/json-row flex items-baseline py-px px-1 rounded hover:bg-background-secondary transition-colors">
        {keyLabel}
        <PrimitiveValue value={value} />
        {!isLast && <span className="text-foreground-muted">,</span>}
        <CopyButton value={copyVal} size="sm" />
      </div>
    );
  }

  // Object or Array node
  const entries = isArray
    ? (value as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>);

  const openBracket = isArray ? "[" : "{";
  const closeBracket = isArray ? "]" : "}";
  const itemCount = entries.length;
  const countLabel = isArray
    ? `${itemCount} item${itemCount !== 1 ? "s" : ""}`
    : `${itemCount} key${itemCount !== 1 ? "s" : ""}`;

  return (
    <div>
      {/* Toggle row */}
      <div
        className="flex items-baseline py-0.5 px-1 rounded cursor-pointer hover:bg-background-secondary transition-colors select-none"
        onClick={toggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <ChevronRight
          className={cn(
            "h-3 w-3 shrink-0 text-primary transition-transform duration-150 mr-1 relative top-[1px]",
            expanded && "rotate-90"
          )}
        />
        {keyLabel}
        <span className="text-foreground-muted">{openBracket}</span>
        {!expanded && (
          <>
            <span className="mx-1 text-xs leading-tight text-foreground-muted bg-background-tertiary px-1.5 py-0.5 rounded">
              {countLabel}
            </span>
            <span className="text-foreground-muted">{closeBracket}</span>
            {!isLast && <span className="text-foreground-muted">,</span>}
          </>
        )}
      </div>

      {/* Children */}
      {expanded && (
        <div className="animate-[fadeIn_100ms_ease-out]">
          <div className="pl-4 border-l border-primary/20 ml-1.5">
            {entries.map(([key, val], idx) => (
              <JsonNode
                key={key}
                keyName={isArray ? null : key}
                value={val}
                isLast={idx === entries.length - 1}
              />
            ))}
            {itemCount === 0 && (
              <div className="py-px px-1 text-foreground-muted italic">empty</div>
            )}
          </div>
          <div className="flex items-baseline py-px px-1">
            <span className="text-foreground-muted">{closeBracket}</span>
            {!isLast && <span className="text-foreground-muted">,</span>}
          </div>
        </div>
      )}
    </div>
  );
});

JsonNode.displayName = "JsonNode";

/* ------------------------------------------------------------------ */
/*  Standalone JsonTreeView (generic, works with any data)             */
/* ------------------------------------------------------------------ */

interface JsonTreeViewProps {
  data: unknown;
  defaultExpanded?: boolean;
}

export function JsonTreeView({ data, defaultExpanded }: JsonTreeViewProps) {
  if (data === undefined || data === null) {
    return <span className="text-foreground-muted">{String(data ?? "null")}</span>;
  }
  return (
    <div className="font-mono text-xs">
      <JsonNode keyName={null} value={data} defaultExpanded={defaultExpanded} isLast />
    </div>
  );
}

export { JsonNode };
export type { JsonNodeProps, JsonTreeViewProps };
