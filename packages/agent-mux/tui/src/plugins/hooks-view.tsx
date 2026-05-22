import React, { useCallback, useEffect, useState } from 'react';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { Box, Text, useInput } from 'ink';
import { HookConfigManager } from '@a5c-ai/agent-mux-core';
import { definePlugin, type TuiViewProps } from '../plugin.js';

interface Row {
  id: string;
  hookType: string;
  handler: string;
  target?: string;
  enabled?: boolean;
  priority?: number;
  source?: 'amux' | 'claude' | 'codex' | 'cursor' | 'opencode' | 'gemini';
}

function readJson(p: string): unknown {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function discoverNativeHooks(): Row[] {
  const HOME = os.homedir() || '.';
  const out: Row[] = [];
  const claude = readJson(path.join(HOME, '.claude', 'settings.json')) as { hooks?: Record<string, Array<{ matcher?: string; hooks?: Array<{ type?: string; command?: string }> }>> } | null;
  if (claude?.hooks) {
    for (const [hookType, arr] of Object.entries(claude.hooks)) {
      for (const grp of arr ?? []) {
        for (const h of grp.hooks ?? []) {
          out.push({
            id: `claude:${hookType}:${grp.matcher ?? '*'}`,
            hookType,
            handler: h.type ?? 'command',
            target: h.command,
            source: 'claude',
          });
        }
      }
    }
  }
  return out;
}

const ADD_FIELDS = ['id', 'agent', 'hookType', 'handler', 'target'] as const;
type AddField = typeof ADD_FIELDS[number];

function HooksView({ active }: TuiViewProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [cursor, setCursor] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addField, setAddField] = useState<AddField | null>(null);
  const [addValues, setAddValues] = useState<Record<AddField, string>>({ id: '', agent: '*', hookType: '*', handler: 'command', target: '' });
  const [addInput, setAddInput] = useState('');

  const refresh = useCallback(async () => {
    try {
      const mgr = new HookConfigManager();
      const list = await mgr.list();
      const mapped: Row[] = list.map((h: { id: string; hookType: string; handler: string; target?: string; enabled?: boolean; priority?: number }) => ({
        id: h.id,
        hookType: h.hookType,
        handler: h.handler,
        target: h.target,
        enabled: h.enabled,
        priority: h.priority,
        source: 'amux' as const,
      }));
      const all = [...mapped, ...discoverNativeHooks()];
      setRows(all);
      setCursor((c) => Math.min(c, Math.max(all.length - 1, 0)));
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    refresh();
  }, [active, refresh]);

  const performAdd = useCallback(async (vals: Record<AddField, string>) => {
    try {
      if (!vals.id || !vals.target) { setStatus('id and target required'); return; }
      const handler = (vals.handler === 'builtin' || vals.handler === 'script') ? vals.handler : 'command';
      const mgr = new HookConfigManager();
      await mgr.add({
        id: vals.id,
        agent: vals.agent as never,
        hookType: vals.hookType,
        handler,
        target: vals.target,
      });
      setStatus(`Added ${vals.id}`);
      refresh();
    } catch (e) {
      setStatus(`Add failed: ${String(e)}`);
    }
  }, [refresh]);

  useInput((input, key) => {
    if (!active) return;
    if (addField) {
      if (key.escape) { setAddField(null); setStatus('Cancelled'); return; }
      if (key.return) {
        const next = { ...addValues, [addField]: addInput || addValues[addField] };
        setAddValues(next);
        const idx = ADD_FIELDS.indexOf(addField);
        if (idx < ADD_FIELDS.length - 1) {
          const nf = ADD_FIELDS[idx + 1]!;
          setAddField(nf);
          setAddInput('');
        } else {
          setAddField(null);
          setAddInput('');
          performAdd(next);
        }
        return;
      }
      if (key.backspace || key.delete) { setAddInput((s) => s.slice(0, -1)); return; }
      if (input && !key.ctrl && !key.meta) setAddInput((s) => s + input);
      return;
    }
    if (confirmDelete) {
      if (input === 'y' || input === 'Y') {
        const row = rows[cursor];
        if (row) {
          (async () => {
            try {
              const mgr = new HookConfigManager();
              await mgr.remove(row.id);
              setStatus(`Removed ${row.id}`);
              refresh();
            } catch (e) {
              setStatus(`Remove failed: ${String(e)}`);
            }
          })();
        }
        setConfirmDelete(false);
      } else if (input === 'n' || input === 'N' || key.escape) {
        setConfirmDelete(false);
        setStatus('Cancelled');
      }
      return;
    }
    if (key.downArrow || input === 'j') setCursor((c) => Math.min(c + 1, Math.max(rows.length - 1, 0)));
    else if (key.upArrow || input === 'k') setCursor((c) => Math.max(c - 1, 0));
    else if (input === 'r') refresh();
    else if (input === 'd' && rows[cursor]) setConfirmDelete(true);
    else if (input === 'a') { setAddField('id'); setAddInput(''); setAddValues({ id: '', agent: '*', hookType: '*', handler: 'command', target: '' }); }
  }, { isActive: active });

  if (error) return <Text color="red">{error}</Text>;
  return (
    <Box flexDirection="column">
      <Text bold>Hooks</Text>
      <Text dimColor>j/k: move · a: add · d: remove · r: refresh · (amux hooks &lt;agent&gt; &lt;discover|list|add|remove|set&gt;)</Text>
      {rows.length === 0 && !addField ? <Text dimColor>No hooks registered.</Text> : null}
      {rows.slice(0, 40).map((r, i) => {
        const sel = i === cursor;
        return (
          <Text key={r.id + ':' + i} color={sel ? 'green' : undefined}>
            {sel ? '> ' : '  '}
            <Text color={r.source === 'amux' ? 'magenta' : 'blue'}>[{(r.source ?? 'amux').padEnd(6)}]</Text>{' '}
            <Text color="cyan">{r.id.padEnd(20)}</Text>{' '}
            <Text>{r.hookType.padEnd(18)}</Text>{' '}
            <Text color="gray">{r.handler.padEnd(8)}</Text>{' '}
            {r.target ? <Text dimColor>{r.target}</Text> : null}
            {r.enabled === false ? <Text color="gray"> (disabled)</Text> : null}
          </Text>
        );
      })}
      {rows.length > 40 ? <Text dimColor>… {rows.length - 40} more</Text> : null}
      {addField ? (
        <Box flexDirection="column">
          <Text color="yellow">Add hook ({ADD_FIELDS.indexOf(addField) + 1}/{ADD_FIELDS.length}) — Enter to accept, Esc to cancel</Text>
          {ADD_FIELDS.map((f) => (
            <Text key={f} color={f === addField ? 'green' : undefined}>
              {f === addField ? '> ' : '  '}{f.padEnd(10)} {f === addField ? (addInput || addValues[f]) : addValues[f]}
              {f === addField ? <Text color="gray">_</Text> : null}
            </Text>
          ))}
        </Box>
      ) : null}
      {confirmDelete && rows[cursor] ? (
        <Text color="yellow">Remove hook {rows[cursor]!.id}? (y/n)</Text>
      ) : null}
      {status ? <Text dimColor>{status}</Text> : null}
    </Box>
  );
}

export default definePlugin({
  name: 'builtin:hooks-view',
  register(ctx) {
    ctx.registerView({
      id: 'hooks',
      title: 'Hooks',
      hotkey: 'H',
      component: HooksView,
    });
  },
});
