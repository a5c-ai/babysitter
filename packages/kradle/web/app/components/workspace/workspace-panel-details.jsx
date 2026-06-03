'use client';

import { useState } from 'react';
import { MOCK_FILE_TREE, FileIcon } from './workspace-panel-helpers.jsx';

// ---- File tree ----

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
        aria-label={isDir ? `${expanded ? 'Collapse' : 'Expand'} folder ${node.name}` : undefined}
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

export function FileSidebar({ fileTree, sidebarOpen, onToggle }) {
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
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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

// ---- Git status indicator ----

export function GitStatusBar({ branch, dirty, ahead, behind }) {
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

// ---- Terminal placeholder ----

export function TerminalPlaceholder({ sessionHref }) {
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
        <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.6875rem' }}>
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

// ---- Workspace action buttons ----

export function WorkspaceActions({ phase, onSync, onRelease, onDelete }) {
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
        <button onClick={onSync} aria-label="Sync workspace" style={{ ...btnBase, background: 'var(--accent)', color: '#fff' }}>
          Sync
        </button>
      ) : null}
      {phase === 'InUse' ? (
        <button onClick={onRelease} aria-label="Release workspace" style={{ ...btnBase, background: '#f59e0b', color: '#fff' }}>
          Release
        </button>
      ) : null}
      {(phase !== 'Terminating') ? (
        <button onClick={onDelete} aria-label="Delete workspace" style={{ ...btnBase, background: '#ef4444', color: '#fff' }}>
          Delete
        </button>
      ) : null}
    </div>
  );
}

// ---- Session binding info ----

export function SessionBinding({ sessionName, sessionHref }) {
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
          href={sessionHref}
          aria-label={`Go to session ${sessionName}`}
          style={{ color: 'var(--accent)', textDecoration: 'none', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem' }}
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
