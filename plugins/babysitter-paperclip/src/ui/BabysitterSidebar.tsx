/**
 * Sidebar panel showing compact babysitter status.
 *
 * Displays active run count, pending breakpoints badge, and quick links.
 */

import { usePluginData, usePluginAction } from "@paperclipai/plugin-sdk/ui";
import type { PluginSidebarProps } from "@paperclipai/plugin-sdk/ui";

interface RunsOverview {
  activeRuns: Array<{
    runId: string;
    processId: string;
    status: string;
    pendingBreakpoints: Array<{ effectId: string }>;
  }>;
  pendingBreakpoints: number;
  totalRuns: number;
}

export function BabysitterSidebar({ context }: PluginSidebarProps) {
  const { data, loading, refresh } = usePluginData<RunsOverview>(
    "runs-overview",
    { companyId: context.companyId }
  );

  if (loading) {
    return <div style={{ padding: 8, fontSize: 12 }}>Loading...</div>;
  }

  if (!data) return null;

  return (
    <div style={{ padding: 12, display: "grid", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong style={{ fontSize: 13 }}>Babysitter</strong>
        <button onClick={refresh} style={{ fontSize: 10, padding: "2px 6px" }}>
          Refresh
        </button>
      </div>

      <div style={{ display: "grid", gap: 4 }}>
        <SidebarRow
          label="Active runs"
          value={String(data.activeRuns.length)}
        />
        <SidebarRow
          label="Breakpoints"
          value={String(data.pendingBreakpoints)}
          highlight={data.pendingBreakpoints > 0}
        />
        <SidebarRow
          label="Total runs"
          value={String(data.totalRuns)}
        />
      </div>

      {data.activeRuns.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 4 }}>
          {data.activeRuns.slice(0, 3).map((run) => (
            <div
              key={run.runId}
              style={{
                fontSize: 11,
                padding: "3px 0",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontFamily: "monospace", opacity: 0.8 }}>
                {run.processId.length > 20
                  ? run.processId.slice(0, 20) + "..."
                  : run.processId}
              </span>
              <span
                style={{
                  fontSize: 10,
                  padding: "1px 4px",
                  borderRadius: 3,
                  background:
                    run.status === "waiting" ? "#eab308" : "#22c55e",
                  color: "white",
                }}
              >
                {run.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 12,
      }}
    >
      <span style={{ color: "var(--muted-foreground)" }}>{label}</span>
      <span
        style={{
          fontWeight: highlight ? 700 : 400,
          color: highlight ? "var(--destructive)" : "inherit",
        }}
      >
        {value}
      </span>
    </div>
  );
}
