'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

/* ───────────── relative timestamp ───────────── */
function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

/* ───────────── styles ───────────── */
const styles = {
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
function ensureKeyframes() {
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

/* ───────────── markdown renderer ───────────── */
function CopyButton({ text, style: extraStyle }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }).catch((err) => console.warn('[krate]', err.message || err));
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      style={{ ...styles.codeCopyBtn, ...extraStyle }}
      title="Copy to clipboard"
      aria-label="Copy to clipboard"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function CodeBlock({ language, code }) {
  const lines = code.split('\n');
  return (
    <div style={{ marginTop: 8, marginBottom: 4 }}>
      <div style={styles.codeBlockHeader}>
        <span>{language || 'code'}</span>
        <CopyButton text={code} />
      </div>
      <pre style={{ ...styles.codeBlock, borderRadius: '0 0 6px 6px', marginTop: 0 }}>
        {lines.map((line, i) => (
          <span key={i}>
            <span style={styles.lineNumber}>{i + 1}</span>{line}{'\n'}
          </span>
        ))}
      </pre>
    </div>
  );
}

function renderMarkdown(text) {
  if (!text) return null;

  // Split by fenced code blocks
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    // Fenced code block
    if (part.startsWith('```') && part.endsWith('```')) {
      const inner = part.slice(3, -3);
      const newlineIdx = inner.indexOf('\n');
      const lang = newlineIdx >= 0 ? inner.slice(0, newlineIdx).trim() : '';
      const code = newlineIdx >= 0 ? inner.slice(newlineIdx + 1) : inner;
      return <CodeBlock key={i} language={lang} code={code} />;
    }

    // Process blocks: paragraphs, lists, headers
    const lines = part.split('\n');
    const elements = [];
    let listItems = [];
    let listType = null; // 'ul' or 'ol'

    function flushList() {
      if (listItems.length > 0) {
        const Tag = listType === 'ol' ? 'ol' : 'ul';
        elements.push(
          <Tag key={`list-${elements.length}`} style={{ margin: '6px 0', paddingLeft: 20 }}>
            {listItems.map((li, j) => <li key={j}>{renderInline(li)}</li>)}
          </Tag>
        );
        listItems = [];
        listType = null;
      }
    }

    for (const line of lines) {
      // Unordered list item
      const ulMatch = line.match(/^(\s*)[-*]\s+(.*)/);
      if (ulMatch) {
        if (listType === 'ol') flushList();
        listType = 'ul';
        listItems.push(ulMatch[2]);
        continue;
      }
      // Ordered list item
      const olMatch = line.match(/^(\s*)\d+\.\s+(.*)/);
      if (olMatch) {
        if (listType === 'ul') flushList();
        listType = 'ol';
        listItems.push(olMatch[2]);
        continue;
      }

      flushList();

      // Headers
      const headingMatch = line.match(/^(#{1,4})\s+(.*)/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const sizes = { 1: 18, 2: 16, 3: 14, 4: 13 };
        elements.push(
          <div key={`h-${elements.length}`} style={{ fontWeight: 700, fontSize: sizes[level] || 14, marginTop: 10, marginBottom: 4 }}>
            {renderInline(headingMatch[2])}
          </div>
        );
        continue;
      }

      // Horizontal rule
      if (/^---+$/.test(line.trim())) {
        elements.push(<hr key={`hr-${elements.length}`} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />);
        continue;
      }

      // Normal text (skip empty lines between content)
      if (line.trim()) {
        elements.push(<div key={`p-${elements.length}`} style={{ marginBottom: 4 }}>{renderInline(line)}</div>);
      }
    }
    flushList();

    return <span key={i}>{elements}</span>;
  });
}

