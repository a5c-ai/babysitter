import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, setupUser } from '@/test/test-utils';
import { LogViewer } from '../log-viewer';
import { createMockTaskDetail } from '@/test/fixtures';

// Mock clipboard
beforeEach(() => {
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

describe('LogViewer', () => {
  it('renders null task state with placeholder message', () => {
    render(<LogViewer task={null} />);
    expect(screen.getByText('Select a task to view logs')).toBeInTheDocument();
  });

  it('renders "No logs captured" for non-agent task with no stdout/stderr', () => {
    const base = createMockTaskDetail({ kind: 'node' });
    const task = { ...base, stdout: undefined, stderr: undefined, result: undefined };
    render(<LogViewer task={task} />);
    expect(screen.getByText('No logs captured for this task.')).toBeInTheDocument();
  });

  it('renders agent hint when agent task has no logs and no result', () => {
    const base = createMockTaskDetail({ kind: 'agent' });
    const task = { ...base, stdout: undefined, stderr: undefined, result: undefined };
    render(<LogViewer task={task} />);
    expect(screen.getByText(/Agent tasks don't produce stdout\/stderr/)).toBeInTheDocument();
  });

  it('renders skill hint when skill task has no logs and no result', () => {
    const base = createMockTaskDetail({ kind: 'skill' });
    const task = { ...base, stdout: undefined, stderr: undefined, result: undefined };
    render(<LogViewer task={task} />);
    expect(screen.getByText(/Agent tasks don't produce stdout\/stderr/)).toBeInTheDocument();
  });

  it('renders stdout section with correct label and content', () => {
    const task = createMockTaskDetail({
      stdout: 'Hello world\nLine two',
      stderr: undefined,
    });
    render(<LogViewer task={task} />);
    expect(screen.getByText('stdout')).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('Line two')).toBeInTheDocument();
  });

  it('renders stderr section with correct label and content', () => {
    const task = createMockTaskDetail({
      stdout: undefined,
      stderr: 'Error: something failed',
    });
    render(<LogViewer task={task} />);
    expect(screen.getByText('stderr')).toBeInTheDocument();
    expect(screen.getByText('Error: something failed')).toBeInTheDocument();
  });

  it('renders both stdout and stderr sections', () => {
    const task = createMockTaskDetail({
      stdout: 'Standard output text',
      stderr: 'Standard error text',
    });
    render(<LogViewer task={task} />);
    expect(screen.getByText('stdout')).toBeInTheDocument();
    expect(screen.getByText('stderr')).toBeInTheDocument();
    expect(screen.getByText('Standard output text')).toBeInTheDocument();
    expect(screen.getByText('Standard error text')).toBeInTheDocument();
  });

  it('renders line numbers for stdout', () => {
    const task = createMockTaskDetail({
      stdout: 'Line A\nLine B\nLine C',
      stderr: undefined,
    });
    render(<LogViewer task={task} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders agent output section when agent task has result but no process logs', () => {
    const base = createMockTaskDetail({
      kind: 'agent',
      result: { result: { message: 'Agent completed' } },
    });
    // Explicitly remove stdout/stderr so hasProcessLogs is false
    const task = { ...base, stdout: undefined, stderr: undefined };
    render(<LogViewer task={task} />);
    expect(screen.getByText('output')).toBeInTheDocument();
  });

  it('does not render agent output section when stdout is present', () => {
    const task = createMockTaskDetail({
      kind: 'agent',
      stdout: 'Some stdout',
      stderr: undefined,
      result: { result: 'agent output' },
    });
    render(<LogViewer task={task} />);
    // Should show stdout, not the "output" section
    expect(screen.getByText('stdout')).toBeInTheDocument();
    expect(screen.queryByText('output')).not.toBeInTheDocument();
  });

  it('renders copy button for each log section', () => {
    const task = createMockTaskDetail({
      stdout: 'some stdout',
      stderr: 'some stderr',
    });
    render(<LogViewer task={task} />);
    const copyButtons = screen.getAllByText('Copy');
    expect(copyButtons).toHaveLength(2);
  });

  it('shows "Show all N lines" button for long stdout', () => {
    // Generate >100 lines
    const lines = Array.from({ length: 120 }, (_, i) => `Line ${i + 1}`).join('\n');
    const task = createMockTaskDetail({
      stdout: lines,
      stderr: undefined,
    });
    render(<LogViewer task={task} />);
    expect(screen.getByText('Show all 120 lines')).toBeInTheDocument();
  });

  it('expands long stdout on "Show all" click', async () => {
    const user = setupUser();
    const lines = Array.from({ length: 120 }, (_, i) => `Line ${i + 1}`).join('\n');
    const task = createMockTaskDetail({
      stdout: lines,
      stderr: undefined,
    });
    render(<LogViewer task={task} />);

    const showAllBtn = screen.getByText('Show all 120 lines');
    await user.click(showAllBtn);

    // After expansion, the "Show all" button should disappear
    expect(screen.queryByText('Show all 120 lines')).not.toBeInTheDocument();
    // Line 120 should now be visible
    expect(screen.getByText('Line 120')).toBeInTheDocument();
  });

  it('renders empty stderr without rendering stderr section', () => {
    const task = createMockTaskDetail({
      stdout: 'output',
      stderr: '',
    });
    render(<LogViewer task={task} />);
    expect(screen.getByText('stdout')).toBeInTheDocument();
    // Empty string is falsy, so stderr section should not render
    expect(screen.queryByText('stderr')).not.toBeInTheDocument();
  });
});
