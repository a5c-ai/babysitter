"use client";

import Link from "next/link";
import { LogoWordmark } from "@a5c-ai/compendium";
import { useStore } from "zustand";

import { Button } from "@/components/ui/button";
import { useGatewayAuth } from "@/components/agent-mux/gateway-provider";
import { useConnection, useGateway } from "@/lib/agent-mux-ui";

export default function SettingsPage() {
  const { auth, logout, isAuthenticated } = useGatewayAuth();
  const connection = isAuthenticated ? <SettingsConnected /> : null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Settings</p>
        <div className="mt-2">
          <LogoWordmark className="h-6 w-auto" />
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Gateway and runtime status</h1>
        <p className="mt-2 text-sm leading-6 text-foreground-muted">
          The kanban app does not own deep integrations. It points at a running agent-mux gateway and
          observes Babysitter runs from the filesystem watcher and cached run parser.
        </p>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
        <h2 className="text-xl font-semibold tracking-tight">Gateway auth</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <SettingCard label="Gateway URL" value={auth?.gatewayUrl ?? "not connected"} />
          <SettingCard label="Saved token" value={auth ? "configured" : "missing"} />
        </div>
        <div className="mt-4 flex gap-3">
          <Button asChild variant="primary">
            <Link href="/login">
              {isAuthenticated ? "Reconnect gateway" : "Connect gateway"}
            </Link>
          </Button>
          {isAuthenticated ? (
            <Button
              onClick={logout}
              variant="ghost"
              type="button"
            >
              Forget token
            </Button>
          ) : null}
        </div>
      </section>

      {connection}
    </div>
  );
}

function SettingsConnected() {
  const connection = useConnection();
  const { store } = useGateway();
  const agentCount = useStore(store, (state) => state.agents.items.length);
  const sessionCount = useStore(store, (state) => Object.keys(state.sessions.byId).length);
  const runCount = useStore(store, (state) => Object.keys(state.runs.byId).length);

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
      <h2 className="text-xl font-semibold tracking-tight">Live state</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SettingCard label="Socket status" value={connection.status} />
        <SettingCard label="Agents" value={String(agentCount)} />
        <SettingCard label="Sessions" value={String(sessionCount)} />
        <SettingCard label="Runs" value={String(runCount)} />
      </div>
      {connection.error ? (
        <div className="mt-4 rounded-2xl border border-error/20 bg-error-muted px-4 py-3 text-sm text-error">
          {connection.error}
        </div>
      ) : null}
    </section>
  );
}

function SettingCard(props: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background/60 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-foreground-muted">{props.label}</div>
      <div className="mt-2 text-sm font-medium">{props.value}</div>
    </div>
  );
}
