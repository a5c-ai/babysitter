"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type {
  WorkspaceRuntimeDeviceProfile,
  WorkspaceRuntimeLogLine,
  WorkspaceRuntimeSurface,
  WorkspaceTerminalCommand,
} from "@a5c-ai/agent-mux-comm";
import type { KanbanExecutionContextEnvelope } from "@a5c-ai/agent-mux-comm/kanban";
import {
  ExternalLink,
  GitBranch,
  Laptop2,
  Logs,
  Radar,
  Search,
  Smartphone,
  TabletSmartphone,
  TerminalSquare,
  WifiOff,
} from "lucide-react";

import { Button, Tabs, cx } from "@a5c-ai/compendium";
import { DispatchContextAuditPanel } from "@/components/shared/dispatch-context-audit-panel";
import { ExecutionContextPanel } from "@/components/shared/execution-context-panel";
import type { DispatchContextAuditRecord } from "@/lib/dispatch-context-audit";

type RuntimeLogProcess = {
  id: string;
  label: string;
  sourceLabel: string;
  status: WorkspaceTerminalCommand["status"] | WorkspaceRuntimeSurface["devServer"]["status"];
  command?: string;
  toolName?: string;
  startedAt?: number;
  endedAt?: number;
  exitCode?: number;
  logs: readonly WorkspaceRuntimeLogLine[];
};

function formatTimestamp(value?: number): string {
  if (!value || !Number.isFinite(value)) {
    return "unavailable";
  }
  return new Date(value).toLocaleString();
}

function statusClass(status: string): string {
  if (status === "running" || status === "ready" || status === "active") {
    return "border-success/20 bg-success/10 text-success";
  }
  if (status === "starting") {
    return "border-info/20 bg-info/10 text-info";
  }
  if (status === "error" || status === "failed") {
    return "border-error/20 bg-error/10 text-error";
  }
  return "border-border text-foreground-muted";
}

function deviceIcon(deviceId: WorkspaceRuntimeDeviceProfile["id"]) {
  switch (deviceId) {
    case "mobile":
      return Smartphone;
    case "tablet":
      return TabletSmartphone;
    default:
      return Laptop2;
  }
}

function previewHeight(device: WorkspaceRuntimeDeviceProfile): number {
  if (device.id === "mobile") {
    return 720;
  }
  if (device.id === "tablet") {
    return 680;
  }
  return 640;
}

function previewFrameMaxWidth(device: WorkspaceRuntimeDeviceProfile): number {
  const aspectRatio = device.width / device.height;
  return Math.min(device.width, 960, Math.round(previewHeight(device) * aspectRatio));
}

function commandLabel(command: WorkspaceTerminalCommand, index: number): string {
  const trimmed = command.command.trim();
  return trimmed.length > 0 ? trimmed : `Process ${index + 1}`;
}

function buildLogProcesses(runtime: WorkspaceRuntimeSurface): RuntimeLogProcess[] {
  const terminalProcesses = runtime.terminal.commands.map((command, index) => ({
    id: command.id,
    label: commandLabel(command, index),
    sourceLabel: command.source,
    status: command.status,
    command: command.command,
    toolName: command.toolName,
    startedAt: command.startedAt,
    endedAt: command.endedAt,
    exitCode: command.exitCode,
    logs: command.logs,
  }));

  if (
    runtime.devServer.status === "idle" &&
    !runtime.devServer.command &&
    runtime.devServer.logs.length === 0 &&
    runtime.devServer.urls.length === 0
  ) {
    return terminalProcesses;
  }

  return [
    ...terminalProcesses,
    {
      id: "dev-server",
      label: runtime.devServer.command?.trim() || "Dev server",
      sourceLabel: "dev server",
      status: runtime.devServer.status,
      command: runtime.devServer.command,
      logs: runtime.devServer.logs,
    },
  ];
}

function failedProcessText(process: RuntimeLogProcess): string {
  if (process.exitCode != null) {
    return `Process exited with code ${process.exitCode} before emitting logs.`;
  }
  return "Process failed before emitting logs.";
}

function ProcessLogState(props: { text: string; tone?: "default" | "error" }) {
  return (
    <div
      className={cx(
        "rounded-2xl border px-4 py-5 text-sm",
        props.tone === "error"
          ? "border-error/20 bg-error/5 text-error"
          : "border-dashed border-border bg-background/60 text-foreground-muted",
      )}
    >
      {props.text}
    </div>
  );
}

