"use client";

import Link from "next/link";
import { Field, Select, Textarea } from "@a5c-ai/compendium";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "zustand";

import { RequireGatewayAuth } from "@/components/agent-mux/require-gateway-auth";
import { TaskTagAutocompleteTextarea } from "@/components/task-tags/task-tag-autocomplete-textarea";
import { Button } from "@/components/ui/button";
import { useGatewayFetch } from "@/components/agent-mux/gateway-provider";
import { useTaskTags } from "@/hooks/use-task-tags";
import { useAgents, useGateway } from "@/lib/agent-mux-ui";

function firstAgent(agents: string[], preferred: string | null): string {
  if (preferred && agents.includes(preferred)) {
    return preferred;
  }
  return agents[0] ?? "codex";
}

function isSessionCapable(record: Record<string, unknown> | null): boolean {
  return record?.supportsInteractiveMode === true || record?.structuredSessionTransport === "persistent";
}

export default function NewSessionPage() {
  return (
    <RequireGatewayAuth>
      <Suspense fallback={null}>
        <NewSessionContent />
      </Suspense>
    </RequireGatewayAuth>
  );
}

function NewSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fetchGateway = useGatewayFetch();
  const { client, store } = useGateway();
  const agents = useAgents();
  const { taskTags } = useTaskTags();
  const requestedAgent = searchParams.get("agent");
  const [agent, setAgent] = useState(() => firstAgent(agents, requestedAgent));
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const agentRecords = useStore(store, (state) => state.agents.byId);
  const agentRecord = useStore(store, (state) => state.agents.byId[agent] ?? null);

  const sessionAgents = useMemo(() => {
    const filtered = agents.filter((item) => isSessionCapable(agentRecords[item] ?? null));
    return filtered.length > 0 ? filtered : agents;
  }, [agentRecords, agents]);

  useEffect(() => {
    setAgent((current) => {
      if (sessionAgents.length === 0) {
        return current;
      }
      if (sessionAgents.includes(current)) {
        return current;
      }
      return firstAgent(sessionAgents, requestedAgent);
    });
  }, [requestedAgent, sessionAgents]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prompt.trim() || !agent) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetchGateway("/api/v1/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agent, prompt }),
      });
      if (!response.ok) {
        throw new Error(`Gateway request failed: ${response.status}`);
      }

      const body = (await response.json()) as { run?: Record<string, unknown> };
      const run = body.run;
      const runId = typeof run?.runId === "string" ? run.runId : null;
      if (!runId) {
        throw new Error("Gateway did not return a run id");
      }

      store.getState().actions.mergeRun(runId, run ?? {});
      if (typeof run?.sessionId === "string" && run.sessionId.length > 0) {
        store.getState().actions.mergeSession(run.sessionId, {
          sessionId: run.sessionId,
          agent,
          activeRunId: runId,
          latestRunId: runId,
          status: "active",
        });
      }

      client.subscribeRun(runId);
      if (typeof run?.sessionId === "string" && run.sessionId.length > 0) {
        router.push(`/sessions/${run.sessionId}`);
        return;
      }

      router.push(`/sessions/pending/${runId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 px-6 py-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">New session</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Start a real conversation</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-muted">
          This creates a live agent-mux session. If the harness emits its real session id later, the
          kanban app keeps the run open until the session becomes addressable.
        </p>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Field label="Agent">
            <Select
              value={agent}
              onChange={setAgent}
              options={sessionAgents.map((item) => ({ label: item, value: item }))}
            />
          </Field>

          {agentRecord ? (
            <p className="text-sm text-foreground-muted">
              Session control plane: {String(agentRecord.sessionControlPlane ?? "self-managed")}. Structured
              transport: {String(agentRecord.structuredSessionTransport ?? "none")}.
            </p>
          ) : null}

          <Field label="Prompt">
            <TaskTagAutocompleteTextarea
              taskTags={taskTags}
              value={prompt}
              onValueChange={setPrompt}
              renderTextarea={(props) => (
                <Textarea
                  {...props}
                  rows={10}
                  placeholder="Describe the task you want the agent to handle..."
                />
              )}
            />
          </Field>

          {error ? (
            <div className="rounded-2xl border border-error/20 bg-error-muted px-4 py-3 text-sm text-error">
              {error}
            </div>
          ) : null}

          <div className="flex gap-3">
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              disabled={submitting || !prompt.trim()}
            >
              Start session
            </Button>
            <Button asChild variant="outline">
              <Link href="/sessions">Browse sessions</Link>
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
