'use client';

import { useState, useCallback } from 'react';
import { CodespaceSection } from './workspace-codespace.jsx';
import { AssociationsSection } from './workspace-associations.jsx';
import { RunHistorySection } from './workspace-run-history.jsx';

// ---- File tree ----

const MOCK_FILE_TREE = [
  {
    name: 'src',
    type: 'dir',
    children: [
      {
        name: 'components',
        type: 'dir',
        children: [
          { name: 'App.tsx', type: 'file' },
          { name: 'Header.tsx', type: 'file' },
        ],
      },
      { name: 'index.ts', type: 'file' },
      { name: 'utils.ts', type: 'file' },
    ],
  },
  {
    name: 'tests',
    type: 'dir',
    children: [
      { name: 'app.test.ts', type: 'file' },
    ],
  },
  { name: 'package.json', type: 'file' },
  { name: 'tsconfig.json', type: 'file' },
  { name: 'README.md', type: 'file' },
];

function FileIcon({ type, expanded }) {
  if (type === 'dir') {
    return (
      <span
        aria-hidden="true"
        style={{ fontSize: '0.75rem', marginRight: '0.25rem', color: '#6b7280' }}
      >
        {expanded ? '▾' : '▸'}
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{ fontSize: '0.75rem', marginRight: '0.25rem', color: '#9ca3af', display: 'inline-block', width: '0.75rem' }}
    >
      &mdash;
    </span>
  );
}

