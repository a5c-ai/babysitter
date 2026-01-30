"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface MetadataDisplayProps {
  /** Data to display */
  data: Record<string, unknown>;
  /** Display mode */
  mode?: "table" | "json" | "auto";
  /** Show copy button */
  showCopy?: boolean;
  /** Maximum depth for nested objects */
  maxDepth?: number;
  /** Custom class name */
  className?: string;
}

export function MetadataDisplay({
  data,
  mode = "auto",
  showCopy = true,
  maxDepth = 3,
  className,
}: MetadataDisplayProps) {
  const [copied, setCopied] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"table" | "json">(
    mode === "auto" ? determineMode(data) : mode
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const toggleMode = () => {
    setViewMode((prev) => (prev === "table" ? "json" : "table"));
  };

  if (!data || Object.keys(data).length === 0) {
    return (
      <p className={cn("text-sm text-[var(--color-fg-muted)]", className)}>
        No metadata available
      </p>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Controls */}
      <div className="flex items-center justify-end gap-2">
        {mode === "auto" && (
          <Button variant="outline" size="sm" onClick={toggleMode}>
            {viewMode === "table" ? (
              <>
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                JSON View
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Table View
              </>
            )}
          </Button>
        )}

        {showCopy && (
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <svg className="h-4 w-4 mr-1 text-[var(--color-success-fg)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </Button>
        )}
      </div>

      {/* Content */}
      {viewMode === "table" ? (
        <MetadataTable data={data} maxDepth={maxDepth} />
      ) : (
        <JsonViewer data={data} />
      )}
    </div>
  );
}

// Determine the best display mode based on data complexity
function determineMode(data: Record<string, unknown>): "table" | "json" {
  const hasComplexValues = Object.values(data).some(
    (value) =>
      Array.isArray(value) ||
      (typeof value === "object" && value !== null && Object.keys(value as object).length > 3)
  );
  return hasComplexValues ? "json" : "table";
}

// Table view component
function MetadataTable({
  data,
  maxDepth,
  depth = 0,
}: {
  data: Record<string, unknown>;
  maxDepth: number;
  depth?: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <tbody>
          {Object.entries(data).map(([key, value]) => (
            <tr key={key} className="border-b border-[var(--color-border-default)] last:border-b-0">
              <td className="py-2 pr-4 align-top font-medium text-[var(--color-fg-muted)] whitespace-nowrap">
                {key}
              </td>
              <td className="py-2 text-[var(--color-fg-default)]">
                <MetadataValue value={value} maxDepth={maxDepth} depth={depth} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Render a single value
function MetadataValue({
  value,
  maxDepth,
  depth,
}: {
  value: unknown;
  maxDepth: number;
  depth: number;
}) {
  if (value === null || value === undefined) {
    return <span className="text-[var(--color-fg-muted)] italic">null</span>;
  }

  if (typeof value === "boolean") {
    return (
      <Badge variant={value ? "success" : "outline"}>
        {value ? "true" : "false"}
      </Badge>
    );
  }

  if (typeof value === "number") {
    return <span className="font-mono text-[var(--color-accent-fg)]">{value}</span>;
  }

  if (typeof value === "string") {
    // Check if it's a URL
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--color-accent-fg)] hover:underline"
        >
          {value}
        </a>
      );
    }
    return <span>{value}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-[var(--color-fg-muted)] italic">[]</span>;
    }

    // Check if it's a simple array of strings
    if (value.every((item) => typeof item === "string")) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {String(item)}
            </Badge>
          ))}
        </div>
      );
    }

    // Complex array - show as JSON
    return (
      <pre className="overflow-x-auto rounded bg-[var(--color-canvas-subtle)] p-2 text-xs">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  if (typeof value === "object") {
    if (depth >= maxDepth) {
      return (
        <pre className="overflow-x-auto rounded bg-[var(--color-canvas-subtle)] p-2 text-xs">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    return (
      <div className="rounded border border-[var(--color-border-default)] bg-[var(--color-canvas-subtle)] p-2 mt-1">
        <MetadataTable
          data={value as Record<string, unknown>}
          maxDepth={maxDepth}
          depth={depth + 1}
        />
      </div>
    );
  }

  return <span>{String(value)}</span>;
}

// JSON viewer component
function JsonViewer({ data }: { data: Record<string, unknown> }) {
  return (
    <pre className="overflow-x-auto rounded-md bg-[var(--color-canvas-subtle)] p-4 text-sm font-mono">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export default MetadataDisplay;
