'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { PlaygroundPanel } from './inference-playground-panel.jsx';

/* ───────────── keyframes ───────────── */
const KEYFRAMES_ID = '__krate-playground-keyframes';
function ensureKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(KEYFRAMES_ID)) return;
  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  style.textContent = `
    @keyframes kradle-pg-spin {
      to { transform: rotate(360deg); }
    }
    @media (max-width: 768px) {
      .pg-grid { grid-template-columns: 1fr !important; }
    }
  `;
  document.head.appendChild(style);
}

/* ───────────── styles ───────────── */
const s = {
  wrapper: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  controls: {
    display: 'flex', flexDirection: 'column', gap: '0.75rem',
    padding: '1rem', background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 8,
  },
  promptArea: {
    width: '100%', minHeight: 80, resize: 'vertical', border: '1px solid var(--border)',
    borderRadius: 6, padding: '0.75rem', fontSize: 14, fontFamily: 'var(--sans, system-ui, sans-serif)',
    background: 'var(--bg)', color: 'var(--text)', outline: 'none', lineHeight: 1.5,
    boxSizing: 'border-box',
  },
  systemToggle: {
    background: 'none', border: 'none', cursor: 'pointer', fontSize: 12,
    color: 'var(--text-muted)', textAlign: 'left', padding: '4px 0', fontWeight: 600,
  },
  systemArea: {
    width: '100%', minHeight: 60, resize: 'vertical', border: '1px solid var(--border)',
    borderRadius: 6, padding: '0.75rem', fontSize: 13, fontFamily: 'var(--sans, system-ui, sans-serif)',
    background: 'var(--bg)', color: 'var(--text)', outline: 'none', lineHeight: 1.4,
    boxSizing: 'border-box',
  },
  paramRow: {
    display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap',
  },
  paramGroup: {
    display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 13,
  },
  paramLabel: { color: 'var(--text-muted)', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' },
  slider: { width: 120, accentColor: 'var(--accent)' },
  paramValue: { fontSize: 12, color: 'var(--text)', fontFamily: 'var(--mono, monospace)', minWidth: 36 },
  sendBtn: (disabled) => ({
    padding: '0.6rem 1.5rem', fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled ? 'var(--text-faint)' : 'var(--accent)', color: '#fff',
    border: 'none', borderRadius: 6, opacity: disabled ? 0.6 : 1, alignSelf: 'flex-start',
  }),
  grid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem',
  },
  historySection: {
    border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden',
  },
  historyToggle: {
    width: '100%', padding: '0.75rem 1rem', background: 'var(--surface)',
    border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer',
    fontSize: 13, fontWeight: 600, color: 'var(--text)', textAlign: 'left',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  historyList: {
    maxHeight: 300, overflow: 'auto',
  },
  historyItem: {
    padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)',
    fontSize: 12, color: 'var(--text-secondary)',
    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0.5rem', alignItems: 'center',
  },
  historyHeader: {
    padding: '0.5rem 1rem', borderBottom: '1px solid var(--border)',
    fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase',
    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0.5rem',
    background: 'var(--surface)',
  },
  promptExcerpt: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
};

