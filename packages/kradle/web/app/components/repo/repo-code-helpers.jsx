'use client';

import { EditorView } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { yaml } from '@codemirror/lang-yaml';

// ── Language detection ─────────────────────────────────────────────────────

export const LANG_MAP = {
  js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
  py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
  md: 'markdown', json: 'json', yaml: 'yaml', yml: 'yaml',
  css: 'css', html: 'html', sh: 'shell', bash: 'shell', zsh: 'shell',
  toml: 'toml', xml: 'xml', svg: 'xml', graphql: 'graphql', gql: 'graphql',
  sql: 'sql', dockerfile: 'dockerfile', makefile: 'makefile',
  c: 'c', cpp: 'cpp', h: 'c', hpp: 'cpp', cs: 'csharp', php: 'php',
  swift: 'swift', kt: 'kotlin', scala: 'scala', r: 'r', lua: 'lua',
};

export function detectLanguage(filePath) {
  if (!filePath) return 'text';
  const base = filePath.split('/').pop().toLowerCase();
  if (base === 'dockerfile') return 'dockerfile';
  if (base === 'makefile' || base === 'gnumakefile') return 'makefile';
  const ext = base.split('.').pop();
  return LANG_MAP[ext] || 'text';
}

export function formatSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function languageExtension(language) {
  if (language === 'yaml') return yaml();
  if (['javascript', 'typescript', 'json'].includes(language)) return javascript({ jsx: true, typescript: language === 'typescript' });
  return [];
}

// ── CodeMirror theme ───────────────────────────────────────────────────────

export const repoCodeTheme = EditorView.theme({
  '&': {
    minHeight: '100%',
    backgroundColor: '#1e1e2e',
    color: '#cdd6f4',
  },
  '.cm-scroller': {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '0.8125rem',
    lineHeight: '1.65',
  },
  '.cm-gutters': {
    backgroundColor: '#181825',
    color: '#6c7086',
    borderRight: '1px solid rgba(205, 214, 244, 0.12)',
  },
  '.cm-activeLine, .cm-activeLineGutter': {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(137, 180, 250, 0.36)',
  },
});

// ── BreadcrumbNav ──────────────────────────────────────────────────────────

export function BreadcrumbNav({ repo, pathSegments, onNavigate }) {
  return (
    <nav
      aria-label="Directory path"
      style={{
        padding: '0.375rem 0.5rem',
        borderBottom: '1px solid #e5e7eb',
        fontSize: '0.6875rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.125rem',
        alignItems: 'center',
        minHeight: '1.75rem',
      }}
    >
      <button
        onClick={() => onNavigate(-1)}
        aria-label={`Navigate to repository root: ${repo}`}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.6875rem',
          color: pathSegments.length === 0 ? '#374151' : '#2563eb',
          padding: 0,
          fontWeight: pathSegments.length === 0 ? 700 : 400,
        }}
      >
        {repo}
      </button>
      {pathSegments.map((seg, idx) => (
        <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <button
            onClick={() => onNavigate(idx)}
            aria-label={`Navigate to directory: ${seg}`}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.6875rem',
              color: idx === pathSegments.length - 1 ? '#374151' : '#2563eb',
              padding: 0,
              fontWeight: idx === pathSegments.length - 1 ? 700 : 400,
            }}
          >
            {seg}
          </button>
        </span>
      ))}
    </nav>
  );
}

// ── FileTreeItem ───────────────────────────────────────────────────────────

export function FileTreeItem({ item, isSelected, onClick }) {
  const isDir = item.type === 'tree';
  const displayName = item.path.split('/').pop();
  return (
    <button
      role="treeitem"
      aria-selected={isSelected}
      aria-label={`${isDir ? 'Directory' : 'File'}: ${displayName}`}
      onClick={() => onClick(item)}
      title={item.path}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        width: '100%',
        textAlign: 'left',
        padding: '0.25rem 0.625rem',
        fontSize: '0.75rem',
        border: 'none',
        cursor: 'pointer',
        background: isSelected ? '#dbeafe' : 'transparent',
        color: isSelected ? '#1d4ed8' : '#374151',
        fontWeight: isDir ? 600 : 400,
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = '#f3f4f6';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'transparent';
      }}
    >
      <span style={{ flexShrink: 0, fontSize: '0.75rem', lineHeight: 1 }}>
        {isDir ? '📁' : '📄'}
      </span>
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
        }}
      >
        {displayName}
      </span>
      {!isDir && item.size ? (
        <span style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', flexShrink: 0 }}>
          {formatSize(item.size)}
        </span>
      ) : null}
    </button>
  );
}

