'use client';

import { useEffect, useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { yaml } from '@codemirror/lang-yaml';
import { EditorView } from '@codemirror/view';

const krateEditorTheme = EditorView.theme({
  '&': {
    backgroundColor: 'rgba(1, 6, 13, .72)',
    color: '#d9f8ff',
    borderRadius: '18px',
    overflow: 'hidden'
  },
  '.cm-scroller': {
    fontFamily: 'var(--font-mono)',
    fontSize: '.82rem',
    lineHeight: '1.45',
    maxHeight: '420px'
  },
  '.cm-gutters': {
    backgroundColor: 'rgba(4, 13, 24, .86)',
    color: 'rgba(232, 242, 255, .44)',
    borderRight: '1px solid rgba(139, 233, 253, .13)'
  },
  '.cm-activeLine, .cm-activeLineGutter': {
    backgroundColor: 'rgba(139, 233, 253, .08)'
  },
  '.cm-content': {
    caretColor: '#8be9fd'
  }
});

export function CodeEditor({ value, language = 'yaml', label = 'CodeMirror resource editor', compact = false }) {
  const extensions = useMemo(() => [
    language === 'javascript' ? javascript({ jsx: true }) : yaml(),
    krateEditorTheme,
    EditorView.lineWrapping
  ], [language]);

  return <div className={`codeEditorShell ${compact ? 'compactEditor' : ''}`} aria-label={label}>
    <div className="editorToolbar"><span>CodeMirror</span><span>{language}</span></div>
    <CodeMirror
      value={value || 'apiVersion: krate.a5c.ai/v1alpha1\nkind: Resource'}
      extensions={extensions}
      editable={false}
      basicSetup={{ foldGutter: false, highlightActiveLine: false, highlightActiveLineGutter: false }}
      theme="dark"
      aria-label={label}
    />
  </div>;
}

export function LiveWatchPanel({ org = 'default', resource = 'pullrequests', initialEvents = [] }) {
  const [state, setState] = useState({ status: 'connecting', events: initialEvents.slice(0, 5), error: '' });
  const streamPath = `/api/watch/orgs/${encodeURIComponent(org)}/${encodeURIComponent(resource)}`;

  useEffect(() => {
    const source = new EventSource(streamPath);
    source.addEventListener('krate', (event) => {
      const payload = JSON.parse(event.data);
      setState((current) => ({ status: 'streaming', error: '', events: [payload, ...current.events].slice(0, 6) }));
    });
    source.onerror = () => {
      setState((current) => ({ ...current, status: 'reconnecting', error: 'Live updates paused. Krate will resume from the current list state.' }));
      source.close();
    };
    return () => source.close();
  }, [streamPath]);

  return <div className="card watchPanel" aria-live="polite">
    <div className="cardTitle"><h3>Live updates</h3><span className={`pill ${state.status === 'streaming' ? 'good' : 'warn'}`}>{state.status}</span></div>
    <p>Updates arrive automatically for this organization without manual refresh.</p>
    <details><summary><span><h4>Advanced stream details</h4><p>Expand only when troubleshooting live updates.</p></span></summary><code>{streamPath}</code></details>
    {state.error ? <small className="watchError">{state.error}</small> : null}
    <ol className="watchEvents">
      {state.events.map((event, index) => <li key={`${event.type || 'event'}-${event.resource || event.namespace || index}-${index}`}>
        <strong>{event.type || 'EVENT'}</strong>
        <span>{event.resource || event.namespace || resource}</span>
        <small>{event.storage || event.status || 'watch'}</small>
      </li>)}
    </ol>
  </div>;
}
