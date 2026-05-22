import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StreamAssembler, buildInvocationCommand } from '@a5c-ai/agent-mux-core';
import type { ParseContext, RunOptions } from '@a5c-ai/agent-mux-core';
import { AgentMuxRemoteAdapter } from '../src/agent-mux-remote-adapter.js';

function makeContext(overrides?: Partial<ParseContext>): ParseContext {
  return {
    runId: 'test-run-remote',
    agent: 'agent-mux-remote',
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

describe('AgentMuxRemoteAdapter (transport-agnostic)', () => {
  let adapter: AgentMuxRemoteAdapter;
  const prevEnv = { ...process.env };

  beforeEach(() => {
    adapter = new AgentMuxRemoteAdapter();
  });

  afterEach(() => {
    process.env = { ...prevEnv };
  });

  it('has identity agent-mux-remote and cliCommand=amux', () => {
    expect(adapter.agent).toBe('agent-mux-remote');
    expect(adapter.cliCommand).toBe('amux');
  });

  it('buildSpawnArgs produces plain `amux run ...` (no ssh in adapter)', () => {
    const opts: RunOptions = {
      agent: 'agent-mux-remote',
      prompt: 'Hello remote',
      env: { AMUX_REMOTE_AGENT: 'codex' },
    };
    const sa = adapter.buildSpawnArgs(opts);
    expect(sa.command).toBe('amux');
    expect(sa.args[0]).toBe('run');
    expect(sa.args).toContain('--agent');
    expect(sa.args).toContain('codex');
    expect(sa.args).toContain('--prompt');
    expect(sa.args).toContain('Hello remote');
    // Must NOT include ssh bits.
    expect(sa.args).not.toContain('ssh');
    expect(sa.args).not.toContain('--');
  });

  it('buildSpawnArgs defaults remote agent to claude', () => {
    const sa = adapter.buildSpawnArgs({ agent: 'agent-mux-remote', prompt: 'p' });
    expect(sa.args).toContain('claude');
  });

  it('buildSpawnArgs forwards --yolo when approvalMode is yolo', () => {
    const sa = adapter.buildSpawnArgs({
      agent: 'agent-mux-remote',
      prompt: 'p',
      approvalMode: 'yolo',
    });
    expect(sa.args).toContain('--yolo');
  });

  it('parseEvent forwards JSON events verbatim and rewrites agent', () => {
    const ctx = makeContext();
    const line = JSON.stringify({
      type: 'text_delta',
      runId: 'remote-run-1',
      agent: 'claude',
      timestamp: 12345,
      delta: 'hello',
    });
    const ev = adapter.parseEvent(line, ctx) as Record<string, unknown>;
    expect(ev).toBeTruthy();
    expect(ev['type']).toBe('text_delta');
    expect(ev['agent']).toBe('agent-mux-remote');
    expect(ev['delta']).toBe('hello');
  });

  it('parseEvent returns null for non-JSON and typeless payloads', () => {
    const ctx = makeContext();
    expect(adapter.parseEvent('not json', ctx)).toBeNull();
    expect(adapter.parseEvent(JSON.stringify({ no: 'type' }), ctx)).toBeNull();
  });

  it('detectAuth reports authenticated (transport handled externally)', async () => {
    const state = await adapter.detectAuth();
    expect(state.status).toBe('authenticated');
  });
});

describe('AgentMuxRemoteAdapter × invocation modes', () => {
  const adapter = new AgentMuxRemoteAdapter();
  const opts: RunOptions = {
    agent: 'agent-mux-remote',
    prompt: 'hi',
    env: { AMUX_REMOTE_AGENT: 'claude' },
  };

  it('ssh invocation wraps the plain amux command with ssh', () => {
    const sa = adapter.buildSpawnArgs(opts);
    const inv = buildInvocationCommand(
      { mode: 'ssh', host: 'user@example.com', identityFile: '/tmp/key' },
      sa,
      adapter.agent,
    );
    expect(inv.command).toBe('ssh');
    expect(inv.args).toContain('user@example.com');
    const remote = inv.args[inv.args.length - 1] as string;
    expect(remote).toContain('amux');
    expect(remote).toContain('run');
    expect(remote).toContain('claude');
  });

  it('docker invocation wraps the plain amux command with docker run', () => {
    const sa = adapter.buildSpawnArgs(opts);
    const inv = buildInvocationCommand(
      { mode: 'docker', image: 'ghcr.io/a5c-ai/agent-mux:latest' },
      sa,
      adapter.agent,
    );
    expect(inv.command).toBe('docker');
    expect(inv.args[0]).toBe('run');
    expect(inv.args).toContain('ghcr.io/a5c-ai/agent-mux:latest');
    expect(inv.args).toContain('amux');
  });

  it('local invocation returns amux unchanged', () => {
    const sa = adapter.buildSpawnArgs(opts);
    const inv = buildInvocationCommand({ mode: 'local' }, sa, adapter.agent);
    expect(inv.command).toBe('amux');
    expect(inv.args[0]).toBe('run');
  });
});
