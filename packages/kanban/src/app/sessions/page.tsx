"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import { RequireGatewayAuth } from "@/components/agent-mux/require-gateway-auth";
import { useGateway } from "@/lib/agent-mux-ui";

function formatUsd(totalUsd: number | null): string | null {
  if (totalUsd == null || !Number.isFinite(totalUsd)) {
    return null;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: totalUsd >= 1 ? 2 : 4,
    maximumFractionDigits: 4,
  }).format(totalUsd);
}

function workspaceHref(cwd: string): string {
  return `/workspaces?workspace=${encodeURIComponent(cwd)}`;
}

export default function SessionsPage() {
  return (
    <RequireGatewayAuth>
      <SessionsContent />
    </RequireGatewayAuth>
  );
}

function SessionsContent() {
  const { store } = useGateway();
  const sessions = useStore(store, useShallow((state) => Object.values(state.sessions.byId)));
  const runs = useStore(store, useShallow((state) => Object.values(state.runs.byId)));
  const eventBuffers = useStore(store, (state) => state.events.byRunId);

  const rows = useMemo(
    () =>
      sessions
        .map((session) => {
          const sessionId = String(session.sessionId);
          const costTotalUsd = runs
            .filter((run) => String(run.sessionId ?? "") === sessionId)
            .reduce((sum, run) => {
              const buffer = eventBuffers[String(run.runId ?? "")];
              if (!buffer) {
                return sum;
              }
              return (
                sum +
                buffer.events.reduce((eventSum, event) => {
                  if (event.type !== "cost" || !event.cost || typeof event.cost !== "object") {
                    return eventSum;
                  }
                  return eventSum + Number((event.cost as { totalUsd?: number }).totalUsd ?? 0);
                }, 0)
              );
            }, 0);

          return {
            sessionId,
            agent: String(session.agent ?? "unknown"),
            status: String(session.status ?? "inactive"),
            updatedAt: Number(session.updatedAt ?? 0),
            title: typeof session.title === "string" ? session.title : null,
            turnCount: typeof session.turnCount === "number" ? session.turnCount : null,
            messageCount: typeof session.messageCount === "number" ? session.messageCount : null,
            costTotalUsd: costTotalUsd > 0 ? costTotalUsd : null,
            cwd: typeof session.cwd === "string" ? session.cwd : null,
          };
        })
        .sort((left, right) => right.updatedAt - left.updatedAt),
    [eventBuffers, runs, sessions],
  );

  const activeSessions = rows.filter((session) => session.status === "active");
  const inactiveSessions = rows.filter((session) => session.status !== "active");

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 px-6 py-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Sessions</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Active agent conversations</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-muted">
              Session state is sourced from agent-mux. Babysitter runs remain visible in the board and
              run-detail views, while this page stays focused on live or resumable conversations.
            </p>
          </div>
          <Button asChild variant="primary">
            <Link href="/sessions/new">Start session</Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <SessionColumn title="Active sessions" empty="No active sessions right now." sessions={activeSessions} />
        <SessionColumn title="Inactive sessions" empty="No inactive sessions yet." sessions={inactiveSessions} />
      </div>
    </div>
  );
}

function SessionColumn(props: {
  title: string;
  empty: string;
  sessions: Array<{
    sessionId: string;
    agent: string;
    status: string;
    title: string | null;
    turnCount: number | null;
    messageCount: number | null;
    costTotalUsd: number | null;
    cwd: string | null;
  }>;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
      <h2 className="text-xl font-semibold tracking-tight">{props.title}</h2>
      <div className="mt-4 grid gap-4">
        {props.sessions.map((session) => (
          <article key={session.sessionId} className="rounded-2xl border border-border bg-background/70 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-base">{session.sessionId}</strong>
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground-muted">
                {session.agent}
              </span>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {session.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-foreground-muted">
              {session.title ?? "Untitled session"}
              {session.messageCount != null ? ` · ${session.messageCount} messages` : ""}
              {session.turnCount != null ? ` · ${session.turnCount} turns` : ""}
              {formatUsd(session.costTotalUsd) ? ` · ${formatUsd(session.costTotalUsd)}` : ""}
            </p>
            {session.cwd ? (
              <p className="mt-2 font-mono text-xs text-foreground-muted" title={session.cwd}>
                {session.cwd}
              </p>
            ) : null}
            <div className="mt-4 flex gap-3">
              <Button asChild size="sm" variant="outline">
                <Link href={`/sessions/${session.sessionId}`}>Open chat</Link>
              </Button>
              {session.cwd ? (
                <Button asChild size="sm" variant="ghost">
                  <Link href={workspaceHref(session.cwd)}>Open workspace</Link>
                </Button>
              ) : null}
            </div>
          </article>
        ))}
        {props.sessions.length === 0 ? <p className="text-sm text-foreground-muted">{props.empty}</p> : null}
      </div>
    </section>
  );
}
