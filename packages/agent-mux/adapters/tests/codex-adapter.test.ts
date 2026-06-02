import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StreamAssembler } from '@a5c-ai/agent-mux-comm';
import type { ParseContext } from '@a5c-ai/agent-mux-comm';
import { CodexAdapter } from '../src/codex-adapter.js';

function makeContext(overrides?: Partial<ParseContext>): ParseContext {
  return {
    runId: 'test-run-1',
    agent: 'codex',
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

describe('CodexAdapter', () => {
  let adapter: CodexAdapter;

  beforeEach(() => {
    adapter = new CodexAdapter();
  });

  describe('identity', () => {
    it('has correct agent name', () => {
      expect(adapter.agent).toBe('codex');
    });

    it('has correct display name', () => {
      expect(adapter.displayName).toBe('OpenAI Codex');
    });

    it('has correct CLI command', () => {
      expect(adapter.cliCommand).toBe('codex');
    });
  });

  describe('capabilities', () => {
    it('declares agent as codex', () => {
      expect(adapter.capabilities.agent).toBe('codex');
    });

    it('supports resume but not fork', () => {
      expect(adapter.capabilities.canResume).toBe(true);
      expect(adapter.capabilities.canFork).toBe(false);
    });

    it('does not support thinking', () => {
      expect(adapter.capabilities.supportsThinking).toBe(false);
    });

    it('uses file session persistence', () => {
      expect(adapter.capabilities.sessionPersistence).toBe('file');
    });

    it('does not claim live interactive subprocess support', () => {
      expect(adapter.capabilities.supportsInteractiveMode).toBe(false);
      expect(adapter.capabilities.supportsStdinInjection).toBe(false);
    });
  });

  describe('models', () => {
    it('has at least one model', () => {
      expect(adapter.models.length).toBeGreaterThanOrEqual(1);
    });

    it('has a default model', () => {
      expect(adapter.defaultModelId).toBeDefined();
    });
  });

  describe('buildSpawnArgs', () => {
    it('builds basic spawn args', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'codex',
        prompt: 'Fix the bug', nonInteractive: true,
      });

      expect(result.command).toBe('codex');
      expect(result.args).toContain('exec');
      expect(result.args).toContain('--json');
      expect(result.args).toContain('Fix the bug');
    });

    it('includes model flag', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'codex',
        prompt: 'Test', nonInteractive: true,
        model: 'o4-mini',
      });

      expect(result.args).toContain('--model');
      expect(result.args).toContain('o4-mini');
    });

    it('sets full-auto for yolo mode', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'codex',
        prompt: 'Test', nonInteractive: true,
        approvalMode: 'yolo',
      });

      expect(result.args).toContain('--full-auto');
    });

    it('joins array prompts', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'codex',
        prompt: ['First', 'Second'], nonInteractive: true,
      });

      expect(result.args).toContain('First\nSecond');
    });

    it('resumes a specific session instead of using --last', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'codex',
        prompt: 'continue this session',
        sessionId: '019d96a9-8685-7503-92c5-8523d6843d6b',
        nonInteractive: true,
      });

      expect(result.args).toEqual([
        'exec',
        'resume',
        '--json',
        '019d96a9-8685-7503-92c5-8523d6843d6b',
        'continue this session',
      ]);
    });

    it('keeps using exec --json on the subprocess transport even without an explicit non-interactive flag', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'codex',
        prompt: 'continue working',
      });

      expect(result.args).toEqual(['exec', '--json', 'continue working']);
      expect(result.closeStdinAfterSpawn).toBe(true);
    });
  });

  describe('parseEvent', () => {
    it('returns null for non-JSON', () => {
      expect(adapter.parseEvent('plain text', makeContext())).toBeNull();
    });

    it('parses message events', () => {
      const result = adapter.parseEvent(
        JSON.stringify({ type: 'message', content: 'Response text' }),
        makeContext(),
      );
      const event = result as { type: string; delta: string };
      expect(event.type).toBe('text_delta');
      expect(event.delta).toBe('Response text');
    });

    it('parses thread.started into session_start using thread_id', () => {
      const result = adapter.parseEvent(
        JSON.stringify({ type: 'thread.started', thread_id: 'thread-123' }),
        makeContext(),
      );
      const event = result as { type: string; sessionId: string; resumed: boolean };
      expect(event.type).toBe('session_start');
      expect(event.sessionId).toBe('thread-123');
      expect(event.resumed).toBe(false);
    });

    it('preserves the requested session id when codex emits thread.started during resume', () => {
      const result = adapter.parseEvent(
        JSON.stringify({ type: 'thread.started', thread_id: 'thread-newly-emitted' }),
        makeContext({ sessionId: 'thread-existing-session' }),
      );
      const event = result as { type: string; sessionId: string; resumed: boolean };
      expect(event.type).toBe('session_start');
      expect(event.sessionId).toBe('thread-existing-session');
      expect(event.resumed).toBe(true);
    });

    it('parses item.completed agent messages from codex exec --json', () => {
      const result = adapter.parseEvent(
        JSON.stringify({ type: 'item.completed', item: { id: 'item_0', type: 'agent_message', text: 'hello from codex' } }),
        makeContext(),
      );
      const event = result as { type: string; delta: string };
      expect(event.type).toBe('text_delta');
      expect(event.delta).toBe('hello from codex');
    });

    it('parses function_call events', () => {
      const result = adapter.parseEvent(
        JSON.stringify({ type: 'function_call', id: 'fc-1', name: 'write_file', arguments: '{}' }),
        makeContext(),
      );
      const event = result as { type: string; toolName: string };
      expect(event.type).toBe('tool_call_start');
      expect(event.toolName).toBe('write_file');
    });

    it('parses function_call_output events', () => {
      const result = adapter.parseEvent(
        JSON.stringify({ type: 'function_call_output', call_id: 'fc-1', output: 'done' }),
        makeContext(),
      );
      const event = result as { type: string; toolCallId: string };
      expect(event.type).toBe('tool_result');
      expect(event.toolCallId).toBe('fc-1');
    });

    it('parses nested command_execution starts from codex exec --json', () => {
      const result = adapter.parseEvent(
        JSON.stringify({
          type: 'item.started',
          item: {
            id: 'cmd-1',
            type: 'command_execution',
            command: 'pwd',
          },
        }),
        makeContext(),
      );
      const event = result as { type: string; toolCallId: string; toolName: string; inputAccumulated: string };
      expect(event.type).toBe('tool_call_start');
      expect(event.toolCallId).toBe('cmd-1');
      expect(event.toolName).toBe('pwd');
      expect(event.inputAccumulated).toContain('pwd');
    });

    it('parses nested command_execution completions from codex exec --json', () => {
      const result = adapter.parseEvent(
        JSON.stringify({
          type: 'item.completed',
          item: {
            id: 'cmd-1',
            type: 'command_execution',
            command: 'pwd',
            aggregated_output: 'C:/work/agent-mux',
          },
        }),
        makeContext(),
      );
      const event = result as { type: string; toolCallId: string; toolName: string; output: string };
      expect(event.type).toBe('tool_result');
      expect(event.toolCallId).toBe('cmd-1');
      expect(event.toolName).toBe('pwd');
      expect(event.output).toContain('agent-mux');
    });

    it('parses error events', () => {
      const result = adapter.parseEvent(
        JSON.stringify({ type: 'error', message: 'Something failed' }),
        makeContext(),
      );
      const event = result as { type: string; message: string };
      expect(event.type).toBe('error');
      expect(event.message).toBe('Something failed');
    });

    it('parses ANSI/plaintext interactive output as text deltas', () => {
      const result = adapter.parseEvent(
        '\u001b[38;5;81mWorking through the repo...\u001b[0m',
        makeContext({ outputFormat: 'text' }),
      );
      const event = result as { type: string; delta: string };
      expect(event.type).toBe('text_delta');
      expect(event.delta).toBe('Working through the repo...');
    });
  });

  describe('detectAuth', () => {
    const originalEnv = process.env;
    let tempCodexHome: string;

    beforeEach(async () => {
      process.env = { ...originalEnv };
      tempCodexHome = await fs.mkdtemp(path.join(os.tmpdir(), 'codex-home-'));
      process.env['CODEX_HOME'] = tempCodexHome;
    });

    afterEach(async () => {
      process.env = originalEnv;
      await fs.rm(tempCodexHome, { recursive: true, force: true });
    });

    it('returns authenticated with OPENAI_API_KEY', async () => {
      process.env['OPENAI_API_KEY'] = 'sk-test1234abcd';
      const state = await adapter.detectAuth();
      expect(state.status).toBe('authenticated');
      expect(state.method).toBe('api_key');
    });

    it('returns unauthenticated without key', async () => {
      delete process.env['OPENAI_API_KEY'];
      const state = await adapter.detectAuth();
      expect(state.status).toBe('unauthenticated');
    });
  });

  describe('getAuthGuidance', () => {
    it('returns valid guidance', () => {
      const guidance = adapter.getAuthGuidance();
      expect(guidance.agent).toBe('codex');
      expect(guidance.providerName).toBe('OpenAI');
      expect(guidance.steps.length).toBeGreaterThan(0);
    });

    it('includes OPENAI_API_KEY in env vars', () => {
      const guidance = adapter.getAuthGuidance();
      const envVarNames = guidance.envVars!.map(v => typeof v === 'string' ? v : v.name);
      expect(envVarNames).toContain('OPENAI_API_KEY');
    });
  });

  describe('sessionDir', () => {
    it('returns a path containing .codex', () => {
      expect(adapter.sessionDir()).toContain('.codex');
    });
  });

  describe('placeholder methods', () => {
    it('listSessionFiles returns an array', async () => {
      expect(Array.isArray(await adapter.listSessionFiles())).toBe(true);
    });

    it('readConfig returns default', async () => {
      const config = await adapter.readConfig();
      expect(config.agent).toBe('codex');
    });
  });

  describe('parseSessionFile', () => {
    it('parses codex native response_item transcripts, including tool calls', async () => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codex-session-'));
      const sessionPath = path.join(tempDir, 'example.jsonl');

      try {
        await fs.writeFile(
          sessionPath,
          [
            JSON.stringify({
              type: 'session_meta',
              payload: {
                id: 'native-session-1',
                cwd: 'C:\\work\\agent-mux',
              },
            }),
            JSON.stringify({
              type: 'turn_context',
              payload: {
                model: 'gpt-5.4',
              },
            }),
            JSON.stringify({
              type: 'response_item',
              payload: {
                type: 'message',
                role: 'user',
                content: [{ type: 'input_text', text: 'Run pwd' }],
              },
            }),
            JSON.stringify({
              type: 'response_item',
              payload: {
                type: 'function_call',
                call_id: 'call-1',
                name: 'shell_command',
                arguments: '{\"command\":\"pwd\"}',
              },
            }),
            JSON.stringify({
              type: 'response_item',
              payload: {
                type: 'function_call_output',
                call_id: 'call-1',
                output: 'C:\\\\work\\\\agent-mux',
              },
            }),
            JSON.stringify({
              type: 'response_item',
              payload: {
                type: 'message',
                role: 'assistant',
                content: [{ type: 'output_text', text: 'DONE' }],
              },
            }),
          ].join('\n'),
          'utf8',
        );

        const session = await adapter.parseSessionFile(sessionPath);
        expect(session.sessionId).toBe('example');
        expect(session.cwd).toBe('C:\\work\\agent-mux');
        expect(session.model).toBe('gpt-5.4');
        expect(session.messages).toHaveLength(4);
        expect(session.messages[0]).toMatchObject({
          role: 'user',
          content: 'Run pwd',
        });
        expect(session.messages[1]).toMatchObject({
          role: 'assistant',
          toolCalls: [
            {
              toolCallId: 'call-1',
              toolName: 'shell_command',
              input: { command: 'pwd' },
            },
          ],
        });
        expect(session.messages[2]).toMatchObject({
          role: 'tool',
          toolResult: {
            toolCallId: 'call-1',
            toolName: 'shell_command',
            output: 'C:\\\\work\\\\agent-mux',
          },
        });
        expect(session.messages[3]).toMatchObject({
          role: 'assistant',
          content: 'DONE',
        });
      } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    });

    it('estimates session cost from persisted token_count events', async () => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codex-session-cost-'));
      const sessionPath = path.join(tempDir, 'costed.jsonl');

      try {
        await fs.writeFile(
          sessionPath,
          [
            JSON.stringify({
              type: 'turn_context',
              payload: {
                model: 'gpt-5.4',
              },
            }),
            JSON.stringify({
              type: 'event_msg',
              payload: {
                type: 'token_count',
                info: {
                  total_token_usage: {
                    input_tokens: 1000,
                    cached_input_tokens: 400,
                    output_tokens: 100,
                    reasoning_output_tokens: 50,
                    total_tokens: 1100,
                  },
                },
              },
            }),
          ].join('\n'),
          'utf8',
        );

        const session = await adapter.parseSessionFile(sessionPath);
        expect(session.cost).toMatchObject({
          inputTokens: 1000,
          cachedTokens: 400,
          outputTokens: 100,
          thinkingTokens: 50,
        });
        expect(session.cost?.totalUsd).toBeCloseTo(0.00385, 8);
      } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    });
  });
});