function renderInline(text) {
  if (!text) return null;
  // Process: inline code, bold, italic
  const segments = text.split(/(`[^`]+`)/g);
  return segments.map((seg, j) => {
    if (seg.startsWith('`') && seg.endsWith('`')) {
      return (
        <code key={j} style={{
          background: 'var(--surface-overlay)', padding: '1px 5px', borderRadius: 3,
          fontFamily: 'var(--mono, monospace)', fontSize: '0.88em',
        }}>
          {seg.slice(1, -1)}
        </code>
      );
    }
    // Bold + italic (***text***)
    let result = seg.replace(/\*\*\*([^*]+)\*\*\*/g, '<<<BI:$1>>>');
    // Bold (**text**)
    result = result.replace(/\*\*([^*]+)\*\*/g, '<<<B:$1>>>');
    // Italic (*text*)
    result = result.replace(/\*([^*]+)\*/g, '<<<I:$1>>>');

    const tokens = result.split(/(<<<(?:BI|B|I):[^>]+>>>)/g);
    return tokens.map((tok, k) => {
      const biMatch = tok.match(/<<<BI:(.+)>>>/);
      if (biMatch) return <strong key={`${j}-${k}`}><em>{biMatch[1]}</em></strong>;
      const bMatch = tok.match(/<<<B:(.+)>>>/);
      if (bMatch) return <strong key={`${j}-${k}`}>{bMatch[1]}</strong>;
      const iMatch = tok.match(/<<<I:(.+)>>>/);
      if (iMatch) return <em key={`${j}-${k}`}>{iMatch[1]}</em>;
      return tok;
    });
  });
}

/* ───────────── API key missing message ───────────── */
function isApiKeyError(content) {
  if (!content) return false;
  const lower = content.toLowerCase();
  return lower.includes('api key not configured') || lower.includes('anthropic_api_key') || lower.includes('krate_assistant_api_key');
}

function ApiKeyMessage() {
  return (
    <div style={{ ...styles.bubbleError, maxWidth: '90%' }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>API Key Not Configured</div>
      <div style={{ fontSize: 13, lineHeight: 1.5 }}>
        The assistant needs an Anthropic API key to generate responses. Set one of:
      </div>
      <pre style={{ ...styles.codeBlock, marginTop: 8, padding: '10px 14px', fontSize: 12 }}>
        {`# Option 1: Environment variable\nexport ANTHROPIC_API_KEY=sk-ant-...\n\n# Option 2: Krate-specific key\nexport KRATE_ASSISTANT_API_KEY=sk-ant-...`}
      </pre>
      <div style={{ fontSize: 12, marginTop: 6, color: 'var(--text-muted)' }}>
        Then restart the Krate web server.
      </div>
    </div>
  );
}

