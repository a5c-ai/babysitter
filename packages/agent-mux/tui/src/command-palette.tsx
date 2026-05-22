import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { TuiCommand, TuiView } from './plugin.js';
import { truncateEnd } from './layout.js';

export interface PaletteAction {
  id: string;
  label: string;
  hint?: string;
  run(): void | Promise<void>;
}

export interface CommandPaletteProps {
  views: TuiView[];
  commands: TuiCommand[];
  onPick(action: PaletteAction): void;
  onCancel(): void;
  width?: number;
  maxItems?: number;
}

function buildActions(views: TuiView[], commands: TuiCommand[]): PaletteAction[] {
  const actions: PaletteAction[] = [];
  for (const v of views) {
    actions.push({
      id: 'view:' + v.id,
      label: 'view: ' + v.title,
      hint: [v.id, v.hotkey ? `hotkey ${v.hotkey}` : null].filter(Boolean).join(' · '),
      run: () => {},
    });
  }
  for (const c of commands) {
    actions.push({
      id: 'cmd:' + c.id,
      label: 'cmd: ' + c.label,
      hint: [c.id, `hotkey ${c.hotkey}`].join(' · '),
      run: () => {},
    });
  }
  return actions;
}

export function CommandPalette({
  views,
  commands,
  onPick,
  onCancel,
  width = 80,
  maxItems = 8,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const all = buildActions(views, commands);
  const filtered = query
    ? all.filter((a) =>
        [a.id, a.label, a.hint ?? '']
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : all;
  const visible = filtered.slice(0, Math.max(1, maxItems));
  const rowWidth = Math.max(12, width - 6);

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }
    if (key.return) {
      const pick = filtered[cursor];
      if (pick) onPick(pick);
      return;
    }
    if (key.downArrow) {
      setCursor((c) => Math.min(c + 1, Math.max(filtered.length - 1, 0)));
      return;
    }
    if (key.upArrow) {
      setCursor((c) => Math.max(c - 1, 0));
      return;
    }
    if (key.backspace || key.delete) {
      setQuery((q) => q.slice(0, -1));
      setCursor(0);
      return;
    }
    if (input && !key.ctrl && !key.meta) {
      setQuery((q) => q + input);
      setCursor(0);
    }
  });

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      <Box>
        <Text color="cyan">: </Text>
        <Text>{query}</Text>
        <Text color="cyan">▌</Text>
      </Box>
      {filtered.length === 0 ? (
        <Text dimColor>(no matches)</Text>
      ) : (
        visible.map((a, i) => {
          const sel = i === cursor;
          const label = truncateEnd(
            a.hint ? `${a.label} ${a.hint}` : a.label,
            rowWidth,
          );
          return (
            <Text key={a.id} color={sel ? 'green' : undefined}>
              {sel ? '> ' : '  '}
              {label}
            </Text>
          );
        })
      )}
      {filtered.length > visible.length ? (
        <Text dimColor>… {filtered.length - visible.length} more</Text>
      ) : null}
    </Box>
  );
}
