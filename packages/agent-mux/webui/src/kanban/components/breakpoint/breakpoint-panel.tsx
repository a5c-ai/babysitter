"use client";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { FilePreview } from "./file-preview";
import { BreakpointApproval } from "./breakpoint-approval";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Hand, CheckCircle2 } from "lucide-react";
import { TruncatedId } from "@/components/shared/truncated-id";
import type { TaskDetail } from "@/types";

interface BreakpointPanelProps {
  task: TaskDetail;
  runId: string;
}

export function BreakpointPanel({ task, runId }: BreakpointPanelProps) {
  const breakpoint = task.breakpoint;
  const question = breakpoint?.question || task.breakpointQuestion || "Approval required";
  const title = breakpoint?.title || task.title || "Breakpoint";
  const files = breakpoint?.context?.files || [];
  const isWaiting = task.status === "requested";

  return (
    <ScrollArea className="h-full">
      <div data-testid="breakpoint-panel" className="space-y-5 p-4">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Hand className={cn("h-4 w-4 text-warning", isWaiting && "animate-pulse-dot")} />
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="warning">Breakpoint</Badge>
            {task.status === "resolved" && (
              <Badge variant="success">Already Resolved</Badge>
            )}
          </div>
          <TruncatedId id={task.effectId} chars={4} className="text-foreground-muted" />
        </div>

        {/* Question callout — sun yellow border with warm glow */}
        <div
          className={cn(
            "rounded-lg border-2 p-5",
            "bg-warning-muted border-warning/40",
            isWaiting && "animate-breakpoint-glow"
          )}
          style={isWaiting ? { boxShadow: "var(--breakpoint-glow)" } : undefined}
        >
          <div className="flex items-start gap-3">
            <Hand className="h-6 w-6 text-warning shrink-0 mt-0.5 animate-pulse-dot" />
            <div className="min-w-0">
              <h4 className={cn(
                "text-xs leading-tight font-medium uppercase tracking-widest mb-2",
                isWaiting ? "text-warning" : "text-success"
              )}>
                {isWaiting ? "Awaiting decision" : "Decision made"}
              </h4>
              <p data-testid="breakpoint-question" className="text-base text-foreground font-medium leading-relaxed whitespace-pre-wrap break-words">
                {question}
              </p>
            </div>
          </div>
        </div>

        {/* Local approval form — only for pending breakpoints */}
        {isWaiting && (
          <BreakpointApproval task={task} runId={runId} />
        )}

        {/* Attached files */}
        {files.length > 0 && (
          <FilePreview files={files} runId={runId} effectId={task.effectId} />
        )}

        {/* Resolved state — neon green success glow */}
        {task.status === "resolved" && (
          <div className="rounded-lg bg-success-muted border border-success/30 p-4 flex items-center gap-3 shadow-glow-success">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-success/15">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <span className="text-sm text-success font-semibold block">
                Approved
              </span>
              <span className="text-xs leading-tight text-foreground-muted">
                Breakpoint has been resolved
              </span>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
