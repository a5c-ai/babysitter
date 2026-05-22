'use client';
import { useState, useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// Helpers (inlined from ui-shell.jsx — server component cannot be imported)
// ---------------------------------------------------------------------------

const TOOL_RENDERERS = {
  bash: { label: 'Shell', prefix: '>', renderInput: (i) => i?.command || 'command', renderOutput: (o) => typeof o === 'string' ? truncateText(o, 300) : o?.stdout || String(o) },
  read: { label: 'Read', prefix: '[R]', renderInput: (i) => i?.file_path || i?.path || 'file', renderOutput: (o) => truncateText(String(o), 300) },
  write: { label: 'Write', prefix: '[W]', renderInput: (i) => i?.file_path || 'file', renderOutput: () => 'File written' },
  edit: { label: 'Edit', prefix: '[E]', renderInput: (i) => i?.file_path || 'file', renderOutput: () => 'File edited' },
  glob: { label: 'Search', prefix: '[G]', renderInput: (i) => i?.pattern || 'pattern', renderOutput: (o) => Array.isArray(o) ? o.length + ' matches' : String(o) },
  grep: { label: 'Grep', prefix: '[?]', renderInput: (i) => i?.pattern || 'pattern', renderOutput: (o) => Array.isArray(o) ? o.length + ' matches' : String(o) },
  web_fetch: { label: 'Fetch', prefix: '[F]', renderInput: (i) => i?.url || 'url', renderOutput: (o) => truncateText(String(o), 200) },
  web_search: { label: 'Search', prefix: '[S]', renderInput: (i) => i?.query || 'query', renderOutput: (o) => truncateText(String(o), 200) },
};

function truncateText(text, maxLen) {
  if (!text || text.length <= maxLen) return text || '';
  return text.slice(0, maxLen) + '...';
}

function resolveToolRenderer(toolName) {
  const normalized = (toolName || '').toLowerCase().replace(/[^a-z_]/g, '');
  return TOOL_RENDERERS[normalized] || { label: toolName || 'Tool', prefix: '[T]', renderInput: (i) => truncateText(JSON.stringify(i), 200), renderOutput: (o) => truncateText(JSON.stringify(o), 200) };
}

function tryParseJson(text) {
  try { return JSON.parse(text); } catch { return text; }
}

const SEGMENT_KINDS = {
  user: { label: 'User', color: '#3b82f6' },
  assistant: { label: 'Assistant', color: '#6b7280' },
  thinking: { label: 'Thinking', color: '#a855f7' },
  tool: { label: 'Tool', color: '#f59e0b' },
  error: { label: 'Error', color: '#ef4444' },
  lifecycle: { label: 'Lifecycle', color: '#94a3b8' },
};

function classifyMessageKind(message) {
  const role = message.role || 'unknown';
  if (role === 'user') return 'user';
  if (role === 'assistant') return 'assistant';
  if (role === 'thinking') return 'thinking';
  if (role === 'tool' || role === 'tool_use' || role === 'tool_result') return 'tool';
  if (role === 'error') return 'error';
  if (role === 'system' || role === 'lifecycle') return 'lifecycle';
  return 'lifecycle';
}

function deriveSegments(messages) {
  if (!messages || !messages.length) return [];
  const segments = [];
  let currentKind = null;
  let currentCount = 0;
  for (const msg of messages) {
    const kind = classifyMessageKind(msg);
    if (kind === currentKind) {
      currentCount++;
    } else {
      if (currentKind) segments.push({ kind: currentKind, count: currentCount });
      currentKind = kind;
      currentCount = 1;
    }
  }
  if (currentKind) segments.push({ kind: currentKind, count: currentCount });
  return segments;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PanelHeader({ title, badge, collapsed, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        backgroundColor: '#1e293b',
        color: '#fff',
        cursor: 'pointer',
        userSelect: 'none',
        borderRadius: collapsed ? 6 : '6px 6px 0 0',
        fontSize: 13,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{title}</span>
        {badge != null && (
          <span style={{ fontSize: 11, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '1px 7px' }}>{badge}</span>
        )}
      </span>
      <span style={{ fontSize: 10, opacity: 0.7 }}>{collapsed ? '▶' : '▼'}</span>
    </div>
  );
}

function Panel({ title, badge, children, defaultCollapsed = false, style = {} }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden', ...style }}>
      <PanelHeader title={title} badge={badge} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      {!collapsed && (
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#fff', minHeight: 0 }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Workspace Panel
// ---------------------------------------------------------------------------

function WorkspacePanel({ session }) {
  const workspace = session?.spec?.workspace || null;
  return (
    <Panel title="Workspace" style={{ height: '100%' }}>
      <div style={{ padding: 12 }}>
        {workspace ? (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>WORKSPACE</div>
            <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#1e293b', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, padding: '6px 10px' }}>
              {workspace}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>No workspace assigned</div>
        )}

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>FILE TREE</div>
          <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#374151', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, padding: '8px 10px', minHeight: 80 }}>
            <div style={{ color: '#6b7280', fontStyle: 'italic' }}>File tree not available</div>
            <div style={{ marginTop: 4, color: '#94a3b8', fontSize: 11 }}>Connect workspace to browse files</div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>GIT STATUS</div>
          <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#374151', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, padding: '8px 10px' }}>
            <div style={{ color: '#6b7280', fontStyle: 'italic' }}>git status not available</div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Chat / Transcript Panel
// ---------------------------------------------------------------------------

function ToolCallCard({ toolName, input, output, status }) {
  const renderer = resolveToolRenderer(toolName);
  const statusColor = status === 'error' ? '#ef4444' : status === 'completed' ? '#22c55e' : '#f59e0b';
  const inputPreview = renderer.renderInput(typeof input === 'string' ? tryParseJson(input) : input);
  const outputPreview = output != null ? renderer.renderOutput(typeof output === 'string' ? tryParseJson(output) : output) : null;
  return (
    <div style={{ border: '1px solid #e2e8f0', borderLeft: `3px solid ${statusColor}`, borderRadius: 4, padding: '8px 12px', marginBottom: 8, fontSize: 13, backgroundColor: '#fafafa' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: outputPreview ? 4 : 0 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b7280' }}>{renderer.prefix}</span>
        <strong style={{ fontSize: 12 }}>{renderer.label}</strong>
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#374151', flex: 1 }}>{inputPreview}</span>
        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: statusColor, flexShrink: 0 }} />
      </div>
      {outputPreview && (
        <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b7280', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{outputPreview}</div>
      )}
    </div>
  );
}

function TranscriptMessageItem({ message }) {
  const role = message.role || 'unknown';
  if (role === 'tool' || role === 'tool_use' || role === 'tool_result') {
    return <ToolCallCard toolName={message.toolName || message.name} input={message.input || message.content} output={message.output} status={message.status || 'completed'} />;
  }
  if (role === 'system' || role === 'thinking') {
    return (
      <div style={{ padding: '8px 12px', marginBottom: 8, backgroundColor: '#f1f5f9', borderRadius: 4, borderLeft: '3px solid #94a3b8' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>{role}</div>
        <div style={{ fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
        </div>
      </div>
    );
  }
  const isUser = role === 'user';
  return (
    <div style={{
      padding: '10px 12px',
      marginBottom: 8,
      borderRadius: 4,
      backgroundColor: isUser ? '#eff6ff' : '#f8fafc',
      borderLeft: `3px solid ${isUser ? '#3b82f6' : '#6b7280'}`,
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: isUser ? '#3b82f6' : '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>{role}</div>
      <div style={{ fontSize: 13, color: '#1e293b', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5 }}>
        {typeof message.content === 'string'
          ? message.content
          : Array.isArray(message.content)
            ? message.content.map((block, i) => <span key={i}>{typeof block === 'string' ? block : block.text || block.content || JSON.stringify(block)}</span>)
            : JSON.stringify(message.content)}
      </div>
    </div>
  );
}

function ChatPanel({ messages = [] }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <Panel title="Chat / Transcript" badge={messages.length} style={{ height: '100%' }}>
      <div style={{ padding: 12 }}>
        {messages.length ? (
          <>
            {messages.map((msg, index) => (
              <TranscriptMessageItem key={`${msg.role}-${index}`} message={msg} />
            ))}
            <div ref={bottomRef} />
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: '#6b7280' }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No transcript available</div>
            <div style={{ fontSize: 13 }}>Session transcript available when Agent Mux is connected and the session has exchanged messages.</div>
          </div>
        )}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Flow Visualization Panel
// ---------------------------------------------------------------------------

function FlowLaneItem({ run, transcript }) {
  const runName = run?.metadata?.name || 'unknown';
  const stackName = run?.spec?.stackRef || run?.spec?.targetStack || null;
  const phase = run?.status?.phase || 'Pending';
  const phaseTone = !phase || phase === 'Queued' || phase === 'Pending' ? 'neutral' : phase === 'Running' ? 'warn' : phase === 'Completed' || phase === 'Succeeded' ? 'good' : phase === 'Failed' ? 'danger' : 'neutral';
  const msgs = transcript?.spec?.messages || [];
  const segments = deriveSegments(msgs);
  const phaseColor = phaseTone === 'good' ? '#22c55e' : phaseTone === 'warn' ? '#f59e0b' : phaseTone === 'danger' ? '#ef4444' : '#94a3b8';
  const pillColor = phaseTone === 'good' ? '#dcfce7' : phaseTone === 'warn' ? '#fef9c3' : phaseTone === 'danger' ? '#fee2e2' : '#f1f5f9';
  const pillText = phaseTone === 'good' ? '#166534' : phaseTone === 'warn' ? '#854d0e' : phaseTone === 'danger' ? '#991b1b' : '#475569';

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 13 }}>
        <strong title={runName} style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{runName}</strong>
        {stackName ? <span style={{ color: '#6b7280', fontSize: 12 }}>{stackName}</span> : null}
        <span style={{ fontSize: 11, borderRadius: 10, padding: '1px 8px', backgroundColor: pillColor, color: pillText, fontWeight: 600 }}>{phase}</span>
      </div>
      <div style={{ display: 'flex', height: 24, borderRadius: 4, overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
        {segments.length ? segments.map((seg, index) => {
          const info = SEGMENT_KINDS[seg.kind] || SEGMENT_KINDS.lifecycle;
          return (
            <div
              key={index}
              title={`${info.label}: ${seg.count} messages`}
              style={{
                minWidth: 20,
                flexGrow: seg.count,
                backgroundColor: info.color,
                borderTopLeftRadius: index === 0 ? 4 : 0,
                borderBottomLeftRadius: index === 0 ? 4 : 0,
                borderTopRightRadius: index === segments.length - 1 ? 4 : 0,
                borderBottomRightRadius: index === segments.length - 1 ? 4 : 0,
              }}
            />
          );
        }) : (
          <div style={{ flexGrow: 1, backgroundColor: phaseColor, borderRadius: 4 }} title={`${phase}: no transcript data`} />
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
        {Object.entries(SEGMENT_KINDS).map(([key, info]) => {
          const seg = segments.find((s) => s.kind === key);
          if (!seg) return null;
          return <span key={key} style={{ fontSize: 10, color: '#6b7280' }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, backgroundColor: info.color, marginRight: 3 }} />{info.label}: {seg.count}</span>;
        })}
      </div>
    </div>
  );
}

function FlowPanel({ runs = [], transcripts = [] }) {
  return (
    <Panel title="Flow Visualization" badge={runs.length} style={{ height: '100%' }}>
      <div style={{ padding: 12 }}>
        {runs.length ? (
          runs.map((run) => {
            const runName = run?.metadata?.name;
            const sessionRef = run?.status?.sessionRef || run?.spec?.sessionRef || null;
            const transcript = transcripts.find((t) => t.spec?.sessionRef === sessionRef || t.spec?.runRef === runName) || null;
            return <FlowLaneItem key={runName} run={run} transcript={transcript} />;
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: '#6b7280' }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No execution flow data</div>
            <div style={{ fontSize: 13 }}>Flow visualization appears when dispatch runs have been created for this session.</div>
          </div>
        )}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Runtime / Cost Panel
// ---------------------------------------------------------------------------

function StatCard({ label, value, accent = false }) {
  return (
    <div style={{
      padding: '10px 16px',
      backgroundColor: accent ? '#eff6ff' : '#f8fafc',
      border: `1px solid ${accent ? '#bfdbfe' : '#e2e8f0'}`,
      borderRadius: 6,
      minWidth: 120,
      flex: '1 1 auto',
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: accent ? '#1d4ed8' : '#1e293b' }}>{value || '—'}</div>
    </div>
  );
}

function RuntimePanel({ session, transcriptRecord }) {
  const phase = session?.status?.phase || 'Pending';
  const model = session?.spec?.model || session?.status?.model || 'default';
  const cost = session?.status?.cost != null
    ? `$${Number(session.status.cost).toFixed(4)}`
    : transcriptRecord?.status?.totalCost != null
      ? `$${Number(transcriptRecord.status.totalCost).toFixed(4)}`
      : null;
  const costPerTurn = transcriptRecord?.status?.costPerTurn != null ? `$${Number(transcriptRecord.status.costPerTurn).toFixed(4)}` : null;
  const startedAt = session?.status?.startedAt || session?.metadata?.creationTimestamp || null;
  const updatedAt = session?.status?.updatedAt || null;
  const stackName = session?.spec?.agentStack || session?.spec?.stackRef || null;
  const dispatchRun = session?.spec?.dispatchRun || null;
  const workspace = session?.spec?.workspace || null;
  const messageCount = transcriptRecord?.spec?.messages?.length ?? null;

  const fmt = (iso) => {
    if (!iso) return null;
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  };

  return (
    <Panel title="Runtime / Cost / Metadata" defaultCollapsed={false}>
      <div style={{ padding: 12 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <StatCard label="Phase" value={phase} accent={phase === 'Active' || phase === 'Running'} />
          <StatCard label="Model" value={model} />
          {cost && <StatCard label="Total Cost" value={cost} accent />}
          {costPerTurn && <StatCard label="Cost / Turn" value={costPerTurn} />}
          {messageCount != null && <StatCard label="Messages" value={messageCount} />}
          {stackName && <StatCard label="Agent Stack" value={stackName} />}
          {dispatchRun && <StatCard label="Dispatch Run" value={dispatchRun} />}
          {workspace && <StatCard label="Workspace" value={workspace} />}
          {startedAt && <StatCard label="Started" value={fmt(startedAt)} />}
          {updatedAt && <StatCard label="Updated" value={fmt(updatedAt)} />}
        </div>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Main SessionShell export
// ---------------------------------------------------------------------------

export function SessionShell({ session, messages = [], runs = [], transcripts = [], transcriptRecord = null }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Top 3-column grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr 1fr',
        gap: 12,
        minHeight: '60vh',
        marginBottom: 12,
      }}>
        <WorkspacePanel session={session} />
        <ChatPanel messages={messages} />
        <FlowPanel runs={runs} transcripts={transcripts} />
      </div>

      {/* Bottom full-width runtime panel */}
      <RuntimePanel session={session} transcriptRecord={transcriptRecord} />
    </div>
  );
}
