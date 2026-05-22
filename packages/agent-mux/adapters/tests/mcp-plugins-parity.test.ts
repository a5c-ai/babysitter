import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs/promises';

import { CursorAdapter } from '../src/cursor-adapter.js';
import { GeminiAdapter } from '../src/gemini-adapter.js';
import { OpenCodeAdapter } from '../src/opencode-adapter.js';
import { OpenCodeHttpAdapter } from '../src/opencode-http-adapter.js';
import { OpenClawAdapter } from '../src/openclaw-adapter.js';
import { QwenAdapter } from '../src/qwen-adapter.js';

const cases = [
  { name: 'cursor', make: () => new CursorAdapter() },
  { name: 'gemini', make: () => new GeminiAdapter() },
  { name: 'opencode', make: () => new OpenCodeAdapter() },
  { name: 'opencode-http', make: () => new OpenCodeHttpAdapter() },
  { name: 'openclaw', make: () => new OpenClawAdapter() },
  { name: 'qwen', make: () => new QwenAdapter() },
] as const;

describe.each(cases)('$name adapter MCP plugin parity', ({ make }) => {
  let home: string;
  const prevHome = process.env['HOME'];
  const prevUserProfile = process.env['USERPROFILE'];

  beforeEach(async () => {
    home = await fs.mkdtemp(path.join(os.tmpdir(), 'amux-mcp-parity-'));
    process.env['HOME'] = home;
    process.env['USERPROFILE'] = home;
  });

  afterEach(() => {
    process.env['HOME'] = prevHome;
    process.env['USERPROFILE'] = prevUserProfile;
  });

  it('advertises supportsPlugins with mcp-server format', () => {
    const a = make();
    expect(a.capabilities.supportsPlugins).toBe(true);
    expect(a.capabilities.pluginFormats).toContain('mcp-server');
  });

  it('listPlugins returns [] when no config exists', async () => {
    const a = make();
    expect(await a.listPlugins!()).toEqual([]);
  });

  it('install → list → uninstall round-trip', async () => {
    const a = make();
    const inst = await a.installPlugin!('sample');
    expect(inst.pluginId).toBe('sample');
    const listed = await a.listPlugins!();
    expect(listed.map((p) => p.pluginId)).toContain('sample');
    await a.uninstallPlugin!('sample');
    const after = await a.listPlugins!();
    expect(after.map((p) => p.pluginId)).not.toContain('sample');
  });

  it('preserves other plugins when uninstalling one', async () => {
    const a = make();
    await a.installPlugin!('keep');
    await a.installPlugin!('drop');
    await a.uninstallPlugin!('drop');
    const list = await a.listPlugins!();
    expect(list.map((p) => p.pluginId).sort()).toEqual(['keep']);
  });
});
