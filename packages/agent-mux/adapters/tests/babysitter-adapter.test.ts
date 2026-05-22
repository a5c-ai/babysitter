import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StreamAssembler } from '@a5c-ai/agent-mux-core';
import type { ParseContext } from '@a5c-ai/agent-mux-core';
import { BabysitterAdapter } from '../src/babysitter-adapter.js';

function makeContext(overrides?: Partial<ParseContext>): ParseContext {
  return {
    runId: 'test-run-1',
    agent: 'babysitter',
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

describe('BabysitterAdapter', () => {
  let adapter: BabysitterAdapter;

  beforeEach(() => {
    adapter = new BabysitterAdapter();
  });

  describe('identity', () => {
    it('has correct agent name', () => {
      expect(adapter.agent).toBe('babysitter');
    });

    it('has correct display name', () => {
      expect(adapter.displayName).toBe('Babysitter');
    });

    it('has correct CLI command', () => {
      expect(adapter.cliCommand).toBe('babysitter-agent');
    });
  });

  describe('capabilities', () => {
    it('declares agent as babysitter', () => {
      expect(adapter.capabilities.agent).toBe('babysitter');
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

    it('supports interactive mode and stdin injection', () => {
      expect(adapter.capabilities.supportsInteractiveMode).toBe(true);
      expect(adapter.capabilities.supportsStdinInjection).toBe(true);
    });

    it('supports MCP', () => {
      expect(adapter.capabilities.supportsMCP).toBe(true);
    });

    it('supports plugins', () => {
      expect(adapter.capabilities.supportsPlugins).toBe(true);
      expect(adapter.capabilities.pluginFormats).toEqual(['skill-directory']);
    });

    it('supports skills', () => {
      expect(adapter.capabilities.supportsSkills).toBe(true);
      expect(adapter.capabilities.skillsFormat).toBe('directory');
    });

    it('supports parallel execution', () => {
      expect(adapter.capabilities.supportsParallelExecution).toBe(true);
      expect(adapter.capabilities.maxParallelTasks).toBe(4);
    });

    it('supports subagent dispatch', () => {
      expect(adapter.capabilities.supportsSubagentDispatch).toBe(true);
    });
  });

  describe('models', () => {
    it('has empty models list (delegates to underlying harness)', () => {
      expect(adapter.models).toEqual([]);
    });

    it('has no default model', () => {
      expect(adapter.defaultModelId).toBeUndefined();
    });
  });

  describe('buildSpawnArgs', () => {
    it('builds basic spawn args with invoke for single turn', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'babysitter',
        prompt: 'Fix the bug',
        nonInteractive: true,
      });

      expect(result.command).toBe('babysitter-agent');
      expect(result.args).toContain('invoke');
      expect(result.args).toContain('claude-code');
      expect(result.args).toContain('--output-format');
      expect(result.args).toContain('amux-events');
      expect(result.args).toContain('--prompt');
      expect(result.args).toContain('Fix the bug');
    });

    it('uses create-run for multi-turn', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'babysitter',
        prompt: 'Fix the bug',
        nonInteractive: true,
        maxTurns: 5,
      });

      expect(result.args).toContain('create-run');
      expect(result.args).not.toContain('invoke');
      expect(result.args).toContain('--harness');
      expect(result.args).toContain('claude-code');
      expect(result.args).toContain('--max-iterations');
      expect(result.args).toContain('5');
    });

    it('includes model flag', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'babysitter',
        prompt: 'Test',
        nonInteractive: true,
        model: 'claude-sonnet-4-20250514',
      });

      expect(result.args).toContain('--model');
      expect(result.args).toContain('claude-sonnet-4-20250514');
    });

    it('sets non-interactive for yolo mode', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'babysitter',
        prompt: 'Test',
        approvalMode: 'yolo',
      });

      expect(result.args).toContain('--non-interactive');
    });

    it('sets non-interactive flag when nonInteractive is true', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'babysitter',
        prompt: 'Test',
        nonInteractive: true,
      });

      expect(result.args).toContain('--non-interactive');
    });

    it('uses workspace from cwd', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'babysitter',
        prompt: 'Test',
        nonInteractive: true,
        cwd: '/some/project',
      });

      expect(result.args).toContain('--workspace');
      expect(result.args).toContain('/some/project');
    });

    it('passes session id as run-id', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'babysitter',
        prompt: 'Continue',
        nonInteractive: true,
        sessionId: 'run-abc-123',
      });

      expect(result.args).toContain('--run-id');
      expect(result.args).toContain('run-abc-123');
    });

    it('joins array prompts', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'babysitter',
        prompt: ['First', 'Second'],
        nonInteractive: true,
      });

      expect(result.args).toContain('First\nSecond');
    });

    it('sets BABYSITTER_MAX_ITERATIONS in env', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'babysitter',
        prompt: 'Test',
        nonInteractive: true,
        maxTurns: 10,
      });

      expect(result.env?.['BABYSITTER_MAX_ITERATIONS']).toBe('10');
    });

    it('sets AGENT_SESSION_ID in env from sessionId', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'babysitter',
        prompt: 'Test',
        nonInteractive: true,
        sessionId: 'sess-123',
      });

      expect(result.env?.['AGENT_SESSION_ID']).toBe('sess-123');
    });

    it('uses custom harness from env for invoke', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'babysitter',
        prompt: 'Test',
        nonInteractive: true,
        env: { BABYSITTER_HARNESS: 'codex' },
      });

      expect(result.args).toContain('invoke');
      expect(result.args).toContain('codex');
    });

    it('uses custom harness from env for create-run', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'babysitter',
        prompt: 'Test',
        nonInteractive: true,
        maxTurns: 5,
        env: { BABYSITTER_HARNESS: 'codex' },
      });

      expect(result.args).toContain('create-run');
      expect(result.args).toContain('--harness');
      expect(result.args).toContain('codex');
    });
  });

  describe('parseEvent', () => {
    it('returns null for non-JSON in jsonl mode', () => {
      expect(adapter.parseEvent('plain text', makeContext())).toBeNull();
    });

    it('parses text_delta events', () => {
      const result = adapter.parseEvent(
        JSON.stringify({ type: 'text_delta', text: 'Hello world' }),
        makeContext(),
      );
      const event = result as { type: string; delta: string };
      expect(event.type).toBe('text_delta');
      expect(event.delta).toBe('Hello world');
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

    it('parses tool_call_start events', () => {
      const result = adapter.parseEvent(
        JSON.stringify({ type: 'tool_call_start', toolCallId: 'tc-1', toolName: 'Read', input: { file_path: 'foo.ts' } }),
        makeContext(),
      );
      const event = result as { type: string; toolCallId: string; toolName: string };
      expect(event.type).toBe('tool_call_start');
      expect(event.toolCallId).toBe('tc-1');
      expect(event.toolName).toBe('Read');
    });

    it('parses tool_use events (alias)', () => {
      const result = adapter.parseEvent(
        JSON.stringify({ type: 'tool_use', id: 'tc-2', name: 'Write', input: {} }),
        makeContext(),
      );
      const event = result as { type: string; toolCallId: string; toolName: string };
      expect(event.type).toBe('tool_call_start');
      expect(event.toolCallId).toBe('tc-2');
      expect(event.toolName).toBe('Write');
    });

    it('parses tool_result events', () => {
      const result = adapter.parseEvent(
        JSON.stringify({ type: 'tool_result', toolCallId: 'tc-1', output: 'file contents' }),
        makeContext(),
      );
      const event = result as { type: string; toolCallId: string; output: string };
      expect(event.type).toBe('tool_result');
      expect(event.toolCallId).toBe('tc-1');
      expect(event.output).toBe('file contents');
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

    it('parses session_start events', () => {
      const result = adapter.parseEvent(
        JSON.stringify({ type: 'session_start', sessionId: 'run-123' }),
        makeContext(),
      );
      const event = result as { type: string; sessionId: string };
      expect(event.type).toBe('session_start');
      expect(event.sessionId).toBe('run-123');
    });

    it('parses run_started events as session_start', () => {
      const result = adapter.parseEvent(
        JSON.stringify({ type: 'run_started', sessionId: 'run-456' }),
        makeContext(),
      );
      const event = result as { type: string; sessionId: string };
      expect(event.type).toBe('session_start');
      expect(event.sessionId).toBe('run-456');
    });

    it('parses legacy completed status as session_end', () => {
      const result = adapter.parseEvent(
        JSON.stringify({ status: 'completed' }),
        makeContext(),
      );
      const event = result as { type: string; sessionId: string; turnCount: number };
      expect(event.type).toBe('session_end');
      expect(event.sessionId).toBe('test-run-1');
      expect(event.turnCount).toBe(0);
    });

    it('parses session_end events', () => {
      const result = adapter.parseEvent(
        JSON.stringify({ type: 'session_end', sessionId: 'run-789' }),
        makeContext(),
      );
      const event = result as { type: string; sessionId: string; turnCount: number };
      expect(event.type).toBe('session_end');
      expect(event.sessionId).toBe('run-789');
      expect(event.turnCount).toBe(0);
    });

    it('parses turn_start / iteration_start events', () => {
      const ctx = makeContext();
      const result = adapter.parseEvent(
        JSON.stringify({ type: 'iteration_start' }),
        ctx,
      );
      const event = result as { type: string; turnIndex: number };
      expect(event.type).toBe('turn_start');
      expect(event.turnIndex).toBe(0);
    });

    it('increments turn index on subsequent turn_start events', () => {
      const ctx = makeContext();
      adapter.parseEvent(JSON.stringify({ type: 'turn_start' }), ctx);
      const result = adapter.parseEvent(JSON.stringify({ type: 'turn_start' }), ctx);
      const event = result as { type: string; turnIndex: number };
      expect(event.turnIndex).toBe(1);
    });

    it('parses passthrough amux-format events with type and runId', () => {
      const amuxEvent = {
        type: 'text_delta',
        runId: 'run-abc',
        agent: 'babysitter',
        timestamp: '2026-04-19T12:00:00Z',
        text: 'pass through',
      };
      const result = adapter.parseEvent(JSON.stringify(amuxEvent), makeContext());
      const event = result as Record<string, unknown>;
      expect(event['type']).toBe('text_delta');
      expect(event['runId']).toBe('run-abc');
      expect(event['text']).toBe('pass through');
    });

    it('parses ANSI/plaintext output as text deltas in text mode', () => {
      const result = adapter.parseEvent(
        '\u001b[38;5;81mAnalyzing...\u001b[0m',
        makeContext({ outputFormat: 'text' }),
      );
      const event = result as { type: string; delta: string };
      expect(event.type).toBe('text_delta');
      expect(event.delta).toBe('Analyzing...');
    });
  });

  describe('detectAuth', () => {
    it('returns unauthenticated when CLI not found', async () => {
      // Override spawner to simulate CLI not found
      adapter.setSpawner(async () => ({ code: 1, stdout: '', stderr: 'not found' }));
      const state = await adapter.detectAuth();
      expect(state.status).toBe('unauthenticated');
    });
  });

  describe('getAuthGuidance', () => {
    it('returns valid guidance', () => {
      const guidance = adapter.getAuthGuidance();
      expect(guidance.agent).toBe('babysitter');
      expect(guidance.providerName).toBe('Babysitter');
      expect(guidance.steps.length).toBeGreaterThan(0);
    });

    it('includes install command in steps', () => {
      const guidance = adapter.getAuthGuidance();
      const hasInstallStep = guidance.steps.some(
        (s) => typeof s.command === 'string' && s.command.includes('@a5c-ai/babysitter'),
      );
      expect(hasInstallStep).toBe(true);
    });
  });

  describe('sessionDir', () => {
    it('returns a path containing .a5c/runs', () => {
      const dir = adapter.sessionDir('/some/project');
      expect(dir).toContain('.a5c');
      expect(dir).toContain('runs');
    });

    it('uses cwd when no argument provided', () => {
      const dir = adapter.sessionDir();
      expect(dir).toContain('.a5c');
      expect(dir).toContain('runs');
    });
  });

  describe('parseSessionFile', () => {
    it('parses a babysitter run.json file', async () => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'babysitter-session-'));
      const runDir = path.join(tempDir, 'test-run');
      await fs.mkdir(runDir, { recursive: true });
      const runJsonPath = path.join(runDir, 'run.json');

      try {
        await fs.writeFile(
          runJsonPath,
          JSON.stringify({
            runId: 'run-test-123',
            processId: 'test-process',
            prompt: 'Fix all lint errors in the project',
            createdAt: '2026-04-19T12:00:00Z',
            model: 'claude-sonnet-4',
          }),
          'utf8',
        );

        const session = await adapter.parseSessionFile(runJsonPath);
        expect(session.agent).toBe('babysitter');
        expect(session.sessionId).toBe('run-test-123');
        expect(session.title).toBe('Fix all lint errors in the project');
        expect(session.model).toBe('claude-sonnet-4');
        expect(session.tags).toContain('test-process');
        expect(session.cwd).toBe(tempDir);
      } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe('listSessionFiles', () => {
    it('returns empty array when runs dir does not exist', async () => {
      const result = await adapter.listSessionFiles('/nonexistent/path');
      expect(result).toEqual([]);
    });

    it('lists run.json files from existing runs directory', async () => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'babysitter-list-'));
      const runsDir = path.join(tempDir, '.a5c', 'runs');
      const run1Dir = path.join(runsDir, 'run-1');
      const run2Dir = path.join(runsDir, 'run-2');
      const emptyDir = path.join(runsDir, 'run-3-no-json');

      try {
        await fs.mkdir(run1Dir, { recursive: true });
        await fs.mkdir(run2Dir, { recursive: true });
        await fs.mkdir(emptyDir, { recursive: true });

        await fs.writeFile(path.join(run1Dir, 'run.json'), '{}', 'utf8');
        await fs.writeFile(path.join(run2Dir, 'run.json'), '{}', 'utf8');
        // run-3 has no run.json

        const result = await adapter.listSessionFiles(tempDir);
        expect(result).toHaveLength(2);
        expect(result.some((f) => f.includes('run-1'))).toBe(true);
        expect(result.some((f) => f.includes('run-2'))).toBe(true);
      } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe('placeholder methods', () => {
    it('readConfig returns default', async () => {
      const config = await adapter.readConfig();
      expect(config.agent).toBe('babysitter');
    });

    it('writeConfig does not throw', async () => {
      await expect(adapter.writeConfig({ agent: 'babysitter' })).resolves.toBeUndefined();
    });
  });

  describe('configSchema', () => {
    it('has babysitter-specific config fields', () => {
      expect(adapter.configSchema.fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: 'defaultHarness' }),
          expect.objectContaining({ key: 'maxIterations' }),
          expect.objectContaining({ key: 'runsDir' }),
        ]),
      );
    });
  });
});
