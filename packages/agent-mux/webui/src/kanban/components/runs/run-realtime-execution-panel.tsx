"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useStore } from "zustand";
import type { WorkspaceRuntimeSurface } from "@a5c-ai/agent-mux-core";

import { useGatewayAuth } from "@/components/agent-mux/gateway-provider";
import { SessionObservabilityPanel } from "@/components/sessions/session-observability-panel";
import type { Run } from "@/types";
import { useGateway } from "@/lib/agent-mux-ui";

type EventBuffer = {
  events: Array<Record<string, unknown>>;
};

export function RunRealtimeExecutionPanel(props: { run: Run }) {
  const { isAuthenticated } = useGatewayAuth();

  if (!isAuthenticated) {
    return (
      <section
        data-testid="run-realtime-auth-required"
        className="rounded-3xl border border-border bg-card p-6 shadow-lg"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Realtime execution</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight">Connect agent-mux to load the reconstructed flow</h3>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground-muted">
          The flow, timeline, transcript, and file-attention views come from the live gateway event buffer for this
          run. Connect the gateway to inspect the same reconstructed execution narrative available on session pages.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link href="/login" className="text-primary hover:text-primary/80">
            Connect gateway
          </Link>
          <Link href="/settings" className="text-foreground-muted hover:text-foreground">
            Open settings
          </Link>
        </div>
      </section>
    );
  }

  return <AuthenticatedRunRealtimeExecutionPanel run={props.run} />;
}

function AuthenticatedRunRealtimeExecutionPanel(props: { run: Run }) {
  const { client, store } = useGateway();
  const eventBuffer = useStore(store, (state) => state.events.byRunId[props.run.runId] as EventBuffer | undefined);
  const gatewayRun = useStore(store, (state) => state.runs.byId[props.run.runId] ?? null);

  useEffect(() => client.subscribeRun(props.run.runId), [client, props.run.runId]);

  const runs = useMemo(() => {
    const mergedRun = {
      ...(gatewayRun ?? {}),
      ...props.run,
      agent:
        typeof gatewayRun?.agent === "string" && gatewayRun.agent.length > 0
          ? gatewayRun.agent
          : props.run.processId,
    };
    return [mergedRun];
  }, [gatewayRun, props.run]);

  const eventBuffers = useMemo<Record<string, EventBuffer | undefined>>(
    () => ({ [props.run.runId]: eventBuffer }),
    [eventBuffer, props.run.runId],
  );
  const runtimeSource = useMemo<Record<string, unknown>>(
    () => (runs[0] as Record<string, unknown>) ?? {},
    [runs],
  );

  return (
    <div data-testid="run-realtime-panel">
      <SessionObservabilityPanel
        sessionId={props.run.sessionId ?? props.run.runId}
        runs={runs}
        eventBuffers={eventBuffers}
        workspacePath={typeof runtimeSource.cwd === "string" ? runtimeSource.cwd : undefined}
        runtime={readRuntime(runtimeSource.runtime)}
      />
    </div>
  );
}

function readRuntime(value: unknown): WorkspaceRuntimeSurface | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as WorkspaceRuntimeSurface;
}
