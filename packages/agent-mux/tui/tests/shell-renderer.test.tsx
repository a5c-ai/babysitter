import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import {
  ShellStartRenderer,
  ShellStdoutRenderer,
  ShellStderrRenderer,
  ShellExitRenderer,
} from '../src/plugins/shell.js';
import type { AgentEvent } from '@a5c-ai/agent-mux';

const base = { runId: 'r', agent: 'claude-code' as const, timestamp: 't' };

describe('shell event renderers', () => {
  it('shell_start shows command and cwd', () => {
    const ev = { ...base, type: 'shell_start', command: 'ls -la', cwd: '/tmp' } as AgentEvent;
    const { lastFrame } = render(<ShellStartRenderer event={ev} />);
    const f = lastFrame() ?? '';
    expect(f).toContain('ls -la');
    expect(f).toContain('/tmp');
  });

  it('shell_stdout_delta renders the delta', () => {
    const ev = { ...base, type: 'shell_stdout_delta', delta: 'hello world' } as AgentEvent;
    const { lastFrame } = render(<ShellStdoutRenderer event={ev} />);
    expect(lastFrame()).toContain('hello world');
  });

  it('shell_stderr_delta renders in red-ish prefix', () => {
    const ev = { ...base, type: 'shell_stderr_delta', delta: 'boom' } as AgentEvent;
    const { lastFrame } = render(<ShellStderrRenderer event={ev} />);
    expect(lastFrame()).toContain('boom');
  });

  it('shell_exit shows exit code and duration', () => {
    const ev = {
      ...base,
      type: 'shell_exit',
      exitCode: 1,
      durationMs: 250,
    } as AgentEvent;
    const { lastFrame } = render(<ShellExitRenderer event={ev} />);
    const f = lastFrame() ?? '';
    expect(f).toMatch(/exit.*1/);
    expect(f).toContain('250');
  });
});
