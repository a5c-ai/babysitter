import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, setupUser } from '@/test/test-utils';
import { StepCard } from '../step-card';
import {
  createMockTaskEffect,
  resetIdCounter,
} from '@/test/fixtures';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) =>
    React.createElement('a', { href, ...props }, children),
}));

describe('StepCard', () => {
  const defaultProps = {
    runId: 'run-001',
    onSelect: vi.fn(),
    isSelected: false,
    defaultExpanded: false,
    stepNumber: 1,
  };

  beforeEach(() => {
    resetIdCounter();
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // Basic rendering
  // -----------------------------------------------------------------------

  it('renders the task title', () => {
    const task = createMockTaskEffect({ title: 'Fetch user data' });
    render(<StepCard {...defaultProps} task={task} />);
    expect(screen.getByText('Fetch user data')).toBeInTheDocument();
  });

  it('renders status badge for resolved task', () => {
    const task = createMockTaskEffect({ status: 'resolved' });
    render(<StepCard {...defaultProps} task={task} />);
    // StatusBadge maps "resolved" -> "Done"
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('renders status badge for error task', () => {
    const task = createMockTaskEffect({ status: 'error' });
    render(<StepCard {...defaultProps} task={task} />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('renders status badge for requested (running) task', () => {
    const task = createMockTaskEffect({ status: 'requested' });
    render(<StepCard {...defaultProps} task={task} />);
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Step number display
  // -----------------------------------------------------------------------

  it('displays step number when provided', () => {
    const task = createMockTaskEffect();
    render(<StepCard {...defaultProps} task={task} stepNumber={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('does not render step number badge when stepNumber is undefined', () => {
    const task = createMockTaskEffect();
    const { container } = render(
      <StepCard {...defaultProps} task={task} stepNumber={undefined} />,
    );
    // Step number badge has specific classes
    const stepBadges = container.querySelectorAll('.w-5.h-5.rounded-full');
    expect(stepBadges.length).toBe(0);
  });

  // -----------------------------------------------------------------------
  // Kind badge
  // -----------------------------------------------------------------------

  it('renders KindBadge for the task kind', () => {
    const task = createMockTaskEffect({ kind: 'shell' });
    render(<StepCard {...defaultProps} task={task} />);
    expect(screen.getByText('shell')).toBeInTheDocument();
  });

  it('renders KindBadge for agent kind', () => {
    const task = createMockTaskEffect({ kind: 'agent' });
    render(<StepCard {...defaultProps} task={task} />);
    expect(screen.getByText('agent')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Running state (animation pulse dot)
  // -----------------------------------------------------------------------

  it('shows an animated pulse dot when task is running', () => {
    const task = createMockTaskEffect({ status: 'requested', kind: 'node' });
    const { container } = render(<StepCard {...defaultProps} task={task} />);
    const pulseDot = container.querySelector('.animate-pulse-dot');
    expect(pulseDot).toBeInTheDocument();
  });

  it('shows running text with elapsed time for requested task', () => {
    const task = createMockTaskEffect({
      status: 'requested',
      kind: 'node',
      requestedAt: new Date(Date.now() - 5000).toISOString(),
    });
    render(<StepCard {...defaultProps} task={task} />);
    expect(screen.getByText(/running/)).toBeInTheDocument();
  });

  it('does not show pulse dot for resolved task', () => {
    const task = createMockTaskEffect({ status: 'resolved', kind: 'node' });
    const { container } = render(<StepCard {...defaultProps} task={task} />);
    const pulseDots = container.querySelectorAll('.bg-info.animate-pulse-dot');
    expect(pulseDots.length).toBe(0);
  });

  // -----------------------------------------------------------------------
  // Duration display
  // -----------------------------------------------------------------------

  it('shows formatted duration for completed task', () => {
    const task = createMockTaskEffect({ status: 'resolved', duration: 4000 });
    render(<StepCard {...defaultProps} task={task} />);
    // Duration appears in the card body (may also appear in expanded details)
    expect(screen.getAllByText('4s').length).toBeGreaterThanOrEqual(1);
  });

  it('does not show duration row in card body when duration is absent and task is not running', () => {
    // Create a task and override duration to undefined (falsy) directly
    const task = createMockTaskEffect({ status: 'resolved' });
    const taskNoDuration = { ...task, duration: undefined };
    const { container } = render(<StepCard {...defaultProps} task={taskNoDuration} defaultExpanded={false} />);
    // The main card button should not contain a Clock icon for the duration row
    const mainButton = container.querySelector('button.w-full.text-left.p-3');
    const clockInBody = mainButton?.querySelector('[data-lucide="Clock"]');
    expect(clockInBody).toBeNull();
  });

  // -----------------------------------------------------------------------
  // Click handler
  // -----------------------------------------------------------------------

  it('calls onSelect with effectId when card button is clicked', async () => {
    const user = setupUser();
    const onSelect = vi.fn();
    const task = createMockTaskEffect({ effectId: 'eff-click-test' });
    render(<StepCard {...defaultProps} task={task} onSelect={onSelect} />);
    // Click the main button (first button is the main card button)
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]);
    expect(onSelect).toHaveBeenCalledWith('eff-click-test');
  });

  it('does not call onSelect when expand toggle is clicked', async () => {
    const user = setupUser();
    const onSelect = vi.fn();
    const task = createMockTaskEffect();
    render(<StepCard {...defaultProps} task={task} onSelect={onSelect} />);
    // The expand/collapse button has an aria-label
    const expandBtn = screen.getByLabelText('Expand details');
    await user.click(expandBtn);
    expect(onSelect).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Expanded details
  // -----------------------------------------------------------------------

  it('shows expand button with "Expand details" label when collapsed', () => {
    const task = createMockTaskEffect();
    render(<StepCard {...defaultProps} task={task} defaultExpanded={false} />);
    expect(screen.getByLabelText('Expand details')).toBeInTheDocument();
  });

  it('shows "Collapse details" label when defaultExpanded is true', () => {
    const task = createMockTaskEffect();
    render(<StepCard {...defaultProps} task={task} defaultExpanded={true} />);
    expect(screen.getByLabelText('Collapse details')).toBeInTheDocument();
  });

  it('toggles expanded state when expand button is clicked', async () => {
    const user = setupUser();
    const task = createMockTaskEffect();
    render(<StepCard {...defaultProps} task={task} defaultExpanded={false} />);
    // Initially collapsed
    expect(screen.getByLabelText('Expand details')).toBeInTheDocument();
    // Click to expand
    await user.click(screen.getByLabelText('Expand details'));
    expect(screen.getByLabelText('Collapse details')).toBeInTheDocument();
    // Click to collapse
    await user.click(screen.getByLabelText('Collapse details'));
    expect(screen.getByLabelText('Expand details')).toBeInTheDocument();
  });

  it('shows step ID in expanded details', () => {
    const task = createMockTaskEffect({ stepId: 'step-abc-123' });
    render(<StepCard {...defaultProps} task={task} defaultExpanded={true} />);
    expect(screen.getByText('Step:')).toBeInTheDocument();
  });

  it('shows duration in expanded details when present', () => {
    const task = createMockTaskEffect({ duration: 12000 });
    render(<StepCard {...defaultProps} task={task} defaultExpanded={true} />);
    expect(screen.getByText('Duration:')).toBeInTheDocument();
    // Duration appears in both the card body and expanded details
    expect(screen.getAllByText('12s').length).toBeGreaterThanOrEqual(2);
  });

  it('shows requestedAt in expanded details', () => {
    const task = createMockTaskEffect({
      requestedAt: '2026-01-15T10:30:00.000Z',
    });
    render(<StepCard {...defaultProps} task={task} defaultExpanded={true} />);
    expect(screen.getByText('Requested:')).toBeInTheDocument();
  });

  it('shows resolvedAt in expanded details when present', () => {
    const task = createMockTaskEffect({
      resolvedAt: '2026-01-15T10:30:05.000Z',
    });
    render(<StepCard {...defaultProps} task={task} defaultExpanded={true} />);
    expect(screen.getByText('Resolved:')).toBeInTheDocument();
  });

  it('shows error details in expanded view when task has error', () => {
    const task = createMockTaskEffect({
      status: 'error',
      error: { name: 'TimeoutError', message: 'Task timed out after 30s' },
    });
    render(<StepCard {...defaultProps} task={task} defaultExpanded={true} />);
    expect(screen.getByText('TimeoutError:')).toBeInTheDocument();
    expect(screen.getByText(/Task timed out after 30s/)).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Breakpoint waiting state
  // -----------------------------------------------------------------------

  it('shows breakpoint waiting indicator for breakpoint kind with requested status', () => {
    const task = createMockTaskEffect({
      kind: 'breakpoint',
      status: 'requested',
    });
    render(<StepCard {...defaultProps} task={task} />);
    expect(screen.getByText('Your approval is needed')).toBeInTheDocument();
  });

  it('shows Hand icon for breakpoint waiting state', () => {
    const task = createMockTaskEffect({
      kind: 'breakpoint',
      status: 'requested',
    });
    const { container } = render(<StepCard {...defaultProps} task={task} />);
    const handIcons = container.querySelectorAll('[data-lucide="Hand"]');
    expect(handIcons.length).toBeGreaterThan(0);
  });

  it('applies breakpoint glow animation class for breakpoint waiting state', () => {
    const task = createMockTaskEffect({
      kind: 'breakpoint',
      status: 'requested',
    });
    const { container } = render(<StepCard {...defaultProps} task={task} />);
    const cardDiv = container.firstChild as HTMLElement;
    expect(cardDiv.className).toContain('animate-breakpoint-glow');
  });

  it('does not show breakpoint indicators for resolved breakpoint', () => {
    const task = createMockTaskEffect({
      kind: 'breakpoint',
      status: 'resolved',
    });
    render(<StepCard {...defaultProps} task={task} />);
    expect(screen.queryByText('Your approval is needed')).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Selected state
  // -----------------------------------------------------------------------

  it('applies selected styling when isSelected is true', () => {
    const task = createMockTaskEffect();
    const { container } = render(
      <StepCard {...defaultProps} task={task} isSelected={true} />,
    );
    const cardDiv = container.firstChild as HTMLElement;
    expect(cardDiv.className).toContain('border-l-primary');
  });

  // -----------------------------------------------------------------------
  // Status-based border colors
  // -----------------------------------------------------------------------

  it('applies success border for resolved task', () => {
    const task = createMockTaskEffect({ status: 'resolved' });
    const { container } = render(<StepCard {...defaultProps} task={task} />);
    const cardDiv = container.firstChild as HTMLElement;
    expect(cardDiv.className).toContain('border-l-success');
  });

  it('applies error border for error task', () => {
    const task = createMockTaskEffect({ status: 'error' });
    const { container } = render(<StepCard {...defaultProps} task={task} />);
    const cardDiv = container.firstChild as HTMLElement;
    expect(cardDiv.className).toContain('border-l-error');
  });

  it('applies info border for running task (non-breakpoint)', () => {
    const task = createMockTaskEffect({ status: 'requested', kind: 'node' });
    const { container } = render(<StepCard {...defaultProps} task={task} />);
    const cardDiv = container.firstChild as HTMLElement;
    expect(cardDiv.className).toContain('border-l-info');
  });

  it('applies warning border for breakpoint waiting task', () => {
    const task = createMockTaskEffect({
      status: 'requested',
      kind: 'breakpoint',
    });
    const { container } = render(<StepCard {...defaultProps} task={task} />);
    const cardDiv = container.firstChild as HTMLElement;
    expect(cardDiv.className).toContain('border-l-warning');
  });
});
