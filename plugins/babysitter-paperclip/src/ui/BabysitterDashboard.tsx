/**
 * Dashboard widget showing babysitter run overview.
 *
 * Displays active runs, pending breakpoints count, and quick status badges.
 */

import { usePluginData } from "@paperclipai/plugin-sdk/ui";
import type { PluginWidgetProps } from "@paperclipai/plugin-sdk/ui";

interface RunsOverview {
  activeRuns: Array<{
    runId: string;
    processId: string;
    status: string;
    pendingBreakpoints: Array<{ effectId: string; title: string }>;
  }>;
  pendingBreakpoints: number;
  totalRuns: number;
}

export function BabysitterDashboard({ context }: PluginWidgetProps) {
  const { data, loading, error, refresh } = usePluginData<RunsOverview>(
    "runs-overview",
    { companyId: context.companyId }
  );

  if (loading) {
    return <div style={{ padding: 16 }}>Loading runs...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 16, color: "var(--destructive)" }}>
        Error: {error.message}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ display: "grid", gap: 12, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>Babysitter Orchestration</strong>
        <button onClick={refresh} style={{ fontSize: 12 }}>
          Refresh
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <StatCard label="Active" value={data.activeRuns.length} />
        <StatCard label="Breakpoints" value={data.pendingBreakpoints} highlight={data.pendingBreakpoints > 0} />
        <StatCard label="Total" value={data.totalRuns} />
      </div>

      {data.activeRuns.length > 0 && (
        <div style={{ display: "grid", gap: 4 }}>
          {data.activeRuns.slice(0, 5).map((run) => (
            <div
              key={run.runId}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "4px 8px",
                borderRadius: 4,
                background: "var(--muted)",
                fontSize: 12,
              }}
            >
              <span style={{ fontFamily: "monospace" }}>
                {run.processId}
              </span>
              <StatusBadge status={run.status} />
            </div>
          ))}
        </div>
      )}

      {data.activeRuns.length === 0 && (
        <div style={{ color: "var(--muted-foreground)", fontSize: 13 }}>
          No active runs
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "8px 4px",
        borderRadius: 6,
        background: highlight ? "var(--destructive)" : "var(--muted)",
        color: highlight ? "var(--destructive-foreground)" : "inherit",
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 600 }}>{value}</div>
      <div style={{ fontSize: 11, opacity: 0.7 }}>{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    running: "#22c55e",
    waiting: "#eab308",
    completed: "#6b7280",
    failed: "#ef4444",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: colors[status] ?? "#6b7280",
        }}
      />
      {status}
    </span>
  );
}
