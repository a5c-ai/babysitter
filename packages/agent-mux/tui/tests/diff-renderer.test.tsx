import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { DiffRenderer } from '../src/plugins/diff.js';
import type { AgentEvent } from '@a5c-ai/agent-mux';

const makePatch = (diff: string): AgentEvent =>
  ({
    type: 'file_patch',
    runId: 'r',
    agent: 'claude-code',
    timestamp: 't',
    path: 'src/foo.ts',
    diff,
  }) as AgentEvent;

describe('file_patch diff renderer', () => {
  it('colors added/removed/context lines', () => {
    const diff = [
      '--- a/src/foo.ts',
      '+++ b/src/foo.ts',
      '@@ -1,3 +1,3 @@',
      ' keep me',
      '-old line',
      '+new line',
    ].join('\n');
    const { lastFrame } = render(<DiffRenderer event={makePatch(diff)} />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('src/foo.ts');
    expect(frame).toContain('-old line');
    expect(frame).toContain('+new line');
    expect(frame).toContain(' keep me');
  });

  it('shows path and total +/- counts in the header', () => {
    const diff = [
      '@@ -1,2 +1,3 @@',
      ' a',
      '+b',
      '+c',
      '-d',
    ].join('\n');
    const { lastFrame } = render(<DiffRenderer event={makePatch(diff)} />);
    const frame = lastFrame() ?? '';
    expect(frame).toMatch(/\+2/);
    expect(frame).toMatch(/-1/);
  });
});
