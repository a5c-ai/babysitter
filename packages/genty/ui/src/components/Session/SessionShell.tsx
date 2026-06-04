import React, { useState, useEffect, useRef } from 'react';
import {
  TOOL_RENDERERS,
  resolveToolRenderer,
  tryParseJson,
  SEGMENT_KINDS,
  deriveSegments,
  phaseTone as computePhaseTone,
  type TranscriptMessage,
  type Segment,
} from './sessionUtils.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionRecord {
  metadata?: { name?: string; creationTimestamp?: string };
  spec?: {
    workspace?: string;
    model?: string;
    agentStack?: string;
    stackRef?: string;
    dispatchRun?: string;
    sessionRef?: string;
  };
  status?: {
    phase?: string;
    model?: string;
    cost?: number | string;
    startedAt?: string;
    updatedAt?: string;
  };
}

export interface DispatchRun {
  metadata?: { name?: string };
  spec?: { stackRef?: string; targetStack?: string; sessionRef?: string };
  status?: { phase?: string; sessionRef?: string; agentActive?: boolean };
}

export interface TranscriptRecord {
  spec?: { messages?: TranscriptMessage[]; sessionRef?: string; runRef?: string };
  status?: { totalCost?: number | string; costPerTurn?: number | string };
}

export interface AgentIdentity {
  name?: string;
  displayName?: string;
  roleTitle?: string;
  fallback?: boolean;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface PanelHeaderProps {
  title: string;
  badge?: number | null;
  collapsed: boolean;
  onToggle: () => void;
}

function PanelHeader({ title, badge, collapsed, onToggle }: PanelHeaderProps): JSX.Element {
  return (
    <div
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
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

interface PanelProps {
  title: string;
  badge?: number | null;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  style?: React.CSSProperties;
}

function Panel({ title, badge, children, defaultCollapsed = false, style = {} }: PanelProps): JSX.Element {
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

interface WorkspacePanelProps {
  session: SessionRecord | null | undefined;
}

function WorkspacePanel({ session }: WorkspacePanelProps): JSX.Element {
  const workspace = session?.spec?.workspace || null;
  return (
    <Panel title="Workspace" style={{ height: '100%' }}>
      <div style={{ padding: 12 }}>
        {workspace ? (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>WORKSPACE</div>
            <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#1e293b', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, padding: '6px 10px' }}>
              {workspace}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>No workspace assigned</div>
        )}

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>FILE TREE</div>
          <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text)', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, padding: '8px 10px', minHeight: 80 }}>
            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>File tree not available</div>
            <div style={{ marginTop: 4, color: '#94a3b8', fontSize: 11 }}>Connect workspace to browse files</div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>GIT STATUS</div>
          <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text)', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, padding: '8px 10px' }}>
            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>git status not available</div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Chat / Transcript Panel
// ---------------------------------------------------------------------------

interface ToolCallCardProps {
  toolName: string | undefined;
  input: unknown;
  output: unknown;
  status: string | undefined;
}

function ToolCallCard({ toolName, input, output, status }: ToolCallCardProps): JSX.Element {
  const renderer = resolveToolRenderer(toolName);
  const statusColor = status === 'error' ? '#ef4444' : status === 'completed' ? '#22c55e' : '#f59e0b';
  const inputPreview = renderer.renderInput(typeof input === 'string' ? tryParseJson(input) : input);
  const outputPreview = output != null ? renderer.renderOutput(typeof output === 'string' ? tryParseJson(output) : output) : null;
  return (
    <div style={{ border: '1px solid #e2e8f0', borderLeft: `3px solid ${statusColor}`, borderRadius: 4, padding: '8px 12px', marginBottom: 8, fontSize: 13, backgroundColor: '#fafafa' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: outputPreview ? 4 : 0 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{renderer.prefix}</span>
        <strong style={{ fontSize: 12 }}>{renderer.label}</strong>
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text)', flex: 1 }}>{inputPreview}</span>
        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: statusColor, flexShrink: 0 }} />
      </div>
      {outputPreview && (
        <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{outputPreview}</div>
      )}
    </div>
  );
}

interface TranscriptMessageItemProps {
  message: TranscriptMessage;
}

function TranscriptMessageItem({ message }: TranscriptMessageItemProps): JSX.Element {
  const role = message.role || 'unknown';
  if (role === 'tool' || role === 'tool_use' || role === 'tool_result') {
    return <ToolCallCard toolName={message.toolName || message.name} input={message.input || message.content} output={message.output} status={message.status || 'completed'} />;
  }
  if (role === 'system' || role === 'thinking') {
    return (
      <div style={{ padding: '8px 12px', marginBottom: 8, backgroundColor: '#f1f5f9', borderRadius: 4, borderLeft: '3px solid #94a3b8' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{role}</div>
        <div style={{ fontSize: 13, color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
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
            ? (message.content as unknown[]).map((block, i) => (
                <span key={i}>{typeof block === 'string' ? block : (block as Record<string, string>).text || (block as Record<string, string>).content || JSON.stringify(block)}</span>
              ))
            : JSON.stringify(message.content)}
      </div>
    </div>
  );
}

interface ChatPanelProps {
  messages?: TranscriptMessage[];
}

function ChatPanel({ messages = [] }: ChatPanelProps): JSX.Element {
  const bottomRef = useRef<HTMLDivElement>(null);

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
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
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

interface FlowLaneItemProps {
  run: DispatchRun;
  transcript: TranscriptRecord | null;
}

function FlowLaneItem({ run, transcript }: FlowLaneItemProps): JSX.Element {
  const runName = run?.metadata?.name || 'unknown';
  const stackName = run?.spec?.stackRef || run?.spec?.targetStack || null;
  const phase = run?.status?.phase || 'Pending';
  const tone = computePhaseTone(phase);
  const msgs = transcript?.spec?.messages || [];
  const segments: Segment[] = deriveSegments(msgs);
  const phaseColor = tone === 'good' ? '#22c55e' : tone === 'warn' ? '#f59e0b' : tone === 'danger' ? '#ef4444' : '#94a3b8';
  const pillColor = tone === 'good' ? '#dcfce7' : tone === 'warn' ? '#fef9c3' : tone === 'danger' ? '#fee2e2' : '#f1f5f9';
  const pillText = tone === 'good' ? '#166534' : tone === 'warn' ? '#854d0e' : tone === 'danger' ? '#991b1b' : '#475569';

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 13 }}>
        <strong title={runName} style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{runName}</strong>
        {stackName ? <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{stackName}</span> : null}
        <span style={{ fontSize: 11, borderRadius: 10, padding: '1px 8px', backgroundColor: pillColor, color: pillText, fontWeight: 600 }}>{phase}</span>
      </div>
      <div style={{ display: 'flex', height: 24, borderRadius: 4, overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
        {segments.length ? segments.map((seg, index) => {
          const info = SEGMENT_KINDS[seg.kind] || SEGMENT_KINDS['lifecycle'];
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
          return <span key={key} style={{ fontSize: 10, color: 'var(--text-muted)' }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, backgroundColor: info.color, marginRight: 3 }} />{info.label}: {seg.count}</span>;
        })}
      </div>
    </div>
  );
}

interface FlowPanelProps {
  runs?: DispatchRun[];
  transcripts?: TranscriptRecord[];
}

function FlowPanel({ runs = [], transcripts = [] }: FlowPanelProps): JSX.Element {
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
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
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

interface StatCardProps {
  label: string;
  value: string | number | null | undefined;
  accent?: boolean;
}

function StatCard({ label, value, accent = false }: StatCardProps): JSX.Element {
  return (
    <div style={{
      padding: '10px 16px',
      backgroundColor: accent ? '#eff6ff' : '#f8fafc',
      border: `1px solid ${accent ? '#bfdbfe' : '#e2e8f0'}`,
      borderRadius: 6,
      minWidth: 120,
      flex: '1 1 auto',
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: accent ? '#1d4ed8' : '#1e293b' }}>{value || '—'}</div>
    </div>
  );
}

interface RuntimePanelProps {
  session: SessionRecord | null | undefined;
  transcriptRecord: TranscriptRecord | null | undefined;
  identity: AgentIdentity | null | undefined;
}

function RuntimePanel({ session, transcriptRecord, identity }: RuntimePanelProps): JSX.Element {
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

  const fmt = (iso: string | null | undefined): string | null => {
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
          {identity && <StatCard label="Agent Persona" value={identity.displayName || identity.name} accent={!identity.fallback} />}
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

export interface SessionShellProps {
  session: SessionRecord | null | undefined;
  messages?: TranscriptMessage[];
  runs?: DispatchRun[];
  transcripts?: TranscriptRecord[];
  transcriptRecord?: TranscriptRecord | null;
  identity?: AgentIdentity | null;
}

export function SessionShell({ session, messages = [], runs = [], transcripts = [], transcriptRecord = null, identity = null }: SessionShellProps): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {identity ? <div className="card" style={{ marginBottom: 12 }}><strong>{identity.displayName || identity.name}</strong><span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>{identity.roleTitle || 'Agent identity'} / stack fallback: {session?.spec?.agentStack || session?.spec?.stackRef || 'none'}</span></div> : null}
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
      <RuntimePanel session={session} transcriptRecord={transcriptRecord} identity={identity} />
    </div>
  );
}
