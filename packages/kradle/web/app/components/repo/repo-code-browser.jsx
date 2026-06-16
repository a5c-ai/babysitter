'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { yaml } from '@codemirror/lang-yaml';
import { EditorView } from '@codemirror/view';

import {
  detectLanguage,
  formatSize,
  languageExtension,
  repoCodeTheme,
  BreadcrumbNav,
  FileTreeItem,
} from './repo-code-helpers.jsx';

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
        if (data?.source === 'not-configured') {
          setTree(data);
        } else {
          setTree(Array.isArray(data) ? data : (data.tree || []));
        }
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
        border: '1px solid var(--border)',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        minHeight: '32rem',
        background: 'var(--surface)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Sidebar: file tree */}
      <aside
        aria-label="Repository file browser sidebar"
        style={{
          width: '220px',
          minWidth: '180px',
          maxWidth: '280px',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-subtle)',
          flexShrink: 0,
        }}
      >
        {/* Branch selector */}
        <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>
          <label style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
            Branch
          </label>
          <select
            value={branch}
            onChange={(e) => handleBranchChange(e.target.value)}
            aria-label="Select branch"
            style={{
              width: '100%',
              padding: '0.25rem 0.375rem',
              fontSize: '0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '0.25rem',
              background: 'var(--surface)',
              cursor: 'pointer',
            }}
          >
            {branchOptions.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Breadcrumb navigation */}
        <BreadcrumbNav repo={repo} pathSegments={pathSegments} onNavigate={navigateTo} />

        {/* File tree list */}
        <div
          role="tree"
          aria-label="Repository file tree"
          style={{ flex: 1, overflowY: 'auto', padding: '0.25rem 0' }}
        >
          {treeLoading ? (
            <p style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Loading...
            </p>
          ) : treeError ? (
            <p style={{ padding: '0.5rem', fontSize: '0.75rem', color: 'var(--danger)' }}>
              Error: {treeError}
            </p>
          ) : tree?.source === 'not-configured' ? (
            <div
              role="alert"
              style={{
                margin: '0.75rem 0.5rem',
                padding: '0.75rem',
                border: '1px solid var(--warning)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-raised)',
                fontSize: '0.75rem',
                color: 'var(--warning)',
              }}
            >
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Repository browser requires Gitea</strong>
              <span>Set <code style={{ background: 'var(--surface)', padding: '0.0625rem 0.25rem', borderRadius: '0.125rem', fontSize: '0.6875rem' }}>KRADLE_GITEA_HTTP_URL</code> to enable.</span>
            </div>
          ) : !tree || tree.length === 0 ? (
            <p style={{ padding: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Empty directory
            </p>
          ) : (
            tree.map((item) => (
              <FileTreeItem
                key={item.path}
                item={item}
                isSelected={selectedFile === item.path}
                onClick={handleTreeItemClick}
              />
            ))
          )}
        </div>
      </aside>

      {/* Main: file viewer */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {tree?.source === 'not-configured' ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '2rem',
            }}
          >
            <div
              role="alert"
              style={{
                maxWidth: '24rem',
                padding: '1.25rem 1.5rem',
                border: '1px solid var(--warning)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--surface-raised)',
                color: 'var(--warning)',
                textAlign: 'center',
              }}
            >
              <p style={{ margin: '0 0 0.5rem', fontWeight: 600, fontSize: '0.9375rem' }}>Repository browser not available</p>
              <p style={{ margin: 0, fontSize: '0.8125rem', lineHeight: 1.5 }}>
                Repository browser requires Gitea. Set{' '}
                <code style={{ background: 'var(--surface)', padding: '0.125rem 0.375rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
                  KRADLE_GITEA_HTTP_URL
                </code>{' '}
                to enable.
              </p>
            </div>
          </div>
        ) : !selectedFile ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
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
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-subtle)',
                flexWrap: 'wrap',
              }}
            >
              <strong style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                {selectedFile}
              </strong>
              {fileContent ? (
                <>
                  <span>{formatSize(fileContent.size)}</span>
                  <span
                    style={{
                      background: 'var(--surface-raised)',
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-mono)',
                      padding: '0.0625rem 0.375rem',
                      borderRadius: '9999px',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                    }}
                  >
                    {language}
                  </span>
                  {fileContent.lastCommit ? (
                    <span style={{ color: 'var(--text-muted)' }}>
                      commit: <code style={{ fontSize: '0.6875rem' }}>{fileContent.lastCommit}</code>
                    </span>
                  ) : null}
                  <a
                    href={`/api/orgs/${encodeURIComponent(org)}/repositories/${encodeURIComponent(repo)}/blob/${selectedFile}?branch=${encodeURIComponent(branch)}&raw=1`}
                    download={selectedFile.split('/').pop()}
                    aria-label={`Download raw file: ${selectedFile.split('/').pop()}`}
                    style={{
                      marginLeft: 'auto',
                      color: 'var(--accent)',
                      textDecoration: 'none',
                      fontSize: '0.6875rem',
                      border: '1px solid var(--accent)',
                      padding: '0.125rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-raised)',
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
                <p style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>
                  Loading file...
                </p>
              ) : fileError ? (
                <p style={{ padding: '1rem', color: 'var(--danger)', fontSize: '0.875rem' }}>
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
