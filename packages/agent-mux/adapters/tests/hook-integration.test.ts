import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs/promises';
import {
  HookConfigManager,
  HookDispatcher,
  BuiltInHooksRegistry,
  parseHookPayload,
  formatHookResult,
} from '@a5c-ai/agent-mux-core';
import { HOOK_PAYLOAD_FIXTURES } from '../../harness-mock/src/scenarios/hooks.js';
import { ClaudeAdapter } from '../src/claude-adapter.js';
import { CodexAdapter } from '../src/codex-adapter.js';
import { GeminiAdapter } from '../src/gemini-adapter.js';
import { CopilotAdapter } from '../src/copilot-adapter.js';
import { CursorAdapter } from '../src/cursor-adapter.js';
import { OpenCodeAdapter } from '../src/opencode-adapter.js';
import { PiAdapter } from '../src/pi-adapter.js';
import { OmpAdapter } from '../src/omp-adapter.js';
import { OpenClawAdapter } from '../src/openclaw-adapter.js';
import { HermesAdapter } from '../src/hermes-adapter.js';

describe('hook fixtures → dispatcher → formatter', () => {
  it('parses and dispatches every fixture without throwing', async () => {
    const logFile = path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'amux-hooks-fx-')), 'log.jsonl');
    const builtins = new BuiltInHooksRegistry(logFile);
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'amux-hooks-cfg-'));
    const mgr = new HookConfigManager(path.join(dir, 'g.json'), path.join(dir, 'p.json'));
    await mgr.add({
      id: 'catchall',
      agent: '*',
      hookType: '*',
      handler: 'builtin',
      target: 'log',
    });
    const dispatcher = new HookDispatcher(mgr, builtins);

    for (const fx of HOOK_PAYLOAD_FIXTURES) {
      const p = parseHookPayload(fx.agent, fx.hookType, fx.payload);
      expect(p.sessionId).toBeDefined();
      const result = await dispatcher.dispatch(p);
      expect(result.decision).toBe('allow');
      const fmt = formatHookResult(fx.agent, fx.hookType, result);
      expect(fmt.exitCode).toBe(0);
    }

    const logContents = await fs.readFile(logFile, 'utf8');
    const lines = logContents.trim().split('\n');
    expect(lines.length).toBe(HOOK_PAYLOAD_FIXTURES.length);
  });
});

describe('ClaudeAdapter.installHook writes ~/.claude/settings.json', () => {
  let home: string;
  const prevHome = process.env['HOME'];
  const prevUserProfile = process.env['USERPROFILE'];
  const prevCwd = process.cwd();

  beforeEach(async () => {
    home = await fs.mkdtemp(path.join(os.tmpdir(), 'amux-claude-hook-'));
    process.env['HOME'] = home;
    process.env['USERPROFILE'] = home;
    process.chdir(home);
  });

  afterEach(() => {
    process.chdir(prevCwd);
    process.env['HOME'] = prevHome;
    process.env['USERPROFILE'] = prevUserProfile;
  });

  it('appends a hook entry under settings.hooks[hookType]', async () => {
    const adapter = new ClaudeAdapter();
    const id = 'test-hook-1';
    await adapter.installHook('PreToolUse', 'amux hooks claude handle PreToolUse', { id });
    const raw = await fs.readFile(path.join(home, '.claude', 'settings.json'), 'utf8');
    const doc = JSON.parse(raw);
    expect(doc.hooks.PreToolUse).toBeDefined();
    expect(doc.hooks.PreToolUse[0].hooks[0].command).toMatch(/amux hooks claude handle/);
  });

  it('CodexAdapter writes ~/.codex/config.json hooks[hookType]', async () => {
    const adapter = new CodexAdapter();
    await adapter.installHook('OnStop', 'amux hooks codex handle OnStop', { id: 'c-1' });
    const doc = JSON.parse(
      await fs.readFile(path.join(home, '.codex', 'config.json'), 'utf8'),
    );
    expect(doc.hooks.OnStop).toBeDefined();
    expect(doc.hooks.OnStop[0].command).toMatch(/amux hooks codex handle/);
  });

  it.each([
    ['gemini', GeminiAdapter, path.join('.config', 'gemini', 'settings.json')],
    ['copilot', CopilotAdapter, path.join('.config', 'github-copilot', 'settings.json')],
    ['cursor', CursorAdapter, path.join('.cursor', 'settings.json')],
    ['opencode', OpenCodeAdapter, path.join('.config', 'opencode', 'opencode.json')],
    ['pi', PiAdapter, path.join('.pi', 'agent', 'settings.json')],
    ['omp', OmpAdapter, path.join('.omp', 'agent', 'settings.json')],
    ['openclaw', OpenClawAdapter, path.join('.openclaw', 'config.json')],
  ] as const)('%s adapter writes hooks[hookType] to native JSON config', async (_name, Ctor, relPath) => {
    const adapter = new Ctor();
    await adapter.installHook!('test-hook', 'amux handle', { id: `${_name}-1` });
    const doc = JSON.parse(await fs.readFile(path.join(home, relPath), 'utf8'));
    expect(Array.isArray(doc.hooks['test-hook'])).toBe(true);
    expect(doc.hooks['test-hook'][0].command).toBe('amux handle');
  });

  it('HermesAdapter writes hook to YAML config (flat nested hooks: block)', async () => {
    const adapter = new HermesAdapter();
    await adapter.installHook!('onEvent', 'amux hermes handle', { id: 'h-yaml-1' });
    const text = await fs.readFile(path.join(home, '.hermes', 'cli-config.yaml'), 'utf8');
    expect(text).toContain('hooks:');
    expect(text).toMatch(/\n\s*onEvent:\s*amux hermes handle/);
    // Append a second hook and assert chaining with &&
    await adapter.installHook!('onEvent', 'second-cmd', { id: 'h-yaml-2' });
    const text2 = await fs.readFile(path.join(home, '.hermes', 'cli-config.yaml'), 'utf8');
    expect(text2).toMatch(/onEvent:\s*.*amux hermes handle && second-cmd/);
  });

  it('appends to existing hooks array without clobbering', async () => {
    const settingsPath = path.join(home, '.claude', 'settings.json');
    await fs.mkdir(path.dirname(settingsPath), { recursive: true });
    await fs.writeFile(
      settingsPath,
      JSON.stringify({ hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'existing' }] }] } }, null, 2),
      'utf8',
    );
    const adapter = new ClaudeAdapter();
    await adapter.installHook('PreToolUse', 'new-cmd', { id: 'h2' });
    const doc = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
    expect(doc.hooks.PreToolUse).toHaveLength(2);
    expect(doc.hooks.PreToolUse[0].hooks[0].command).toBe('existing');
    expect(doc.hooks.PreToolUse[1].hooks[0].command).toBe('new-cmd');
  });
});
