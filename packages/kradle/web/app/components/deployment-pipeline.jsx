'use client';

import { useState } from 'react';

const STAGES = ['Build', 'Test', 'Deploy', 'Verify'];

const STAGE_DESCRIPTIONS = {
  Build: 'Compile source, produce image artifact, and run static checks.',
  Test: 'Run unit, integration, and smoke tests against the build artifact.',
  Deploy: 'Apply manifests or Helm chart to the target environment.',
  Verify: 'Confirm readiness probes, health checks, and smoke assertions pass.'
};

const tonePalette = {
  pending: { bg: 'var(--surface)', border: 'var(--border)', badge: 'var(--text-muted)', badgeBg: 'var(--surface-raised)' },
  running: { bg: 'var(--surface-raised)', border: 'var(--info)', badge: 'var(--accent)', badgeBg: 'var(--surface-raised)' },
  success: { bg: 'var(--surface-raised)', border: 'var(--success)', badge: 'var(--success)', badgeBg: 'var(--surface-raised)' },
  failed: { bg: 'var(--surface-raised)', border: 'var(--danger)', badge: 'var(--danger)', badgeBg: 'var(--surface-raised)' }
};

const stageIcon = { pending: '○', running: '◎', success: '✓', failed: '✕' };

function StatusBadge({ tone, children }) {
  const p = tonePalette[tone] || tonePalette.pending;
  return (
    <span role="status" aria-label={`Pipeline stage status: ${children}`} style={{
      display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: '9999px',
      fontSize: '0.75rem', fontWeight: 600, color: p.badge, background: p.badgeBg
    }}>
      {children}
    </span>
  );
}

function StageCard({ stage, status, startedAt, finishedAt, artifactUrl, onDeploy, isDeployStage, env }) {
  const p = tonePalette[status] || tonePalette.pending;
  const durationMs = startedAt && finishedAt
    ? new Date(finishedAt).getTime() - new Date(startedAt).getTime()
    : null;
  const durationLabel = durationMs !== null
    ? durationMs < 1000 ? `${durationMs}ms` : `${(durationMs / 1000).toFixed(1)}s`
    : null;

  return (
    <div style={{
      flex: 1, padding: '1rem', borderRadius: '0.5rem', border: `1.5px solid ${p.border}`,
      background: p.bg, display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span style={{ fontWeight: 700, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ fontSize: '1rem' }}>{stageIcon[status] || '○'}</span>
          {stage}
        </span>
        <StatusBadge tone={status}>{status}</StatusBadge>
      </div>
      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{STAGE_DESCRIPTIONS[stage]}</p>
      {durationLabel && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Duration: {durationLabel}</span>
      )}
      {startedAt && !finishedAt && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Started: {new Date(startedAt).toLocaleTimeString()}</span>
      )}
      {artifactUrl && (
        <a href={artifactUrl} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: '0.8125rem', color: 'var(--accent)', textDecoration: 'underline' }}>
          View artifact
        </a>
      )}
      {isDeployStage && status === 'pending' && (
        <button
          onClick={onDeploy}
          aria-label={`Deploy ${stage} stage to ${env} environment`}
          style={{
            marginTop: '0.25rem', padding: '0.375rem 0.75rem', fontSize: '0.8125rem',
            fontWeight: 600, background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: '0.375rem', cursor: 'pointer', alignSelf: 'flex-start'
          }}>
          Deploy to {env}
        </button>
      )}
    </div>
  );
}

function PipelineConnector({ done }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '0 0.25rem', flexShrink: 0
    }}>
      <div style={{
        width: '2rem', height: '2px',
        background: done ? 'var(--success)' : 'var(--border)'
      }} />
    </div>
  );
}

const ENVIRONMENTS = ['staging', 'production'];

const INITIAL_STAGES = STAGES.reduce((acc, s) => ({ ...acc, [s]: { status: 'pending', startedAt: null, finishedAt: null, artifactUrl: null } }), {});

