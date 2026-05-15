'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { yaml } from '@codemirror/lang-yaml';
import { EditorView } from '@codemirror/view';

const LANG_MAP = {
  js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
  py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
  md: 'markdown', json: 'json', yaml: 'yaml', yml: 'yaml',
  css: 'css', html: 'html', sh: 'shell', bash: 'shell', zsh: 'shell',
  toml: 'toml', xml: 'xml', svg: 'xml', graphql: 'graphql', gql: 'graphql',
  sql: 'sql', dockerfile: 'dockerfile', makefile: 'makefile',
  c: 'c', cpp: 'cpp', h: 'c', hpp: 'cpp', cs: 'csharp', php: 'php',
  swift: 'swift', kt: 'kotlin', scala: 'scala', r: 'r', lua: 'lua',
};

function detectLanguage(filePath) {
  if (!filePath) return 'text';
  const base = filePath.split('/').pop().toLowerCase();
  if (base === 'dockerfile') return 'dockerfile';
  if (base === 'makefile' || base === 'gnumakefile') return 'makefile';
  const ext = base.split('.').pop();
  return LANG_MAP[ext] || 'text';
}

function formatSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function languageExtension(language) {
  if (language === 'yaml') return yaml();
  if (['javascript', 'typescript', 'json'].includes(language)) return javascript({ jsx: true, typescript: language === 'typescript' });
  return [];
}

