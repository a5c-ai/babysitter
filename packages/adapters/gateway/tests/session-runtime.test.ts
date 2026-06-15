import { describe, expect, it } from 'vitest';

import { buildWorkspaceRuntimeSurface } from '../src/runs/session-runtime.js';
import type { LoggedRunEvent } from '../src/runs/event-log.js';
import type { RunEntry } from '../src/runs/types.js';

describe('workspace runtime surface derivation', () => {
  it('extracts preview, terminal, and dev-server data from shell events', () => {
    const run: RunEntry = {
      runId: '01TESTRUNTIME000000000000001',
      agent: 'codex',
      status: 'running',
      createdAt: 1,
      startedAt: 1,
      endedAt: null,
      owner: { tokenId: null, name: 'tester' },
    };

    const events: LoggedRunEvent[] = [
      {
        seq: 1,
        ts: 10,
        source: 'agent',
        event: {
          type: 'shell_start',
          command: 'pnpm dev --port 3000',
          cwd: '/repo/worktrees/task',
        },
      },
      {
        seq: 2,
        ts: 20,
        source: 'agent',
        event: {
          type: 'shell_stdout_delta',
          delta: 'ready in 850ms\nLocal: http://127.0.0.1:3000/\n',
        },
      },
    ];

    const runtime = buildWorkspaceRuntimeSurface({
      cwd: '/repo/worktrees/task',
      runs: [run],
      eventsByRunId: new Map([[run.runId, events]]),
    });

    expect(runtime).toBeDefined();
    expect(runtime?.preview.primaryUrl).toBe('http://127.0.0.1:3000/');
    expect(runtime?.preview.status).toBe('ready');
    expect(runtime?.devServer.status).toBe('running');
    expect(runtime?.devServer.command).toBe('pnpm dev --port 3000');
    expect(runtime?.devServer.port).toBe(3000);
    expect(runtime?.terminal.status).toBe('active');
    expect(runtime?.terminal.commands[0]).toMatchObject({
      source: 'shell',
      command: 'pnpm dev --port 3000',
      status: 'running',
    });
  });

  it('retains long process buffers instead of truncating them to a tiny tail', () => {
    const run: RunEntry = {
      runId: '01TESTRUNTIME000000000000002',
      agent: 'codex',
      status: 'running',
      createdAt: 1,
      startedAt: 1,
      endedAt: null,
      owner: { tokenId: null, name: 'tester' },
    };

    const events: LoggedRunEvent[] = [
      {
        seq: 1,
        ts: 10,
        source: 'agent',
        event: {
          type: 'shell_start',
          command: 'pnpm vitest run workspace-runtime-panel.test.tsx',
          cwd: '/repo/worktrees/task',
        },
      },
      ...Array.from({ length: 30 }, (_, index) => ({
        seq: index + 2,
        ts: index + 20,
        source: 'agent' as const,
        event: {
          type: 'shell_stdout_delta',
          delta: `line ${index + 1}\n`,
        },
      })),
    ];

    const runtime = buildWorkspaceRuntimeSurface({
      cwd: '/repo/worktrees/task',
      runs: [run],
      eventsByRunId: new Map([[run.runId, events]]),
    });

    expect(runtime?.terminal.commands[0]?.logs).toHaveLength(30);
    expect(runtime?.terminal.commands[0]?.logs[0]?.text).toBe('line 1');
    expect(runtime?.terminal.commands[0]?.logs[29]?.text).toBe('line 30');
  });
});
