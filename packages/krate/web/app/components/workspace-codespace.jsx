'use client';

import { useState } from 'react';

function CodespaceStatusBadge({ status }) {
  const display = status || 'Stopped';
  const bg = display === 'Running' ? '#d1fae5' : display === 'Starting' ? '#fef3c7' : display === 'Stopping' ? '#fef3c7' : '#f3f4f6';
  const fg = display === 'Running' ? '#065f46' : display === 'Starting' ? '#92400e' : display === 'Stopping' ? '#92400e' : '#6b7280';

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
      {display}
    </span>
  );
}

export function CodespaceSection({ codespace, workspaceName, org, onLaunch, onStop }) {
  const [selectedImage, setSelectedImage] = useState('codercom/code-server:latest');
  const [confirmStop, setConfirmStop] = useState(false);

  const images = [
    { value: 'codercom/code-server:latest', label: 'code-server' },
    { value: 'gitpod/openvscode-server:latest', label: 'openvscode-server' },
  ];

  const btnBase = {
    padding: '0.375rem 0.75rem',
    fontSize: '0.75rem',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    transition: 'background 0.15s',
  };

  const isRunning = codespace?.running === true;
  const isStarting = codespace?.phase === 'Starting' || codespace?.phase === 'Pending';
  const isStopping = codespace?.phase === 'Stopping';

  const formatUptime = (startTime) => {
    if (!startTime) return '--';
    const start = new Date(startTime);
    const now = new Date();
    const diff = Math.floor((now - start) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        padding: '0.75rem',
      }}
    >
      <div
        style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#374151',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        Codespace
        <CodespaceStatusBadge status={isRunning ? 'Running' : isStarting ? 'Starting' : isStopping ? 'Stopping' : 'Stopped'} />
      </div>

      {!isRunning && !isStarting && !isStopping ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select
            value={selectedImage}
            onChange={(e) => setSelectedImage(e.target.value)}
            style={{
              padding: '0.375rem 0.5rem',
              fontSize: '0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              background: '#fff',
            }}
          >
            {images.map((img) => (
              <option key={img.value} value={img.value}>{img.label}</option>
            ))}
          </select>
          <button
            onClick={() => onLaunch?.({ image: selectedImage })}
            style={{ ...btnBase, background: '#22c55e', color: '#fff' }}
          >
            Launch Codespace
          </button>
        </div>
      ) : null}

      {isRunning ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono, monospace)',
              color: '#374151',
              flexWrap: 'wrap',
            }}
          >
            <span><strong>Uptime:</strong> {formatUptime(codespace.startTime)}</span>
            {codespace.cpu != null ? <span><strong>CPU:</strong> {codespace.cpu}</span> : null}
            {codespace.memory != null ? <span><strong>Memory:</strong> {codespace.memory}</span> : null}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {codespace.url ? (
              <a
                href={codespace.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...btnBase,
                  background: '#2563eb',
                  color: '#fff',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Open in Browser
              </a>
            ) : null}
            {!confirmStop ? (
              <button
                onClick={() => setConfirmStop(true)}
                style={{ ...btnBase, background: '#ef4444', color: '#fff' }}
              >
                Stop Codespace
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Confirm?</span>
                <button
                  onClick={() => { setConfirmStop(false); onStop?.(); }}
                  style={{ ...btnBase, background: '#ef4444', color: '#fff' }}
                >
                  Yes, Stop
                </button>
                <button
                  onClick={() => setConfirmStop(false)}
                  style={{ ...btnBase, background: '#e5e7eb', color: '#374151' }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {(isStarting || isStopping) ? (
        <div style={{ fontSize: '0.75rem', color: '#92400e' }}>
          {isStarting ? 'Starting codespace...' : 'Stopping codespace...'}
        </div>
      ) : null}
    </div>
  );
}
