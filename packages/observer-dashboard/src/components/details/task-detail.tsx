"use client";
import dynamic from "next/dynamic";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTaskDetail } from "@/hooks/use-run-detail";
import { Loader2, Hand } from "lucide-react";
import { Kbd } from "@/components/shared/kbd";

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
}

export function TaskDetailPanel({ runId, effectId, activeTab, onTabChange, runDuration, allTasks }: TaskDetailPanelProps) {
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
    <Tabs data-testid="task-detail-tabs" value={activeTab} onValueChange={onTabChange} defaultValue={defaultTab} className="h-full flex flex-col">
      <TabsList className="shrink-0 mx-4 mt-3">
        {isBreakpoint && (
          <TabsTrigger value="breakpoint" className="gap-1.5">
            <Hand className="h-3 w-3" />
            Approval
            <Kbd className="ml-0.5 opacity-50">5</Kbd>
          </TabsTrigger>
        )}
        <TabsTrigger value="agent" className="gap-1.5">Agent <Kbd className="ml-0.5 opacity-50">1</Kbd></TabsTrigger>
        <TabsTrigger value="timing" className="gap-1.5">Timing <Kbd className="ml-0.5 opacity-50">2</Kbd></TabsTrigger>
        <TabsTrigger value="logs" className="gap-1.5">Logs <Kbd className="ml-0.5 opacity-50">3</Kbd></TabsTrigger>
        <TabsTrigger value="data" className="gap-1.5">Data <Kbd className="ml-0.5 opacity-50">4</Kbd></TabsTrigger>
      </TabsList>
      <div className="flex-1 overflow-y-auto">
        {isBreakpoint && task && (
          <TabsContent value="breakpoint">
            <BreakpointPanel
              task={task}
              runId={runId}
            />
          </TabsContent>
        )}
        <TabsContent value="agent"><AgentPanel task={task} /></TabsContent>
        <TabsContent value="timing"><TimingPanel task={task} runDuration={runDuration} allTasks={allTasks} /></TabsContent>
        <TabsContent value="logs"><LogViewer task={task} /></TabsContent>
        <TabsContent value="data"><JsonTree task={task} /></TabsContent>
      </div>
    </Tabs>
  );
}
