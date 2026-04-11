/**
 * Run detail tab showing full journal timeline and breakpoint approval.
 *
 * Rendered as a detail tab on agent entities in the Paperclip UI.
 */

import { usePluginData, usePluginStream } from "@paperclipai/plugin-sdk/ui";
import type { PluginDetailTabProps } from "@paperclipai/plugin-sdk/ui";
import { BreakpointApproval } from "./BreakpointApproval";

interface RunEvent {
  seq: number;
  type: string;
  recordedAt: string;
  data: Record<string, unknown>;
}

interface PendingEffect {
  effectId: string;
  kind: string;
  label: string;
  taskId: string;
  requestedAt: string;
}

interface RunDetail {
  run: {
    runId: string;
    processId: string;
    status: string;
    pendingBreakpoints: Array<{
      effectId: string;
      title: string;
      description?: string;
      options?: string[];
    }>;
  };
  events: RunEvent[];
  pendingEffects: PendingEffect[];
}

interface StreamEvent {
  type: string;
  data: Record<string, unknown>;
}

export function RunDetailTab({ context }: PluginDetailTabProps) {
  const runId = context.entityId;
  const { data, loading, error, refresh } = usePluginData<RunDetail>(
    "run-detail",
    { runId, companyId: context.companyId }
  );

  const { events: streamEvents } = usePluginStream<StreamEvent>(
    `run-events:${runId}`,
    { companyId: context.companyId ?? undefined }
  );

  if (loading) return <div style={{ padding: 16 }}>Loading run detail...</div>;
  if (error) {
    return (
      <div style={{ padding: 16, color: "var(--destructive)" }}>
        Error: {error.message}
      </div>
    );
  }
  if (!data) return null;

  const { run, events, pendingEffects } = data;
  const breakpoints = pendingEffects.filter((e) => e.kind === "breakpoint");

  return (
    <div style={{ display: "grid", gap: 16, padding: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <strong style={{ fontSize: 16 }}>{run.processId}</strong>
          <div style={{ fontSize: 12, color: "var(--muted-foreground)", fontFamily: "monospace" }}>
            {run.runId}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 4,
              fontSize: 12,
              background:
                run.status === "waiting"
                  ? "#eab308"
                  : run.status === "running"
                    ? "#22c55e"
                    : run.status === "failed"
                      ? "#ef4444"
                      : "#6b7280",
              color: "white",
            }}
          >
            {run.status}
          </span>
          <button onClick={refresh} style={{ fontSize: 12 }}>
            Refresh
          </button>
        </div>
      </div>

      {/* Pending breakpoints */}
      {breakpoints.length > 0 && (
        <div style={{ display: "grid", gap: 8 }}>
          <strong style={{ fontSize: 14 }}>
            Pending Breakpoints ({breakpoints.length})
          </strong>
          {breakpoints.map((bp) => (
            <BreakpointApproval
              key={bp.effectId}
              runId={run.runId}
              effectId={bp.effectId}
              title={bp.label}
              companyId={context.companyId ?? ""}
              onResolved={refresh}
            />
          ))}
        </div>
      )}

      {/* Journal timeline */}
      <div>
        <strong style={{ fontSize: 14 }}>Journal Timeline</strong>
        <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
          {events.map((evt) => (
            <div
              key={evt.seq}
              style={{
                display: "grid",
                gridTemplateColumns: "40px 140px 1fr",
                gap: 8,
                padding: "4px 8px",
                borderRadius: 4,
                background: "var(--muted)",
                fontSize: 12,
                fontFamily: "monospace",
              }}
            >
              <span style={{ color: "var(--muted-foreground)" }}>#{evt.seq}</span>
              <span>{evt.type}</span>
              <span style={{ color: "var(--muted-foreground)" }}>
                {new Date(evt.recordedAt).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Live stream events */}
      {streamEvents.length > 0 && (
        <div>
          <strong style={{ fontSize: 14 }}>Live Events</strong>
          <div style={{ marginTop: 8, maxHeight: 200, overflow: "auto" }}>
            {streamEvents.map((evt, i) => (
              <div key={i} style={{ fontSize: 11, fontFamily: "monospace", padding: 2 }}>
                [{evt.type}] {JSON.stringify(evt.data).slice(0, 120)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
