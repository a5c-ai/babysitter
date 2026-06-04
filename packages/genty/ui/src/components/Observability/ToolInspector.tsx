import React, { useState } from 'react';

function tryParseJson(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function formatJson(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function truncate(text: string | null | undefined, maxLen: number): string {
  if (!text || text.length <= maxLen) return text || '';
  return text.slice(0, maxLen) + '...';
}

const STATUS_COLOR: Record<string, string> = {
  completed: '#22c55e',
  error: '#ef4444',
  running: '#f59e0b',
};

function statusColor(status: string) {
  return STATUS_COLOR[status] || '#94a3b8';
}

const TOOL_META: Record<string, { label: string; prefix: string }> = {
  bash: { label: 'Bash', prefix: '$' },
  read: { label: 'Read', prefix: 'R' },
  write: { label: 'Write', prefix: 'W' },
  edit: { label: 'Edit', prefix: 'E' },
  glob: { label: 'Glob', prefix: 'G' },
  grep: { label: 'Grep', prefix: '/' },
  web_fetch: { label: 'Fetch', prefix: 'F' },
  web_search: { label: 'Search', prefix: 'S' },
};

function resolveToolMeta(toolName: string) {
  const key = (toolName || '').toLowerCase().replace(/[^a-z_]/g, '');
  return TOOL_META[key] || { label: toolName || 'Tool', prefix: 'T' };
}

function inputSummary(toolName: string, input: unknown): string {
  const parsed = typeof input === 'string' ? tryParseJson(input) : input;
  if (!parsed) return '';
  const p = parsed as Record<string, unknown>;
  const key = (toolName || '').toLowerCase().replace(/[^a-z_]/g, '');
  if (key === 'bash') return truncate(String(p?.command || JSON.stringify(parsed)), 120);
  if (key === 'read') return String(p?.file_path || p?.path || JSON.stringify(parsed));
  if (key === 'write' || key === 'edit') return String(p?.file_path || JSON.stringify(parsed));
  if (key === 'glob') return String(p?.pattern || JSON.stringify(parsed));
  if (key === 'grep') return String(p?.pattern || JSON.stringify(parsed));
  if (key === 'web_fetch') return String(p?.url || JSON.stringify(parsed));
  if (key === 'web_search') return String(p?.query || JSON.stringify(parsed));
  return truncate(typeof parsed === 'string' ? parsed : JSON.stringify(parsed), 120);
}

export interface ToolCallInspectorProps {
  toolName: string;
  input?: unknown;
  output?: unknown;
  status?: string;
  durationMs?: number | null;
}

export function ToolCallInspector({
  toolName,
  input,
  output,
  status = 'completed',
  durationMs,
}: ToolCallInspectorProps) {
  const [open, setOpen] = useState(false);
  const meta = resolveToolMeta(toolName);
  const color = statusColor(status);
  const summary = inputSummary(toolName, input);
  const parsedInput = typeof input === 'string' ? tryParseJson(input) : input;
  const parsedOutput = typeof output === 'string' ? tryParseJson(output) : output;

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      aria-label={`Tool call: ${meta.label} - ${summary || 'no input'}`}
      style={{
        border: '1px solid #e2e8f0',
        borderLeft: `3px solid ${color}`,
        borderRadius: 4,
        marginBottom: 6,
        fontSize: 12,
        backgroundColor: '#fafafa',
      }}
    >
      <summary
        style={{
          cursor: 'pointer',
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          listStyle: 'none',
          userSelect: 'none',
        }}
      >
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 10,
            color: '#fff',
            backgroundColor: color,
            borderRadius: 3,
            padding: '1px 5px',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {meta.prefix}
        </span>
        <strong style={{ fontSize: 11, color: '#1e293b', flexShrink: 0 }}>{meta.label}</strong>
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 11,
            color: 'var(--text)',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {summary}
        </span>
        {durationMs != null && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
            {durationMs < 1000 ? `${durationMs}ms` : `${(durationMs / 1000).toFixed(1)}s`}
          </span>
        )}
        <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 4 }}>
          {open ? '▲' : '▼'}
        </span>
      </summary>

      <div style={{ padding: '8px 10px', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ marginBottom: parsedOutput != null ? 8 : 0 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: 4,
            }}
          >
            Input
          </span>
          <pre
            style={{
              margin: 0,
              fontFamily: 'monospace',
              fontSize: 11,
              color: '#1e293b',
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: 3,
              padding: '6px 8px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: 200,
              overflow: 'auto',
            }}
          >
            {parsedInput != null ? formatJson(parsedInput) : '(empty)'}
          </pre>
        </div>

        {parsedOutput != null && (
          <div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Output
            </span>
            <pre
              style={{
                margin: 0,
                fontFamily: 'monospace',
                fontSize: 11,
                color: status === 'error' ? '#dc2626' : '#374151',
                backgroundColor: status === 'error' ? '#fef2f2' : '#f8fafc',
                border: `1px solid ${status === 'error' ? '#fca5a5' : '#e2e8f0'}`,
                borderRadius: 3,
                padding: '6px 8px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: 300,
                overflow: 'auto',
              }}
            >
              {formatJson(parsedOutput)}
            </pre>
          </div>
        )}
      </div>
    </details>
  );
}

export interface ToolMessage {
  role?: string;
  toolName?: string;
  name?: string;
  input?: unknown;
  content?: unknown;
  output?: unknown;
  status?: string;
  durationMs?: number;
}

export interface ToolCallListProps {
  messages?: ToolMessage[];
}

export function ToolCallList({ messages }: ToolCallListProps) {
  const toolMessages = (messages || []).filter(
    (m) => m.role === 'tool' || m.role === 'tool_use' || m.role === 'tool_result'
  );

  if (!toolMessages.length) {
    return (
      <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>
        No tool calls in this transcript.
      </p>
    );
  }

  return (
    <div role="list" aria-label="Tool calls">
      {toolMessages.map((msg, i) => (
        <ToolCallInspector
          key={i}
          toolName={msg.toolName || msg.name || 'Tool'}
          input={msg.input || msg.content}
          output={msg.output}
          status={msg.status || 'completed'}
          durationMs={msg.durationMs}
        />
      ))}
    </div>
  );
}
