/**
 * Web IDE overlay (SPEC-V4 §V4-11): full-screen cogitator plate over the
 * board — LEFT explorer (the §V4-8 tree, collapsible dirs, A/M/D badges),
 * CENTER multi-tab editor (tabs `ide-tab-<sanitized-path>` with close
 * buttons + dirty dots). Editor = layered architecture: a tokenized
 * highlight layer (pre/code spans, game/syntax.ts) UNDER a transparent
 * textarea (caret via caret-color), engraved line-number gutter and a
 * tinted caret line (class without the substring 'current').
 *
 * Ghost completion (§V4-11): ~400ms idle with the caret at a line end asks
 * the mock microagent `suggestCompletion` and renders dim italic inline
 * ghost text (`ide-ghost`); Tab accepts (buffer + writeFile), Esc dismisses
 * the ghost FIRST — a ghost-less Esc cascades (closes the IDE; the review
 * panel beneath survives, store cascade §V4-13).
 *
 * Edits are session-local: `orders.writeFile` runs on ghost accept and on
 * tab switch/close so dirty badges + diff plates update.
 */

import { useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import clsx from 'clsx';

import type { CommanderStore, Orders } from '../../game/store';
import type { SimViews } from '../../game/views';
import type { SimFileTreeNode } from '../../backend/mock/simulation';
import {
  acceptGhost,
  caretInfo,
  escapeGhost,
  IDE_CAP_NOTICE,
  IDE_RENDER_LINE_CAP,
  sanitizeTabId,
  type GhostState,
} from '../../game/ideView';
import { languageOf, tokenizeLine } from '../../game/syntax';
import { mockMicroagent } from '../../microagent/mock/commandGen';

export interface IdeOverlayProps {
  store: CommanderStore;
  orders: Orders;
  views: SimViews;
}

const GHOST_IDLE_MS = 400;
const HIGHLIGHT_DEBOUNCE_MS = 80;

// ---------------------------------------------------------------------------
// Explorer (left rail)
// ---------------------------------------------------------------------------

function ExplorerNode({
  node,
  depth,
  changed,
  collapsed,
  onToggleDir,
  onOpenFile,
  activePath,
}: {
  node: SimFileTreeNode;
  depth: number;
  changed: ReadonlyMap<string, 'A' | 'M' | 'D'>;
  collapsed: ReadonlySet<string>;
  onToggleDir: (path: string) => void;
  onOpenFile: (path: string) => void;
  activePath: string | null;
}): React.JSX.Element {
  const pad = { paddingLeft: `${8 + depth * 14}px` };
  if (node.type === 'dir') {
    const open = !collapsed.has(node.path);
    return (
      <>
        <div
          className="wr-ide-entry wr-ide-entry--dir"
          style={pad}
          role="treeitem"
          aria-expanded={open}
          onClick={() => onToggleDir(node.path)}
        >
          <span className="wr-ide-disclosure" aria-hidden>
            {open ? '▾' : '▸'}
          </span>
          <span className="wr-ide-entry-dirname">{node.name}/</span>
        </div>
        {open &&
          (node.children ?? []).map((child) => (
            <ExplorerNode
              key={child.path}
              node={child}
              depth={depth + 1}
              changed={changed}
              collapsed={collapsed}
              onToggleDir={onToggleDir}
              onOpenFile={onOpenFile}
              activePath={activePath}
            />
          ))}
      </>
    );
  }
  const status = changed.get(node.path);
  return (
    <div
      className={clsx('wr-ide-entry wr-ide-entry--file', activePath === node.path && 'is-open')}
      style={pad}
      role="treeitem"
      onClick={() => onOpenFile(node.path)}
    >
      <span className="wr-ide-entry-name">{node.name}</span>
      {status !== undefined && (
        <span className={`wr-ide-badge wr-ide-badge--${status.toLowerCase()}`}>{status}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// IDE overlay shell
// ---------------------------------------------------------------------------

export function IdeOverlay({ store, orders, views }: IdeOverlayProps): React.JSX.Element | null {
  const taskId = useStore(store, (s) => s.meta.ideTaskId);
  // Sim views (tree + changed files) refresh per committed tick.
  useStore(store, (s) => s.meta.tickIndex);

  const [tabs, setTabs] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [buffers, setBuffers] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const [ghost, setGhost] = useState<GhostState | null>(null);
  const [caret, setCaret] = useState(0);
  const [hlText, setHlText] = useState('');

  const idleTimer = useRef<number | null>(null);
  const hlTimer = useRef<number | null>(null);
  const bufferRef = useRef<HTMLTextAreaElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const pendingCaret = useRef<number | null>(null);

  // Fresh card (or reopen) → fresh session state. v4-r0: default-open the
  // card's first changed file, preferring a .ts/.tsx so the token-span
  // highlighting shows immediately (§V4-11 polish).
  useEffect(() => {
    setTabs([]);
    setActive(null);
    setBuffers({});
    setDirty({});
    setCollapsed(new Set());
    setGhost(null);
    setCaret(0);
    setHlText('');
    if (taskId === null) return;
    const files = views.getWorkspaceView(taskId)?.files ?? [];
    const preferred =
      files.find((f) => /\.tsx?$/.test(f.path) && f.status !== 'D') ??
      files.find((f) => f.status !== 'D');
    if (preferred === undefined) return;
    const content = views.getFileContent(taskId, preferred.path) ?? '';
    setTabs([preferred.path]);
    setActive(preferred.path);
    setBuffers({ [preferred.path]: content });
    setHlText(content);
  }, [taskId, views]);

  // Debounced re-highlight (~80ms) of the active buffer.
  const activeText = active !== null ? (buffers[active] ?? '') : '';
  useEffect(() => {
    if (hlTimer.current !== null) window.clearTimeout(hlTimer.current);
    hlTimer.current = window.setTimeout(() => setHlText(activeText), HIGHLIGHT_DEBOUNCE_MS);
    return () => {
      if (hlTimer.current !== null) window.clearTimeout(hlTimer.current);
    };
  }, [activeText]);

  // Restore the caret after programmatic buffer splices (ghost accept).
  useEffect(() => {
    if (pendingCaret.current !== null && bufferRef.current !== null) {
      bufferRef.current.setSelectionRange(pendingCaret.current, pendingCaret.current);
      pendingCaret.current = null;
    }
  });

  useEffect(
    () => () => {
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    },
    [],
  );

  if (taskId === null) return null;

  const tree = views.getWorkspaceTree(taskId);
  const ws = views.getWorkspaceView(taskId);
  const changed = new Map<string, 'A' | 'M' | 'D'>();
  for (const file of ws?.files ?? []) changed.set(file.path, file.status);

  const saveBuffer = (path: string | null): void => {
    if (path === null || dirty[path] !== true) return;
    orders.writeFile(taskId, path, buffers[path] ?? '');
  };

  const openFile = (path: string): void => {
    setGhost(null);
    if (active !== null && active !== path) saveBuffer(active);
    setBuffers((prev) =>
      prev[path] !== undefined
        ? prev
        : { ...prev, [path]: views.getFileContent(taskId, path) ?? '' },
    );
    setTabs((prev) => (prev.includes(path) ? prev : [...prev, path]));
    setActive(path);
    setHlText(buffers[path] ?? views.getFileContent(taskId, path) ?? '');
    setCaret(0);
  };

  const closeTab = (path: string): void => {
    saveBuffer(path);
    setGhost(null);
    setTabs((prev) => {
      const next = prev.filter((p) => p !== path);
      if (active === path) {
        const fallback = next[next.length - 1] ?? null;
        setActive(fallback);
        setHlText(fallback !== null ? (buffers[fallback] ?? '') : '');
      }
      return next;
    });
  };

  const scheduleGhost = (text: string, caretAt: number, path: string): void => {
    if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      const info = caretInfo(text, caretAt);
      if (!info.atLineEnd || info.lineText.trim() === '') return;
      const suggestion = mockMicroagent.suggestCompletion({
        path,
        lineText: info.lineText,
        lineIndex: info.lineIndex,
      });
      if (suggestion !== '') {
        setGhost({ path, lineIndex: info.lineIndex, text: suggestion });
      }
    }, GHOST_IDLE_MS);
  };

  const onBufferChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    if (active === null) return;
    const text = e.target.value;
    const at = e.target.selectionStart;
    setBuffers((prev) => ({ ...prev, [active]: text }));
    setDirty((prev) => (prev[active] === true ? prev : { ...prev, [active]: true }));
    setCaret(at);
    setGhost(null);
    scheduleGhost(text, at, active);
  };

  const onBufferKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (active === null) return;
    if (e.key === 'Tab' && ghost !== null && ghost.path === active) {
      e.preventDefault();
      const accepted = acceptGhost(buffers[active] ?? '', e.currentTarget.selectionStart, ghost);
      setBuffers((prev) => ({ ...prev, [active]: accepted.text }));
      setDirty((prev) => ({ ...prev, [active]: true }));
      setGhost(null);
      pendingCaret.current = accepted.caret;
      setCaret(accepted.caret);
      // Explicit-accept save boundary: diffs + dirty badges update (§V4-11).
      orders.writeFile(taskId, active, accepted.text);
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      const next = escapeGhost(ghost);
      setGhost(next.ghost);
      if (next.cascade) {
        saveBuffer(active);
        store.getState().escape(); // ide sits at the top of the cascade
      }
      return;
    }
    if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
  };

  const onBufferSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>): void => {
    setCaret(e.currentTarget.selectionStart);
  };

  const syncScroll = (e: React.UIEvent<HTMLTextAreaElement>): void => {
    const el = e.currentTarget;
    const backdrop = backdropRef.current;
    if (backdrop !== null) {
      backdrop.style.transform = `translate(${-el.scrollLeft}px, ${-el.scrollTop}px)`;
    }
  };

  const lang = active !== null ? languageOf(active) : 'plain';
  const caretLine = caretInfo(activeText, caret).lineIndex;
  const allLines = hlText.split('\n');
  const capped = allLines.length > IDE_RENDER_LINE_CAP;
  const lines = capped ? allLines.slice(0, IDE_RENDER_LINE_CAP) : allLines;

  return (
    <div className="wr-ide" data-testid="ide-overlay" role="dialog" aria-label="Web IDE">
      <header className="wr-ide-head">
        <span className="wr-ide-title">COGITATOR LENS — {taskId}</span>
        <span className="wr-ide-sub">{ws?.gitStatus.branch ?? ''}</span>
        <button
          type="button"
          className="wr-inspector-close"
          aria-label="Close IDE"
          onClick={() => {
            saveBuffer(active);
            store.getState().closeIde();
          }}
        >
          CLOSE
        </button>
      </header>
      <div className="wr-ide-body">
        <nav className="wr-ide-explorer" data-testid="ide-explorer" role="tree" aria-label="Workspace explorer">
          {tree === null && <div className="wr-ide-empty">the workspace shrine is dark</div>}
          {tree !== null &&
            (tree.children ?? []).map((node) => (
              <ExplorerNode
                key={node.path}
                node={node}
                depth={0}
                changed={changed}
                collapsed={collapsed}
                onToggleDir={(path) =>
                  setCollapsed((prev) => {
                    const next = new Set(prev);
                    if (next.has(path)) next.delete(path);
                    else next.add(path);
                    return next;
                  })
                }
                onOpenFile={openFile}
                activePath={active}
              />
            ))}
        </nav>
        <section className="wr-ide-center">
          <div className="wr-ide-tabbar" role="tablist">
            {tabs.map((path) => (
              <span
                key={path}
                data-testid={`ide-tab-${sanitizeTabId(path)}`}
                role="tab"
                aria-selected={path === active}
                className={clsx(
                  'wr-ide-tab',
                  path === active && 'is-active',
                  dirty[path] === true && 'is-dirty',
                )}
                onClick={() => {
                  if (path !== active) openFile(path);
                }}
              >
                <span className="wr-ide-tab-name">{path.split('/').pop()}</span>
                {dirty[path] === true && <span className="wr-ide-dirty-dot" aria-label="unsaved edits" />}
                <button
                  type="button"
                  className="wr-ide-tab-close"
                  aria-label={`Close ${path}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(path);
                  }}
                >
                  ×
                </button>
              </span>
            ))}
            {tabs.length === 0 && <span className="wr-ide-tabbar-empty">choose a scroll from the gallery</span>}
          </div>
          {active !== null ? (
            <div className="wr-ide-editor">
              <div className="wr-ide-backdrop" ref={backdropRef} aria-hidden>
                <div className="wr-ide-gutter">
                  {lines.map((_, i) => (
                    <div key={i} className={clsx('wr-ide-lineno', i === caretLine && 'is-lit')}>
                      {i + 1}
                    </div>
                  ))}
                </div>
                <pre className="wr-ide-highlight">
                  <code>
                    {lines.map((line, i) => (
                      <div key={i} className={clsx('wr-ide-line', i === caretLine && 'is-lit')}>
                        {tokenizeLine(line, lang).map((token, t) =>
                          token.cls === 'plain' ? (
                            <span key={t}>{token.text}</span>
                          ) : (
                            <span key={t} className={`tok-${token.cls}`}>
                              {token.text}
                            </span>
                          ),
                        )}
                        {ghost !== null && ghost.path === active && ghost.lineIndex === i && (
                          <span className="wr-ide-ghost" data-testid="ide-ghost">
                            {ghost.text}
                          </span>
                        )}
                        {line.length === 0 ? '​' : ''}
                      </div>
                    ))}
                    {capped && <div className="wr-ide-cap-notice">{IDE_CAP_NOTICE}</div>}
                  </code>
                </pre>
              </div>
              <textarea
                ref={bufferRef}
                className="wr-ide-buffer"
                value={activeText}
                wrap="off"
                spellCheck={false}
                autoComplete="off"
                aria-label={`Editor buffer for ${active}`}
                onChange={onBufferChange}
                onKeyDown={onBufferKeyDown}
                onSelect={onBufferSelect}
                onClick={onBufferSelect}
                onKeyUp={onBufferSelect}
                onScroll={syncScroll}
              />
            </div>
          ) : (
            <div className="wr-ide-editor wr-ide-editor--empty">
              <div className="wr-ide-empty">the lens awaits a scroll — open a file from the explorer</div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
