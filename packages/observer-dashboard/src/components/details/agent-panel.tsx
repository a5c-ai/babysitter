"use client";

import { useState, useCallback } from "react";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/shared/status-badge";
import { KindBadge } from "@/components/shared/kind-badge";
import { TruncatedId } from "@/components/shared/truncated-id";
import type { TaskDetail } from "@/types";

/** Tiny copy-to-clipboard button (icon only) — magenta hover */
function CopyButton({ text }: { text: string }) {
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
      className="inline-flex items-center justify-center h-6 w-6 rounded text-foreground-muted hover:text-primary hover:bg-primary-muted transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

/** Consistent section header with magenta left border accent */
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-medium text-foreground-muted tracking-wider mb-1.5 pl-2 border-l-2 border-primary">
      {children}
    </h4>
  );
}

function renderDescription(prompt: Record<string, unknown> | undefined, description: string | null) {
  if (prompt || !description) return null;
  const text = description.length > 500 ? description.slice(0, 500) + "..." : description;
  return (
    <div>
      <SectionHeader>Description</SectionHeader>
      <p className="text-sm text-foreground-secondary whitespace-pre-wrap break-words leading-relaxed">{text}</p>
    </div>
  );
}

function ErrorSection({
  resultError,
  taskError,
}: {
  resultError: Record<string, unknown> | undefined | null;
  taskError: TaskDetail["error"] | undefined;
}) {
  const [stackExpanded, setStackExpanded] = useState(false);

  const errorName =
    taskError?.name ?? (resultError?.name != null ? String(resultError.name) : "Error");
  const errorMessage =
    taskError?.message ?? (resultError?.message != null ? String(resultError.message) : "Unknown error");
  const errorStack =
    taskError?.stack ?? (resultError?.stack != null ? String(resultError.stack) : undefined);

  return (
    <div>
      <SectionHeader>Error</SectionHeader>
      <div className="rounded-md bg-error-muted border border-error/30 border-l-[3px] border-l-error p-3 shadow-glow-error">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-error">
            {errorName}: {errorMessage}
          </p>
          <CopyButton text={`${errorName}: ${errorMessage}`} />
        </div>
        {errorStack && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setStackExpanded((prev) => !prev)}
              className="text-xs text-foreground-muted hover:text-foreground-secondary transition-colors flex items-center gap-1"
            >
              <span className="inline-block transition-transform" style={{ transform: stackExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>
                &#9654;
              </span>
              Stack Trace
            </button>
            {stackExpanded && (
              <pre className="mt-2 rounded bg-background-secondary p-2 text-[11px] font-mono text-foreground-secondary overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap break-words">
                {errorStack}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const OUTPUT_CHAR_LIMIT = 500;

function ResultOutput({ value }: { value: unknown }) {
  const [expanded, setExpanded] = useState(false);
  const fullText = JSON.stringify(value, null, 2);
  const isLong = fullText.length > OUTPUT_CHAR_LIMIT;
  const displayText = isLong && !expanded ? fullText.slice(0, OUTPUT_CHAR_LIMIT) + "\n..." : fullText;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <SectionHeader>Output</SectionHeader>
        <CopyButton text={fullText} />
      </div>
      <pre className="rounded-md bg-background-secondary border border-border/50 p-3 text-xs font-mono text-secondary overflow-x-auto max-h-[60vh] overflow-y-auto">
        {displayText}
      </pre>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 flex items-center gap-1 text-xs leading-tight text-foreground-muted hover:text-primary transition-colors"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? "Collapse" : `Expand (${fullText.length.toLocaleString()} chars)`}
        </button>
      )}
    </div>
  );
}

export function AgentPanel({ task }: { task: TaskDetail | null }) {
  if (!task) return <div className="p-4 text-sm text-foreground-muted">Select a task to view details</div>;

  // Try to find agent prompt data from taskDef or inputs
  const taskDef = task.taskDef || {};
  const inputs = task.input || (taskDef.inputs as Record<string, unknown> | undefined) || {};
  const metadata = taskDef.metadata as Record<string, unknown> | undefined;

  // Extract displayable info
  const title = task.title || task.label || task.effectId;
  const description: string | null =
    (inputs.prd as string) ||
    (inputs.description as string) ||
    (inputs.task as string) ||
    (inputs.prompt as string) ||
    (metadata?.label as string) ||
    null;

  // Check for agent prompt structure (if present)
  const agentDef = taskDef.agent as Record<string, unknown> | undefined;
  const prompt = agentDef?.prompt as Record<string, unknown> | undefined;

  // Result summary
  const resultData = task.result;
  const resultStatus = resultData?.status as string | undefined;
  const resultValue = resultData?.result || resultData?.value;
  const resultError = resultData?.error as Record<string, unknown> | undefined;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        {/* Header with title, kind, status */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">{String(title)}</h3>
          <div className="flex items-center gap-2">
            <KindBadge kind={task.kind} />
            <StatusBadge status={task.status} />
          </div>
          {task.invocationKey && (
            <TruncatedId id={task.invocationKey} chars={4} className="text-foreground-muted" />
          )}
        </div>

        {/* Agent prompt data (if present) */}
        {typeof prompt?.role === "string" && (
          <div>
            <SectionHeader>Role</SectionHeader>
            <p className="text-sm text-foreground">{prompt.role}</p>
          </div>
        )}
        {typeof prompt?.task === "string" && (
          <div>
            <SectionHeader>Task</SectionHeader>
            <p className="text-sm text-foreground">{prompt.task}</p>
          </div>
        )}
        {Array.isArray(prompt?.instructions) && (
          <div>
            <SectionHeader>Instructions</SectionHeader>
            <ol className="space-y-2">
              {(prompt.instructions as string[]).map((inst: string, i: number) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-foreground-secondary">
                  <span className="flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-secondary-muted text-secondary text-xs leading-tight font-medium mt-px">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{inst}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Description / inputs summary (when no agent prompt) */}
        {renderDescription(prompt, description)}

        {/* Result status */}
        {resultStatus != null && (
          <div>
            <SectionHeader>Result</SectionHeader>
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={resultStatus === "ok" ? "resolved" : "error"} />
            </div>
          </div>
        )}

        {/* Error display with expandable stack trace */}
        {(resultError != null || task.error != null) && (
          <ErrorSection
            resultError={resultError}
            taskError={task.error}
          />
        )}

        {/* Result value — monospace with brand accent */}
        {resultValue != null && (
          <ResultOutput value={resultValue} />
        )}
      </div>
    </ScrollArea>
  );
}
