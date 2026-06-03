'use client';

/* ───────────── simple markdown renderer ───────────── */
function renderMarkdown(text) {
  if (!text) return null;
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const inner = part.slice(3, -3);
      const nl = inner.indexOf('\n');
      const lang = nl >= 0 ? inner.slice(0, nl).trim() : '';
      const code = nl >= 0 ? inner.slice(nl + 1) : inner;
      return (
        <div key={i} style={{ marginTop: 8, marginBottom: 4 }}>
          {lang && <div style={panelStyles.codeHeader}>{lang}</div>}
          <pre style={{ ...panelStyles.codeBlock, ...(lang ? { borderRadius: '0 0 6px 6px', marginTop: 0 } : {}) }}>{code}</pre>
        </div>
      );
    }
    const lines = part.split('\n');
    const elems = [];
    let listItems = [];
    let listType = null;
    function flushList() {
      if (!listItems.length) return;
      const Tag = listType === 'ol' ? 'ol' : 'ul';
      elems.push(<Tag key={`l-${elems.length}`} style={{ margin: '6px 0', paddingLeft: 20 }}>{listItems.map((li, j) => <li key={j}>{renderInline(li)}</li>)}</Tag>);
      listItems = [];
      listType = null;
    }
    for (const line of lines) {
      const ul = line.match(/^\s*[-*]\s+(.*)/);
      if (ul) { if (listType === 'ol') flushList(); listType = 'ul'; listItems.push(ul[1]); continue; }
      const ol = line.match(/^\s*\d+\.\s+(.*)/);
      if (ol) { if (listType === 'ul') flushList(); listType = 'ol'; listItems.push(ol[1]); continue; }
      flushList();
      const hm = line.match(/^(#{1,4})\s+(.*)/);
      if (hm) { const sz = { 1: 18, 2: 16, 3: 14, 4: 13 }; elems.push(<div key={`h-${elems.length}`} style={{ fontWeight: 700, fontSize: sz[hm[1].length] || 14, marginTop: 10, marginBottom: 4 }}>{renderInline(hm[2])}</div>); continue; }
      if (line.trim()) elems.push(<div key={`p-${elems.length}`} style={{ marginBottom: 4 }}>{renderInline(line)}</div>);
    }
    flushList();
    return <span key={i}>{elems}</span>;
  });
}

