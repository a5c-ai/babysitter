import React, { useState, useCallback } from 'react';
import { CodespaceSection, CodespaceInfo } from './WorkspaceCodespace.js';
import { AssociationsSection, WorkspaceAssociation } from './WorkspaceAssociations.js';

// ---- Phase helpers ----

function phaseColor(phase: string) {
  return phase === 'Ready'
    ? '#22c55e'
    : phase === 'InUse'
    ? '#3b82f6'
    : phase === 'Pending'
    ? '#f59e0b'
    : phase === 'Terminating'
    ? '#ef4444'
    : phase === 'Archived'
    ? '#6b7280'
    : '#9ca3af';
}

// ---- PVC Status Badge ----

function PvcStatusBadge({ status }: { status: string }) {
  const display = status || 'Unknown';
  const bg =
    display === 'Bound'
      ? '#d1fae5'
      : display === 'Pending'
      ? '#fef3c7'
      : display === 'Released'
      ? '#e5e7eb'
      : '#f3f4f6';
  const fg =
    display === 'Bound'
      ? '#065f46'
      : display === 'Pending'
      ? '#92400e'
      : display === 'Released'
      ? '#374151'
      : '#6b7280';
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

// ---- Resource usage bars ----

function ResourceUsageBar({
  label,
  value,
  max,
  unit = '%',
  color = '#3b82f6',
}: {
  label: string;
  value: number;
  max?: number;
  unit?: string;
  color?: string;
}) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : value;
  const barColor = pct > 85 ? '#ef4444' : pct > 60 ? '#f97316' : color;
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--text)',
          marginBottom: '0.25rem',
        }}
      >
        <span>{label}</span>
        <span style={{ fontWeight: 600 }}>
          {value}
          {unit}
          {max ? ` / ${max}${unit}` : ''}
        </span>
      </div>
      <div
        style={{ height: '0.375rem', background: '#e5e7eb', borderRadius: '9999px', overflow: 'hidden' }}
      >
        <div
          role="meter"
          aria-label={`${label} usage`}
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
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

interface ResourceInfo {
  used?: number;
  total?: number;
}

function ResourceStats({
  cpu,
  memory,
  disk,
}: {
  cpu?: number | null;
  memory?: ResourceInfo | null;
  disk?: ResourceInfo | null;
}) {
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

// ---- Git status bar ----

function GitStatusBar({
  branch,
  dirty,
  ahead,
  behind,
}: {
  branch?: string | null;
  dirty?: boolean | null;
  ahead?: number | null;
  behind?: number | null;
}) {
  const displayBranch = branch || 'unknown';
  const isDirty = dirty != null ? dirty : false;
  const aheadCount = ahead ?? 0;
  const behindCount = behind ?? 0;
  return (
    <div
      aria-label="Git branch status"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '0.375rem 0.625rem',
        background: 'var(--bg-subtle)',
        borderRadius: '0.375rem',
        fontSize: '0.75rem',
        fontFamily: 'var(--font-mono, monospace)',
      }}
    >
      <span style={{ color: 'var(--text-muted)' }} aria-hidden="true">
        &#x2387;
      </span>
      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{displayBranch}</span>
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
        <span style={{ color: 'var(--accent)' }} title={`${aheadCount} commit(s) ahead of remote`}>
          &uarr;{aheadCount}
        </span>
      ) : null}
      {behindCount > 0 ? (
        <span style={{ color: 'var(--danger)' }} title={`${behindCount} commit(s) behind remote`}>
          &darr;{behindCount}
        </span>
      ) : null}
      {aheadCount === 0 && behindCount === 0 ? (
        <span style={{ color: 'var(--text-muted)' }}>up to date</span>
      ) : null}
    </div>
  );
}

// ---- Workspace actions ----

