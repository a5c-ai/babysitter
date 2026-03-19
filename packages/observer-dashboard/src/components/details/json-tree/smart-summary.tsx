"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Clock,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { CopyButton, JsonNode, JsonTreeView } from "./json-node";
import { formatLabel } from "./categorize";

/* ------------------------------------------------------------------ */
/*  SmartSectionHeader                                                  */
/* ------------------------------------------------------------------ */

/** SmartSectionHeader -- reusable section header with consistent styling */
export function SmartSectionHeader({ children, className: extraClass }: { children: React.ReactNode; className?: string }) {
  return (
    <h4 className={cn("text-xs font-medium text-foreground-muted tracking-wider uppercase pl-2 border-l-2 border-primary", extraClass)}>
      {children}
    </h4>
  );
}

/* ------------------------------------------------------------------ */
/*  StatusPill                                                          */
/* ------------------------------------------------------------------ */

/** Status pill -- colored dot + text */
export function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const isOk =
    normalized === "ok" ||
    normalized === "success" ||
    normalized === "resolved" ||
    normalized === "completed" ||
    normalized === "pass";
  const isError =
    normalized === "error" ||
    normalized === "failed" ||
    normalized === "fail" ||
    normalized === "rejected";
  const isPending =
    normalized === "pending" ||
    normalized === "waiting" ||
    normalized === "running" ||
    normalized === "requested";

  const dotColor = isOk
    ? "bg-success"
    : isError
      ? "bg-error"
      : isPending
        ? "bg-warning"
        : "bg-foreground-muted";

  const textColor = isOk
    ? "text-success"
    : isError
      ? "text-error"
      : isPending
        ? "text-warning"
        : "text-foreground-secondary";

  const bgColor = isOk
    ? "bg-success-muted"
    : isError
      ? "bg-error-muted"
      : isPending
        ? "bg-warning-muted"
        : "bg-background-tertiary";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium",
        bgColor,
        textColor
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full animate-pulse-dot", dotColor)}
      />
      {status}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  ScoreBar                                                            */
/* ------------------------------------------------------------------ */

