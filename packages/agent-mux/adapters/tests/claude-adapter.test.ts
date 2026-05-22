import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawn } from 'node:child_process';
import { StreamAssembler } from '@a5c-ai/agent-mux-core';
import type { ParseContext } from '@a5c-ai/agent-mux-core';
import { RuntimeHookDispatcher } from '../../core/src/runtime-hook-dispatcher.js';
import { ClaudeAdapter } from '../src/claude-adapter.js';

function makeContext(overrides?: Partial<ParseContext>): ParseContext {
  return {
    runId: 'test-run-1',
    agent: 'claude',
    sessionId: undefined,
    turnIndex: 0,
    debug: false,
    outputFormat: 'jsonl',
    source: 'stdout',
    assembler: new StreamAssembler(),
    eventCount: 0,
    lastEventType: null,
    adapterState: {},
    ...overrides,
  };
}

async function runNodeScript(
  scriptPath: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  input: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      resolve({ stdout, stderr, exitCode: code ?? 1 });
    });
    child.stdin.end(input);
  });
}

describe('ClaudeAdapter', () => {
  let adapter: ClaudeAdapter;

  beforeEach(() => {
    adapter = new ClaudeAdapter();
  });

  describe('identity', () => {
    it('has correct agent name', () => {
      expect(adapter.agent).toBe('claude');
    });

    it('has correct display name', () => {
      expect(adapter.displayName).toBe('Claude Code');
    });

    it('has correct CLI command', () => {
      expect(adapter.cliCommand).toBe('claude');
    });
  });

  describe('capabilities', () => {
    it('declares agent as claude', () => {
      expect(adapter.capabilities.agent).toBe('claude');
    });

    it('supports resume and fork', () => {
      expect(adapter.capabilities.canResume).toBe(true);
      expect(adapter.capabilities.canFork).toBe(true);
    });

    it('supports text streaming', () => {
      expect(adapter.capabilities.supportsTextStreaming).toBe(true);
    });

    it('supports thinking', () => {
      expect(adapter.capabilities.supportsThinking).toBe(true);
      expect(adapter.capabilities.thinkingEffortLevels).toContain('high');
    });

    it('supports MCP', () => {
      expect(adapter.capabilities.supportsMCP).toBe(true);
    });

    it('uses file session persistence', () => {
      expect(adapter.capabilities.sessionPersistence).toBe('file');
    });

    it('supports all three platforms', () => {
      expect(adapter.capabilities.supportedPlatforms).toContain('darwin');
      expect(adapter.capabilities.supportedPlatforms).toContain('linux');
      expect(adapter.capabilities.supportedPlatforms).toContain('win32');
    });

    it('advertises the real persistent stream-json subprocess transport', () => {
      expect(adapter.capabilities.supportsInteractiveMode).toBe(true);
      expect(adapter.capabilities.supportsStdinInjection).toBe(true);
      expect(adapter.capabilities.structuredSessionTransport).toBe('persistent');
    });
  });

  describe('models', () => {
    it('has at least one model', () => {
      expect(adapter.models.length).toBeGreaterThanOrEqual(1);
    });

    it('has a default model', () => {
      expect(adapter.defaultModelId).toBeDefined();
      const defaultModel = adapter.models.find(m => m.modelId === adapter.defaultModelId);
      expect(defaultModel).toBeDefined();
    });

    it('model has correct agent field', () => {
      for (const model of adapter.models) {
        expect(model.agent).toBe('claude');
      }
    });
  });

  describe('buildSpawnArgs', () => {
    it('builds persistent stream-json spawn args with stdin-backed prompt delivery by default', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'claude',
        prompt: 'Hello world',
      });

      expect(result.command).toBe('claude');
      expect(result.args).toContain('--print');
      expect(result.args).toContain('--output-format');
      expect(result.args).toContain('stream-json');
      expect(result.args).toContain('--input-format');
      expect(result.args).toContain('--replay-user-messages');
      expect(result.args).not.toContain('Hello world');
      expect(result.stdin).toContain('"type":"user"');
      expect(result.stdin).toContain('Hello world');
      expect(result.usePty).toBe(false);
      expect(result.closeStdinAfterSpawn).toBe(false);
    });

    it('includes model flag when specified', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'claude',
        prompt: 'Test', nonInteractive: true,
        model: 'claude-opus-4-20250514',
      });

      expect(result.args).toContain('--model');
      expect(result.args).toContain('claude-opus-4-20250514');
    });

    it('uses --resume when sessionId is set (reconnect path)', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'claude',
        prompt: 'Test', nonInteractive: true,
        sessionId: 'abc-123',
      });

      expect(result.args).toContain('--resume');
      expect(result.args).toContain('abc-123');
      expect(result.args).not.toContain('--session-id');
    });

    it('uses --session-id when forkSessionId is set (new session from fork)', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'claude',
        prompt: 'Test', nonInteractive: true,
        forkSessionId: 'parent-xyz',
      });

      expect(result.args).toContain('--session-id');
    });

    it('includes max-turns when specified', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'claude',
        prompt: 'Test', nonInteractive: true,
        maxTurns: 5,
      });

      expect(result.args).toContain('--max-turns');
      expect(result.args).toContain('5');
    });

    it('sets yolo mode with --dangerously-skip-permissions', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'claude',
        prompt: 'Test', nonInteractive: true,
        approvalMode: 'yolo',
      });

      expect(result.args).toContain('--dangerously-skip-permissions');
    });

    it('uses custom cwd when specified', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'claude',
        prompt: 'Test', nonInteractive: true,
        cwd: '/tmp/project',
      });

      expect(result.cwd).toBe('/tmp/project');
    });

    it('includes system prompt when provided', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'claude',
        prompt: 'Test', nonInteractive: true,
        systemPrompt: 'You are a helpful assistant',
      });

      expect(result.args).toContain('--system-prompt');
      expect(result.args).toContain('You are a helpful assistant');
    });

    it('joins array prompts with newlines', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'claude',
        prompt: ['Line 1', 'Line 2'], nonInteractive: true,
      });

      expect(result.args).toContain('Line 1\nLine 2');
    });

    it('passes env vars from options', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'claude',
        prompt: 'Test', nonInteractive: true,
        env: { CUSTOM_VAR: 'value' },
      });

      expect(result.env['CUSTOM_VAR']).toBe('value');
    });

    it('sets timeout from options', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'claude',
        prompt: 'Test', nonInteractive: true,
        timeout: 30000,
      });

      expect(result.timeout).toBe(30000);
    });

    it('keeps a one-shot prompt argument path when explicitly forced non-interactive', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'claude',
        prompt: 'Hello world',
        nonInteractive: true,
      });

      expect(result.command).toBe('claude');
      expect(result.args).toContain('--print');
      expect(result.args).toContain('--output-format');
      expect(result.args).toContain('Hello world');
      expect(result.closeStdinAfterSpawn).toBe(true);
      expect(result.stdin).toBeUndefined();
    });
  });

  describe('runtime hooks', () => {
    const previousHome = process.env['HOME'];
    const previousUserProfile = process.env['USERPROFILE'];

    afterEach(() => {
      process.env['HOME'] = previousHome;
      process.env['USERPROFILE'] = previousUserProfile;
    });

    it('creates an isolated CLAUDE_CONFIG_DIR and routes shim requests through the dispatcher', async () => {
      const fakeHome = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-runtime-home-'));
      const globalConfigDir = path.join(fakeHome, '.claude');
      const globalConfigPath = path.join(globalConfigDir, 'settings.json');
      await fs.mkdir(globalConfigDir, { recursive: true });
      await fs.writeFile(globalConfigPath, '{"unchanged":true}\n', 'utf8');
      const beforeStat = await fs.stat(globalConfigPath);
      process.env['HOME'] = fakeHome;
      process.env['USERPROFILE'] = fakeHome;

      const emitted: unknown[] = [];
      const dispatcher = new RuntimeHookDispatcher({
        hooks: {
          preToolUse: () => ({ decision: 'deny', reason: 'blocked in test' }),
        },
        runId: 'run-claude-runtime',
        agent: 'claude',
        emit: (event) => {
          emitted.push(event);
        },
      });

      const setup = await adapter.setupRuntimeHooks!(
        { agent: 'claude', prompt: 'test', hooks: { preToolUse: async () => ({ decision: 'allow' }) } },
        dispatcher,
      );

      expect(setup?.env?.CLAUDE_CONFIG_DIR).toContain('amux-run-run-claude-runtime');
      const configDir = setup!.env!.CLAUDE_CONFIG_DIR!;
      const settingsPath = path.join(configDir, 'settings.json');
      const shimPath = path.join(configDir, 'hook-shim.mjs');
      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
      expect(settings.hooks.PreToolUse[0].hooks[0].command).toContain('hook-shim.mjs');

      const shimResult = await runNodeScript(
        shimPath,
        ['PreToolUse'],
        { ...process.env, ...setup!.env },
        JSON.stringify({ tool_name: 'Write', tool_input: { path: 'blocked.txt' } }),
      );
      expect(shimResult.exitCode).toBe(2);
      expect(shimResult.stdout).toContain('"decision":"deny"');

      await setup!.cleanup?.();

      const afterStat = await fs.stat(globalConfigPath);
      expect(await fs.readFile(globalConfigPath, 'utf8')).toBe('{"unchanged":true}\n');
      expect(afterStat.mtimeMs).toBe(beforeStat.mtimeMs);
      expect(emitted).toEqual([]);
      await fs.rm(fakeHome, { recursive: true, force: true });
    });
  });

  describe('parseEvent', () => {
    it('returns null for non-JSON lines', () => {
      const result = adapter.parseEvent('not json', makeContext());
      expect(result).toBeNull();
    });

    it('returns null for empty JSON objects without type', () => {
      const result = adapter.parseEvent('{}', makeContext());
      expect(result).toBeNull();
    });

    it('parses assistant text events', () => {
      const result = adapter.parseEvent(
        JSON.stringify({ type: 'assistant', content: 'Hello!' }),
        makeContext(),
      );
      expect(result).not.toBeNull();
      const event = result as { type: string; delta: string };
      expect(event.type).toBe('text_delta');
      expect(event.delta).toBe('Hello!');
    });

    it('parses tool_use events', () => {
      const result = adapter.parseEvent(
        JSON.stringify({ type: 'tool_use', id: 'tc-1', name: 'read_file', input: { path: '/tmp/test.txt' } }),
        makeContext(),
      );
      expect(result).not.toBeNull();
      const event = result as { type: string; toolCallId: string; toolName: string };
      expect(event.type).toBe('tool_call_start');
      expect(event.toolCallId).toBe('tc-1');
      expect(event.toolName).toBe('read_file');
    });

    it('parses stream_event content_block_delta text_delta', () => {
      const result = adapter.parseEvent(
        JSON.stringify({
          type: 'stream_event',
          event: { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'hi ' } },
        }),
        makeContext(),
      );
      expect(result).not.toBeNull();
      const ev = result as { type: string; delta: string };
      expect(ev.type).toBe('text_delta');
      expect(ev.delta).toBe('hi ');
    });

    it('parses stream_event content_block_delta input_json_delta → tool_input_delta', () => {
      const result = adapter.parseEvent(
        JSON.stringify({
          type: 'stream_event',
          event: { type: 'content_block_delta', index: 2, delta: { type: 'input_json_delta', partial_json: '{"p":' } },
        }),
        makeContext(),
      );
      const ev = result as { type: string; toolCallId: string; delta: string };
      expect(ev.type).toBe('tool_input_delta');
      expect(ev.toolCallId).toBe('2');
      expect(ev.delta).toBe('{"p":');
    });

    it('parses stream_event tool-use blocks into tool lifecycle events', () => {
      const ctx = makeContext();

      const start = adapter.parseEvent(
        JSON.stringify({
          type: 'stream_event',
          event: {
            type: 'content_block_start',
            index: 1,
            content_block: {
              type: 'tool_use',
              id: 'tool-1',
              name: 'Read',
              input: {},
            },
          },
        }),
        ctx,
      ) as { type: string; toolCallId: string; toolName: string };
      expect(start.type).toBe('tool_call_start');
      expect(start.toolCallId).toBe('tool-1');
      expect(start.toolName).toBe('Read');

      const delta = adapter.parseEvent(
        JSON.stringify({
          type: 'stream_event',
          event: {
            type: 'content_block_delta',
            index: 1,
            delta: { type: 'input_json_delta', partial_json: '{"file_path":"/tmp/x.txt"}' },
          },
        }),
        ctx,
      ) as { type: string; toolCallId: string; inputAccumulated: string };
      expect(delta.type).toBe('tool_input_delta');
      expect(delta.toolCallId).toBe('tool-1');
      expect(delta.inputAccumulated).toContain('/tmp/x.txt');

      const ready = adapter.parseEvent(
        JSON.stringify({
          type: 'stream_event',
          event: {
            type: 'content_block_stop',
            index: 1,
          },
        }),
        ctx,
      ) as { type: string; toolCallId: string; input: { file_path: string } };
      expect(ready.type).toBe('tool_call_ready');
      expect(ready.toolCallId).toBe('tool-1');
      expect(ready.input.file_path).toBe('/tmp/x.txt');
    });

    it('parses replayed user tool results', () => {
      const ctx = makeContext();
      adapter.parseEvent(
        JSON.stringify({
          type: 'stream_event',
          event: {
            type: 'content_block_start',
            index: 1,
            content_block: {
              type: 'tool_use',
              id: 'tool-2',
              name: 'Read',
              input: {},
            },
          },
        }),
        ctx,
      );

      const result = adapter.parseEvent(
        JSON.stringify({
          type: 'user',
          parent_tool_use_id: 'tool-2',
          tool_use_result: 'file contents',
        }),
        ctx,
      ) as { type: string; toolCallId: string; output: string };
      expect(result.type).toBe('tool_result');
      expect(result.toolCallId).toBe('tool-2');
      expect(result.output).toBe('file contents');
    });

    it('parses tool_result events', () => {
      const result = adapter.parseEvent(
        JSON.stringify({ type: 'tool_result', tool_use_id: 'tc-1', content: 'file content' }),
        makeContext(),
      );
      expect(result).not.toBeNull();
      const event = result as { type: string; toolCallId: string };
      expect(event.type).toBe('tool_result');
      expect(event.toolCallId).toBe('tc-1');
    });

    it('parses thinking events', () => {
      const result = adapter.parseEvent(
        JSON.stringify({ type: 'thinking', thinking: 'Let me consider...' }),
        makeContext(),
      );
      expect(result).not.toBeNull();
      const event = result as { type: string; delta: string };
      expect(event.type).toBe('thinking_delta');
      expect(event.delta).toBe('Let me consider...');
    });

    it('parses error events', () => {
      const result = adapter.parseEvent(
        JSON.stringify({ type: 'error', message: 'Rate limit exceeded' }),
        makeContext(),
      );
      expect(result).not.toBeNull();
      const event = result as { type: string; message: string };
      expect(event.type).toBe('error');
      expect(event.message).toBe('Rate limit exceeded');
    });

    it('parses result events with text and cost', () => {
      const ctx = makeContext();
      adapter.parseEvent(
        JSON.stringify({ type: 'system', subtype: 'status', status: 'requesting' }),
        ctx,
      );
      const result = adapter.parseEvent(
        JSON.stringify({
          type: 'result',
          result: 'Final answer',
          cost: { totalUsd: 0.05, inputTokens: 100, outputTokens: 50 },
        }),
        ctx,
      );
      expect(result).not.toBeNull();
      expect(Array.isArray(result)).toBe(true);
      const events = result as Array<{ type: string }>;
      expect(events.length).toBe(3);
      expect(events[0]!.type).toBe('message_stop');
      expect(events[1]!.type).toBe('cost');
      expect(events[2]!.type).toBe('turn_end');
    });

    it('starts a turn on requesting status and deduplicates repeated init events for the same live session', () => {
      const ctx = makeContext({ sessionId: 'sess-1' });
      const firstInit = adapter.parseEvent(
        JSON.stringify({ type: 'system', subtype: 'init', session_id: 'sess-1' }),
        ctx,
      ) as { type: string; sessionId: string; resumed: boolean };
      expect(firstInit.type).toBe('session_start');
      expect(firstInit.sessionId).toBe('sess-1');
      expect(firstInit.resumed).toBe(true);

      const secondInit = adapter.parseEvent(
        JSON.stringify({ type: 'system', subtype: 'init', session_id: 'sess-1' }),
        ctx,
      );
      expect(secondInit).toBeNull();

      const turnStart = adapter.parseEvent(
        JSON.stringify({ type: 'system', subtype: 'status', status: 'requesting' }),
        ctx,
      ) as { type: string; turnIndex: number };
      expect(turnStart.type).toBe('turn_start');
      expect(turnStart.turnIndex).toBe(0);
    });

    it('sets correct runId and agent on events', () => {
      const ctx = makeContext({ runId: 'run-xyz' });
      const result = adapter.parseEvent(
        JSON.stringify({ type: 'assistant', content: 'Hello' }),
        ctx,
      );
      const event = result as { runId: string; agent: string };
      expect(event.runId).toBe('run-xyz');
      expect(event.agent).toBe('claude');
    });

    it('parses ANSI/plaintext interactive output as text deltas', () => {
      const result = adapter.parseEvent(
        '\u001b[1mInvestigating session state...\u001b[0m',
        makeContext({ outputFormat: 'text' }),
      );
      const event = result as { type: string; delta: string };
      expect(event.type).toBe('text_delta');
      expect(event.delta).toBe('Investigating session state...');
    });
  });

  describe('detectAuth', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('returns authenticated when ANTHROPIC_API_KEY is set', async () => {
      process.env['ANTHROPIC_API_KEY'] = 'sk-ant-api03-testkey1234';
      const state = await adapter.detectAuth();
      expect(state.status).toBe('authenticated');
      expect(state.method).toBe('api_key');
      expect(state.identity).toContain('1234');
    });

    it('returns unauthenticated when no key is set', async () => {
      delete process.env['ANTHROPIC_API_KEY'];
      const state = await adapter.detectAuth();
      expect(state.status).toBe('unauthenticated');
    });
  });

  describe('getAuthGuidance', () => {
    it('returns valid guidance structure', () => {
      const guidance = adapter.getAuthGuidance();
      expect(guidance.agent).toBe('claude');
      expect(guidance.providerName).toBe('Anthropic');
      expect(guidance.steps.length).toBeGreaterThan(0);
      expect(guidance.envVars).toBeDefined();
      expect(guidance.envVars!.length).toBeGreaterThan(0);
    });

    it('includes ANTHROPIC_API_KEY in env vars', () => {
      const guidance = adapter.getAuthGuidance();
      const envVarNames = guidance.envVars!.map(v => typeof v === 'string' ? v : v.name);
      expect(envVarNames).toContain('ANTHROPIC_API_KEY');
    });

    it('includes documentation URLs', () => {
      const guidance = adapter.getAuthGuidance();
      expect(guidance.documentationUrls).toBeDefined();
      expect(guidance.documentationUrls!.length).toBeGreaterThan(0);
    });
  });

  describe('sessionDir', () => {
    it('returns a path containing .claude', () => {
      const dir = adapter.sessionDir();
      expect(dir).toContain('.claude');
    });
  });

  describe('placeholder methods', () => {
    it('listSessionFiles returns an array', async () => {
      const files = await adapter.listSessionFiles();
      expect(Array.isArray(files)).toBe(true);
    });

    it('parseSessionFile returns minimal session for missing file', async () => {
      const session = await adapter.parseSessionFile('/nonexistent-dir/test-session.jsonl');
      expect(session.sessionId).toBe('test-session');
      expect(session.agent).toBe('claude');
      expect(session.turnCount).toBe(0);
    });

    it('readConfig returns default config', async () => {
      const config = await adapter.readConfig();
      expect(config.agent).toBe('claude');
    });

    it('writeConfig writes to configured path', async () => {
      const os = await import('node:os');
      const path = await import('node:path');
      const fs = await import('node:fs/promises');
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-cfg-'));
      const tmpFile = path.join(tmpDir, 'settings.json');
      Object.defineProperty(adapter, 'configSchema', {
        value: { ...adapter.configSchema, configFilePaths: [tmpFile] },
        configurable: true,
      });
      await adapter.writeConfig({ model: 'sonnet' });
      const written = JSON.parse(await fs.readFile(tmpFile, 'utf8'));
      expect(written.model).toBe('sonnet');
      await fs.rm(tmpDir, { recursive: true, force: true });
    });
  });

  describe('configSchema', () => {
    it('has correct agent', () => {
      expect(adapter.configSchema.agent).toBe('claude');
    });

    it('has json format', () => {
      expect(adapter.configSchema.configFormat).toBe('json');
    });

    it('supports project config', () => {
      expect(adapter.configSchema.supportsProjectConfig).toBe(true);
    });
  });
});
