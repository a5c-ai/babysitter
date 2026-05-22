import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { CommandPalette } from '../src/command-palette.js';
import type { TuiCommand, TuiView } from '../src/plugin.js';

const views: TuiView[] = [
  { id: 'chat', title: 'Chat', hotkey: '1', component: () => null },
  { id: 'sessions', title: 'Sessions', hotkey: '2', component: () => null },
  { id: 'cost', title: 'Cost', hotkey: '3', component: () => null },
];
const cmds: TuiCommand[] = [
  { id: 'reload', label: 'Reload', hotkey: 'r', run: () => {} },
];
const flush = () => new Promise((r) => setTimeout(r, 10));

describe('CommandPalette', () => {
  it('lists views and commands; filters by typed query; Enter picks selection', async () => {
    const onPick = vi.fn();
    const onCancel = vi.fn();
    const { lastFrame, stdin, rerender } = render(
      <CommandPalette views={views} commands={cmds} onPick={onPick} onCancel={onCancel} />,
    );
    rerender(<CommandPalette views={views} commands={cmds} onPick={onPick} onCancel={onCancel} />);
    const initial = lastFrame() ?? '';
    expect(initial).toContain('Chat');
    expect(initial).toContain('Sessions');
    expect(initial).toContain('Reload');

    stdin.write('cost');
    await flush();
    rerender(<CommandPalette views={views} commands={cmds} onPick={onPick} onCancel={onCancel} />);
    const filtered = lastFrame() ?? '';
    expect(filtered).toContain('Cost');
    expect(filtered).not.toContain('Sessions');

    stdin.write('\r'); // Enter
    await flush();
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick.mock.calls[0]![0]!.id).toBe('view:cost');
  });

  it('matches ids and hotkeys in addition to labels', async () => {
    const onPick = vi.fn();
    const onCancel = vi.fn();
    const byHotkey = render(
      <CommandPalette views={views} commands={cmds} onPick={onPick} onCancel={onCancel} />,
    );
    byHotkey.rerender(<CommandPalette views={views} commands={cmds} onPick={onPick} onCancel={onCancel} />);
    byHotkey.stdin.write('view:sessions');
    await flush();
    byHotkey.rerender(<CommandPalette views={views} commands={cmds} onPick={onPick} onCancel={onCancel} />);
    expect(byHotkey.lastFrame() ?? '').toContain('Sessions');
    expect(byHotkey.lastFrame() ?? '').not.toContain('Cost');

    const byId = render(
      <CommandPalette views={views} commands={cmds} onPick={onPick} onCancel={onCancel} />,
    );
    byId.rerender(<CommandPalette views={views} commands={cmds} onPick={onPick} onCancel={onCancel} />);
    byId.stdin.write('hotkey r');
    await flush();
    byId.rerender(<CommandPalette views={views} commands={cmds} onPick={onPick} onCancel={onCancel} />);
    expect(byId.lastFrame() ?? '').toContain('Reload');
    expect(byId.lastFrame() ?? '').not.toContain('Chat');
  });

  it('Esc cancels', async () => {
    const onPick = vi.fn();
    const onCancel = vi.fn();
    const { stdin, rerender } = render(
      <CommandPalette views={views} commands={cmds} onPick={onPick} onCancel={onCancel} />,
    );
    rerender(<CommandPalette views={views} commands={cmds} onPick={onPick} onCancel={onCancel} />);
    await flush();
    stdin.write('\u001B'); // Esc
    await new Promise((r) => setTimeout(r, 50));
    expect(onCancel).toHaveBeenCalled();
  });

  it('truncates and caps visible actions for narrow overlays', async () => {
    const onPick = vi.fn();
    const onCancel = vi.fn();
    const { lastFrame, rerender } = render(
      <CommandPalette
        views={views}
        commands={cmds}
        onPick={onPick}
        onCancel={onCancel}
        width={24}
        maxItems={2}
      />,
    );
    rerender(
      <CommandPalette
        views={views}
        commands={cmds}
        onPick={onPick}
        onCancel={onCancel}
        width={24}
        maxItems={2}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('… 2 more');
    expect(frame).toContain('view: Sessions');
  });
});