function renderInline(text) {
  if (!text) return null;
  const segs = text.split(/(`[^`]+`)/g);
  return segs.map((seg, j) => {
    if (seg.startsWith('`') && seg.endsWith('`')) {
      return <code key={j} style={panelStyles.inlineCode}>{seg.slice(1, -1)}</code>;
    }
    let r = seg.replace(/\*\*\*([^*]+)\*\*\*/g, '<<<BI:$1>>>');
    r = r.replace(/\*\*([^*]+)\*\*/g, '<<<B:$1>>>');
    r = r.replace(/\*([^*]+)\*/g, '<<<I:$1>>>');
    const tokens = r.split(/(<<<(?:BI|B|I):[^>]+>>>)/g);
    return tokens.map((tok, k) => {
      const bi = tok.match(/<<<BI:(.+)>>>/); if (bi) return <strong key={`${j}-${k}`}><em>{bi[1]}</em></strong>;
      const b = tok.match(/<<<B:(.+)>>>/); if (b) return <strong key={`${j}-${k}`}>{b[1]}</strong>;
      const im = tok.match(/<<<I:(.+)>>>/); if (im) return <em key={`${j}-${k}`}>{im[1]}</em>;
      return tok;
    });
  });
}

/* ───────────── panel styles ───────────── */
export const panelStyles = {
  panel: (isLeft) => ({
    display: 'flex', flexDirection: 'column', gap: '0.75rem',
    padding: '1rem', border: '1px solid var(--border)', borderRadius: 8,
    background: isLeft ? 'var(--surface)' : 'var(--bg)',
    minHeight: 200,
  }),
  modelSelect: {
    padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)',
    fontSize: 13, background: 'var(--bg)', color: 'var(--text)', width: '100%',
  },
  responseArea: {
    flex: 1, minHeight: 120, padding: '0.75rem', borderRadius: 6,
    border: '1px solid var(--border)', background: 'var(--bg)',
    overflow: 'auto', fontSize: 14, lineHeight: 1.6, color: 'var(--text)',
  },
  spinner: {
    display: 'inline-block', width: 18, height: 18, border: '2px solid var(--border)',
    borderTopColor: 'var(--accent)', borderRadius: '50%',
    animation: 'krate-pg-spin 0.8s linear infinite',
  },
  emptyResponse: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100%', color: 'var(--text-muted)', fontSize: 13,
  },
  metricsBar: {
    display: 'flex', gap: '1rem', fontSize: 12, color: 'var(--text-muted)',
    padding: '6px 0', borderTop: '1px solid var(--border)', flexWrap: 'wrap',
  },
  metricItem: { display: 'flex', gap: '0.25rem', alignItems: 'center' },
  metricLabel: { fontWeight: 600 },
  ratingRow: {
    display: 'flex', gap: '0.5rem', alignItems: 'center',
  },
  ratingBtn: (active) => ({
    background: active ? 'var(--accent)' : 'var(--surface-overlay)',
    color: active ? '#fff' : 'var(--text-muted)',
    border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer',
    fontSize: 14, fontWeight: 600, transition: 'background 0.15s',
  }),
  codeBlock: {
    background: 'var(--bg-code, #1e1e2e)', color: 'var(--text)',
    padding: '12px 14px', borderRadius: 6, fontFamily: 'var(--mono, monospace)',
    fontSize: 12.5, overflow: 'auto', whiteSpace: 'pre', lineHeight: 1.6,
  },
  codeHeader: {
    padding: '4px 12px', background: 'var(--bg-code, #1e1e2e)', borderRadius: '6px 6px 0 0',
    fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono, monospace)',
    borderBottom: '1px solid var(--border)',
  },
  inlineCode: {
    background: 'var(--surface-overlay)', padding: '1px 5px', borderRadius: 3,
    fontFamily: 'var(--mono, monospace)', fontSize: '0.88em',
  },
};

/* ───────────── helpers ───────────── */
export function formatTokens(usage) {
  if (!usage) return '--';
  const inp = usage.input_tokens ?? usage.inputTokens ?? 0;
  const out = usage.output_tokens ?? usage.outputTokens ?? 0;
  return `${inp} in / ${out} out`;
}

export function estimateCost(usage) {
  if (!usage) return '--';
  const inp = usage.input_tokens ?? usage.inputTokens ?? 0;
  const out = usage.output_tokens ?? usage.outputTokens ?? 0;
  // Rough estimate: $3/M input, $15/M output (generic mid-tier pricing)
  const cost = (inp * 3 + out * 15) / 1_000_000;
  return cost < 0.001 ? '<$0.001' : `~$${cost.toFixed(4)}`;
}

/* ───────────── PlaygroundPanel ───────────── */
export function PlaygroundPanel({ side, model, onModelChange, models, state, rating, onRatingChange }) {
  const isLeft = side === 'left';
  const sideLabel = isLeft ? 'Left' : 'Right';

  return (
    <div style={panelStyles.panel(isLeft)} aria-label={`Response from ${model || `${sideLabel.toLowerCase()} model`}`}>
      <select
        value={model}
        onChange={(e) => onModelChange(e.target.value)}
        style={panelStyles.modelSelect}
        aria-label={`${sideLabel} panel model selector`}
      >
        {models.length === 0 && <option value="">Loading models...</option>}
        {models.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      <div style={panelStyles.responseArea}>
        {state.loading ? (
          <div style={panelStyles.emptyResponse}><div style={panelStyles.spinner} /></div>
        ) : state.error ? (
          <div style={{ color: 'var(--danger, #ef4444)', fontSize: 13 }}>{state.error}</div>
        ) : state.response ? (
          renderMarkdown(state.response)
        ) : (
          <div style={panelStyles.emptyResponse}>Response will appear here</div>
        )}
      </div>
      {(state.elapsed != null || state.usage) && (
        <div style={panelStyles.metricsBar}>
          <div style={panelStyles.metricItem}><span style={panelStyles.metricLabel}>Latency:</span> {state.elapsed}ms</div>
          <div style={panelStyles.metricItem}><span style={panelStyles.metricLabel}>Tokens:</span> {formatTokens(state.usage)}</div>
          <div style={panelStyles.metricItem}><span style={panelStyles.metricLabel}>Cost:</span> {estimateCost(state.usage)}</div>
        </div>
      )}
      <div style={panelStyles.ratingRow}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Rate:</span>
        <button
          onClick={() => onRatingChange(rating === 'up' ? null : 'up')}
          style={panelStyles.ratingBtn(rating === 'up')}
          aria-label={`Thumbs up for ${sideLabel.toLowerCase()} panel`}
          title="Thumbs up"
        >
          +1
        </button>
        <button
          onClick={() => onRatingChange(rating === 'down' ? null : 'down')}
          style={panelStyles.ratingBtn(rating === 'down')}
          aria-label={`Thumbs down for ${sideLabel.toLowerCase()} panel`}
          title="Thumbs down"
        >
          -1
        </button>
      </div>
    </div>
  );
}
