"use client";
import dynamic from "next/dynamic";
import type { KanbanExecutionContextEnvelope } from "@a5c-ai/agent-mux-core/kanban";

import type { DispatchContextAuditRecord } from "@/lib/dispatch-context-audit";
import { Kbd } from "@/components/shared/kbd";
import { Tabs } from "@a5c-ai/compendium";
import { useTaskDetail } from "@/hooks/use-run-detail";
import { Loader2, Hand } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Loading skeletons for lazy-loaded tab panels                              */
/* -------------------------------------------------------------------------- */

function PanelSkeleton() {
  return (
    <div className="p-4 space-y-3 animate-pulse">
      <div className="h-4 w-48 rounded bg-foreground-muted/10" />
      <div className="h-3 w-full rounded bg-foreground-muted/10" />
      <div className="h-3 w-3/4 rounded bg-foreground-muted/10" />
      <div className="h-3 w-1/2 rounded bg-foreground-muted/10" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Lazy-loaded heavy components (code-split per tab)                         */
/* -------------------------------------------------------------------------- */

const AgentPanel = dynamic(
  () => import("./agent-panel").then((mod) => ({ default: mod.AgentPanel })),
  { ssr: false, loading: PanelSkeleton }
);

const TimingPanel = dynamic(
  () => import("./timing-panel").then((mod) => ({ default: mod.TimingPanel })),
  { ssr: false, loading: PanelSkeleton }
);

const LogViewer = dynamic(
  () => import("./log-viewer").then((mod) => ({ default: mod.LogViewer })),
  { ssr: false, loading: PanelSkeleton }
);

const JsonTree = dynamic(
  () => import("./json-tree").then((mod) => ({ default: mod.JsonTree })),
  { ssr: false, loading: PanelSkeleton }
);

const BreakpointPanel = dynamic(
  () => import("@/components/breakpoint/breakpoint-panel").then((mod) => ({ default: mod.BreakpointPanel })),
  { ssr: false, loading: PanelSkeleton }
);

interface TaskDetailPanelProps {
  runId: string;
  effectId: string | null;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  runDuration?: number;
  allTasks?: import("@/types").TaskEffect[];
  executionContexts?: readonly KanbanExecutionContextEnvelope[];
  executionAudits?: readonly DispatchContextAuditRecord[];
}

export function TaskDetailPanel({
  runId,
  effectId,
  activeTab,
  onTabChange,
  runDuration,
  allTasks,
  executionContexts = [],
  executionAudits = [],
}: TaskDetailPanelProps) {
  const { task, loading } = useTaskDetail(runId, effectId);

  if (!effectId) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-foreground-muted">
        Click a task to view details
      </div>
    );
  }

  if (loading && !task) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-5 w-5 animate-spin text-foreground-muted" />
      </div>
    );
  }

  const isBreakpoint = task?.kind === "breakpoint";
  const defaultTab = isBreakpoint ? "breakpoint" : "agent";

  return (
    <Tabs value={activeTab} onChange={onTabChange} defaultValue={defaultTab}
      items={[
        ...(isBreakpoint && task ? [{ value: "breakpoint", label: "Approval", body: (<div><BreakpointPanel task={task} runId={runId} /></div>) }] : []),
        { value: "agent", label: "Agent", body: (<div><AgentPanel task={task} executionContexts={executionContexts} executionAudits={executionAudits} /></div>) },
        { value: "timing", label: "Timing", body: (<div><TimingPanel task={task} runDuration={runDuration} allTasks={allTasks} /></div>) },
        { value: "logs", label: "Logs", body: (<div><LogViewer task={task} /></div>) },
        { value: "data", label: "Data", body: (<div><JsonTree task={task} /></div>) },
      ]}
    />
  );
}