const repoCodeTheme = EditorView.theme({
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

export function RepoCodeBrowser({ org, repo, defaultBranch = 'main' }) {
  const [branch, setBranch] = useState(defaultBranch);
  const [tree, setTree] = useState(null);
  const [treeLoading, setTreeLoading] = useState(true);
  const [treeError, setTreeError] = useState(null);
  const [currentPath, setCurrentPath] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState(null);

  // Fetch tree whenever branch or currentPath changes
  useEffect(() => {
    setTreeLoading(true);
    setTreeError(null);
    const params = new URLSearchParams({ branch, path: currentPath });
    fetch(`/api/orgs/${encodeURIComponent(org)}/repositories/${encodeURIComponent(repo)}/tree?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setTree(Array.isArray(data) ? data : (data.tree || []));
        setTreeLoading(false);
      })
      .catch((err) => {
        setTreeError(err.message);
        setTreeLoading(false);
      });
  }, [org, repo, branch, currentPath]);

  // Fetch file content
  const openFile = useCallback(
    (filePath) => {
      setSelectedFile(filePath);
      setFileContent(null);
      setFileLoading(true);
      setFileError(null);
      fetch(
        `/api/orgs/${encodeURIComponent(org)}/repositories/${encodeURIComponent(repo)}/blob/${filePath}?branch=${encodeURIComponent(branch)}`
      )
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((data) => {
          setFileContent(data);
          setFileLoading(false);
        })
        .catch((err) => {
          setFileError(err.message);
          setFileLoading(false);
        });
    },
    [org, repo, branch]
  );

  // Build breadcrumb path segments
  const pathSegments = currentPath ? currentPath.split('/').filter(Boolean) : [];

  const navigateTo = useCallback(
    (idx) => {
      setSelectedFile(null);
      setFileContent(null);
      if (idx < 0) {
        setCurrentPath('');
      } else {
        setCurrentPath(pathSegments.slice(0, idx + 1).join('/'));
      }
    },
    [pathSegments]
  );

  const handleTreeItemClick = useCallback(
    (item) => {
      if (item.type === 'tree') {
        setCurrentPath(item.path);
        setSelectedFile(null);
        setFileContent(null);
      } else {
        openFile(item.path);
      }
    },
    [openFile]
  );

  const handleBranchChange = (newBranch) => {
    setBranch(newBranch);
    setCurrentPath('');
    setSelectedFile(null);
    setFileContent(null);
  };

  // Deduplicated branch list including the current and default
  const branchOptions = Array.from(new Set(['main', 'staging', 'develop', defaultBranch, branch].filter(Boolean)));

  const language = detectLanguage(selectedFile);
  const editorExtensions = useMemo(() => [languageExtension(language), repoCodeTheme, EditorView.lineWrapping].flat(), [language]);

  return (
    <div
      style={{
        display: 'flex',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        minHeight: '32rem',
        background: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* ── Sidebar: file tree ── */}
      <aside
        style={{
          width: '220px',
          minWidth: '180px',
          maxWidth: '280px',
          borderRight: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          background: '#f9fafb',
          flexShrink: 0,
        }}
      >
        {/* Branch selector */}
        <div style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <label style={{ display: 'block', fontSize: '0.6875rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 600 }}>
            Branch
          </label>
          <select
            value={branch}
            onChange={(e) => handleBranchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '0.25rem 0.375rem',
              fontSize: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.25rem',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            {branchOptions.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Breadcrumb navigation */}
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
            onClick={() => navigateTo(-1)}
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
              <span style={{ color: '#9ca3af' }}>/</span>
              <button
                onClick={() => navigateTo(idx)}
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

        {/* File tree list */}
        <div
          role="tree"
          aria-label="Repository file tree"
          style={{ flex: 1, overflowY: 'auto', padding: '0.25rem 0' }}
        >
          {treeLoading ? (
            <p style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>
              Loading…
            </p>
          ) : treeError ? (
            <p style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#ef4444' }}>
              Error: {treeError}
            </p>
          ) : !tree || tree.length === 0 ? (
            <p style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
              Empty directory
            </p>
          ) : (
            tree.map((item) => {
              const isDir = item.type === 'tree';
              const displayName = item.path.split('/').pop();
              const isSelected = selectedFile === item.path;
              return (
                <button
                  key={item.path}
                  role="treeitem"
                  aria-selected={isSelected}
                  onClick={() => handleTreeItemClick(item)}
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
                    <span style={{ fontSize: '0.5625rem', color: '#9ca3af', flexShrink: 0 }}>
                      {formatSize(item.size)}
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Main: file viewer ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {!selectedFile ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              gap: '0.5rem',
            }}
          >
            <span style={{ fontSize: '2rem' }}>📂</span>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>Select a file to view its contents</p>
          </div>
        ) : (
          <>
            {/* File info bar */}
            <div
              style={{
                padding: '0.5rem 0.875rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.75rem',
                color: '#6b7280',
                background: '#f9fafb',
                flexWrap: 'wrap',
              }}
            >
              <strong style={{ color: '#374151', fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                {selectedFile}
              </strong>
              {fileContent ? (
                <>
                  <span>{formatSize(fileContent.size)}</span>
                  <span
                    style={{
                      background: '#e5e7eb',
                      padding: '0.0625rem 0.375rem',
                      borderRadius: '9999px',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                    }}
                  >
                    {language}
                  </span>
                  {fileContent.lastCommit ? (
                    <span style={{ color: '#9ca3af' }}>
                      commit: <code style={{ fontSize: '0.6875rem' }}>{fileContent.lastCommit}</code>
                    </span>
                  ) : null}
                  <a
                    href={`/api/orgs/${encodeURIComponent(org)}/repositories/${encodeURIComponent(repo)}/blob/${selectedFile}?branch=${encodeURIComponent(branch)}&raw=1`}
                    download={selectedFile.split('/').pop()}
                    style={{
                      marginLeft: 'auto',
                      color: '#2563eb',
                      textDecoration: 'none',
                      fontSize: '0.6875rem',
                      border: '1px solid #bfdbfe',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '0.25rem',
                      background: '#eff6ff',
                      flexShrink: 0,
                    }}
                  >
                    Raw
                  </a>
                </>
              ) : null}
            </div>

            {/* File content viewer */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              {fileLoading ? (
                <p style={{ padding: '1.5rem', color: '#9ca3af', fontSize: '0.875rem', textAlign: 'center' }}>
                  Loading file…
                </p>
              ) : fileError ? (
                <p style={{ padding: '1rem', color: '#ef4444', fontSize: '0.875rem' }}>
                  Error loading file: {fileError}
                </p>
              ) : fileContent ? (
                <CodeMirror
                  value={fileContent.content || ''}
                  extensions={editorExtensions}
                  editable={false}
                  basicSetup={{ foldGutter: true, highlightActiveLine: true, highlightActiveLineGutter: true }}
                  theme="dark"
                  aria-label={`File content: ${selectedFile}`}
                />
              ) : null}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