function FileTreeNode({ node, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth === 0);

  const isDir = node.type === 'dir';
  const indent = depth * 12;

  return (
    <div>
      <div
        role={isDir ? 'button' : undefined}
        tabIndex={isDir ? 0 : undefined}
        aria-expanded={isDir ? expanded : undefined}
        onClick={isDir ? () => setExpanded((v) => !v) : undefined}
        onKeyDown={isDir ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded((v) => !v); } } : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          paddingLeft: `${indent + 4}px`,
          paddingTop: '0.1875rem',
          paddingBottom: '0.1875rem',
          fontSize: '0.8125rem',
          cursor: isDir ? 'pointer' : 'default',
          borderRadius: '0.25rem',
          color: isDir ? '#111827' : '#374151',
          fontWeight: isDir ? 600 : 400,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <FileIcon type={node.type} expanded={expanded} />
        <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>{node.name}</span>
      </div>
      {isDir && expanded && node.children ? (
        <div>
          {node.children.map((child) => (
            <FileTreeNode key={child.name} node={child} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FileSidebar({ fileTree, sidebarOpen, onToggle }) {
  return (
    <div
      style={{
        width: sidebarOpen ? '14rem' : '2.25rem',
        minWidth: sidebarOpen ? '14rem' : '2.25rem',
        flexShrink: 0,
        borderRight: '1px solid #e5e7eb',
        background: '#f9fafb',
        borderRadius: '0.5rem 0 0 0.5rem',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease, min-width 0.2s ease',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem 0.625rem',
          borderBottom: '1px solid #e5e7eb',
          flexShrink: 0,
        }}
      >
        {sidebarOpen ? (
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Files
          </span>
        ) : null}
        <button
          onClick={onToggle}
          aria-label={sidebarOpen ? 'Collapse file tree' : 'Expand file tree'}
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            padding: '0.125rem 0.25rem',
            borderRadius: '0.25rem',
            fontSize: '0.875rem',
            color: '#6b7280',
            marginLeft: sidebarOpen ? 'auto' : 0,
          }}
        >
          {sidebarOpen ? '«' : '»'}
        </button>
      </div>
      {sidebarOpen ? (
        <div style={{ overflowY: 'auto', flex: 1, padding: '0.375rem 0.25rem' }}>
          {(fileTree || MOCK_FILE_TREE).map((node) => (
            <FileTreeNode key={node.name} node={node} depth={0} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ---- Git status indicator ----

function GitStatusBar({ branch, dirty, ahead, behind }) {
  const displayBranch = branch || 'unknown';
  const isDirty = dirty != null ? dirty : false;
  const aheadCount = ahead ?? 0;
  const behindCount = behind ?? 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '0.375rem 0.625rem',
        background: '#f3f4f6',
        borderRadius: '0.375rem',
        fontSize: '0.75rem',
        fontFamily: 'var(--font-mono, monospace)',
      }}
    >
      <span style={{ color: '#6b7280' }} aria-hidden="true">
        &#x2387;
      </span>
      <span style={{ fontWeight: 600, color: '#111827' }}>{displayBranch}</span>
      {isDirty ? (
        <span
          title="Uncommitted changes"
          style={{
            background: '#fef3c7',
            color: '#92400e',
            borderRadius: '0.25rem',
            padding: '0.0625rem 0.375rem',
            fontWeight: 700,
            fontSize: '0.6875rem',
          }}
        >
          dirty
        </span>
      ) : (
        <span
          style={{
            background: '#d1fae5',
            color: '#065f46',
            borderRadius: '0.25rem',
            padding: '0.0625rem 0.375rem',
            fontWeight: 700,
            fontSize: '0.6875rem',
          }}
        >
          clean
        </span>
      )}
      {aheadCount > 0 ? (
        <span style={{ color: '#2563eb' }} title={`${aheadCount} commit(s) ahead of remote`}>
          &uarr;{aheadCount}
        </span>
      ) : null}
      {behindCount > 0 ? (
        <span style={{ color: '#dc2626' }} title={`${behindCount} commit(s) behind remote`}>
          &darr;{behindCount}
        </span>
      ) : null}
      {aheadCount === 0 && behindCount === 0 ? (
        <span style={{ color: '#9ca3af' }}>up to date</span>
      ) : null}
    </div>
  );
}

// ---- Terminal placeholder ----

function TerminalPlaceholder({ sessionHref }) {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  function handleConnect() {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      if (sessionHref) {
        window.open(sessionHref, '_blank', 'noopener,noreferrer');
      } else {
        setConnected(true);
      }
    }, 600);
  }

  return (
    <div
      style={{
        background: '#111827',
        borderRadius: '0.5rem',
        padding: '1rem',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: '0.8125rem',
        color: '#d1d5db',
        minHeight: '7rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '0.75rem',
      }}
    >
      <div>
        <div style={{ color: '#6b7280', marginBottom: '0.5rem', fontSize: '0.6875rem' }}>
          TERMINAL
        </div>
        {connected ? (
          <div>
            <span style={{ color: '#22c55e' }}>$</span>
            <span style={{ marginLeft: '0.5rem', color: '#d1d5db' }}>agent@workspace:~$</span>
            <span
              style={{
                display: 'inline-block',
                width: '0.5rem',
                height: '1em',
                background: '#22c55e',
                marginLeft: '0.25rem',
                verticalAlign: 'text-bottom',
                animation: 'none',
              }}
            />
          </div>
        ) : (
          <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
            No active terminal session. Connect to start a live terminal.
          </div>
        )}
      </div>
      {!connected ? (
        <button
          onClick={handleConnect}
          disabled={connecting}
          style={{
            alignSelf: 'flex-start',
            padding: '0.375rem 0.75rem',
            fontSize: '0.75rem',
            background: connecting ? '#374151' : '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: connecting ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {connecting ? 'Connecting...' : 'Connect terminal'}
        </button>
      ) : (
        <button
          onClick={() => setConnected(false)}
          style={{
            alignSelf: 'flex-start',
            padding: '0.375rem 0.75rem',
            fontSize: '0.75rem',
            background: '#374151',
            color: '#d1d5db',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
          }}
        >
          Disconnect
        </button>
      )}
    </div>
  );
}

// ---- Resource usage stats ----

function ResourceUsageBar({ label, value, max, unit = '%', color = '#3b82f6' }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : value;
  const barColor = pct > 85 ? '#ef4444' : pct > 60 ? '#f97316' : color;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: '#374151',
          marginBottom: '0.25rem',
        }}
      >
        <span>{label}</span>
        <span style={{ fontWeight: 600 }}>
          {value}{unit}{max ? ` / ${max}${unit}` : ''}
        </span>
      </div>
      <div
        style={{
          height: '0.375rem',
          background: '#e5e7eb',
          borderRadius: '9999px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: barColor,
            borderRadius: '9999px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

function ResourceStats({ cpu, memory, disk }) {
  const cpuVal = cpu ?? 12;
  const memUsed = memory?.used ?? 1.2;
  const memTotal = memory?.total ?? 4;
  const diskUsed = disk?.used ?? 8;
  const diskTotal = disk?.total ?? 20;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <ResourceUsageBar label="CPU" value={cpuVal} unit="%" color="#3b82f6" />
      <ResourceUsageBar label="Memory" value={memUsed} max={memTotal} unit=" GB" color="#8b5cf6" />
      <ResourceUsageBar label="Disk" value={diskUsed} max={diskTotal} unit=" GB" color="#06b6d4" />
    </div>
  );
}

// ---- PVC status badge ----

function PvcStatusBadge({ status }) {
  const display = status || 'Unknown';
  const bg = display === 'Bound' ? '#d1fae5' : display === 'Pending' ? '#fef3c7' : display === 'Released' ? '#e5e7eb' : '#f3f4f6';
  const fg = display === 'Bound' ? '#065f46' : display === 'Pending' ? '#92400e' : display === 'Released' ? '#374151' : '#6b7280';

  return (
    <span
      style={{
        background: bg,
        color: fg,
        borderRadius: '0.25rem',
        padding: '0.0625rem 0.375rem',
        fontWeight: 700,
        fontSize: '0.6875rem',
      }}
    >
      PVC: {display}
    </span>
  );
}

// ---- Workspace action buttons ----

function WorkspaceActions({ phase, onSync, onRelease, onDelete }) {
  const btnBase = {
    padding: '0.375rem 0.75rem',
    fontSize: '0.75rem',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    transition: 'background 0.15s',
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {(phase === 'Ready' || phase === 'InUse') ? (
        <button onClick={onSync} style={{ ...btnBase, background: '#2563eb', color: '#fff' }}>
          Sync
        </button>
      ) : null}
      {phase === 'InUse' ? (
        <button onClick={onRelease} style={{ ...btnBase, background: '#f59e0b', color: '#fff' }}>
          Release
        </button>
      ) : null}
      {(phase !== 'Terminating') ? (
        <button onClick={onDelete} style={{ ...btnBase, background: '#ef4444', color: '#fff' }}>
          Delete
        </button>
      ) : null}
    </div>
  );
}

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

  const phaseColor = phase === 'Ready' ? '#22c55e' : phase === 'InUse' ? '#3b82f6' : phase === 'Pending' ? '#f59e0b' : phase === 'Terminating' ? '#ef4444' : phase === 'Archived' ? '#6b7280' : '#9ca3af';

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
              background: phaseColor,
              color: '#fff',
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
          <span style={{ fontSize: '0.8125rem', color: '#6b7280', fontFamily: 'var(--font-mono, monospace)' }}>
            {repository}
          </span>
        ) : null}
      </div>

      {/* Volume info bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '0.5rem 0.75rem',
          background: '#f9fafb',
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
          <span style={{ color: '#2563eb' }}><strong>Mounted by:</strong> {runRef}</span>
        ) : (
          <span style={{ color: '#9ca3af' }}>Not mounted</span>
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
          border: '1px solid #e5e7eb',
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
          {sessionName ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                background: '#eff6ff',
                borderRadius: '0.375rem',
                fontSize: '0.8125rem',
              }}
            >
              <span style={{ color: '#1d4ed8', fontWeight: 600 }}>Active session</span>
              <a
                href={sessionHref}
                style={{ color: '#2563eb', textDecoration: 'none', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem' }}
              >
                {sessionName} &rarr;
              </a>
            </div>
          ) : (
            <div
              style={{
                padding: '0.5rem 0.75rem',
                background: '#f9fafb',
                borderRadius: '0.375rem',
                fontSize: '0.8125rem',
                color: '#9ca3af',
              }}
            >
              No active session bound
            </div>
          )}

          {/* Terminal */}
          <TerminalPlaceholder sessionHref={sessionHref} />

          {/* Resource usage */}
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#374151',
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
