"use client";

import { useMemo, useState } from "react";
import type { WorkspaceRuntimeDeviceProfile, WorkspaceRuntimeSurface } from "@a5c-ai/agent-mux-core";
import { ExternalLink, Laptop2, Logs, Radar, Smartphone, TabletSmartphone, TerminalSquare } from "lucide-react";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export function WorkspaceRuntimePanel(props: {
  runtime: WorkspaceRuntimeSurface;
  sessionId?: string;
  className?: string;
}) {
  const defaultTab = props.runtime.preview.primaryUrl ? "preview" : props.runtime.terminal.commands.length > 0 ? "terminal" : "dev-server";
  const devices = props.runtime.preview.deviceProfiles;
  const [deviceId, setDeviceId] = useState<WorkspaceRuntimeDeviceProfile["id"]>(devices[0]?.id ?? "desktop");

  const selectedDevice = useMemo(
    () => devices.find((device) => device.id === deviceId) ?? devices[0] ?? { id: "desktop", label: "Desktop 1440", width: 1440, height: 960 },
    [deviceId, devices],
  );

  return (
    <section className={cn("rounded-3xl border border-border bg-card p-5 shadow-lg", props.className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Runtime surfaces</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight">Preview, shell, inspect, and dev server</h3>
          <p className="mt-2 text-sm text-foreground-muted">
            Derived from agent-mux session state and recent run events.
            {props.sessionId ? ` Session ${props.sessionId}.` : ""}
          </p>
        </div>
        <span className="rounded-full border border-border px-3 py-1.5 text-xs text-foreground-muted">
          Updated {formatTimestamp(props.runtime.updatedAt)}
        </span>
      </div>

      <Tabs className="mt-5" defaultValue={defaultTab}>
        <TabsList className="flex h-auto w-full flex-wrap gap-2 bg-transparent p-0">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="terminal">Terminal</TabsTrigger>
          <TabsTrigger value="dev-server">Dev server</TabsTrigger>
          <TabsTrigger value="inspect">Inspect</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {devices.map((device) => {
                const Icon = deviceIcon(device.id);
                return (
                  <Button
                    key={device.id}
                    type="button"
                    variant={device.id === selectedDevice.id ? "default" : "outline"}
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
              <a
                href={props.runtime.preview.primaryUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary"
              >
                Open preview
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </div>

          {props.runtime.preview.primaryUrl ? (
            <div className="rounded-[28px] border border-border bg-background/70 p-4">
              <div className="mx-auto rounded-[24px] border border-border bg-card p-3 shadow-sm" style={{ maxWidth: `${Math.min(selectedDevice.width, 960)}px` }}>
                <div className="mb-3 flex items-center justify-between rounded-2xl border border-border bg-background/75 px-4 py-2 text-xs text-foreground-muted">
                  <span>{selectedDevice.label}</span>
                  <span>
                    {selectedDevice.width} x {selectedDevice.height}
                  </span>
                </div>
                <iframe
                  title={`Preview for ${props.runtime.workspacePath ?? "workspace"}`}
                  src={props.runtime.preview.primaryUrl}
                  className="w-full rounded-2xl border border-border bg-white"
                  style={{ height: `${previewHeight(selectedDevice)}px` }}
                />
              </div>
            </div>
          ) : (
            <EmptyRuntimeState text="No preview URL has been detected from the workspace runtime yet." />
          )}
        </TabsContent>

        <TabsContent value="terminal" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <ScrollArea className="max-h-[420px] rounded-2xl border border-border bg-background/80">
              <div className="grid gap-3 p-4">
                {props.runtime.terminal.commands.map((command) => (
                  <article key={command.id} className="rounded-2xl border border-border bg-card/90 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-full border px-2 py-0.5 text-xs uppercase", statusClass(command.status))}>
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
                      {command.command}
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
            </ScrollArea>

            <ScrollArea className="max-h-[420px] rounded-2xl border border-border bg-slate-950">
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
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="dev-server" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <article className="rounded-2xl border border-border bg-background/70 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("rounded-full border px-2 py-0.5 text-xs uppercase", statusClass(props.runtime.devServer.status))}>
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

            <ScrollArea className="max-h-[420px] rounded-2xl border border-border bg-slate-950">
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
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="inspect" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InspectCard icon={Radar} label="Workspace" value={props.runtime.workspacePath ?? "unavailable"} mono />
            <InspectCard icon={Logs} label="Commands" value={String(props.runtime.terminal.commands.length)} />
            <InspectCard icon={TerminalSquare} label="Terminal" value={props.runtime.terminal.status} />
            <InspectCard icon={ExternalLink} label="Preview origin" value={props.runtime.preview.primaryUrl ?? "unavailable"} />
          </div>
          <article className="rounded-2xl border border-border bg-background/70 p-4 text-sm text-foreground-muted">
            The inspect surface keeps the workspace path, preview origin, terminal activity, and dev-server status
            visible together so the kanban UI can act as the shell while runtime ownership remains in `agent-mux`.
          </article>
        </TabsContent>
      </Tabs>
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
      <div className={cn("mt-3 text-sm font-medium", props.mono ? "break-all font-mono text-xs" : "")}>{props.value}</div>
    </article>
  );
}

function EmptyRuntimeState(props: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-border bg-background/60 p-4 text-sm text-foreground-muted">{props.text}</div>;
}
