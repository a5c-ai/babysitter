/**
 * Integration tests: real-filesystem behaviour of
 * listSessionFiles / parseSessionFile / readConfig / writeConfig
 * across a representative set of adapters, using temp dirs.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { ClaudeAdapter, CodexAdapter, HermesAdapter } from '../src/index.js';

async function mkTmp(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

function redirectAdapter(
  adapter: { sessionDir: () => string; configSchema: { configFilePaths?: string[] } },
  sessionDirPath: string,
  configFilePath: string,
): void {
  Object.defineProperty(adapter, 'sessionDir', {
    value: () => sessionDirPath,
    configurable: true,
  });
  Object.defineProperty(adapter, 'configSchema', {
    value: {
      ...adapter.configSchema,
      configFilePaths: [configFilePath],
    },
    configurable: true,
  });
}

describe('adapter real-FS integration', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkTmp('amx-int-');
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('claude: listSessionFiles picks up .jsonl, parseSessionFile parses messages', async () => {
    const sessDir = path.join(dir, 'projects');
    const cfgPath = path.join(dir, 'claude-settings.json');
    await fs.mkdir(sessDir, { recursive: true });
    const sessFile = path.join(sessDir, 'sess-xyz.jsonl');
    await fs.writeFile(
      sessFile,
      [
        '{"role":"user","content":"hello"}',
        '{"role":"assistant","content":"hi back"}',
      ].join('\n'),
    );

    const adapter = new ClaudeAdapter();
    redirectAdapter(adapter, sessDir, cfgPath);

    const files = await adapter.listSessionFiles();
    expect(files.length).toBe(1);
    expect(files[0]!.endsWith('sess-xyz.jsonl')).toBe(true);

    const session = await adapter.parseSessionFile(files[0]!);
    expect(session.sessionId).toBe('sess-xyz');
    expect(session.agent).toBe('claude');
    expect(session.turnCount).toBe(1);
    expect(session.messages?.length).toBe(2);
  });

  it('codex: readConfig/writeConfig JSON roundtrip', async () => {
    const cfgPath = path.join(dir, 'codex-config.json');
    const adapter = new CodexAdapter();
    redirectAdapter(adapter, path.join(dir, 'codex-sess'), cfgPath);

    // Empty initial read
    const initial = await adapter.readConfig();
    expect(initial.agent).toBe('codex');

    await adapter.writeConfig({ model: 'o4', temperature: 0.3 });
    const round = await adapter.readConfig();
    expect(round['model']).toBe('o4');
    expect(round['temperature']).toBe(0.3);

    // Overlay preserves existing keys
    await adapter.writeConfig({ maxTokens: 5000 });
    const merged = await adapter.readConfig();
    expect(merged['model']).toBe('o4');
    expect(merged['maxTokens']).toBe(5000);
  });

  it('hermes: readConfig/writeConfig YAML roundtrip', async () => {
    const cfgPath = path.join(dir, 'hermes-cli.yaml');
    const adapter = new HermesAdapter();
    redirectAdapter(adapter, path.join(dir, 'hermes-sess'), cfgPath);

    await adapter.writeConfig({ model: 'hermes-405b', temperature: 0.7 });
    const text = await fs.readFile(cfgPath, 'utf8');
    expect(text).toContain('model:');
    expect(text).toContain('hermes-405b');

    const round = await adapter.readConfig();
    expect(round['model']).toBe('hermes-405b');
    expect(round['temperature']).toBe(0.7);
  });

  it('codex: listSessionFiles returns [] when dir missing', async () => {
    const adapter = new CodexAdapter();
    redirectAdapter(adapter, path.join(dir, 'does', 'not', 'exist'), path.join(dir, 'c.json'));
    expect(await adapter.listSessionFiles()).toEqual([]);
  });
});