/** Score bar -- colored progress indicator */
export function ScoreBar({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const color =
    clamped < 50 ? "bg-error" : clamped < 80 ? "bg-warning" : "bg-success";
  const glowShadow =
    clamped < 50
      ? "shadow-progress-glow-error"
      : clamped < 80
        ? "shadow-progress-glow-warning"
        : "shadow-progress-glow-success";
  const textColor =
    clamped < 50
      ? "text-error"
      : clamped < 80
        ? "text-warning"
        : "text-success";

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <span className={cn("text-[11px] font-mono font-bold", textColor)}>
        {score}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-background-tertiary overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color, glowShadow)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-xs text-foreground-muted">/100</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  QualityBadge                                                        */
/* ------------------------------------------------------------------ */

/** Quality pass/fail badge */
export function QualityBadge({ passes }: { passes: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium",
        passes
          ? "bg-success-muted text-success"
          : "bg-error-muted text-error"
      )}
    >
      {passes ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      {passes ? "Pass" : "Fail"}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  AtAGlanceHeader                                                     */
/* ------------------------------------------------------------------ */

/** At-a-Glance Header Bar */
export function AtAGlanceHeader({
  status,
  score,
  passesQuality,
  taskId,
}: {
  status: string | null;
  score: number | null;
  passesQuality: boolean | null;
  taskId: string | null;
}) {
  const hasAny =
    status !== null ||
    score !== null ||
    passesQuality !== null ||
    taskId !== null;
  if (!hasAny) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-background-secondary/60 border border-border/50 px-3 py-2">
      {status !== null && <StatusPill status={status} />}
      {score !== null && <ScoreBar score={score} />}
      {passesQuality !== null && <QualityBadge passes={passesQuality} />}
      {taskId !== null && (
        <span className="flex items-center gap-1 text-[11px] text-foreground-muted font-mono">
          <Hash className="h-3 w-3" />
          <span title={taskId}>
            {taskId.length > 12
              ? taskId.slice(0, 6) + "\u2026" + taskId.slice(-4)
              : taskId}
          </span>
          <CopyButton value={taskId} />
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  BooleanFlagsGrid                                                    */
/* ------------------------------------------------------------------ */

/** Boolean Flags Grid */
export function BooleanFlagsGrid({
  booleans,
}: {
  booleans: Array<{ key: string; value: boolean }>;
}) {
  if (booleans.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <SmartSectionHeader>Flags</SmartSectionHeader>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {booleans.map(({ key, value }) => (
          <div
            key={key}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium border transition-colors",
              value
                ? "bg-success-muted/50 border-success/20 text-success"
                : "bg-background-tertiary/50 border-border/30 text-foreground-muted"
            )}
          >
            {value ? (
              <CheckCircle2 className="h-3 w-3 shrink-0" />
            ) : (
              <XCircle className="h-3 w-3 shrink-0" />
            )}
            <span className="truncate">{formatLabel(key)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FindingCard & FindingsSection                                       */
/* ------------------------------------------------------------------ */

/** Single finding card with truncation + expand */
function FindingCard({
  index,
  text,
  isWarning,
}: {
  index: number;
  text: string;
  isWarning: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 120;
  const display = isLong && !expanded ? text.slice(0, 120) + "\u2026" : text;

  const Icon = isWarning ? AlertTriangle : Info;
  const iconColor = isWarning ? "text-warning" : "text-info";

  return (
    <div className="group/finding flex items-start gap-2 rounded-md bg-background-secondary/50 border border-border/40 px-3 py-2 transition-colors hover:border-border-hover/60">
      <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", iconColor)} />
      <div className="flex-1 min-w-0">
        <span className="text-[11px] text-foreground-muted font-mono mr-1.5">
          {index}.
        </span>
        <span className="text-xs text-foreground-secondary leading-relaxed">
          {display}
        </span>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="ml-1 text-xs text-primary hover:text-primary-hover transition-colors min-h-[44px] inline-flex items-center"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>
      <span className="opacity-0 group-hover/finding:opacity-100 transition-opacity">
        <CopyButton value={text} />
      </span>
    </div>
  );
}

/** Findings / Issues Section */
export function FindingsSection({
  findings,
}: {
  findings: Array<{ key: string; items: string[] }>;
}) {
  if (findings.length === 0) return null;

  const warningKeys = new Set([
    "issues",
    "errors",
    "warnings",
    "problems",
  ]);

  return (
    <>
      {findings.map(({ key, items }) => {
        const isWarning = warningKeys.has(key.toLowerCase());
        const Icon = isWarning ? AlertTriangle : Info;
        const iconColor = isWarning ? "text-warning" : "text-info";

        return (
          <div key={key} className="space-y-1.5">
            <SmartSectionHeader className="flex items-center gap-1.5">
              <Icon className={cn("h-3 w-3", iconColor)} />
              {formatLabel(key)}
              <span className="ml-1 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-primary-muted text-primary text-xs font-bold">
                {items.length}
              </span>
            </SmartSectionHeader>
            <div className="space-y-1">
              {items.map((item, i) => (
                <FindingCard
                  key={`${key}-${i}`}
                  index={i + 1}
                  text={item}
                  isWarning={isWarning}
                />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  SummaryBlock                                                        */
/* ------------------------------------------------------------------ */

/** Summary Block -- quote/info style card */
export function SummaryBlock({ summary }: { summary: string }) {
  return (
    <div className="space-y-1.5">
      <SmartSectionHeader>Summary</SmartSectionHeader>
      <div className="rounded-md bg-background-secondary/50 border border-border/40 border-l-[3px] border-l-secondary px-3 py-2.5">
        <p className="text-xs text-foreground-secondary leading-relaxed">
          {summary}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Timestamp & ID helpers                                              */
/* ------------------------------------------------------------------ */

/** Format a timestamp as relative time with full ISO on hover */
function formatRelativeTime(value: string): { relative: string; full: string } | null {
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;

  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let relative: string;
  if (seconds < 60) relative = `${seconds}s ago`;
  else if (minutes < 60) relative = `${minutes}m ago`;
  else if (hours < 24) relative = `${hours}h ago`;
  else relative = `${days}d ago`;

  return { relative, full: date.toISOString() };
}

/** Check if a string looks like an ISO timestamp */
function isTimestamp(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T/.test(value) || /^\d{4}-\d{2}-\d{2} /.test(value);
}

/** Check if a string looks like an ID (long hex, uuid, etc.) */
function isIdLike(value: string): boolean {
  return /^[a-f0-9-]{16,}$/i.test(value) || /^[a-zA-Z0-9_-]{20,}$/.test(value);
}

/* ------------------------------------------------------------------ */
/*  MetadataGrid & MetadataRow                                          */
/* ------------------------------------------------------------------ */

/** Single metadata row */
function MetadataRow({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  const strVal = value === null ? "null" : String(value);

  // Timestamp formatting
  if (typeof value === "string" && isTimestamp(value)) {
    const rel = formatRelativeTime(value);
    if (rel) {
      return (
        <div className="flex items-baseline gap-2 py-0.5 min-w-0">
          <span className="text-xs text-foreground-muted uppercase tracking-wider shrink-0">
            {formatLabel(label)}
          </span>
          <span
            className="text-xs text-foreground-secondary font-mono flex items-center gap-1 truncate"
            title={rel.full}
          >
            <Clock className="h-2.5 w-2.5 shrink-0 text-foreground-muted" />
            {rel.relative}
          </span>
        </div>
      );
    }
  }

  // ID-like values -- truncate + copy
  if (typeof value === "string" && isIdLike(value)) {
    const truncated =
      value.length > 16
        ? value.slice(0, 8) + "\u2026" + value.slice(-4)
        : value;
    return (
      <div className="flex items-baseline gap-2 py-0.5 min-w-0">
        <span className="text-xs text-foreground-muted uppercase tracking-wider shrink-0">
          {formatLabel(label)}
        </span>
        <span
          className="text-xs text-foreground-secondary font-mono truncate"
          title={value}
        >
          {truncated}
        </span>
        <CopyButton value={value} />
      </div>
    );
  }

  // Boolean in metadata (from the < 2 fallback)
  if (typeof value === "boolean") {
    return (
      <div className="flex items-baseline gap-2 py-0.5 min-w-0">
        <span className="text-xs text-foreground-muted uppercase tracking-wider shrink-0">
          {formatLabel(label)}
        </span>
        <span
          className={cn(
            "text-xs font-mono",
            value ? "text-success" : "text-error"
          )}
        >
          {String(value)}
        </span>
      </div>
    );
  }

  // Default
  return (
    <div className="flex items-baseline gap-2 py-0.5 min-w-0">
      <span className="text-xs text-foreground-muted uppercase tracking-wider shrink-0">
        {formatLabel(label)}
      </span>
      <span className="text-xs text-foreground-secondary font-mono truncate" title={strVal}>
        {strVal.length > 60 ? strVal.slice(0, 60) + "\u2026" : strVal}
      </span>
    </div>
  );
}

/** Metadata Grid -- compact 2-column key-value layout */
export function MetadataGrid({
  metadata,
}: {
  metadata: Array<{ key: string; value: unknown }>;
}) {
  if (metadata.length === 0) return null;

  // Separate simple (primitive) values from complex (object/array) values
  const simpleEntries = metadata.filter(
    ({ value }) =>
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
  );
  const complexEntries = metadata.filter(
    ({ value }) =>
      typeof value === "object" && value !== null
  );

  return (
    <div className="space-y-1.5">
      <SmartSectionHeader>Metadata</SmartSectionHeader>
      {simpleEntries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 rounded-md bg-background-secondary/50 border border-border/40 px-3 py-2">
          {simpleEntries.map(({ key, value }) => (
            <MetadataRow key={key} label={key} value={value} />
          ))}
        </div>
      )}
      {complexEntries.map(({ key, value }) => (
        <div key={key} className="rounded-md bg-background-secondary/50 border border-border/40 px-3 py-2">
          <div className="text-xs text-foreground-muted uppercase tracking-wider mb-1">
            {formatLabel(key)}
          </div>
          <div className="font-mono text-xs">
            <JsonNode keyName={null} value={value} isLast />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CollapsibleRawJson                                                  */
/* ------------------------------------------------------------------ */

/** Collapsible Raw JSON section */
export function CollapsibleRawJson({ data }: { data: unknown }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyAll = () => {
    try {
      const text = JSON.stringify(data, null, 2);
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }).catch(() => {});
    } catch {
      // JSON.stringify can throw on circular references
    }
  };

  return (
    <div className="space-y-0">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((p) => !p)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded((p) => !p); }
        }}
        className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md hover:bg-background-secondary/50 transition-colors group cursor-pointer select-none"
      >
        <ChevronDown
          className={cn(
            "h-3 w-3 text-primary transition-transform duration-150",
            !expanded && "-rotate-90"
          )}
        />
        <span className="text-xs font-medium text-foreground-muted tracking-wider uppercase">
          Raw JSON
        </span>
        {!expanded && (
          <span className="text-xs text-foreground-muted">
            (click to expand)
          </span>
        )}
        {expanded && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyAll();
            }}
            className="ml-auto inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-primary transition-colors px-1.5 py-0.5 rounded"
            title="Copy all JSON"
          >
            {copied ? (
              <Check className="h-3 w-3 text-success" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            Copy All
          </button>
        )}
      </div>
      {expanded && (
        <div className="animate-[fadeIn_100ms_ease-out] rounded-md bg-background-secondary p-3 mt-1">
          <JsonTreeView data={data} />
        </div>
      )}
    </div>
  );
}