function WorkspaceActions({
  phase,
  onSync,
  onRelease,
  onDelete,
}: {
  phase: string;
  onSync?: () => void;
  onRelease?: () => void;
  onDelete?: () => void;
}) {
  const btnBase: React.CSSProperties = {
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
        <button onClick={onSync} aria-label="Sync workspace" style={{ ...btnBase, background: 'var(--accent)', color: '#fff' }}>
          Sync
        </button>
      ) : null}
      {phase === 'InUse' ? (
        <button onClick={onRelease} aria-label="Release workspace" style={{ ...btnBase, background: '#f59e0b', color: '#fff' }}>
          Release
        </button>
      ) : null}
      {phase !== 'Terminating' ? (
        <button onClick={onDelete} aria-label="Delete workspace" style={{ ...btnBase, background: '#ef4444', color: '#fff' }}>
          Delete
        </button>
      ) : null}
    </div>
  );
}

// ---- Session binding ----

function SessionBinding({ sessionName, sessionHref }: { sessionName?: string | null; sessionHref?: string | null }) {
  if (sessionName) {
    return (
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
        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Active session</span>
        <a
          href={sessionHref || '#'}
          aria-label={`Go to session ${sessionName}`}
          style={{
            color: 'var(--accent)',
            textDecoration: 'none',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.75rem',
          }}
        >
          {sessionName} &rarr;
        </a>
      </div>
    );
  }
  return (
    <div
      style={{
        padding: '0.5rem 0.75rem',
        background: 'var(--bg-subtle)',
        borderRadius: '0.375rem',
        fontSize: '0.8125rem',
        color: 'var(--text-muted)',
      }}
    >
      No active session bound
    </div>
  );
}

// ---- Terminal placeholder ----

function TerminalPlaceholder({ sessionHref }: { sessionHref?: string | null }) {
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
        <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.6875rem' }}>TERMINAL</div>
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
              }}
            />
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            No active terminal session. Connect to start a live terminal.
          </div>
        )}
      </div>
      {!connected ? (
        <button
          onClick={handleConnect}
          disabled={connecting}
          aria-label="Connect to workspace terminal"
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
          aria-label="Disconnect from workspace terminal"
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

// ---- File tree ----

interface FileNode {
  name: string;
  type: 'file' | 'dir';
  children?: FileNode[];
}

const MOCK_FILE_TREE: FileNode[] = [
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
    children: [{ name: 'app.test.ts', type: 'file' }],
  },
  { name: 'package.json', type: 'file' },
  { name: 'tsconfig.json', type: 'file' },
  { name: 'README.md', type: 'file' },
];

function FileTreeNode({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth === 0);
  const isDir = node.type === 'dir';
  const indent = depth * 12;
  return (
    <div>
      <div
        role={isDir ? 'button' : undefined}
        tabIndex={isDir ? 0 : undefined}
        aria-expanded={isDir ? expanded : undefined}
        aria-label={isDir ? `${expanded ? 'Collapse' : 'Expand'} folder ${node.name}` : undefined}
        onClick={isDir ? () => setExpanded((v) => !v) : undefined}
        onKeyDown={
          isDir
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setExpanded((v) => !v);
                }
              }
            : undefined
        }
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
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = '#f3f4f6';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = 'transparent';
        }}
      >
        {isDir ? (
          <span aria-hidden="true" style={{ fontSize: '0.75rem', marginRight: '0.25rem', color: 'var(--text-muted)' }}>
            {expanded ? '▾' : '▸'}
          </span>
        ) : (
          <span
            aria-hidden="true"
            style={{
              fontSize: '0.75rem',
              marginRight: '0.25rem',
              color: 'var(--text-muted)',
              display: 'inline-block',
              width: '0.75rem',
            }}
          >
            &mdash;
          </span>
        )}
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

