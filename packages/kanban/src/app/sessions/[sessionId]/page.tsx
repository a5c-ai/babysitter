"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { WorkspaceRuntimeSurface } from "@a5c-ai/agent-mux-core";

import { RequireGatewayAuth } from "@/components/agent-mux/require-gateway-auth";
import { WorkspaceRuntimePanel } from "@/components/workspaces/workspace-runtime-panel";
import { useGatewayFetch } from "@/components/agent-mux/gateway-provider";
import { useGateway } from "@/lib/agent-mux-ui";

type TranscriptNode =
  | { kind: "user"; text: string; runId: string }
  | { kind: "assistant"; text: string; runId: string }
  | { kind: "thinking"; text: string; runId: string }
  | { kind: "tool"; text: string; runId: string; label: string };

function formatUsd(totalUsd: number | null): string {
  if (totalUsd == null || !Number.isFinite(totalUsd)) {
    return "unavailable";
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

function readRuntime(value: unknown): WorkspaceRuntimeSurface | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  return value as WorkspaceRuntimeSurface;
}

function buildTranscript(
  runs: Array<Record<string, unknown>>,
  eventBuffers: Record<string, { events: Record<string, unknown>[] } | undefined>,
): TranscriptNode[] {
  const orderedRuns = [...runs].sort((left, right) => Number(left.startedAt ?? 0) - Number(right.startedAt ?? 0));
  const nodes: TranscriptNode[] = [];

  for (const run of orderedRuns) {
    const runId = String(run.runId ?? "");
    const buffer = eventBuffers[runId];
    if (!buffer) {
      continue;
    }

    let currentAssistantText = "";
    let currentThinkingText = "";
    const flushAssistant = () => {
      if (!currentAssistantText) return;
      nodes.push({ kind: "assistant", text: currentAssistantText, runId });
      currentAssistantText = "";
    };
    const flushThinking = () => {
      if (!currentThinkingText) return;
      nodes.push({ kind: "thinking", text: currentThinkingText, runId });
      currentThinkingText = "";
    };

    for (const event of buffer.events) {
      const type = String(event.type ?? "");
      if (type === "user_message") {
        flushThinking();
        flushAssistant();
        const text = String(event.text ?? "");
        if (text.length > 0) {
          nodes.push({ kind: "user", text, runId });
        }
        continue;
      }

      if (type === "thinking_delta") {
        const delta = String(event.delta ?? "");
        if (delta.length > 0) {
          currentThinkingText += delta;
        }
        continue;
      }

      if (type === "thinking_stop") {
        const finalThinking = String(event.thinking ?? "");
        if (finalThinking.length > 0) {
          currentThinkingText = finalThinking;
        }
        flushThinking();
        continue;
      }

      if (type === "text_delta") {
        flushThinking();
        currentAssistantText += String(event.delta ?? "");
        continue;
      }

      if (type === "message_stop") {
        flushThinking();
        const finalText = String(event.text ?? "");
        if (finalText.length > 0) {
          currentAssistantText = finalText;
        }
        flushAssistant();
        continue;
      }

      flushThinking();
      flushAssistant();

      if (type === "tool_call_start" || type === "tool_call_ready") {
        nodes.push({
          kind: "tool",
          runId,
          label: `start ${String(event.toolName ?? "tool")}`,
          text:
            type === "tool_call_ready"
              ? JSON.stringify(event.input ?? {}, null, 2)
              : String(event.inputAccumulated ?? ""),
        });
      }

      if (type === "tool_result" || type === "tool_error") {
        nodes.push({
          kind: "tool",
          runId,
          label: String(event.toolName ?? "tool"),
          text: JSON.stringify(event, null, 2),
        });
      }
    }

    flushThinking();
    flushAssistant();
  }

  return nodes;
}

function accumulateEventCost(
  runIds: string[],
  eventBuffers: Record<string, { events: Record<string, unknown>[] } | undefined>,
): number | null {
  let found = false;
  let total = 0;
  for (const runId of runIds) {
    const buffer = eventBuffers[runId];
    if (!buffer) {
      continue;
    }
    for (const event of buffer.events) {
      if (event.type !== "cost" || !event.cost || typeof event.cost !== "object") {
        continue;
      }
      total += Number((event.cost as { totalUsd?: number }).totalUsd ?? 0);
      found = true;
    }
  }
  return found ? total : null;
}

export default function SessionDetailPage() {
  return (
    <RequireGatewayAuth>
      <SessionDetailContent />
    </RequireGatewayAuth>
  );
}

function SessionDetailContent() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId ?? "";
  const fetchGateway = useGatewayFetch();
  const { store } = useGateway();
  const session = useStore(store, (state) => state.sessions.byId[sessionId] ?? null);
  const runs = useStore(
    store,
    useShallow((state) =>
      Object.values(state.runs.byId)
        .filter((run) => run.sessionId === sessionId)
        .sort((left, right) => Number(right.startedAt ?? 0) - Number(left.startedAt ?? 0)),
    ),
  );
  const eventBuffers = useStore(store, (state) => state.events.byRunId);
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transcript = useMemo(
    () => buildTranscript(runs as Array<Record<string, unknown>>, eventBuffers),
    [eventBuffers, runs],
  );
  const runIds = useMemo(() => runs.map((run) => String(run.runId ?? "")), [runs]);
  const totalCost = useMemo(() => accumulateEventCost(runIds, eventBuffers), [eventBuffers, runIds]);
  const workspacePath = typeof session?.cwd === "string" && session.cwd.length > 0 ? session.cwd : null;
  const runtime = readRuntime(session?.runtime);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prompt.trim()) {
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await fetchGateway(`/api/v1/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt,
          agent: typeof session?.agent === "string" ? session.agent : undefined,
        }),
      });
      if (!response.ok) {
        throw new Error(`Gateway request failed: ${response.status}`);
      }
      const body = (await response.json()) as {
        run?: Record<string, unknown>;
        session?: Record<string, unknown>;
      };
      if (body.run?.runId) {
        store.getState().actions.mergeRun(String(body.run.runId), body.run);
      }
      if (body.session?.sessionId) {
        store.getState().actions.mergeSession(String(body.session.sessionId), body.session);
      }
      setPrompt("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 px-6 py-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/sessions" className="text-sm font-medium text-primary">
            Sessions
          </Link>
          <span className="text-foreground-muted">/</span>
          <span className="font-mono text-sm text-foreground-secondary">{sessionId}</span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{session?.title ?? "Live session transcript"}</h1>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <StatCard label="Agent" value={String(session?.agent ?? "unknown")} />
          <StatCard label="Status" value={String(session?.status ?? "inactive")} />
          <StatCard label="Runs" value={String(runs.length)} />
          <StatCard label="Cost" value={formatUsd(totalCost)} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
          <h2 className="text-xl font-semibold tracking-tight">Transcript</h2>
          <div className="mt-4 grid gap-4">
            {transcript.map((node, index) => (
              <article
                key={`${node.runId}-${index}`}
                className="rounded-2xl border border-border bg-background/65 p-4"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs uppercase tracking-[0.18em] text-foreground-muted">
                    {node.kind}
                  </span>
                  {node.kind === "tool" ? (
                    <span className="rounded-full border border-info/20 bg-info/10 px-2 py-0.5 text-xs text-info">
                      {node.label}
                    </span>
                  ) : null}
                  <Link href={`/runs/${node.runId}`} className="text-xs text-primary">
                    {node.runId}
                  </Link>
                </div>
                <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground-secondary">
                  {node.text}
                </pre>
              </article>
            ))}
            {transcript.length === 0 ? (
              <p className="text-sm text-foreground-muted">No transcript events have been received for this session yet.</p>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-3">
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Send another turn</span>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={5}
                className="rounded-2xl border border-input bg-background px-4 py-3 outline-none transition focus:border-primary"
                placeholder="Continue the session..."
              />
            </label>
            {error ? (
              <div className="rounded-2xl border border-error/20 bg-error-muted px-4 py-3 text-sm text-error">
                {error}
              </div>
            ) : null}
            <div>
              <button
                type="submit"
                disabled={sending || !prompt.trim()}
                className="inline-flex items-center rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {sending ? "Sending..." : "Send turn"}
              </button>
            </div>
          </form>
        </section>

        <aside className="rounded-3xl border border-border bg-card p-6 shadow-lg">
          <h2 className="text-xl font-semibold tracking-tight">Runs in this session</h2>
          {workspacePath ? (
            <div className="mt-4 rounded-2xl border border-border bg-background/65 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-foreground-muted">Workspace</div>
              <p className="mt-2 font-mono text-xs text-foreground-muted">{workspacePath}</p>
              <div className="mt-3">
                <Link href={workspaceHref(workspacePath)} className="text-sm font-medium text-primary">
                  Open workspace lifecycle
                </Link>
              </div>
            </div>
          ) : null}
          <div className="mt-4 grid gap-3">
            {runs.map((run) => (
              <article key={String(run.runId)} className="rounded-2xl border border-border bg-background/65 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/runs/${String(run.runId)}`} className="font-mono text-sm text-primary">
                    {String(run.runId)}
                  </Link>
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground-muted">
                    {String(run.status ?? "unknown")}
                  </span>
                </div>
                <p className="mt-2 text-sm text-foreground-muted">
                  {String(run.agent ?? session?.agent ?? "unknown")}
                </p>
              </article>
            ))}
            {runs.length === 0 ? (
              <p className="text-sm text-foreground-muted">No runs recorded for this session yet.</p>
            ) : null}
          </div>
        </aside>
      </div>

      {runtime ? <WorkspaceRuntimePanel runtime={runtime} sessionId={sessionId} /> : null}
    </div>
  );
}

function StatCard(props: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background/60 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-foreground-muted">{props.label}</div>
      <div className="mt-2 text-sm font-medium">{props.value}</div>
    </div>
  );
}
