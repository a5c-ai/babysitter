'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { styles, ensureKeyframes } from './assistant-chat-styles.jsx';
import { MessageBubble, ThinkingIndicator } from './assistant-chat-messages.jsx';

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
        <div style={styles.sessionList} aria-label="Session list">
          {sessions.length === 0 && (
            <div style={{ padding: '16px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
              No sessions yet. Click &quot;+ New&quot; or start typing to begin.
            </div>
          )}
          {sessions.map((s) => (
            <div key={s.id} onClick={() => selectSession(s.id)} style={styles.sessionItem(s.id === activeSessionId)} role="button" tabIndex={0} aria-label={`Session ${s.stackRef || 'assistant'}, ${s.messageCount || 0} messages`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectSession(s.id); } }}>
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
          aria-label="Chat messages"
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

          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {/* Thinking indicator */}
          {sending && <ThinkingIndicator />}

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
          <button onClick={handleSend} disabled={!input.trim() || sending} style={styles.sendBtn(!input.trim() || sending)} aria-label="Send message">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
