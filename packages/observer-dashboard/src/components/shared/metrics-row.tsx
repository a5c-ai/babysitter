import { Clock, CheckCircle2, Percent, RefreshCw, Loader2, Pause } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/utils";
import type { Run } from "@/types";

interface MetricsRowProps {
  run: Run;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
  testId?: string;
}

function MetricCard({ icon, label, value, valueColor, testId }: MetricCardProps) {
  return (
    <div data-testid={testId} className="bg-background-secondary/60 rounded-lg px-4 py-2.5 flex items-center gap-3">
      <div className="text-foreground-muted">{icon}</div>
      <div className="flex flex-col">
        <span className="text-xs leading-tight text-foreground-muted uppercase tracking-wider font-medium">{label}</span>
        <span className={cn("text-lg font-semibold tabular-nums", valueColor || "text-foreground")}>{value}</span>
      </div>
    </div>
  );
}

export function MetricsRow({ run }: MetricsRowProps) {
  const isTerminal = run.status === "completed" || run.status === "failed";
  const isRunning = run.status === "pending";
  const isWaiting = run.status === "waiting";

  const successRate =
    run.totalTasks > 0
      ? Math.round((run.completedTasks / run.totalTasks) * 100)
      : 0;

  // Count unique iterations from invocationKeys
  const iterationKeys = new Set(run.tasks.map((t) => t.invocationKey));
  const iterationCount = iterationKeys.size;

  // Semantic color for success rate (neon palette)
  const successRateColor = successRate === 100
    ? "text-success"
    : successRate >= 80
    ? "text-foreground"
    : successRate >= 50
    ? "text-warning"
    : "text-error";

  // Duration display and color
  const durationValue = isTerminal ? formatDuration(run.duration) : formatDuration(run.duration) || "...";
  const durationColor = isRunning ? "text-info" : isWaiting ? "text-warning" : undefined;

  // Status-specific icon for duration
  const durationIcon = isRunning
    ? <Loader2 className="h-4 w-4 animate-spin-smooth text-info drop-shadow-[var(--drop-glow-cyan)]" />
    : isWaiting
    ? <Pause className="h-4 w-4 text-warning" />
    : <Clock className="h-4 w-4" />;

  return (
    <div data-testid="metrics-row" className={cn(
      "flex items-center divide-x divide-primary/10 px-4 py-3 border-b border-border bg-background",
      (isRunning || isWaiting) && "opacity-90"
    )}>
      <div className="flex items-center pr-3">
        <MetricCard
          icon={durationIcon}
          label="Total Duration"
          value={durationValue}
          valueColor={durationColor}
          testId="metric-total-duration"
        />
      </div>
      <div className="flex items-center px-3">
        <MetricCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Tasks"
          value={`${run.completedTasks}/${run.totalTasks}`}
          valueColor="text-success"
          testId="metric-tasks"
        />
      </div>
      <div className="flex items-center px-3">
        <MetricCard
          icon={<Percent className="h-4 w-4" />}
          label="Success Rate"
          value={`${successRate}%`}
          valueColor={successRateColor}
          testId="metric-success-rate"
        />
      </div>
      <div className="flex items-center pl-3">
        <MetricCard
          icon={<RefreshCw className="h-4 w-4" />}
          label="Iterations"
          value={String(iterationCount)}
          testId="metric-iterations"
        />
      </div>
    </div>
  );
}
