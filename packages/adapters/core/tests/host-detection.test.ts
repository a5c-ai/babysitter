import { describe, it, expect } from 'vitest';
import { detectHostHarness, DEFAULT_HOST_SIGNALS, DEFAULT_HOST_METADATA } from '../src/host-detection.js';

describe('host metadata extraction', () => {
  it('extracts claude-code session_id, env_file, project_dir', () => {
    const r = detectHostHarness({
      env: {
        CLAUDECODE: '1',
        CLAUDE_CODE_SESSION_ID: 'sess-abc',
        CLAUDE_ENV_FILE: '/tmp/claude.env',
        CLAUDE_PROJECT_DIR: '/work/foo',
      },
      argv: [],
    });
    expect(r!.metadata).toMatchObject({
      session_id: 'sess-abc',
      env_file: '/tmp/claude.env',
      project_dir: '/work/foo',
    });
  });
  it('extracts codex session_id + run_id', () => {
    const r = detectHostHarness({ env: { CODEX_SESSION_ID: 's1', CODEX_RUN_ID: 'r1' }, argv: [] });
    expect(r!.metadata).toEqual({ session_id: 's1', run_id: 'r1' });
  });
  it('extracts codex session_id from CODEX_THREAD_ID when session_id is otherwise absent', () => {
    const r = detectHostHarness({ env: { CODEX_THREAD_ID: 'thread-1' }, argv: [] });
    expect(r!.metadata).toEqual({ session_id: 'thread-1' });
  });
  it('extracts gemini session_id', () => {
    const r = detectHostHarness({ env: { GEMINI_CLI: '1', GEMINI_SESSION_ID: 'g1' }, argv: [] });
    expect(r!.metadata).toEqual({ session_id: 'g1' });
  });
  it('extracts copilot session_id falling back to GH_COPILOT_SESSION', () => {
    const r = detectHostHarness({ env: { GH_COPILOT_SESSION: 'gh1' }, argv: [] });
    expect(r!.metadata).toEqual({ session_id: 'gh1' });
  });
  it('returns undefined metadata when no env vars populate', () => {
    const r = detectHostHarness({ env: { OPENCODE_SESSION: 's' }, argv: [] });
    // Has session_id but run_id is null, so trimmed to just session_id
    expect(r!.metadata).toEqual({ session_id: 's' });
  });
  it('custom metadata reader overrides default', () => {
    const r = detectHostHarness({
      env: { CLAUDECODE: '1' },
      argv: [],
      metadata: { claude: () => ({ custom: 'yes' }) },
    });
    expect(r!.metadata).toEqual({ custom: 'yes' });
  });
  it('DEFAULT_HOST_METADATA has readers for all 10 built-in agents', () => {
    const agents = ['claude', 'codex', 'gemini', 'copilot', 'cursor', 'opencode', 'pi', 'omp', 'openclaw', 'hermes'];
    for (const a of agents) {
      expect(typeof DEFAULT_HOST_METADATA[a]).toBe('function');
    }
  });
});

