import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs/promises';
import { ClaudeAdapter } from '../src/claude-adapter.js';

describe('ClaudeAdapter plugin methods (MCP servers in ~/.claude/settings.json)', () => {
  let home: string;
  const prevHome = process.env['HOME'];
  const prevUserProfile = process.env['USERPROFILE'];

  beforeEach(async () => {
    home = await fs.mkdtemp(path.join(os.tmpdir(), 'amux-claude-plugins-'));
    process.env['HOME'] = home;
    process.env['USERPROFILE'] = home;
  });

  afterEach(() => {
    process.env['HOME'] = prevHome;
    process.env['USERPROFILE'] = prevUserProfile;
  });

  it('claims supportsPlugins: true', () => {
    expect(new ClaudeAdapter().capabilities.supportsPlugins).toBe(true);
  });

  it('listPlugins returns [] when no settings file exists', async () => {
    const a = new ClaudeAdapter();
    expect(await a.listPlugins!()).toEqual([]);
  });

  it('installPlugin writes mcpServers[pluginId] and list reflects it', async () => {
    const a = new ClaudeAdapter();
    const installed = await a.installPlugin!('tokenscope');
    expect(installed.pluginId).toBe('tokenscope');
    expect(installed.enabled).toBe(true);

    const doc = JSON.parse(
      await fs.readFile(path.join(home, '.claude', 'settings.json'), 'utf8'),
    );
    expect(doc.mcpServers.tokenscope.command).toBe('tokenscope');

    const list = await a.listPlugins!();
    expect(list.map((p) => p.pluginId)).toEqual(['tokenscope']);
  });

  it('uninstallPlugin removes only the target and preserves others', async () => {
    const a = new ClaudeAdapter();
    await a.installPlugin!('a');
    await a.installPlugin!('b');
    await a.uninstallPlugin!('a');
    const list = await a.listPlugins!();
    expect(list.map((p) => p.pluginId)).toEqual(['b']);
  });

  it('uninstallPlugin is a no-op when plugin missing', async () => {
    const a = new ClaudeAdapter();
    await a.installPlugin!('keep');
    await a.uninstallPlugin!('nope');
    const list = await a.listPlugins!();
    expect(list.map((p) => p.pluginId)).toEqual(['keep']);
  });

  it('preserves other top-level settings keys on install/uninstall', async () => {
    const settingsPath = path.join(home, '.claude', 'settings.json');
    await fs.mkdir(path.dirname(settingsPath), { recursive: true });
    await fs.writeFile(
      settingsPath,
      JSON.stringify({ theme: 'dark', mcpServers: { existing: { command: 'x' } } }, null, 2),
    );
    const a = new ClaudeAdapter();
    await a.installPlugin!('added');
    const doc = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
    expect(doc.theme).toBe('dark');
    expect(Object.keys(doc.mcpServers).sort()).toEqual(['added', 'existing']);
  });
});
