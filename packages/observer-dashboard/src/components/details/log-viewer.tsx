"use client";

import { useState, useCallback } from "react";
import { Copy, Check, Terminal, AlertTriangle, Info, ChevronDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TaskDetail } from "@/types";

const LINE_LIMIT = 100;

/** Adds line numbers to a text block with optional line limit */
function NumberedPre({ text, colorClass, limit }: { text: string; colorClass: string; limit?: number }) {
  const allLines = text.split("\n");
  const [showAll, setShowAll] = useState(false);
  const isLong = limit != null && allLines.length > limit;
  const lines = isLong && !showAll ? allLines.slice(0, limit) : allLines;

  return (
    <>
      <pre className="rounded-b-md bg-background p-0 text-xs font-mono whitespace-pre-wrap overflow-x-auto">
        {lines.map((line, i) => (
          <div key={i} className="flex hover:bg-background-secondary/50 transition-colors">
            <span className="select-none text-foreground-muted/40 text-right w-8 flex-shrink-0 pr-2 py-px border-r border-border/30">
              {i + 1}
            </span>
            <span className={`${colorClass} pl-2 py-px flex-1 break-all`}>{line}</span>
          </div>
        ))}
      </pre>
      {isLong && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs leading-tight text-foreground-muted hover:text-primary bg-background-secondary/30 hover:bg-background-secondary hover:shadow-neon-glow-primary-xs transition-all border-t border-border/30"
        >
          <ChevronDown className="h-3 w-3" />
          Show all {allLines.length} lines
        </button>
      )}
    </>
  );
}

/** Copy button for log sections */
function LogCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs leading-tight text-foreground-muted hover:text-primary hover:shadow-glow-primary transition-all px-1.5 py-0.5 rounded hover:bg-primary-muted"
      title="Copy all"
    >
      {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/** Section header bar for each log type */
function LogSectionHeader({ label, colorClass, icon, text }: { label: string; colorClass: string; icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center justify-between rounded-t-md bg-background-secondary/60 border-b border-border/50 px-3 py-1.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className={`text-xs font-medium tracking-wider ${colorClass}`}>{label}</span>
      </div>
      <LogCopyButton text={text} />
    </div>
  );
}

export function LogViewer({ task }: { task: TaskDetail | null }) {
  if (!task) return <div className="p-4 text-sm text-foreground-muted">Select a task to view logs</div>;

  const hasProcessLogs = task.stdout || task.stderr;

  // For agent/skill tasks without process logs, show the result summary as output
  const agentOutput = !hasProcessLogs && task.result
    ? JSON.stringify(task.result.result ?? task.result.value ?? task.result, null, 2)
    : undefined;

  const hasAnyOutput = hasProcessLogs || agentOutput;

  if (!hasAnyOutput) {
    const hint = (task.kind === "agent" || task.kind === "skill")
      ? "Agent tasks don't produce stdout/stderr. Results will appear here once the task completes."
      : "No logs captured for this task.";
    return <div className="p-4 text-sm text-foreground-muted">{hint}</div>;
  }

  return (
    <div className="space-y-4 p-4">
      {task.stdout && (
        <div className="rounded-md border border-border/50 overflow-hidden">
          <LogSectionHeader
            label="stdout"
            colorClass="text-success"
            icon={<Terminal className="h-3 w-3 text-success" />}
            text={task.stdout}
          />
          <ScrollArea className="max-h-[60vh]">
            <NumberedPre text={task.stdout} colorClass="text-success" limit={LINE_LIMIT} />
          </ScrollArea>
        </div>
      )}
      {task.stderr && (
        <div className="rounded-md border border-error/20 overflow-hidden">
          <LogSectionHeader
            label="stderr"
            colorClass="text-error"
            icon={<AlertTriangle className="h-3 w-3 text-error" />}
            text={task.stderr}
          />
          <ScrollArea className="max-h-[60vh]">
            <NumberedPre text={task.stderr} colorClass="text-error" limit={LINE_LIMIT} />
          </ScrollArea>
        </div>
      )}
      {agentOutput && (
        <div className="rounded-md border border-secondary/20 overflow-hidden">
          <LogSectionHeader
            label="output"
            colorClass="text-secondary"
            icon={<Info className="h-3 w-3 text-secondary" />}
            text={agentOutput}
          />
          <ScrollArea className="max-h-[60vh]">
            <NumberedPre text={agentOutput} colorClass="text-secondary" limit={LINE_LIMIT} />
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
