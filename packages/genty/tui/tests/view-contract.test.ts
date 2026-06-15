import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { builtinPlugins, createContext, createRegistry, EventStream, loadPlugins } from '../src/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const expectedHotkeyViews = [
  { hotkey: '1', id: 'chat', title: 'Chat' },
  { hotkey: '2', id: 'sessions', title: 'Sessions' },
  { hotkey: '3', id: 'cost', title: 'Cost' },
  { hotkey: '4', id: 'adapters', title: 'Adapters' },
  { hotkey: '5', id: 'models', title: 'Models' },
  { hotkey: '6', id: 'profiles', title: 'Profiles' },
  { hotkey: '7', id: 'plugins', title: 'Plugins' },
  { hotkey: '8', id: 'kanban', title: 'Kanban' },
  { hotkey: '9', id: 'help', title: 'Help' },
  { hotkey: 'W', id: 'workspaces', title: 'Workspaces' },
  { hotkey: '0', id: 'mcp', title: 'MCP' },
  { hotkey: '-', id: 'doctor', title: 'Doctor' },
  { hotkey: 'l', id: 'logs', title: 'Logs' },
  { hotkey: 'A', id: 'auth', title: 'Auth' },
  { hotkey: 'C', id: 'config', title: 'Config' },
  { hotkey: 'K', id: 'skills', title: 'Skills' },
  { hotkey: 'G', id: 'agents', title: 'Agents' },
  { hotkey: 'H', id: 'hooks', title: 'Hooks' },
] as const;

const hotkeyOrder = new Map(expectedHotkeyViews.map((view, index) => [view.hotkey, index]));

function parseReadmeViewRows(readme: string) {
  const section = readme.match(/## View hotkeys\n\n((?:\|.*\n)+)/);
  expect(section).not.toBeNull();
  return (section?.[1] ?? '')
    .split('\n')
    .filter((line) => line.startsWith('| `'))
    .map((line) => {
      const cells = line.split('|').map((cell) => cell.trim());
      return {
        hotkey: cells[1]?.replace(/`/g, ''),
        id: cells[2],
      };
    });
}

function sortContractRows<T extends { hotkey: string }>(rows: T[]): T[] {
  return [...rows].sort((left, right) => (hotkeyOrder.get(left.hotkey) ?? Number.MAX_SAFE_INTEGER) - (hotkeyOrder.get(right.hotkey) ?? Number.MAX_SAFE_INTEGER));
}

describe('builtin TUI view contract', () => {
  it('registers the documented built-in view hotkeys and does not expose a runs view', async () => {
    const registry = createRegistry();
    const stream = new EventStream();
    const context = createContext({} as never, registry, () => {}, stream);

    await loadPlugins(builtinPlugins, context);

    const actualHotkeyViews = registry.views
      .filter((view) => view.hotkey)
      .map((view) => ({
        hotkey: view.hotkey ?? '',
        id: view.id,
        title: view.title,
      }));

    expect(sortContractRows(actualHotkeyViews)).toEqual(expectedHotkeyViews);
    expect(registry.views.some((view) => view.id === 'runs')).toBe(false);
    expect(registry.views.some((view) => view.id === 'kanban')).toBe(true);
    expect(registry.views.some((view) => view.id === 'workspaces')).toBe(true);
  });

  it('documents the same built-in view hotkeys in the package README', () => {
    const readmePath = path.resolve(__dirname, '..', 'README.md');
    const readme = fs.readFileSync(readmePath, 'utf8');
    const compact = readme.replace(/\s+/g, ' ');

    expect(sortContractRows(parseReadmeViewRows(readme))).toEqual(
      expectedHotkeyViews.map(({ hotkey, id }) => ({ hotkey, id })),
    );
    expect(readme).not.toContain('| `8` | runs');
    expect(compact).toContain('`N` agent picker');
    expect(compact).not.toContain('Global: `p` prompt');
    expect(compact).toContain('Inside `kanban`, press `w` to jump to the linked workspace');
  });
});
