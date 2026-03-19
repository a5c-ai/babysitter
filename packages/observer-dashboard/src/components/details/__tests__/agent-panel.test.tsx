import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, setupUser } from '@/test/test-utils';
import { AgentPanel } from '../agent-panel';
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

describe('AgentPanel', () => {
  it('renders null task state with placeholder message', () => {
    render(<AgentPanel task={null} />);
    expect(screen.getByText('Select a task to view details')).toBeInTheDocument();
  });

  it('renders task title from task.title', () => {
    const task = createMockTaskDetail({ title: 'My Cool Task' });
    render(<AgentPanel task={task} />);
    expect(screen.getByText('My Cool Task')).toBeInTheDocument();
  });

  it('falls back to task.label when title is empty', () => {
    const task = createMockTaskDetail({ title: '', label: 'label-fallback' });
    render(<AgentPanel task={task} />);
    expect(screen.getByText('label-fallback')).toBeInTheDocument();
  });

  it('falls back to effectId when title and label are empty', () => {
    const task = createMockTaskDetail({ effectId: 'eff-123', title: '', label: '' });
    render(<AgentPanel task={task} />);
    expect(screen.getByText('eff-123')).toBeInTheDocument();
  });

  it('renders kind badge and status badge', () => {
    const task = createMockTaskDetail({ kind: 'agent', status: 'resolved' });
    render(<AgentPanel task={task} />);
    // KindBadge renders the kind text uppercased
    expect(screen.getByText('agent')).toBeInTheDocument();
    // StatusBadge renders "Done" for resolved
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('renders invocationKey via TruncatedId', () => {
    const task = createMockTaskDetail({ invocationKey: 'inv-abcdef1234' });
    render(<AgentPanel task={task} />);
    // TruncatedId renders last 4 chars with "..." prefix
    expect(screen.getByText('...1234')).toBeInTheDocument();
  });

  it('renders description from input.description when no agent prompt', () => {
    const task = createMockTaskDetail({
      input: { description: 'This is a task description' },
      taskDef: {},
    });
    render(<AgentPanel task={task} />);
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('This is a task description')).toBeInTheDocument();
  });

  it('truncates long descriptions at 500 chars', () => {
    const longDesc = 'A'.repeat(600);
    const task = createMockTaskDetail({
      input: { description: longDesc },
      taskDef: {},
    });
    render(<AgentPanel task={task} />);
    expect(screen.getByText('Description')).toBeInTheDocument();
    const descEl = screen.getByText(/^A+\.\.\.$/);
    expect(descEl.textContent).toHaveLength(503); // 500 chars + "..."
  });

  it('does not render description when agent prompt is present', () => {
    const task = createMockTaskDetail({
      input: { description: 'hidden description' },
      taskDef: {
        agent: {
          prompt: {
            role: 'Developer',
            task: 'Build a thing',
            instructions: ['Step 1'],
          },
        },
      },
    });
    render(<AgentPanel task={task} />);
    expect(screen.queryByText('Description')).not.toBeInTheDocument();
    expect(screen.queryByText('hidden description')).not.toBeInTheDocument();
  });

  it('renders agent prompt role, task, and instructions', () => {
    const task = createMockTaskDetail({
      taskDef: {
        agent: {
          prompt: {
            role: 'Senior Engineer',
            task: 'Refactor the module',
            instructions: ['Read the code', 'Write tests', 'Submit PR'],
          },
        },
      },
    });
    render(<AgentPanel task={task} />);
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('Senior Engineer')).toBeInTheDocument();
    expect(screen.getByText('Task')).toBeInTheDocument();
    expect(screen.getByText('Refactor the module')).toBeInTheDocument();
    expect(screen.getByText('Instructions')).toBeInTheDocument();
    expect(screen.getByText('Read the code')).toBeInTheDocument();
    expect(screen.getByText('Write tests')).toBeInTheDocument();
    expect(screen.getByText('Submit PR')).toBeInTheDocument();
  });

  it('renders numbered instructions', () => {
    const task = createMockTaskDetail({
      taskDef: {
        agent: {
          prompt: {
            role: 'Dev',
            task: 'Do work',
            instructions: ['First', 'Second'],
          },
        },
      },
    });
    render(<AgentPanel task={task} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders result status badge when result has status', () => {
    const task = createMockTaskDetail({
      result: { status: 'ok', output: 'done' },
    });
    render(<AgentPanel task={task} />);
    expect(screen.getByText('Result')).toBeInTheDocument();
    // StatusBadge for "resolved" renders "Done"
    expect(screen.getAllByText('Done').length).toBeGreaterThanOrEqual(1);
  });

  it('renders error section when resultError is present', () => {
    const task = createMockTaskDetail({
      result: { error: { name: 'TypeError', message: 'null is not an object' } },
    });
    render(<AgentPanel task={task} />);
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('TypeError: null is not an object')).toBeInTheDocument();
  });

  it('renders error section from task.error', () => {
    const task = createMockTaskDetail({
      error: { name: 'RuntimeError', message: 'Something broke', stack: 'at line 42' },
      result: undefined,
    });
    render(<AgentPanel task={task} />);
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('RuntimeError: Something broke')).toBeInTheDocument();
  });

  it('expands stack trace on click', async () => {
    const user = setupUser();
    const task = createMockTaskDetail({
      error: { name: 'Err', message: 'Msg', stack: 'Error at file.ts:10\n  at run()' },
      result: undefined,
    });
    render(<AgentPanel task={task} />);

    expect(screen.queryByText('Error at file.ts:10')).not.toBeInTheDocument();

    const stackBtn = screen.getByText('Stack Trace');
    await user.click(stackBtn);

    expect(screen.getByText(/Error at file\.ts:10/)).toBeInTheDocument();
  });

  it('renders result output section', () => {
    const task = createMockTaskDetail({
      result: { result: { value: 42 } },
    });
    render(<AgentPanel task={task} />);
    expect(screen.getByText('Output')).toBeInTheDocument();
  });

  it('shows expand button for long output and expands on click', async () => {
    const user = setupUser();
    const longValue = 'x'.repeat(600);
    const task = createMockTaskDetail({
      result: { result: longValue },
    });
    render(<AgentPanel task={task} />);

    // Should show truncated + expand button
    const expandBtn = screen.getByText(/Expand/);
    expect(expandBtn).toBeInTheDocument();

    await user.click(expandBtn);

    // After expanding, collapse button should appear
    expect(screen.getByText('Collapse')).toBeInTheDocument();
  });

  it('renders copy button for error section', () => {
    const task = createMockTaskDetail({
      error: { name: 'Err', message: 'Broken' },
      result: undefined,
    });
    render(<AgentPanel task={task} />);
    const copyButtons = screen.getAllByTitle('Copy to clipboard');
    expect(copyButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders with minimal task data (no input, no result, no error)', () => {
    const task = createMockTaskDetail({
      input: undefined,
      result: undefined,
      error: undefined,
      taskDef: undefined,
    });
    render(<AgentPanel task={task} />);
    // Should still render the title
    expect(screen.getByText(task.title)).toBeInTheDocument();
  });
});
