'use client';

/* ───────────── styles ───────────── */
export const styles = {
  container: {
    display: 'flex', height: '100%', minHeight: 0, gap: 0,
    fontFamily: 'var(--sans, system-ui, sans-serif)', color: 'var(--text)',
  },
  sidebar: {
    width: 240, flexShrink: 0, borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', background: 'var(--surface)',
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: '12px 14px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  sidebarTitle: { fontWeight: 700, fontSize: 13, color: 'var(--text)', margin: 0 },
  newBtn: {
    padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
    background: 'var(--accent, #2563eb)', color: '#fff', border: 'none', borderRadius: 4,
  },
  sessionList: { flex: 1, overflow: 'auto', padding: '4px 0' },
  sessionItem: (active) => ({
    display: 'block', padding: '8px 14px', cursor: 'pointer', fontSize: 12,
    background: active ? 'var(--surface-raised)' : 'transparent',
    borderLeft: active ? '3px solid var(--accent, #2563eb)' : '3px solid transparent',
    borderBottom: 'none', borderTop: 'none', borderRight: 'none',
    textAlign: 'left', width: '100%', color: 'var(--text)',
  }),
  sessionLabel: { fontWeight: 600, fontSize: 12, display: 'block', marginBottom: 2 },
  sessionMeta: { fontSize: 11, color: 'var(--text-muted)', display: 'block' },
  sessionDelete: {
    fontSize: 10, color: 'var(--danger)', cursor: 'pointer', float: 'right',
    background: 'none', border: 'none', padding: '0 4px', fontWeight: 700,
  },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' },
  toolbar: {
    padding: '8px 16px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)',
  },
  stackLabel: { fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' },
  stackSelect: {
    padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)',
    fontSize: 12, background: 'var(--bg)', color: 'var(--text)',
  },
  messages: {
    flex: 1, overflow: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16,
    scrollBehavior: 'smooth',
  },
  /* ── message row ── */
  messageRow: (isUser) => ({
    display: 'flex', flexDirection: 'column',
    alignItems: isUser ? 'flex-end' : 'flex-start',
    maxWidth: '100%',
  }),
  bubble: (isUser) => ({
    maxWidth: '78%', position: 'relative',
    background: isUser ? 'var(--accent, #2563eb)' : 'var(--surface-raised)',
    color: isUser ? '#fff' : 'var(--text)',
    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
    padding: '10px 14px', fontSize: 14, lineHeight: 1.55,
    wordBreak: 'break-word',
  }),
  bubbleError: {
    maxWidth: '78%', position: 'relative',
    background: '#fef2f2', border: '1px solid var(--danger)',
    color: 'var(--danger)',
    borderRadius: '16px 16px 16px 4px',
    padding: '10px 14px', fontSize: 14, lineHeight: 1.55,
    wordBreak: 'break-word',
  },
  bubbleMeta: {
    display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 11,
    color: 'var(--text-muted)',
  },
  copyBtn: {
    background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px',
    fontSize: 11, color: 'var(--text-muted)', borderRadius: 4,
    transition: 'background .15s',
  },
  copyBtnHover: { background: 'var(--surface-overlay)' },
  /* ── code blocks ── */
  codeBlock: {
    background: '#181624', color: '#f0e6d1',
    padding: '14px 16px', borderRadius: 6, fontFamily: 'var(--mono, "JetBrains Mono", monospace)',
    fontSize: 12.5, overflow: 'auto', whiteSpace: 'pre', marginTop: 8, marginBottom: 4,
    lineHeight: 1.6, position: 'relative', counterReset: 'line',
  },
  codeBlockHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '4px 12px', background: '#12101e', borderRadius: '6px 6px 0 0',
    fontSize: 11, color: '#8c7e65', fontFamily: 'var(--mono, monospace)',
  },
  codeCopyBtn: {
    background: 'none', border: 'none', cursor: 'pointer', padding: '2px 8px',
    fontSize: 11, color: '#8c7e65', borderRadius: 3,
  },
  lineNumber: {
    display: 'inline-block', width: '2.5em', textAlign: 'right',
    marginRight: '1em', color: '#5a4e5a', userSelect: 'none', fontSize: 11,
  },
  usage: { fontSize: 10, color: 'var(--text-muted)', marginTop: 2 },
  /* ── input area ── */
  inputRow: {
    padding: '12px 16px', borderTop: '1px solid var(--border)',
    display: 'flex', gap: 8, alignItems: 'flex-end',
    background: 'var(--surface)',
  },
  textarea: {
    flex: 1, resize: 'none', border: '1px solid var(--border)',
    borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'var(--sans, system-ui, sans-serif)',
    lineHeight: 1.4, background: 'var(--bg)', color: 'var(--text)',
    outline: 'none', minHeight: 42, maxHeight: 160,
  },
  sendBtn: (disabled) => ({
    padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled ? 'var(--text-faint)' : 'var(--accent, #2563eb)', color: '#fff',
    border: 'none', borderRadius: 8, opacity: disabled ? 0.6 : 1, flexShrink: 0,
  }),
  /* ── empty state ── */
  empty: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: 40,
  },
  emptyIcon: {
    width: 48, height: 48, borderRadius: '50%',
    background: 'var(--surface-raised)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', margin: '0 auto 16px', fontSize: 22,
  },
  /* ── thinking indicator ── */
  thinkingRow: {
    display: 'flex', alignItems: 'flex-start', gap: 8,
  },
  thinkingBubble: {
    background: 'var(--surface-raised)',
    borderRadius: '16px 16px 16px 4px',
    padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 6,
  },
  thinkingDot: (delay) => ({
    width: 7, height: 7, borderRadius: '50%',
    background: 'var(--accent, #2563eb)',
    animation: `krate-dot-pulse 1.4s ease-in-out ${delay}s infinite`,
  }),
  /* ── scroll-to-bottom ── */
  scrollBtn: {
    position: 'absolute', bottom: 80, right: 24,
    width: 36, height: 36, borderRadius: '50%',
    background: 'var(--accent, #2563eb)', color: '#fff',
    border: 'none', cursor: 'pointer', fontSize: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,.18)',
    transition: 'opacity .2s',
  },
  /* ── error banner ── */
  errorBanner: {
    background: '#fef2f2', border: '1px solid var(--danger)', borderRadius: 8,
    padding: '8px 14px', color: 'var(--danger)', fontSize: 13, margin: '0 16px 8px',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  errorDismiss: {
    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)',
    fontWeight: 700, fontSize: 14, marginLeft: 'auto', padding: '0 4px',
  },
};

/* ───────────── keyframes (injected once) ───────────── */
const KEYFRAMES_ID = '__krate-chat-keyframes';
export function ensureKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(KEYFRAMES_ID)) return;
  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  style.textContent = `
    @keyframes krate-dot-pulse {
      0%, 80%, 100% { opacity: .25; transform: scale(.85); }
      40% { opacity: 1; transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
}