/* ───────────── component ───────────── */
export function InferencePlayground({ org }) {
  const [models, setModels] = useState([]);
  const [leftModel, setLeftModel] = useState('');
  const [rightModel, setRightModel] = useState('');
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [showSystem, setShowSystem] = useState(false);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [temperature, setTemperature] = useState(1);
  const [leftState, setLeftState] = useState({ loading: false, response: null, elapsed: null, usage: null, error: null });
  const [rightState, setRightState] = useState({ loading: false, response: null, elapsed: null, usage: null, error: null });
  const [leftRating, setLeftRating] = useState(null);
  const [rightRating, setRightRating] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const promptRef = useRef(null);

  useEffect(() => { ensureKeyframes(); }, []);

  // Fetch model catalog
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/orgs/${org}/inference/catalog`);
        if (!res.ok) return;
        const data = await res.json();
        const list = (data.models || []).map((m) => m.name).filter(Boolean);
        if (!cancelled && list.length) {
          setModels(list);
          setLeftModel((prev) => prev || list[0]);
          setRightModel((prev) => prev || (list[1] || list[0]));
        }
      } catch { /* ignore */ }
    }
    load();
    return () => { cancelled = true; };
  }, [org]);

  const sending = leftState.loading || rightState.loading;

  const handleSend = useCallback(async () => {
    if (!prompt.trim() || sending) return;
    const userPrompt = prompt.trim();

    // Reset ratings
    setLeftRating(null);
    setRightRating(null);

    // Start both panels
    setLeftState({ loading: true, response: null, elapsed: null, usage: null, error: null });
    setRightState({ loading: true, response: null, elapsed: null, usage: null, error: null });

    async function callModel(model, setState) {
      const start = performance.now();
      try {
        const body = { message: userPrompt, stackRef: model };
        if (systemPrompt.trim()) body.systemPrompt = systemPrompt.trim();
        const res = await fetch(`/api/orgs/${org}/assistant/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const elapsed = Math.round(performance.now() - start);
        const data = await res.json();
        if (res.ok) {
          const msg = data.response?.message;
          const usage = msg?.usage || data.response?.usage || null;
          setState({ loading: false, response: msg?.content || JSON.stringify(data.response), elapsed, usage, error: null });
          return { elapsed, usage };
        } else {
          setState({ loading: false, response: null, elapsed, usage: null, error: data.message || 'Request failed' });
          return { elapsed, usage: null };
        }
      } catch (err) {
        const elapsed = Math.round(performance.now() - start);
        setState({ loading: false, response: null, elapsed, usage: null, error: err.message || 'Network error' });
        return { elapsed, usage: null };
      }
    }

    const [leftResult, rightResult] = await Promise.all([
      callModel(leftModel, setLeftState),
      callModel(rightModel, setRightState),
    ]);

    // Add to history (keep last 10)
    setHistory((prev) => {
      const entry = {
        id: Date.now(),
        prompt: userPrompt.length > 80 ? userPrompt.slice(0, 80) + '...' : userPrompt,
        leftModel,
        rightModel,
        leftLatency: leftResult.elapsed,
        rightLatency: rightResult.elapsed,
      };
      return [entry, ...prev].slice(0, 10);
    });
  }, [prompt, systemPrompt, leftModel, rightModel, org, sending]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div style={s.wrapper}>
      {/* Shared controls */}
      <div style={s.controls}>
        <textarea
          ref={promptRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your prompt... (Ctrl+Enter to send)"
          style={s.promptArea}
          aria-label="Prompt input"
        />
        <div>
          <button
            onClick={() => setShowSystem(!showSystem)}
            style={s.systemToggle}
            aria-expanded={showSystem}
            aria-label={showSystem ? 'Hide system prompt' : 'Show system prompt'}
          >
            {showSystem ? 'Hide' : 'Show'} system prompt
          </button>
          {showSystem && (
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Optional system prompt..."
              style={s.systemArea}
              aria-label="System prompt input"
            />
          )}
        </div>
        <div style={s.paramRow}>
          <div style={s.paramGroup}>
            <span style={s.paramLabel}>Max tokens</span>
            <input
              type="range" min={256} max={8192} step={256} value={maxTokens}
              onChange={(e) => setMaxTokens(Number(e.target.value))}
              style={s.slider}
              aria-label="Max tokens"
            />
            <span style={s.paramValue}>{maxTokens}</span>
          </div>
          <div style={s.paramGroup}>
            <span style={s.paramLabel}>Temperature</span>
            <input
              type="range" min={0} max={2} step={0.1} value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              style={s.slider}
              aria-label="Temperature"
            />
            <span style={s.paramValue}>{temperature.toFixed(1)}</span>
          </div>
          <button
            onClick={handleSend}
            disabled={!prompt.trim() || sending}
            style={s.sendBtn(!prompt.trim() || sending)}
            aria-label="Send prompt to both models for comparison"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      {/* Side-by-side panels */}
      <div style={s.grid} className="pg-grid" role="region" aria-label="Model comparison panels">
        <PlaygroundPanel
          side="left"
          model={leftModel}
          onModelChange={setLeftModel}
          models={models}
          state={leftState}
          rating={leftRating}
          onRatingChange={setLeftRating}
        />
        <PlaygroundPanel
          side="right"
          model={rightModel}
          onModelChange={setRightModel}
          models={models}
          state={rightState}
          rating={rightRating}
          onRatingChange={setRightRating}
        />
      </div>

      {/* History */}
      {history.length > 0 && (
        <div style={s.historySection}>
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            style={s.historyToggle}
            aria-expanded={historyOpen}
            aria-label={historyOpen ? 'Collapse comparison history' : 'Expand comparison history'}
          >
            <span>Comparison history ({history.length})</span>
            <span>{historyOpen ? 'Collapse' : 'Expand'}</span>
          </button>
          {historyOpen && (
            <div style={s.historyList}>
              <div style={s.historyHeader}>
                <span>Prompt</span>
                <span>Left model</span>
                <span>Right model</span>
                <span>Latency</span>
              </div>
              {history.map((entry) => (
                <div key={entry.id} style={s.historyItem}>
                  <span style={s.promptExcerpt} title={entry.prompt}>{entry.prompt}</span>
                  <span>{entry.leftModel}</span>
                  <span>{entry.rightModel}</span>
                  <span>{entry.leftLatency}ms / {entry.rightLatency}ms</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
