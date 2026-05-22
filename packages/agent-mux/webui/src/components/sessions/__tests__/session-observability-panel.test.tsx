/** @vitest-environment jsdom */

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import type { WorkspaceRuntimeSurface } from '@a5c-ai/agent-mux-core';

import { render, screen } from '@/test/test-utils';
import { SessionObservabilityPanel } from '../session-observability-panel';

const mockBuildSessionFlowModel = vi.fn();
const mockBuildRunArtifactShortcuts = vi.fn();

vi.mock('@a5c-ai/agent-mux-ui/session-flow', () => ({
  buildSessionFlowModel: (...args: unknown[]) => mockBuildSessionFlowModel(...args),
}));

vi.mock('@/lib/babysitter-overlays', () => ({
  buildRunArtifactShortcuts: (...args: unknown[]) => mockBuildRunArtifactShortcuts(...args),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('lucide-react', () => ({
  AlertTriangle: () => <svg aria-hidden="true" />,
  ArrowUpRight: () => <svg aria-hidden="true" />,
  CheckCircle2: () => <svg aria-hidden="true" />,
  Hand: () => <svg aria-hidden="true" />,
  TerminalSquare: () => <svg aria-hidden="true" />,
}));

vi.mock('@a5c-ai/compendium', () => ({
  Tabs: ({
    value,
    onChange,
    items,
  }: {
    value: string;
    onChange: (value: string) => void;
    items: Array<{ value: string; label: string; body: React.ReactNode }>;
  }) => (
    <div>
      <div role="tablist">
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={item.value === value}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div>{items.find((item) => item.value === value)?.body}</div>
    </div>
  ),
}));

describe('SessionObservabilityPanel', () => {
  beforeEach(() => {
    mockBuildRunArtifactShortcuts.mockReset();
    mockBuildSessionFlowModel.mockReset();
    mockBuildRunArtifactShortcuts.mockReturnValue([]);
  });

  it('switches tabs and shows empty states for each realtime view', async () => {
    mockBuildSessionFlowModel.mockReturnValue({
      lanes: [],
      timeline: [],
      transcript: [],
      files: [],
      summary: {
        totalRuns: 0,
        totalSegments: 0,
        totalTools: 0,
        pendingTools: 0,
        fileCount: 0,
        totalUsd: null,
      },
    });

    const user = userEvent.setup();
    render(<SessionObservabilityPanel sessionId="session-1" runs={[]} eventBuffers={{}} />);

    expect(screen.getByText('No structured execution flow is available for this session yet.')).toBeTruthy();

    expect(screen.getByRole('tab', { name: 'Trace' })).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: 'Files' }));
    expect(screen.getByText('File attention will appear here once the session touches the workspace.')).toBeTruthy();
  });

  it('renders realtime trace and file attention when flow data exists', async () => {
    mockBuildSessionFlowModel.mockReturnValue({
      lanes: [
        {
          runId: 'run-1',
          laneKey: 'run-1',
          agent: 'codex',
          status: 'running',
          startedAt: 1_000,
          lastEventAt: 1_500,
          segmentCount: 1,
          toolCount: 1,
          totalUsd: 0.12,
          segments: [
            {
              id: 'seg-1',
              kind: 'tool',
              title: 'Write',
              detail: 'Editing src/panel.tsx',
              weight: 1,
              startedAt: 1_000,
              endedAt: null,
              status: 'running',
              filePaths: ['src/panel.tsx'],
            },
          ],
        },
      ],
      timeline: [
        {
          id: 'timeline-1',
          runId: 'run-1',
          laneKey: 'run-1',
          kind: 'tool',
          title: 'Write',
          detail: 'Editing src/panel.tsx',
          timestamp: 1_100,
          status: 'running',
          filePaths: ['src/panel.tsx'],
        },
      ],
      transcript: [
        {
          id: 'transcript-1',
          runId: 'run-1',
          kind: 'assistant',
          label: 'Assistant',
          text: 'Realtime panel updated.',
          timestamp: 1_200,
          filePaths: ['src/panel.tsx'],
        },
      ],
      files: [
        {
          path: 'src/panel.tsx',
          reads: 1,
          writes: 1,
          touches: 2,
          lastEventAt: 1_300,
          runIds: ['run-1'],
          tools: ['Write'],
        },
      ],
      summary: {
        totalRuns: 1,
        totalSegments: 1,
        totalTools: 1,
        pendingTools: 1,
        fileCount: 1,
        totalUsd: 0.12,
      },
    });

    render(<SessionObservabilityPanel sessionId="session-1" runs={[{ runId: 'run-1' }]} eventBuffers={{}} />);

    expect(screen.getByText('Editing src/panel.tsx')).toBeTruthy();

    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'Files' }));
    expect(screen.getByText('src/panel.tsx')).toBeTruthy();
    expect(screen.getByText('2 touches')).toBeTruthy();
  });

  it('renders actionable links for run, breakpoint, task, file, workspace, and runtime affordances', async () => {
    mockBuildRunArtifactShortcuts.mockReturnValue([
      {
        runId: 'run-1',
        breakpointEffectId: 'bp-1',
        errorEffectId: 'task-1',
      },
    ]);
    mockBuildSessionFlowModel.mockReturnValue({
      lanes: [
        {
          runId: 'run-1',
          laneKey: 'run-1',
          agent: 'codex',
          status: 'running',
          startedAt: 1_000,
          lastEventAt: 1_500,
          segmentCount: 1,
          toolCount: 1,
          totalUsd: 0.12,
          segments: [
            {
              id: 'seg-1',
              kind: 'tool',
              title: 'Write',
              detail: 'Editing src/panel.tsx',
              weight: 1,
              startedAt: 1_000,
              endedAt: null,
              status: 'running',
              filePaths: ['src/panel.tsx'],
            },
          ],
        },
      ],
      timeline: [
        {
          id: 'timeline-1',
          runId: 'run-1',
          laneKey: 'run-1',
          kind: 'tool',
          title: 'Write',
          detail: 'Editing src/panel.tsx',
          timestamp: 1_100,
          status: 'running',
          filePaths: ['src/panel.tsx'],
        },
      ],
      transcript: [
        {
          id: 'transcript-1',
          runId: 'run-1',
          kind: 'assistant',
          label: 'Assistant',
          text: 'Realtime panel updated.',
          timestamp: 1_200,
          filePaths: ['src/panel.tsx'],
        },
      ],
      files: [
        {
          path: 'src/panel.tsx',
          reads: 1,
          writes: 1,
          touches: 2,
          lastEventAt: 1_300,
          runIds: ['run-1'],
          tools: ['Write'],
        },
      ],
      summary: {
        totalRuns: 1,
        totalSegments: 1,
        totalTools: 1,
        pendingTools: 1,
        fileCount: 1,
        totalUsd: 0.12,
      },
    });

    const user = userEvent.setup();
    render(
      <SessionObservabilityPanel
        sessionId="session-1"
        runs={[{ runId: 'run-1', cwd: '/repo/worktrees/task-1' }]}
        eventBuffers={{}}
        workspacePath="/repo/worktrees/task-1"
        runtime={{ preview: { primaryUrl: 'http://localhost:3000' } } as WorkspaceRuntimeSurface}
      />,
    );

    expect(screen.getAllByRole('link', { name: 'Open dispatch' }).some((link) => link.getAttribute('href') === '/dispatches/run-1')).toBe(true);
    expect(
      screen.getAllByRole('link', { name: 'Review breakpoint' }).some((link) => link.getAttribute('href') === '/dispatches/run-1?effectId=bp-1'),
    ).toBe(true);
    expect(
      screen.getAllByRole('link', { name: 'Open failed task' }).some((link) => link.getAttribute('href') === '/dispatches/run-1?effectId=task-1'),
    ).toBe(true);
    expect(
      screen.getAllByRole('link', { name: 'Open file' }).some((link) => link.getAttribute('href') === 'vscode://file/repo/worktrees/task-1/src/panel.tsx'),
    ).toBe(true);
    expect(
      screen.getAllByRole('link', { name: 'Open workspace' }).some((link) => link.getAttribute('href') === 'vscode://file/repo/worktrees/task-1'),
    ).toBe(true);
    expect(
      screen.getAllByRole('link', { name: 'Open runtime' }).some((link) => link.getAttribute('href') === 'http://localhost:3000'),
    ).toBe(true);

    await user.click(screen.getByRole('tab', { name: 'Files' }));
    expect(screen.getByText('src/panel.tsx')).toBeTruthy();
    expect(
      screen.getAllByRole('link', { name: 'Open workspace' }).some((link) => link.getAttribute('href') === 'vscode://file/repo/worktrees/task-1'),
    ).toBe(true);
  });
});