function FileSidebar({
  fileTree,
  sidebarOpen,
  onToggle,
}: {
  fileTree?: FileNode[] | null;
  sidebarOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        width: sidebarOpen ? '14rem' : '2.25rem',
        minWidth: sidebarOpen ? '14rem' : '2.25rem',
        flexShrink: 0,
        borderRight: '1px solid #e5e7eb',
        background: 'var(--bg-subtle)',
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
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        {sidebarOpen ? (
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
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
            color: 'var(--text-muted)',
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

// ---- Run history ----

function RunPhaseBadge({ phase }: { phase: string }) {
  const display = phase || 'Unknown';
  const colorMap: Record<string, { bg: string; fg: string }> = {
    Running: { bg: '#dbeafe', fg: '#1e40af' },
    Queued: { bg: '#fef3c7', fg: '#92400e' },
    Pending: { bg: '#fef3c7', fg: '#92400e' },
    Dispatched: { bg: '#e0e7ff', fg: '#3730a3' },
    Succeeded: { bg: '#d1fae5', fg: '#065f46' },
    Failed: { bg: '#fee2e2', fg: '#991b1b' },
    Cancelled: { bg: '#e5e7eb', fg: '#374151' },
  };
  const colors = colorMap[display] || { bg: '#f3f4f6', fg: '#6b7280' };
  return (
    <span
      style={{
        background: colors.bg,
        color: colors.fg,
        borderRadius: '0.25rem',
        padding: '0.0625rem 0.375rem',
        fontWeight: 700,
        fontSize: '0.625rem',
      }}
    >
      {display}
    </span>
  );
}

function formatRelativeTime(dateStr?: string) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export interface RunRecord {
  metadata?: { name?: string; creationTimestamp?: string };
  spec?: { agentStack?: string };
  status?: { phase?: string; createdAt?: string; duration?: string };
}

function RunHistorySection({ active = [], history = [], org }: { active?: RunRecord[]; history?: RunRecord[]; org?: string }) {
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const tabStyle = (selected: boolean): React.CSSProperties => ({
    padding: '0.25rem 0.625rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    border: 'none',
    borderBottom: selected ? '2px solid #2563eb' : '2px solid transparent',
    background: 'none',
    color: selected ? '#2563eb' : '#6b7280',
    cursor: 'pointer',
  });
  const runs = tab === 'active' ? active : history;
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.75rem' }}>
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
        Runs
      </div>
      <div
        style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border)', marginBottom: '0.5rem' }}
        role="tablist"
        aria-label="Run history tabs"
      >
        <button
          onClick={() => setTab('active')}
          style={tabStyle(tab === 'active')}
          role="tab"
          aria-selected={tab === 'active'}
        >
          Active ({active.length})
        </button>
        <button
          onClick={() => setTab('history')}
          style={tabStyle(tab === 'history')}
          role="tab"
          aria-selected={tab === 'history'}
        >
          History ({history.length})
        </button>
      </div>
      {runs.length > 0 ? (
        <div role="list" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {runs.map((run) => {
            const name = run.metadata?.name || 'unknown';
            const stack = run.spec?.agentStack || '--';
            const phase = run.status?.phase || 'Unknown';
            const started = run.status?.createdAt || run.metadata?.creationTimestamp;
            const duration = run.status?.duration || null;
            const href = org ? `/orgs/${org}/agents/runs/${name}` : null;
            return (
              <div
                key={name}
                role="listitem"
                aria-label={`Run ${name}, status ${phase}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.375rem 0.5rem',
                  background: 'var(--bg-subtle)',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', minWidth: 0 }}>
                  <RunPhaseBadge phase={phase} />
                  {href ? (
                    <a
                      href={href}
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        color: 'var(--accent)',
                        textDecoration: 'none',
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {name}
                    </a>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>{name}</span>
                  )}
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono, monospace)' }}>{stack}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
                  <span>{formatRelativeTime(started)}</span>
                  {duration ? <span>{duration}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {tab === 'active' ? 'No active runs' : 'No run history'}
        </div>
      )}
    </div>
  );
}

// ---- Main WorkspacePanel ----

export interface WorkspaceResource {
  metadata?: { name?: string };
  spec?: {
    repository?: string;
    branch?: string;
    pvcName?: string;
    volumeSpec?: { capacity?: string; storageClassName?: string };
    associations?: WorkspaceAssociation[];
  };
  status?: {
    phase?: string;
    volumeStatus?: string;
    runRef?: string;
    gitBranch?: string;
    gitDirty?: boolean;
    gitAhead?: number;
    gitBehind?: number;
  };
}

export interface WorkspaceRuntimeResource {
  spec?: {
    gitBranch?: string;
    gitDirty?: boolean;
    gitAhead?: number;
    gitBehind?: number;
    fileTree?: FileNode[];
    cpu?: number;
    memory?: ResourceInfo;
    disk?: ResourceInfo;
  };
  status?: {
    cpu?: number;
    memory?: ResourceInfo;
    disk?: ResourceInfo;
  };
}

export interface WorkspaceSessionResource {
  metadata?: { name?: string };
}

export interface WorkspacePanelProps {
  workspace?: WorkspaceResource | null;
  runtime?: WorkspaceRuntimeResource | null;
  session?: WorkspaceSessionResource | null;
  org?: string;
  codespace?: CodespaceInfo | null;
  associations?: WorkspaceAssociation[] | null;
  activeRuns?: RunRecord[] | null;
  historyRuns?: RunRecord[] | null;
  onLaunchCodespace?: ((opts: { image: string }) => void) | null;
  onStopCodespace?: (() => void) | null;
  onAddAssociation?: ((a: WorkspaceAssociation) => void) | null;
  onRemoveAssociation?: ((a: WorkspaceAssociation) => void) | null;
}

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
}: WorkspacePanelProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const wsName = workspace?.metadata?.name || 'Workspace';
  const repository = workspace?.spec?.repository || null;
  const phase = workspace?.status?.phase || 'Unknown';

  const volumeSpec = workspace?.spec?.volumeSpec || {};
  const pvcName = workspace?.spec?.pvcName || null;
  const volumeStatus = workspace?.status?.volumeStatus || 'Unknown';
  const capacity = volumeSpec.capacity || '10Gi';
  const storageClassName = volumeSpec.storageClassName || 'standard';

  const runRef = workspace?.status?.runRef || null;

  const gitBranch = workspace?.spec?.branch || runtime?.spec?.gitBranch || workspace?.status?.gitBranch || null;
  const gitDirty = runtime?.spec?.gitDirty ?? workspace?.status?.gitDirty ?? null;
  const gitAhead = runtime?.spec?.gitAhead ?? workspace?.status?.gitAhead ?? null;
  const gitBehind = runtime?.spec?.gitBehind ?? workspace?.status?.gitBehind ?? null;

  const fileTree = runtime?.spec?.fileTree || null;

  const cpuPct = runtime?.status?.cpu ?? runtime?.spec?.cpu ?? null;
  const memoryInfo = runtime?.status?.memory || runtime?.spec?.memory || null;
  const diskInfo = runtime?.status?.disk || runtime?.spec?.disk || null;

  const sessionName = session?.metadata?.name || null;
  const sessionHref = sessionName ? `/orgs/${org}/agents/sessions/${sessionName}` : null;

  const pColor = phaseColor(phase);

  const handleSync = useCallback(() => {}, []);
  const handleRelease = useCallback(() => {}, []);
  const handleDelete = useCallback(() => {}, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
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
          <span
            style={{
              fontSize: '0.8125rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
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
          <span>
            <strong>PVC:</strong> {pvcName}
          </span>
        ) : null}
        <span>
          <strong>Capacity:</strong> {capacity}
        </span>
        <span>
          <strong>Storage class:</strong> {storageClassName}
        </span>
        {runRef ? (
          <span style={{ color: 'var(--accent)' }}>
            <strong>Mounted by:</strong> {runRef}
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>Not mounted</span>
        )}
      </div>

      {/* Git status */}
      {gitBranch || gitDirty != null ? (
        <GitStatusBar branch={gitBranch} dirty={gitDirty} ahead={gitAhead} behind={gitBehind} />
      ) : null}

      {/* Actions */}
      <WorkspaceActions phase={phase} onSync={handleSync} onRelease={handleRelease} onDelete={handleDelete} />

      {/* Codespace section */}
      <CodespaceSection
        codespace={codespace}
        workspaceName={wsName}
        org={org}
        onLaunch={onLaunchCodespace ?? undefined}
        onStop={onStopCodespace ?? undefined}
      />

      {/* Associations manager */}
      <AssociationsSection
        associations={associations ?? workspace?.spec?.associations ?? []}
        onAdd={onAddAssociation ?? undefined}
        onRemove={onRemoveAssociation ?? undefined}
      />

      {/* Run history */}
      <RunHistorySection active={activeRuns ?? []} history={historyRuns ?? []} org={org} />

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
          <SessionBinding sessionName={sessionName} sessionHref={sessionHref} />
          <TerminalPlaceholder sessionHref={sessionHref} />
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