function filterLogs(logs: readonly WorkspaceRuntimeLogLine[], query: string): WorkspaceRuntimeLogLine[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [...logs];
  }
  return logs.filter((line) => line.text.toLowerCase().includes(normalizedQuery));
}

export function WorkspaceRuntimePanel(props: {
  runtime: WorkspaceRuntimeSurface;
  rebase?: WorkspaceRuntimeSurface["rebase"];
  sessionId?: string;
  sessionStatus?: string;
  audits?: readonly DispatchContextAuditRecord[];
  className?: string;
  executionContexts?: readonly KanbanExecutionContextEnvelope[];
}) {
  const defaultTab = props.rebase && props.rebase.status === "rebase-conflicts"
    ? "rebase"
    : props.runtime.preview.primaryUrl ? "preview" : props.runtime.terminal.commands.length > 0 ? "logs" : "dev-server";
  const devices = props.runtime.preview.deviceProfiles;
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [deviceId, setDeviceId] = useState<WorkspaceRuntimeDeviceProfile["id"]>(devices[0]?.id ?? "desktop");
  const [logQuery, setLogQuery] = useState("");
  const deferredLogQuery = useDeferredValue(logQuery);
  const [preferredLogProcessId, setPreferredLogProcessId] = useState<string | null>(null);

  const selectedDevice = useMemo(
    () => devices.find((device) => device.id === deviceId) ?? devices[0] ?? { id: "desktop", label: "Desktop 1440", width: 1440, height: 960 },
    [deviceId, devices],
  );

  const logProcesses = useMemo(() => buildLogProcesses(props.runtime), [props.runtime]);
  const activeLogProcess = useMemo(
    () => logProcesses.find((process) => process.id === preferredLogProcessId) ?? logProcesses[0] ?? null,
    [logProcesses, preferredLogProcessId],
  );
  const filteredLogLines = useMemo(
    () => filterLogs(activeLogProcess?.logs ?? [], deferredLogQuery),
    [activeLogProcess?.logs, deferredLogQuery],
  );
  const isDisconnected = props.sessionStatus != null && props.sessionStatus !== "active";

  useEffect(() => {
    if (activeLogProcess && activeLogProcess.id !== preferredLogProcessId) {
      setPreferredLogProcessId(activeLogProcess.id);
    }
  }, [activeLogProcess, preferredLogProcessId]);

  return (
    <section className={cx("rounded-3xl border border-border bg-card p-5 shadow-lg", props.className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Runtime surfaces</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight">Preview, logs, inspect, and dev server</h3>
          <p className="mt-2 text-sm text-foreground-muted">
            Derived from agent-mux session state and recent run events.
            {props.sessionId ? ` Session ${props.sessionId}.` : ""}
          </p>
        </div>
        <span className="rounded-full border border-border px-3 py-1.5 text-xs text-foreground-muted">
          Updated {formatTimestamp(props.runtime.updatedAt)}
        </span>
      </div>

      <Tabs value={activeTab} onChange={setActiveTab} items={[
        { value: "preview", label: "Preview", body: (<div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {devices.map((device) => {
                const Icon = deviceIcon(device.id);
                return (
                  <Button
                    key={device.id}
                    type="button"
                    variant={device.id === selectedDevice.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setDeviceId(device.id)}
                  >
                    <Icon className="h-4 w-4" />
                    {device.label}
                  </Button>
                );
              })}
            </div>
            {props.runtime.preview.primaryUrl ? (
              <Button
               
                variant="ghost"
                size="sm"
              >
                <a
                  href={props.runtime.preview.primaryUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open preview
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            ) : null}
          </div>

          {props.runtime.preview.primaryUrl ? (
            <div className="rounded-[28px] border border-border bg-background/70 p-3 sm:p-4">
              <div
                className="mx-auto w-full rounded-[24px] border border-border bg-card p-2 shadow-sm sm:p-3"
                style={{ maxWidth: `${previewFrameMaxWidth(selectedDevice)}px` }}
              >
                <div className="mb-3 flex items-center justify-between rounded-2xl border border-border bg-background/75 px-4 py-2 text-xs text-foreground-muted">
                  <span>{selectedDevice.label}</span>
                  <span>
                    {selectedDevice.width} x {selectedDevice.height}
                  </span>
                </div>
                <div
                  className="overflow-hidden rounded-2xl border border-border bg-white"
                  style={{ aspectRatio: `${selectedDevice.width} / ${selectedDevice.height}` }}
                >
                  <iframe
                    title={`Preview for ${props.runtime.workspacePath ?? "workspace"}`}
                    src={props.runtime.preview.primaryUrl}
                    className="h-full w-full bg-white"
                  />
                </div>
              </div>
            </div>
          ) : (
            <EmptyRuntimeState text="No preview URL has been detected from the workspace runtime yet." />
          )}
        </div>) },
        { value: "logs", label: "Logs", body: (<div className="space-y-4">
          {!activeLogProcess && isDisconnected ? (
            <EmptyRuntimeState
              icon={WifiOff}
              text="Logs disconnected. The selected session is not publishing runtime output right now."
            />
          ) : null}

          {!activeLogProcess && !isDisconnected ? (
            <EmptyRuntimeState text="No active processes are publishing logs yet." />
          ) : null}

          {activeLogProcess ? (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
              <div className="flex flex-col gap-2">
                  {logProcesses.map((process) => (
                    <button
                      key={process.id}
                      type="button"
                      aria-label={process.label}
                      onClick={() => setPreferredLogProcessId(process.id)}
                      className={cx(
                        "h-auto w-full rounded-2xl border bg-background/70 px-3 py-3 text-left transition-colors",
                        process.id === activeLogProcess.id ? "border-primary/30 bg-primary/8" : "border-border"
                      )}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{process.label}</div>
                        <div
                          aria-hidden="true"
                          className="mt-1 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-foreground-muted"
                        >
                          <span>{process.sourceLabel}</span>
                          <span className={cx("rounded-full border px-2 py-0.5", statusClass(process.status))}>
                            {process.status}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>

              <div className="grid gap-4">
                <article className="rounded-2xl border border-border bg-background/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-foreground">{activeLogProcess.label}</h4>
                        <span className={cx("rounded-full border px-2 py-0.5 text-xs uppercase", statusClass(activeLogProcess.status))}>
                          {activeLogProcess.status}
                        </span>
                        <span className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground-muted">
                          {activeLogProcess.sourceLabel}
                        </span>
                        {activeLogProcess.toolName ? (
                          <span className="rounded-full border border-info/20 bg-info/10 px-2 py-0.5 text-xs text-info">
                            {activeLogProcess.toolName}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-foreground-muted">
                        {activeLogProcess.startedAt ? <span>Started {formatTimestamp(activeLogProcess.startedAt)}</span> : null}
                        {activeLogProcess.endedAt ? <span>Ended {formatTimestamp(activeLogProcess.endedAt)}</span> : null}
                        {activeLogProcess.exitCode != null ? <span>Exit code {activeLogProcess.exitCode}</span> : null}
                      </div>
                    </div>

                    <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-sm text-foreground-muted sm:max-w-sm">
                      <Search className="h-4 w-4" />
                      <input
                        value={logQuery}
                        onChange={(event) => setLogQuery(event.target.value)}
                        placeholder="Search logs"
                        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-muted"
                      />
                    </label>
                  </div>

                  {activeLogProcess.command ? (
                    <pre className="mt-4 whitespace-pre-wrap break-words rounded-2xl bg-slate-950 px-4 py-3 text-xs leading-6 text-slate-100">
                      {activeLogProcess.command}
                    </pre>
                  ) : null}
                </article>

                <div style={{overflowY:'auto'}} className="max-h-[460px] rounded-2xl border border-border bg-slate-950">
                  <div className="space-y-2 p-4 font-mono text-xs leading-6 text-slate-100">
                    {activeLogProcess.logs.length === 0 ? (
                      activeLogProcess.status === "failed" || activeLogProcess.status === "error" ? (
                        <ProcessLogState text={failedProcessText(activeLogProcess)} tone="error" />
                      ) : (
                        <ProcessLogState text="Waiting for runtime output from this process." />
                      )
                    ) : null}

                    {activeLogProcess.logs.length > 0 && filteredLogLines.length === 0 ? (
                      <ProcessLogState text={`No log lines match "${deferredLogQuery}" for this process.`} />
                    ) : null}

                    {filteredLogLines.map((line, index) => (
                      <div key={`${activeLogProcess.id}:${line.timestamp}:${index}`} className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2">
                        <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                          {line.stream} · {formatTimestamp(line.timestamp)}
                        </div>
                        <div className="whitespace-pre-wrap break-words">{line.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>) },
        { value: "terminal", label: "Terminal", body: (<div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div style={{overflowY:'auto'}} className="max-h-[420px] rounded-2xl border border-border bg-background/80">
              <div className="grid gap-3 p-4">
                {props.runtime.terminal.commands.map((command, index) => (
                  <article key={command.id} className="rounded-2xl border border-border bg-card/90 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cx("rounded-full border px-2 py-0.5 text-xs uppercase", statusClass(command.status))}>
                        {command.status}
                      </span>
                      <span className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground-muted">
                        {command.source}
                      </span>
                      {command.toolName ? (
                        <span className="rounded-full border border-info/20 bg-info/10 px-2 py-0.5 text-xs text-info">
                          {command.toolName}
                        </span>
                      ) : null}
                    </div>
                    <pre className="mt-3 whitespace-pre-wrap break-words rounded-2xl bg-slate-950 px-4 py-3 text-xs leading-6 text-slate-100">
                      {commandLabel(command, index)}
                    </pre>
                    <div className="mt-3 grid gap-2 text-xs text-foreground-muted">
                      <span>Started {formatTimestamp(command.startedAt)}</span>
                      {command.endedAt ? <span>Ended {formatTimestamp(command.endedAt)}</span> : null}
                      {command.exitCode != null ? <span>Exit code {command.exitCode}</span> : null}
                    </div>
                  </article>
                ))}
                {props.runtime.terminal.commands.length === 0 ? (
                  <EmptyRuntimeState text="No shell or terminal commands have been captured for this workspace yet." />
                ) : null}
              </div>
            </div>

            <div style={{overflowY:'auto'}} className="max-h-[420px] rounded-2xl border border-border bg-slate-950">
              <div className="space-y-2 p-4 font-mono text-xs leading-6 text-slate-100">
                {props.runtime.terminal.commands.flatMap((command) =>
                  command.logs.map((line, index) => (
                    <div key={`${command.id}:${index}`} className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2">
                      <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                        {line.stream} · {formatTimestamp(line.timestamp)}
                      </div>
                      <div className="whitespace-pre-wrap break-words">{line.text}</div>
                    </div>
                  )),
                )}
                {props.runtime.terminal.commands.every((command) => command.logs.length === 0) ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-400">
                    No terminal output captured yet.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>) },
        { value: "dev-server", label: "Dev server", body: (<div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <article className="rounded-2xl border border-border bg-background/70 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cx("rounded-full border px-2 py-0.5 text-xs uppercase", statusClass(props.runtime.devServer.status))}>
                  {props.runtime.devServer.status}
                </span>
                {props.runtime.devServer.port ? (
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground-muted">
                    Port {props.runtime.devServer.port}
                  </span>
                ) : null}
              </div>
              {props.runtime.devServer.command ? (
                <pre className="mt-3 whitespace-pre-wrap break-words rounded-2xl bg-slate-950 px-4 py-3 text-xs leading-6 text-slate-100">
                  {props.runtime.devServer.command}
                </pre>
              ) : null}
              <div className="mt-4 grid gap-2 text-sm text-foreground-muted">
                {props.runtime.devServer.primaryUrl ? (
                  <a href={props.runtime.devServer.primaryUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-primary">
                    {props.runtime.devServer.primaryUrl}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <span>No previewable dev-server endpoint has been detected yet.</span>
                )}
                <span>Last signal {formatTimestamp(props.runtime.devServer.detectedAt)}</span>
              </div>
            </article>

            <div style={{overflowY:'auto'}} className="max-h-[420px] rounded-2xl border border-border bg-slate-950">
              <div className="space-y-2 p-4 font-mono text-xs leading-6 text-slate-100">
                {props.runtime.devServer.logs.map((line, index) => (
                  <div key={`${line.timestamp}:${index}`} className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2">
                    <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                      {line.stream} · {formatTimestamp(line.timestamp)}
                    </div>
                    <div className="whitespace-pre-wrap break-words">{line.text}</div>
                  </div>
                ))}
                {props.runtime.devServer.logs.length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-400">
                    No dev-server logs captured yet.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>) },
        { value: "rebase", label: "Rebase", body: (<div className="space-y-4">
          {props.rebase ? (
            <article className="rounded-2xl border border-border bg-background/70 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cx("rounded-full border px-2 py-0.5 text-xs uppercase", statusClass(
                  props.rebase.status === "rebase-conflicts"
                    ? "failed"
                    : props.rebase.status === "rebase-needed"
                      ? "starting"
                      : "ready",
                ))}>
                  {props.rebase.status.replace(/-/g, " ")}
                </span>
                <span className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground-muted">
                  Attempt {props.rebase.attemptCount}
                </span>
                <span className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground-muted">
                  Ready for {props.rebase.readyFor}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <InspectCard icon={GitBranch} label="Target branch" value={props.rebase.targetBranch ?? "main"} />
                <InspectCard icon={GitBranch} label="Unresolved" value={String(props.rebase.unresolvedFiles.length)} />
              </div>

              {props.rebase.followUpInstructions.length > 0 ? (
                <div className="mt-4 grid gap-2 text-sm text-foreground-muted">
                  {props.rebase.followUpInstructions.map((instruction) => (
                    <div key={instruction} className="rounded-xl border border-border bg-card/70 px-3 py-2">
                      {instruction}
                    </div>
                  ))}
                </div>
              ) : null}

              {props.rebase.unresolvedFiles.length > 0 ? (
                <pre className="mt-4 whitespace-pre-wrap break-words rounded-2xl bg-slate-950 px-4 py-3 text-xs leading-6 text-slate-100">
                  {props.rebase.unresolvedFiles.join("\n")}
                </pre>
              ) : null}
            </article>
          ) : (
            <EmptyRuntimeState text="No rebase workflow state has been detected for this workspace yet." />
          )}
        </div>) },
        { value: "execution-context", label: "Execution context", body: (<div className="space-y-4">
          {props.executionContexts && props.executionContexts.length > 0 ? (
            <ExecutionContextPanel
              contexts={props.executionContexts}
              compact
              className="border-border/70 bg-card/70 p-4 shadow-none"
              title="Workspace-linked issue context"
              description="The workspace runtime inherits dispatch context from the linked issue session."
            />
          ) : (
            <EmptyRuntimeState text="No linked dispatch-context labels have been associated with this workspace session yet." />
          )}
        </div>) },
        { value: "inspect", label: "Inspect", body: (<div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InspectCard icon={Radar} label="Workspace" value={props.runtime.workspacePath ?? "unavailable"} mono />
            <InspectCard icon={Logs} label="Commands" value={String(props.runtime.terminal.commands.length)} />
            <InspectCard icon={TerminalSquare} label="Terminal" value={props.runtime.terminal.status} />
            <InspectCard icon={ExternalLink} label="Preview origin" value={props.runtime.preview.primaryUrl ?? "unavailable"} />
            <InspectCard icon={GitBranch} label="Rebase" value={props.rebase?.status ?? "unavailable"} />
          </div>
          <DispatchContextAuditPanel
            title="Dispatch audit envelope"
            audits={props.audits ?? []}
            emptyText="No dispatch-context label projection is linked to this workspace runtime yet."
          />
          <article className="rounded-2xl border border-border bg-background/70 p-4 text-sm text-foreground-muted">
            The inspect surface keeps the workspace path, preview origin, terminal activity, dev-server status,
            and process logs visible together so the kanban UI can act as the shell while runtime ownership remains in `agent-mux`.
          </article>
        </div>) },
      ]} />
    </section>
  );
}

function InspectCard(props: {
  icon: typeof Radar;
  label: string;
  value: string;
  mono?: boolean;
}) {
  const Icon = props.icon;
  return (
    <article className="rounded-2xl border border-border bg-background/70 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-foreground-muted">
        <Icon className="h-4 w-4" />
        {props.label}
      </div>
      <div className={cx("mt-3 text-sm font-medium", props.mono ? "break-all font-mono text-xs" : "")}>{props.value}</div>
    </article>
  );
}

function EmptyRuntimeState(props: {
  text: string;
  icon?: typeof WifiOff;
}) {
  const Icon = props.icon;
  return (
    <div className="rounded-2xl border border-dashed border-border bg-background/60 p-4 text-sm text-foreground-muted">
      {Icon ? <Icon className="mb-2 h-4 w-4" /> : null}
      {props.text}
    </div>
  );
}
