'use client';
import { useState, useRef } from 'react';

const OUTPUT_TYPES = [
  { value: 'markdown', label: 'Markdown' },
  { value: 'html', label: 'HTML' },
  { value: 'json', label: 'JSON' },
];

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: 16 },
  fieldLabel: { display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4, color: 'var(--text)' },
  textarea: {
    width: '100%', minHeight: 80, resize: 'vertical', border: '1px solid var(--border)',
    borderRadius: 6, padding: '10px 12px', fontSize: 14, fontFamily: 'var(--sans, system-ui, sans-serif)',
    lineHeight: 1.4, background: 'var(--bg)', color: 'var(--text)',
  },
  contextEditor: {
    width: '100%', minHeight: 100, resize: 'vertical', border: '1px solid var(--border)',
    borderRadius: 6, padding: '10px 12px', fontSize: 12, fontFamily: 'var(--mono, monospace)',
    lineHeight: 1.5, background: 'var(--bg-code, #1e1e2e)', color: 'var(--text-code, #cdd6f4)',
  },
  select: {
    padding: '6px 12px', borderRadius: 4, border: '1px solid var(--border)',
    fontSize: 13, background: 'var(--bg)', color: 'var(--text)',
  },
  row: { display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' },
  generateBtn: (disabled) => ({
    padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled ? 'var(--text-faint)' : 'var(--accent, #2563eb)',
    color: '#fff', border: 'none', borderRadius: 6, opacity: disabled ? 0.6 : 1,
  }),
  resultBox: {
    border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden',
  },
  resultHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px',
    borderBottom: '1px solid var(--border)', background: 'var(--surface)',
  },
  resultLabel: { fontWeight: 600, fontSize: 13, color: 'var(--text)' },
  actionBtn: {
    padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', borderRadius: 4,
    border: '1px solid var(--border)', background: 'transparent',
    color: 'var(--text)',
  },
  iframe: { width: '100%', height: 400, border: 'none', background: '#fff' },
  jsonView: {
    padding: '14px', fontFamily: 'var(--mono, monospace)', fontSize: 12,
    background: 'var(--bg-code, #1e1e2e)', color: 'var(--text-code, #cdd6f4)',
    overflow: 'auto', maxHeight: 500, whiteSpace: 'pre-wrap', lineHeight: 1.5,
  },
  markdownView: {
    padding: '14px 18px', fontSize: 14, lineHeight: 1.6, color: 'var(--text)',
    background: 'var(--bg)', maxHeight: 500, overflow: 'auto',
  },
  error: {
    background: '#fef2f2', border: '1px solid var(--red, #c03a2b)', borderRadius: 8,
    padding: '8px 14px', color: 'var(--red, #c03a2b)', fontSize: 13,
  },
  usage: { fontSize: 11, color: 'var(--text-muted)', marginTop: 6 },
};

export function AssistantGenerate({ org, stacks = [] }) {
  const [task, setTask] = useState('');
  const [contextJson, setContextJson] = useState('');
  const [outputType, setOutputType] = useState('markdown');
  const [selectedStack, setSelectedStack] = useState(stacks[0] || 'assistant');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const iframeRef = useRef(null);

  async function handleGenerate() {
    if (!task.trim() || generating) return;
    setGenerating(true);
    setError('');
    setResult(null);

    let parsedContext = null;
    if (contextJson.trim()) {
      try {
        parsedContext = JSON.parse(contextJson.trim());
      } catch {
        setError('Invalid JSON in context field');
        setGenerating(false);
        return;
      }
    }

    try {
      const res = await fetch(`/api/orgs/${org}/assistant/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: task.trim(),
          context: parsedContext,
          stackRef: selectedStack,
          outputType,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.message || 'Generation failed');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    const text = typeof result.content === 'string' ? result.content : JSON.stringify(result.content, null, 2);
    navigator.clipboard.writeText(text).catch(() => {});
  }

  function handleDownload() {
    if (!result) return;
    const text = typeof result.content === 'string' ? result.content : JSON.stringify(result.content, null, 2);
    const ext = outputType === 'html' ? 'html' : outputType === 'json' ? 'json' : 'md';
    const blob = new Blob([text], { type: result.contentType || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const stackOptions = stacks.length ? stacks : ['assistant'];

  return (
    <div style={styles.container}>
      {/* Task description */}
      <div>
        <label style={styles.fieldLabel}>Task description</label>
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Describe what you want to generate..."
          style={styles.textarea}
          aria-label="Task description"
        />
      </div>

      {/* Context JSON (optional) */}
      <div>
        <label style={styles.fieldLabel}>Context (JSON, optional)</label>
        <textarea
          value={contextJson}
          onChange={(e) => setContextJson(e.target.value)}
          placeholder='{ "repos": [...], "config": {...} }'
          style={styles.contextEditor}
          aria-label="Context JSON"
        />
      </div>

      {/* Controls row */}
      <div style={styles.row}>
        <div>
          <label style={styles.fieldLabel}>Output type</label>
          <select value={outputType} onChange={(e) => setOutputType(e.target.value)} style={styles.select} aria-label="Output type">
            {OUTPUT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label style={styles.fieldLabel}>Stack</label>
          <select value={selectedStack} onChange={(e) => setSelectedStack(e.target.value)} style={styles.select} aria-label="Agent stack">
            {stackOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={handleGenerate} disabled={!task.trim() || generating} style={styles.generateBtn(!task.trim() || generating)}>
          {generating ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {/* Error */}
      {error && <div style={styles.error}>{error}</div>}

      {/* Result */}
      {result && (
        <div style={styles.resultBox}>
          <div style={styles.resultHeader}>
            <span style={styles.resultLabel}>Result ({outputType.toUpperCase()})</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={handleCopy} style={styles.actionBtn}>Copy</button>
              <button onClick={handleDownload} style={styles.actionBtn}>Download</button>
            </div>
          </div>

          {/* Render based on output type */}
          {outputType === 'html' && result.artifactUrl ? (
            <iframe ref={iframeRef} src={result.artifactUrl} style={styles.iframe} sandbox="allow-scripts" title="Generated HTML" />
          ) : outputType === 'html' ? (
            <iframe ref={iframeRef} srcDoc={typeof result.content === 'string' ? result.content : ''} style={styles.iframe} sandbox="allow-scripts" title="Generated HTML" />
          ) : outputType === 'json' ? (
            <pre style={styles.jsonView}>
              {typeof result.content === 'string' ? result.content : JSON.stringify(result.content, null, 2)}
            </pre>
          ) : (
            <div style={styles.markdownView}>
              {renderSimpleMarkdown(typeof result.content === 'string' ? result.content : JSON.stringify(result.content, null, 2))}
            </div>
          )}

          {result.usage && (
            <div style={styles.usage}>
              Tokens: {result.usage.inputTokens && `in ${result.usage.inputTokens}`} {result.usage.outputTokens && `out ${result.usage.outputTokens}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function renderSimpleMarkdown(text) {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    if (line.startsWith('# ')) return <h1 key={i} style={{ fontSize: 20, fontWeight: 700, margin: '12px 0 6px' }}>{line.slice(2)}</h1>;
    if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: 17, fontWeight: 700, margin: '10px 0 4px' }}>{line.slice(3)}</h2>;
    if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize: 15, fontWeight: 700, margin: '8px 0 4px' }}>{line.slice(4)}</h3>;
    if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} style={{ marginLeft: 16 }}>{line.slice(2)}</li>;
    if (line.trim() === '') return <br key={i} />;
    return <p key={i} style={{ margin: '4px 0' }}>{line}</p>;
  });
}
