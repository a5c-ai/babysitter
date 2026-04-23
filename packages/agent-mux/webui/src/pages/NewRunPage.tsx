import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom-v6';
import { useAgents, useGateway } from '@a5c-ai/agent-mux-ui';
import { useStore } from 'zustand';
import { Button, Field, Select, Textarea } from '@a5c-ai/compendium';

import { useGatewayFetch } from '../providers/GatewayProvider.js';

function firstAgent(agents: string[], preferred: string | null): string {
  if (preferred && agents.includes(preferred)) {
    return preferred;
  }
  return agents[0] ?? 'codex';
}

function isSessionCapable(record: Record<string, unknown> | null): boolean {
  return (
    record?.['supportsInteractiveMode'] === true ||
    record?.['structuredSessionTransport'] === 'persistent'
  );
}

function describeControlPlane(controlPlane: unknown): string {
  switch (controlPlane) {
    case 'external-host':
      return 'Live session owner: external host surface.';
    case 'mcp-mediated':
      return 'Live session owner: host-mediated channel.';
    default:
      return 'Live session owner: agent-mux managed process or SDK.';
  }
}

export function NewRunPage(): JSX.Element {
  const navigate = useNavigate();
  const fetchGateway = useGatewayFetch();
  const { client, store } = useGateway();
  const [searchParams] = useSearchParams();
  const agents = useAgents();
  const requestedAgent = searchParams.get('agent');
  const [agent, setAgent] = useState(() => firstAgent(agents, requestedAgent));
  const [prompt, setPrompt] = useState('');
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!prompt.trim() || !agent) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetchGateway('/api/v1/sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ agent, prompt }),
      });
      if (!response.ok) {
        throw new Error(`Gateway request failed: ${response.status}`);
      }
      const body = (await response.json()) as { run?: Record<string, unknown> };
      const run = body.run;
      const runId = typeof run?.runId === 'string' ? run.runId : null;
      if (!runId) {
        throw new Error('Gateway did not return a run id');
      }
      store.getState().actions.mergeRun(runId, run ?? {});
      if (typeof run?.sessionId === 'string' && run.sessionId.length > 0) {
        store.getState().actions.mergeSession(run.sessionId, {
          sessionId: run.sessionId,
          agent,
          activeRunId: runId,
          latestRunId: runId,
          status: 'active',
        });
      }
      client.subscribeRun(runId);
      if (typeof run?.sessionId === 'string' && run.sessionId.length > 0) {
        navigate(`/sessions/${run.sessionId}`);
        return;
      }
      navigate(`/sessions/pending/${runId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="flow-grid">
      <article className="panel hero-panel">
        <p className="eyebrow">New Session</p>
        <h2>Start a real conversation</h2>
        <p className="lede">
          This creates a real session on the selected harness. If the harness does not emit its session
          id immediately, the browser stays inside the sessions flow until the live session is ready.
        </p>
      </article>

      <article className="panel">
        <header>
          <h2>Compose First Turn</h2>
        </header>
        <form className="stack" onSubmit={handleSubmit}>
          <Field label="Agent">
            <Select
              value={agent}
              onChange={setAgent}
              options={sessionAgents.map((item) => ({ label: item, value: item }))}
            />
          </Field>

          {agentRecord ? (
            <p className="muted-copy">
              {describeControlPlane(agentRecord.sessionControlPlane)}{' '}
              {agentRecord.structuredSessionTransport === 'persistent'
                ? 'Later turns stay on the same live structured channel.'
                : agentRecord.structuredSessionTransport === 'restart-per-turn'
                  ? 'Later turns reconnect the same session with a fresh execution.'
                  : 'Structured multi-turn transport is unavailable.'}
            </p>
          ) : null}

          {sessionAgents.length !== agents.length ? (
            <p className="muted-copy">
              The browser is showing only transports that can keep a session interactive or persistent.
            </p>
          ) : null}

          <Field label="Prompt">
            <Textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe the task you want the agent to handle..."
              rows={10}
            />
          </Field>

          {error ? <p className="error-banner">{error}</p> : null}

          <div className="actions">
            <Button type="submit" variant="primary" loading={submitting} disabled={submitting || !prompt.trim()}>
              Start session
            </Button>
            <Link className="ghost-link" to="/sessions">
              Browse sessions
            </Link>
          </div>
        </form>
      </article>
    </section>
  );
}
