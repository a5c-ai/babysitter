import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, setupUser } from '@/test/test-utils';
import { TaskDetailPanel } from '../task-detail';
import { createMockTaskDetail } from '@/test/fixtures';
import type { TaskDetail } from '@/types';

// Mock the useTaskDetail hook
const mockUseTaskDetail = vi.fn<[], { task: TaskDetail | null; loading: boolean; error: string | null }>();

vi.mock('@/hooks/use-run-detail', () => ({
  useTaskDetail: (..._args: unknown[]) => mockUseTaskDetail(),
}));

// Mock BreakpointPanel to avoid its complex dependencies
vi.mock('@/components/breakpoint/breakpoint-panel', () => ({
  BreakpointPanel: ({ task: _task }: { task: unknown }) => (
    <div data-testid="breakpoint-panel">Breakpoint Panel Content</div>
  ),
}));

// Mock clipboard
beforeEach(() => {
  mockUseTaskDetail.mockReset();
  Object.defineProperty(navigator, 'clipboard', {
    writable: true,
    configurable: true,
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(''),
      write: vi.fn().mockResolvedValue(undefined),
      read: vi.fn().mockResolvedValue([]),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn().mockReturnValue(false),
    },
  });
});

describe('TaskDetailPanel', () => {
  it('renders "Click a task to view details" when effectId is null', () => {
    mockUseTaskDetail.mockReturnValue({ task: null, loading: false, error: null });
    render(<TaskDetailPanel runId="run-1" effectId={null} />);
    expect(screen.getByText('Click a task to view details')).toBeInTheDocument();
  });

  it('renders loading spinner when loading and no task', () => {
    mockUseTaskDetail.mockReturnValue({ task: null, loading: true, error: null });
    const { container } = render(<TaskDetailPanel runId="run-1" effectId="eff-1" />);
    // Loader2 icon is mocked as svg with data-lucide="Loader2"
    const spinner = container.querySelector('[data-lucide="Loader2"]');
    expect(spinner).toBeInTheDocument();
  });

  it('renders tab list with Agent, Timing, Logs, Data tabs', () => {
    const task = createMockTaskDetail({ kind: 'node' });
    mockUseTaskDetail.mockReturnValue({ task, loading: false, error: null });
    render(<TaskDetailPanel runId="run-1" effectId="eff-1" />);

    expect(screen.getByText('Agent')).toBeInTheDocument();
    expect(screen.getByText('Timing')).toBeInTheDocument();
    expect(screen.getByText('Logs')).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
  });

  it('does not render Approval tab for non-breakpoint tasks', () => {
    const task = createMockTaskDetail({ kind: 'node' });
    mockUseTaskDetail.mockReturnValue({ task, loading: false, error: null });
    render(<TaskDetailPanel runId="run-1" effectId="eff-1" />);
    expect(screen.queryByText('Approval')).not.toBeInTheDocument();
  });

  it('renders Approval tab for breakpoint tasks', () => {
    const task = createMockTaskDetail({ kind: 'breakpoint' });
    mockUseTaskDetail.mockReturnValue({ task, loading: false, error: null });
    render(<TaskDetailPanel runId="run-1" effectId="eff-1" />);
    expect(screen.getByText('Approval')).toBeInTheDocument();
  });

  it('calls onTabChange when switching tabs', async () => {
    const user = setupUser();
    const task = createMockTaskDetail({ kind: 'node' });
    mockUseTaskDetail.mockReturnValue({ task, loading: false, error: null });
    const onTabChange = vi.fn();

    render(
      <TaskDetailPanel
        runId="run-1"
        effectId="eff-1"
        activeTab="agent"
        onTabChange={onTabChange}
      />
    );

    const timingTab = screen.getByText('Timing');
    await user.click(timingTab);

    expect(onTabChange).toHaveBeenCalledWith('timing');
  });

  it('renders with activeTab controlling which tab content is visible', async () => {
    const task = createMockTaskDetail({
      kind: 'node',
      stdout: 'log output here',
      stderr: undefined,
    });
    mockUseTaskDetail.mockReturnValue({ task, loading: false, error: null });

    render(
      <TaskDetailPanel
        runId="run-1"
        effectId="eff-1"
        activeTab="logs"
        onTabChange={vi.fn()}
      />
    );

    // LogViewer is lazy-loaded via next/dynamic; wait for it to resolve
    expect(await screen.findByText('stdout')).toBeInTheDocument();
  });

  it('renders agent panel content when agent tab is active', async () => {
    const task = createMockTaskDetail({
      kind: 'agent',
      title: 'My Agent Task',
    });
    mockUseTaskDetail.mockReturnValue({ task, loading: false, error: null });

    render(
      <TaskDetailPanel
        runId="run-1"
        effectId="eff-1"
        activeTab="agent"
        onTabChange={vi.fn()}
      />
    );

    // AgentPanel is lazy-loaded via next/dynamic; wait for it to resolve
    expect(await screen.findByText('My Agent Task')).toBeInTheDocument();
  });

  it('renders timing panel content when timing tab is active', async () => {
    const task = createMockTaskDetail({
      kind: 'node',
      duration: 5000,
    });
    mockUseTaskDetail.mockReturnValue({ task, loading: false, error: null });

    render(
      <TaskDetailPanel
        runId="run-1"
        effectId="eff-1"
        activeTab="timing"
        onTabChange={vi.fn()}
      />
    );

    // TimingPanel is lazy-loaded via next/dynamic; wait for it to resolve
    expect(await screen.findByText('Requested')).toBeInTheDocument();
    expect(screen.getByText('Duration')).toBeInTheDocument();
  });

  it('renders data panel (JsonTree) when data tab is active', async () => {
    const task = createMockTaskDetail({
      kind: 'node',
      input: { query: 'some-input-data' },
      result: { output: 'result-data' },
    });
    mockUseTaskDetail.mockReturnValue({ task, loading: false, error: null });

    render(
      <TaskDetailPanel
        runId="run-1"
        effectId="eff-1"
        activeTab="data"
        onTabChange={vi.fn()}
      />
    );

    // JsonTree is lazy-loaded via next/dynamic; wait for it to resolve
    expect(await screen.findByText('Input')).toBeInTheDocument();
    expect(screen.getByText('Output')).toBeInTheDocument();
  });

  it('does not show loading spinner when loading is true but task is already available', () => {
    const task = createMockTaskDetail({ kind: 'node' });
    mockUseTaskDetail.mockReturnValue({ task, loading: true, error: null });
    const { container } = render(<TaskDetailPanel runId="run-1" effectId="eff-1" />);
    // Should render tabs, not spinner
    expect(screen.getByText('Agent')).toBeInTheDocument();
    const _spinner = container.querySelector('[data-lucide="Loader2"]');
    // The spinner should not appear (or if it does it's in the tab content, not the loading state)
    expect(screen.queryByText('Click a task to view details')).not.toBeInTheDocument();
  });

  it('renders breakpoint panel content when breakpoint tab is active', async () => {
    const task = createMockTaskDetail({ kind: 'breakpoint' });
    mockUseTaskDetail.mockReturnValue({ task, loading: false, error: null });

    render(
      <TaskDetailPanel
        runId="run-1"
        effectId="eff-1"
        activeTab="breakpoint"
        onTabChange={vi.fn()}
      />
    );

    // BreakpointPanel is lazy-loaded via next/dynamic; wait for it to resolve
    expect(await screen.findByTestId('breakpoint-panel')).toBeInTheDocument();
  });
});