/* ───────────── component ───────────── */
export function AssistantChat({ org, stacks = [] }) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [selectedStack, setSelectedStack] = useState(stacks[0] || 'assistant');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { ensureKeyframes(); }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Track scroll position for scroll-to-bottom button
  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollBtn(!atBottom);
  }, []);

  // Load sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [org]);

  async function fetchSessions() {
    try {
      const res = await fetch(`/api/orgs/${org}/assistant/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch { /* ignore */ }
  }

  async function selectSession(sessionId) {
    setActiveSessionId(sessionId);
    setError('');
    try {
      const res = await fetch(`/api/orgs/${org}/assistant/sessions/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.session?.messages || []);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function createNewSession() {
    setError('');
    try {
      const res = await fetch(`/api/orgs/${org}/assistant/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stackRef: selectedStack }),
      });
      if (res.ok) {
        const data = await res.json();
        const newSession = data.session;
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setMessages([]);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteSession(sessionId) {
    try {
      await fetch(`/api/orgs/${org}/assistant/sessions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch { /* ignore */ }
  }

  async function handleSend() {
    if (!input.trim() || sending) return;
    const userMessage = input.trim();
    setInput('');
    setSending(true);
    setError('');

    // Optimistic user message
    const tempUserMsg = { id: `temp_${Date.now()}`, role: 'user', content: userMessage, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`/api/orgs/${org}/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSessionId, message: userMessage, stackRef: selectedStack }),
      });
      const data = await res.json();
      if (res.ok) {
        if (!activeSessionId && data.sessionId) {
          setActiveSessionId(data.sessionId);
          fetchSessions();
        }
        if (data.response?.message) {
          setMessages((prev) => [...prev, data.response.message]);
        }
      } else {
        setError(data.message || 'Send failed');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const stackOptions = stacks.length ? stacks : ['assistant'];

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h3 style={styles.sidebarTitle}>Sessions</h3>
          <button onClick={createNewSession} style={styles.newBtn}>+ New</button>
        </div>
        <div style={styles.sessionList}>
          {sessions.length === 0 && (
            <div style={{ padding: '16px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
              No sessions yet. Click &quot;+ New&quot; or start typing to begin.
            </div>
          )}
          {sessions.map((s) => (
            <div key={s.id} onClick={() => selectSession(s.id)} style={styles.sessionItem(s.id === activeSessionId)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectSession(s.id); } }}>
              <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} style={styles.sessionDelete} aria-label="Delete session" title="Delete session">x</button>
              <span style={styles.sessionLabel}>{s.stackRef || 'assistant'}</span>
              <span style={styles.sessionMeta}>{s.messageCount || 0} messages</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div style={styles.main}>
        {/* Toolbar */}
        <div style={styles.toolbar}>
          <span style={styles.stackLabel}>Stack:</span>
          <select value={selectedStack} onChange={(e) => setSelectedStack(e.target.value)} style={styles.stackSelect} aria-label="Select agent stack">
            {stackOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {activeSessionId && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>Session: {activeSessionId.slice(0, 16)}...</span>
          )}
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          style={styles.messages}
          onScroll={handleScroll}
        >
          {messages.length === 0 && !sending && (
            <div style={styles.empty}>
              <div>
                <div style={styles.emptyIcon}>
                  <span role="img" aria-hidden="true">K</span>
                </div>
                <p style={{ fontWeight: 700, marginBottom: 6, fontSize: 16 }}>Start a conversation with the Krate Assistant</p>
                <p style={{ fontSize: 13, maxWidth: 360, margin: '0 auto', lineHeight: 1.5 }}>
                  Ask questions about your repositories, agent stacks, workspaces, and infrastructure. The assistant can help manage resources and query the Atlas knowledge graph.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isError = !isUser && msg.content && (msg.content.startsWith('Error:') || msg.content.startsWith('Error processing'));
            const showApiKeyHelp = !isUser && isApiKeyError(msg.content);

            return (
              <div key={msg.id} style={styles.messageRow(isUser)}>
                {showApiKeyHelp ? (
                  <ApiKeyMessage />
                ) : (
                  <div style={isError ? styles.bubbleError : styles.bubble(isUser)}>
                    {isUser ? msg.content : renderMarkdown(msg.content)}
                  </div>
                )}
                <div style={styles.bubbleMeta}>
                  <span>{timeAgo(msg.timestamp)}</span>
                  {msg.usage && (
                    <span style={styles.usage}>
                      {msg.usage.input_tokens != null && `In: ${msg.usage.input_tokens}`}
                      {msg.usage.output_tokens != null && ` Out: ${msg.usage.output_tokens}`}
                      {msg.usage.inputTokens != null && `In: ${msg.usage.inputTokens}`}
                      {msg.usage.outputTokens != null && ` Out: ${msg.usage.outputTokens}`}
                    </span>
                  )}
                  {!isUser && msg.content && !showApiKeyHelp && (
                    <CopyButton text={msg.content} style={styles.copyBtn} />
                  )}
                </div>
              </div>
            );
          })}

          {/* Thinking indicator */}
          {sending && (
            <div style={styles.thinkingRow}>
              <div style={styles.thinkingBubble}>
                <div style={styles.thinkingDot(0)} />
                <div style={styles.thinkingDot(0.2)} />
                <div style={styles.thinkingDot(0.4)} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <button onClick={scrollToBottom} style={styles.scrollBtn} aria-label="Scroll to bottom" title="Scroll to bottom">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10m0 0l-4-4m4 4l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        )}

        {/* Error banner */}
        {error && (
          <div style={styles.errorBanner}>
            <span>{error}</span>
            <button onClick={() => setError('')} style={styles.errorDismiss} aria-label="Dismiss error">x</button>
          </div>
        )}

        {/* Input */}
        <div style={styles.inputRow}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            style={styles.textarea}
            rows={1}
            disabled={sending}
            aria-label="Chat message input"
          />
          <button onClick={handleSend} disabled={!input.trim() || sending} style={styles.sendBtn(!input.trim() || sending)}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