export function DeploymentPipeline({ org = 'default', repository = null, kubeVelaAvailable = false, initialPipeline = null }) {
  const [env, setEnv] = useState('staging');
  const [stages, setStages] = useState(() => {
    if (initialPipeline?.stages) return initialPipeline.stages;
    return INITIAL_STAGES;
  });
  const [pipelineId, setPipelineId] = useState(initialPipeline?.id || null);
  const [deploying, setDeploying] = useState(false);
  const [message, setMessage] = useState('');
  const [rollingBack, setRollingBack] = useState(false);

  const allSuccess = STAGES.every((s) => stages[s]?.status === 'success');
  const anyFailed = STAGES.some((s) => stages[s]?.status === 'failed');
  const isRunning = STAGES.some((s) => stages[s]?.status === 'running');

  async function handleCreatePipeline() {
    setDeploying(true);
    setMessage('');
    try {
      // Simulate pipeline creation via API
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiVersion: 'kradle.a5c.ai/v1alpha1',
          kind: 'Pipeline',
          metadata: {
            name: `deploy-${repository || 'app'}-${Date.now()}`,
            labels: { environment: env, repository: repository || 'app' }
          },
          spec: {
            organizationRef: org,
            repository: repository || 'app',
            ref: 'main',
            actor: 'kradle-ui',
            steps: STAGES.map((s) => s.toLowerCase()),
            environment: env
          }
        })
      });
      if (res.ok) {
        const body = await res.json();
        setPipelineId(body?.metadata?.name || `pipeline-${Date.now()}`);
        // Simulate stage progression for demo
        const now = new Date().toISOString();
        setStages((prev) => ({
          ...prev,
          Build: { status: 'running', startedAt: now, finishedAt: null, artifactUrl: null }
        }));
        setMessage(`Deployment pipeline started for ${env}.`);
      } else {
        setMessage('Failed to create pipeline — check API connectivity.');
      }
    } catch {
      // Offline / no backend: simulate locally
      const now = new Date().toISOString();
      setPipelineId(`local-pipeline-${Date.now()}`);
      setStages((prev) => ({
        ...prev,
        Build: { status: 'running', startedAt: now, finishedAt: null, artifactUrl: null }
      }));
      setMessage('Pipeline created (offline simulation).');
    } finally {
      setDeploying(false);
    }
  }

  async function handleDeploy() {
    setDeploying(true);
    setMessage('');
    try {
      const now = new Date().toISOString();
      setStages((prev) => ({
        ...prev,
        Deploy: { status: 'running', startedAt: now, finishedAt: null, artifactUrl: null }
      }));
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiVersion: 'kradle.a5c.ai/v1alpha1',
          kind: 'Pipeline',
          metadata: { name: `deploy-${pipelineId || 'manual'}-${Date.now()}` },
          spec: {
            organizationRef: org,
            repository: repository || 'app',
            ref: 'main',
            actor: 'kradle-ui',
            steps: ['deploy'],
            environment: env,
            parentPipeline: pipelineId || null,
          }
        })
      });
      if (res.ok) {
        setStages((prev) => ({
          ...prev,
          Deploy: { status: 'success', startedAt: now, finishedAt: new Date().toISOString(), artifactUrl: null }
        }));
        setMessage(`Deploy to ${env} initiated.`);
      } else {
        setStages((prev) => ({
          ...prev,
          Deploy: { status: 'failed', startedAt: now, finishedAt: new Date().toISOString(), artifactUrl: null }
        }));
        setMessage('Deploy failed — check API connectivity.');
      }
    } catch {
      setMessage(`Deploy to ${env} queued (offline).`);
    } finally {
      setDeploying(false);
    }
  }

  async function handleRollback() {
    setRollingBack(true);
    setMessage('');
    try {
      await fetch(`/api/orgs/${encodeURIComponent(org)}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiVersion: 'kradle.a5c.ai/v1alpha1',
          kind: 'Pipeline',
          metadata: { name: `rollback-${pipelineId || 'last'}-${Date.now()}` },
          spec: {
            organizationRef: org,
            repository: repository || 'app',
            ref: 'main',
            actor: 'kradle-ui',
            steps: ['rollback'],
            environment: env
          }
        })
      }).catch(() => null);
      setStages(INITIAL_STAGES);
      setPipelineId(null);
      setMessage(`Rollback initiated for ${env}.`);
    } finally {
      setRollingBack(false);
    }
  }

  const pipelineStatusTone = anyFailed ? 'failed' : allSuccess ? 'success' : isRunning ? 'running' : 'pending';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div className="cardTitle">
        <h3>Deployment pipeline</h3>
        <StatusBadge tone={pipelineStatusTone}>
          {anyFailed ? 'failed' : allSuccess ? 'complete' : isRunning ? 'running' : 'ready'}
        </StatusBadge>
      </div>

      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        {kubeVelaAvailable
          ? 'KubeVela is available. Pipeline stages map to OAM Application resources.'
          : 'KubeVela not detected — using native pipeline stages for deployment management.'}
      </p>

      {/* Environment selector + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }} htmlFor="env-select">
            Environment:
          </label>
          <select
            id="env-select"
            value={env}
            onChange={(e) => setEnv(e.target.value)}
            style={{
              padding: '0.375rem 0.625rem', borderRadius: '0.375rem',
              border: '1px solid var(--border)', fontSize: '0.875rem', background: 'var(--surface)'
            }}>
            {ENVIRONMENTS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        <button
          onClick={handleCreatePipeline}
          disabled={deploying || isRunning}
          aria-label={`Create deployment pipeline for ${env} environment`}
          style={{
            padding: '0.375rem 0.875rem', fontSize: '0.875rem', fontWeight: 600,
            background: deploying || isRunning ? 'var(--text-muted)' : 'var(--accent)',
            color: '#fff', border: 'none', borderRadius: '0.375rem',
            cursor: deploying || isRunning ? 'not-allowed' : 'pointer'
          }}>
          {deploying ? 'Creating…' : 'Create deployment'}
        </button>

        {(anyFailed || allSuccess) && (
          <button
            onClick={handleRollback}
            disabled={rollingBack}
            aria-label={`Rollback deployment in ${env} environment`}
            style={{
              padding: '0.375rem 0.875rem', fontSize: '0.875rem', fontWeight: 600,
              background: rollingBack ? 'var(--text-muted)' : 'var(--danger)',
              color: '#fff', border: 'none', borderRadius: '0.375rem',
              cursor: rollingBack ? 'not-allowed' : 'pointer'
            }}>
            {rollingBack ? 'Rolling back…' : 'Rollback'}
          </button>
        )}
      </div>

      {/* Pipeline stage visualization */}
      <div role="list" aria-label="Pipeline stages" style={{
        display: 'flex', alignItems: 'stretch', gap: 0,
        overflowX: 'auto', paddingBottom: '0.25rem'
      }}>
        {STAGES.map((stage, idx) => (
          <div role="listitem" key={stage} style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
            <StageCard
              stage={stage}
              status={stages[stage]?.status || 'pending'}
              startedAt={stages[stage]?.startedAt}
              finishedAt={stages[stage]?.finishedAt}
              artifactUrl={stages[stage]?.artifactUrl}
              isDeployStage={stage === 'Deploy'}
              env={env}
              onDeploy={handleDeploy}
            />
            {idx < STAGES.length - 1 && (
              <PipelineConnector done={stages[stage]?.status === 'success'} />
            )}
          </div>
        ))}
      </div>

      {/* Pipeline ID and message */}
      {pipelineId && (
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Pipeline: <code style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{pipelineId}</code>
        </p>
      )}
      {message && (
        <p aria-live="polite" style={{ margin: 0, fontSize: '0.875rem', color: anyFailed ? 'var(--danger)' : 'var(--success)' }}>
          {message}
        </p>
      )}
    </div>
  );
}
