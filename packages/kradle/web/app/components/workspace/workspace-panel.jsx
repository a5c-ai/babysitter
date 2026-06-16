'use client';

import { useState, useCallback } from 'react';
import { CodespaceSection } from './workspace-codespace.jsx';
import { AssociationsSection } from './workspace-associations.jsx';
import { RunHistorySection } from './workspace-run-history.jsx';
import { phaseColor, PvcStatusBadge, ResourceStats } from './workspace-panel-helpers.jsx';
import {
  FileSidebar,
  GitStatusBar,
  TerminalPlaceholder,
  WorkspaceActions,
  SessionBinding,
} from './workspace-panel-details.jsx';

// ---- Main workspace panel orchestrator ----

export function WorkspacePanel({
  workspace = null,
  runtime = null,
  session = null,
  org = 'default',
  codespace = null,
  associations = null,
  activeRuns = null,
  historyRuns = null,
  onLaunchCodespace = null,
  onStopCodespace = null,
  onAddAssociation = null,
  onRemoveAssociation = null,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const wsName = workspace?.metadata?.name || 'Workspace';
  const repository = workspace?.spec?.repository || null;
  const phase = workspace?.status?.phase || 'Unknown';

  // Volume info
  const volumeSpec = workspace?.spec?.volumeSpec || {};
  const pvcName = workspace?.spec?.pvcName || null;
  const volumeStatus = workspace?.status?.volumeStatus || 'Unknown';
  const capacity = volumeSpec.capacity || '10Gi';
  const storageClassName = volumeSpec.storageClassName || 'standard';

  // Run binding
  const runRef = workspace?.status?.runRef || null;

  // Git info
  const gitBranch = workspace?.spec?.branch || runtime?.spec?.gitBranch || workspace?.status?.gitBranch || null;
  const gitDirty = runtime?.spec?.gitDirty ?? workspace?.status?.gitDirty ?? null;
  const gitAhead = runtime?.spec?.gitAhead ?? workspace?.status?.gitAhead ?? null;
  const gitBehind = runtime?.spec?.gitBehind ?? workspace?.status?.gitBehind ?? null;

  // File tree from runtime
  const fileTree = runtime?.spec?.fileTree || null;

  // Resource usage
  const cpuPct = runtime?.status?.cpu ?? runtime?.spec?.cpu ?? null;
  const memoryInfo = runtime?.status?.memory || runtime?.spec?.memory || null;
  const diskInfo = runtime?.status?.disk || runtime?.spec?.disk || null;

  // Session link
  const sessionName = session?.metadata?.name || null;
  const sessionHref = sessionName ? `/orgs/${org}/agents/sessions/${sessionName}` : null;

  const pColor = phaseColor(phase);

  const handleSync = useCallback(() => {
    // Intent — dispatched to controller
  }, []);
  const handleRelease = useCallback(() => {
    // Intent — dispatched to controller
  }, []);
  const handleDelete = useCallback(() => {
    // Intent — dispatched to controller
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        height: '100%',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{wsName}</h2>
          <span
            style={{
              background: pColor,
              color: 'var(--surface)',
              borderRadius: '9999px',
              padding: '0.125rem 0.5rem',
              fontSize: '0.6875rem',
              fontWeight: 700,
            }}
          >
            {phase}
          </span>
          <PvcStatusBadge status={volumeStatus} />
        </div>
        {repository ? (
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono, monospace)' }}>
            {repository}
          </span>
        ) : null}
      </div>

      {/* Volume info bar */}
      <div
        aria-label="Volume information"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '0.5rem 0.75rem',
          background: 'var(--bg-subtle)',
          borderRadius: '0.375rem',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono, monospace)',
          flexWrap: 'wrap',
        }}
      >
        {pvcName ? (
          <span><strong>PVC:</strong> {pvcName}</span>
        ) : null}
        <span><strong>Capacity:</strong> {capacity}</span>
        <span><strong>Storage class:</strong> {storageClassName}</span>
        {runRef ? (
          <span style={{ color: 'var(--accent)' }}><strong>Mounted by:</strong> {runRef}</span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>Not mounted</span>
        )}
      </div>

      {/* Git status */}
      {(gitBranch || gitDirty != null) ? (
        <GitStatusBar
          branch={gitBranch}
          dirty={gitDirty}
          ahead={gitAhead}
          behind={gitBehind}
        />
      ) : null}

      {/* Actions */}
      <WorkspaceActions
        phase={phase}
        onSync={handleSync}
        onRelease={handleRelease}
        onDelete={handleDelete}
      />

      {/* Codespace section */}
      <CodespaceSection
        codespace={codespace}
        workspaceName={wsName}
        org={org}
        onLaunch={onLaunchCodespace}
        onStop={onStopCodespace}
      />

      {/* Associations manager */}
      <AssociationsSection
        associations={associations ?? workspace?.spec?.associations ?? []}
        onAdd={onAddAssociation}
        onRemove={onRemoveAssociation}
      />

      {/* Run history */}
      <RunHistorySection
        active={activeRuns ?? []}
        history={historyRuns ?? []}
        org={org}
      />

      {/* Main area: sidebar + content */}
      <div
        style={{
          display: 'flex',
          border: '1px solid var(--border)',
          borderRadius: '0.5rem',
          overflow: 'hidden',
          minHeight: '18rem',
          flex: 1,
        }}
      >
        <FileSidebar
          fileTree={fileTree}
          sidebarOpen={sidebarOpen}
          onToggle={() => setSidebarOpen((v) => !v)}
        />

        {/* Right panel */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            padding: '0.75rem',
            minWidth: 0,
          }}
        >
          {/* Active session / mounted-by info */}
          <SessionBinding sessionName={sessionName} sessionHref={sessionHref} />

          {/* Terminal */}
          <TerminalPlaceholder sessionHref={sessionHref} />

          {/* Resource usage */}
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem',
              }}
            >
              Resource usage
            </div>
            <ResourceStats cpu={cpuPct} memory={memoryInfo} disk={diskInfo} />
          </div>
        </div>
      </div>
    </div>
  );
}