describe('detectHostHarness', () => {
  it('returns null when no signals are set', () => {
    const r = detectHostHarness({ env: {}, argv: ['node', 'script.js'] });
    expect(r).toBeNull();
  });

  it('detects claude via CLAUDECODE with medium confidence (single signal)', () => {
    const r = detectHostHarness({ env: { CLAUDECODE: '1' }, argv: [] });
    expect(r).not.toBeNull();
    expect(r!.agent).toBe('claude');
    expect(r!.source).toBe('env');
    expect(r!.confidence).toBe('medium');
    expect(r!.matchedSignals).toContain('CLAUDECODE');
  });

  it('detects claude with high confidence when multiple claude signals match', () => {
    const r = detectHostHarness({
      env: { CLAUDECODE: '1', CLAUDE_CODE_SESSION_ID: 'abc' },
      argv: [],
    });
    expect(r!.agent).toBe('claude');
    expect(r!.confidence).toBe('high');
  });

  it('detects codex via CODEX_SESSION_ID', () => {
    const r = detectHostHarness({ env: { CODEX_SESSION_ID: 's1' }, argv: [] });
    expect(r!.agent).toBe('codex');
  });

  it('detects codex via CODEX_THREAD_ID', () => {
    const r = detectHostHarness({ env: { CODEX_THREAD_ID: 'thread-1' }, argv: [] });
    expect(r!.agent).toBe('codex');
  });

  it('detects gemini via GEMINI_CLI', () => {
    const r = detectHostHarness({ env: { GEMINI_CLI: '1' }, argv: [] });
    expect(r!.agent).toBe('gemini');
  });

  it('detects copilot via COPILOT_CLI_SESSION', () => {
    const r = detectHostHarness({ env: { COPILOT_CLI_SESSION: 's' }, argv: [] });
    expect(r!.agent).toBe('copilot');
  });

  it('detects cursor via CURSOR_SESSION', () => {
    const r = detectHostHarness({ env: { CURSOR_SESSION: 's' }, argv: [] });
    expect(r!.agent).toBe('cursor');
  });

  it('detects opencode via OPENCODE_SESSION', () => {
    const r = detectHostHarness({ env: { OPENCODE_SESSION: 's' }, argv: [] });
    expect(r!.agent).toBe('opencode');
  });

  it('detects pi via PI_RUN_ID', () => {
    const r = detectHostHarness({ env: { PI_RUN_ID: 'r1' }, argv: [] });
    expect(r!.agent).toBe('pi');
  });

  it('detects omp via OMP_RUN_ID', () => {
    const r = detectHostHarness({ env: { OMP_RUN_ID: 'r1' }, argv: [] });
    expect(r!.agent).toBe('omp');
  });

  it('detects openclaw via OPENCLAW_SESSION', () => {
    const r = detectHostHarness({ env: { OPENCLAW_SESSION: 's' }, argv: [] });
    expect(r!.agent).toBe('openclaw');
  });

  it('detects hermes via HERMES_SESSION', () => {
    const r = detectHostHarness({ env: { HERMES_SESSION: 's' }, argv: [] });
    expect(r!.agent).toBe('hermes');
  });

  it('precedence: agent with more matched signals wins when multiple present', () => {
    const r = detectHostHarness({
      env: {
        CODEX_SESSION_ID: 's', // 1 codex signal
        CLAUDECODE: '1',       // 2 claude signals
        CLAUDE_CODE_SESSION_ID: 'x',
      },
      argv: [],
    });
    expect(r!.agent).toBe('claude');
    expect(r!.confidence).toBe('high');
  });

  it('ignores empty-string env values', () => {
    const r = detectHostHarness({ env: { CLAUDECODE: '' }, argv: [] });
    expect(r).toBeNull();
  });

  it('argv fallback detects claude with low confidence', () => {
    const r = detectHostHarness({ env: {}, argv: ['/usr/bin/node', '/opt/claude-code/cli.js'] });
    expect(r).not.toBeNull();
    expect(r!.agent).toBe('claude');
    expect(r!.source).toBe('argv');
    expect(r!.confidence).toBe('low');
  });

  it('accepts extra signal overrides for plugin adapters', () => {
    const r = detectHostHarness({
      env: { MY_PLUGIN_SESSION: 'abc' },
      argv: [],
      signals: { myplugin: ['MY_PLUGIN_SESSION'] },
    });
    expect(r!.agent).toBe('myplugin');
  });

  it('DEFAULT_HOST_SIGNALS covers all ten built-in harnesses', () => {
    const agents = Object.keys(DEFAULT_HOST_SIGNALS);
    for (const a of ['claude', 'codex', 'gemini', 'copilot', 'cursor', 'opencode', 'pi', 'omp', 'openclaw', 'hermes']) {
      expect(agents).toContain(a);
    }
  });
});
