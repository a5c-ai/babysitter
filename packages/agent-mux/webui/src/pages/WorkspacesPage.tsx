import React, { useEffect, useState } from 'react';
import { Button, Field, Select, Textarea } from '@a5c-ai/compendium';

import { useGatewayFetch } from '../providers/GatewayProvider.js';

type WorkspaceSummary = {
  id: string;
  name: string;
  rootPath: string;
  defaultCwd: string;
  status: string;
  mode: 'worktree' | 'symlink';
  sessions: Array<{ sessionId: string; agent: string; status: 'running' | 'stopped' }>;
};

type WorkspaceListResponse = {
  workspaces: WorkspaceSummary[];
  summary: Record<string, number>;
};

export function WorkspacesPage(): JSX.Element {
  const fetchGateway = useGatewayFetch();
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('session-workspace');
  const [mode, setMode] = useState<'worktree' | 'symlink'>('worktree');
  const [repos, setRepos] = useState('');

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchGateway('/api/v1/workspaces');
      if (!response.ok) {
        throw new Error(`Gateway request failed: ${response.status}`);
      }
      const body = (await response.json()) as WorkspaceListResponse;
      setWorkspaces(body.workspaces ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createWorkspace(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const repoLines = repos
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (!name.trim() || repoLines.length === 0) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetchGateway('/api/v1/workspaces', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name,
          mode,
          repos: repoLines.map((repoPath) => ({ path: repoPath })),
        }),
      });
      if (!response.ok) {
        throw new Error(`Workspace creation failed: ${response.status}`);
      }
      setRepos('');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSubmitting(false);
    }
  }

  async function runAction(workspaceId: string, action: 'archive' | 'cleanup' | 'recover' | 'delete'): Promise<void> {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetchGateway('/api/v1/workspaces', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action,
          workspaceId,
          force: action === 'delete',
        }),
      });
      if (!response.ok) {
        throw new Error(`Workspace action failed: ${response.status}`);
      }
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="flow-grid">
      <article className="panel hero-panel">
        <p className="eyebrow">Workspaces</p>
        <h2>Stage temp directories, worktrees, and linked repos</h2>
        <p className="lede">
          Workspaces live under <code>~/.a5c/workspaces</code> and can bind directly to live sessions.
        </p>
      </article>

      <article className="panel">
        <header>
          <h2>Create workspace</h2>
        </header>
        <form className="stack" onSubmit={createWorkspace}>
          <Field label="Name">
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Mode">
            <Select
              value={mode}
              onChange={(value) => setMode(value === 'symlink' ? 'symlink' : 'worktree')}
              options={[
                { label: 'Git worktrees', value: 'worktree' },
                { label: 'Symbolic links', value: 'symlink' },
              ]}
            />
          </Field>
          <Field label="Repo paths">
            <Textarea
              value={repos}
              onChange={(event) => setRepos(event.target.value)}
              rows={5}
              placeholder={'/abs/path/to/repo-one\n/abs/path/to/repo-two'}
            />
          </Field>
          {error ? <p className="error-banner">{error}</p> : null}
          <div className="actions">
            <Button type="submit" variant="primary" loading={submitting} disabled={submitting}>
              Create workspace
            </Button>
          </div>
        </form>
      </article>

      <article className="panel">
        <header>
          <h2>Tracked workspaces</h2>
        </header>
        {loading ? <p className="muted-copy">Loading workspaces…</p> : null}
        {!loading && workspaces.length === 0 ? <p className="muted-copy">No workspaces have been created yet.</p> : null}
        <div className="stack">
          {workspaces.map((workspace) => (
            <article key={workspace.id} className="panel panel-muted">
              <div className="stack">
                <div>
                  <strong>{workspace.name}</strong> <span className="muted-copy">({workspace.id})</span>
                </div>
                <p className="muted-copy">{workspace.defaultCwd}</p>
                {workspace.defaultCwd !== workspace.rootPath ? <p className="muted-copy">root: {workspace.rootPath}</p> : null}
                <p className="muted-copy">
                  {workspace.status} · {workspace.mode} · {workspace.sessions.length} session{workspace.sessions.length === 1 ? '' : 's'}
                </p>
                <div className="actions">
                  <Button variant="default" disabled={submitting} onClick={() => void runAction(workspace.id, 'archive')}>
                    Archive
                  </Button>
                  <Button variant="default" disabled={submitting} onClick={() => void runAction(workspace.id, 'cleanup')}>
                    Cleanup
                  </Button>
                  <Button variant="default" disabled={submitting} onClick={() => void runAction(workspace.id, 'recover')}>
                    Recover
                  </Button>
                  <Button variant="default" disabled={submitting} onClick={() => void runAction(workspace.id, 'delete')}>
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
