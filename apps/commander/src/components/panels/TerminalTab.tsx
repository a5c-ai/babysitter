/**
 * Cogitator terminal plate (SPEC-V4 §V4-7): the Inspector's Terminal tab —
 * dark slate, amber mono text, block cursor — bound to one card's
 * workspace. The shell itself is the pure command table in
 * game/cogitatorShell.ts; this component only owns the scrollback, the
 * input line and ArrowUp/ArrowDown history.
 */

import { useEffect, useRef, useState } from 'react';

import { runShellCommand, stepHistory, type ShellSources } from '../../game/cogitatorShell';
import type { SimViews } from '../../game/views';

export interface TerminalTabProps {
  taskId: string | null;
  workspaceId: string;
  views: SimViews;
}

const BANNER = [
  'AEGIS COGITATOR — remote shell consecrated',
  'speak `help` for the litany of incantations',
];

interface ScrollbackLine {
  id: number;
  kind: 'echo' | 'out';
  text: string;
}

export function TerminalTab({ taskId, workspaceId, views }: TerminalTabProps): React.JSX.Element {
  const [lines, setLines] = useState<ScrollbackLine[]>(() =>
    BANNER.map((text, i) => ({ id: i, kind: 'out', text })),
  );
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const seqRef = useRef(BANNER.length);
  const outputRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Fresh card → fresh slate (scrollback + history are per-session).
  useEffect(() => {
    setLines(BANNER.map((text, i) => ({ id: i, kind: 'out', text })));
    setValue('');
    setHistory([]);
    setHistoryIndex(-1);
    seqRef.current = BANNER.length;
  }, [taskId]);

  useEffect(() => {
    const el = outputRef.current;
    if (el !== null) el.scrollTop = el.scrollHeight;
  }, [lines]);

  if (taskId === null) {
    return (
      <div className="wr-inspector-body wr-tab-empty">
        no workspace — the terminal has nothing to consecrate
      </div>
    );
  }

  const prompt = `cogitator:${workspaceId || taskId}$`;

  const submit = (): void => {
    const command = value;
    const sources: ShellSources = {
      taskId,
      workspaceId,
      getWorkspaceTree: (id) => views.getWorkspaceTree(id),
      getFileContent: (id, path) => views.getFileContent(id, path),
      getGitLog: (id) => views.getGitLog(id),
      getWorkspaceView: (id) => views.getWorkspaceView(id),
    };
    const result = runShellCommand(command, sources);
    setLines((prev) => {
      if (result.clear) return [];
      const next = [...prev, { id: (seqRef.current += 1), kind: 'echo' as const, text: `${prompt} ${command}` }];
      for (const text of result.lines) {
        next.push({ id: (seqRef.current += 1), kind: 'out', text });
      }
      return next;
    });
    if (command.trim() !== '') {
      setHistory((prev) => [...prev, command]);
    }
    setHistoryIndex(-1);
    setValue('');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
      return;
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const stepped = stepHistory(history, historyIndex, e.key === 'ArrowUp' ? -1 : 1);
      setHistoryIndex(stepped.index);
      setValue(stepped.text);
    }
  };

  return (
    <div className="wr-inspector-body wr-terminal" onClick={() => inputRef.current?.focus()}>
      <div className="wr-terminal-output" data-testid="terminal-output" ref={outputRef}>
        {lines.map((line) => (
          <div key={line.id} className={`wr-terminal-line wr-terminal-line--${line.kind}`}>
            {line.text}
          </div>
        ))}
      </div>
      <div className="wr-terminal-inputrow">
        <span className="wr-terminal-prompt" aria-hidden>
          {prompt}
        </span>
        <input
          ref={inputRef}
          data-testid="terminal-input"
          className="wr-terminal-input"
          type="text"
          value={value}
          spellCheck={false}
          autoComplete="off"
          aria-label="Cogitator terminal input"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <span className="wr-terminal-cursor" aria-hidden />
      </div>
    </div>
  );
}
