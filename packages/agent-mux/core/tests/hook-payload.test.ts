import { describe, it, expect } from 'vitest';
import {
  parseHookPayload,
  formatHookResult,
  getHookCatalog,
  isKnownHookType,
  HOOK_CATALOG,
} from '../src/index.js';

describe('parseHookPayload', () => {
  it('normalizes claude PreToolUse payload', () => {
    const p = parseHookPayload('claude', 'PreToolUse', {
      session_id: 'sess-1',
      tool_name: 'Bash',
      tool_input: { command: 'ls' },
      cwd: '/work/x',
      extra: 'kept-in-raw',
    });
    expect(p.agent).toBe('claude');
    expect(p.hookType).toBe('PreToolUse');
    expect(p.sessionId).toBe('sess-1');
    expect(p.data).toMatchObject({ tool_name: 'Bash', tool_input: { command: 'ls' }, cwd: '/work/x' });
    expect(p.data['extra']).toBeUndefined();
    expect(p.raw['extra']).toBe('kept-in-raw');
  });

  it('handles sessionId alias', () => {
    const p = parseHookPayload('codex', 'OnStop', { sessionId: 'xyz' });
    expect(p.sessionId).toBe('xyz');
  });

  it('returns empty data for non-object payload', () => {
    const p = parseHookPayload('claude', 'Stop', 'just a string');
    expect(p.data).toEqual({});
    expect(p.raw).toEqual({});
  });

  it('generates a timestamp', () => {
    const p = parseHookPayload('claude', 'Stop', {});
    expect(p.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('formatHookResult', () => {
  it('emits decision JSON and exit 0 on allow', () => {
    const { stdout, exitCode } = formatHookResult('claude', 'Stop', { decision: 'allow' });
    expect(exitCode).toBe(0);
    expect(JSON.parse(stdout.split('\n')[0])).toEqual({ decision: 'allow' });
  });

  it('maps deny → exit code 2', () => {
    const { exitCode } = formatHookResult('claude', 'Stop', { decision: 'deny', message: 'nope' });
    expect(exitCode).toBe(2);
  });

  it('appends extra stdout after JSON body', () => {
    const { stdout } = formatHookResult('claude', 'Stop', {
      decision: 'allow',
      stdout: 'extra-line\n',
    });
    expect(stdout).toContain('extra-line');
    expect(stdout).toContain('"decision":"allow"');
  });

  it('preserves explicit exitCode on non-deny', () => {
    const { exitCode } = formatHookResult('claude', 'Stop', { decision: 'allow', exitCode: 42 });
    expect(exitCode).toBe(42);
  });

  it('modifiedInput is included in JSON body', () => {
    const { stdout } = formatHookResult('claude', 'PreToolUse', {
      decision: 'modify',
      modifiedInput: { tool_input: { command: 'safer' } },
    });
    expect(stdout).toContain('"modifiedInput"');
    expect(stdout).toContain('safer');
  });
});

describe('hook catalog', () => {
  it('returns claude hook types', () => {
    const entries = getHookCatalog('claude');
    const names = entries.map((e) => e.name);
    expect(names).toContain('PreToolUse');
    expect(names).toContain('Stop');
  });

  it('isKnownHookType yields true for catalogued types', () => {
    expect(isKnownHookType('codex', 'OnStop')).toBe(true);
    expect(isKnownHookType('codex', 'DoesNotExist')).toBe(false);
    expect(isKnownHookType('unknown-agent', 'x')).toBe(false);
  });

  it('covers all 10 built-in harnesses', () => {
    for (const a of ['claude','codex','gemini','copilot','cursor','opencode','pi','omp','openclaw','hermes']) {
      expect(HOOK_CATALOG[a]).toBeDefined();
      expect(HOOK_CATALOG[a].length).toBeGreaterThan(0);
    }
  });
});
