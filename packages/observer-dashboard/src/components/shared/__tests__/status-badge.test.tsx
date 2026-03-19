import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { StatusBadge } from '../status-badge';

describe('StatusBadge', () => {
  it('renders without crashing', () => {
    render(<StatusBadge status="completed" />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders "Completed" label for completed status', () => {
    render(<StatusBadge status="completed" />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders "Done" label for resolved status', () => {
    render(<StatusBadge status="resolved" />);
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('renders "OK" label for ok status', () => {
    render(<StatusBadge status="ok" />);
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('renders "Failed" label for failed status', () => {
    render(<StatusBadge status="failed" />);
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('renders "Error" label for error status', () => {
    render(<StatusBadge status="error" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('renders "Waiting" label for waiting status', () => {
    render(<StatusBadge status="waiting" />);
    expect(screen.getByText('Waiting')).toBeInTheDocument();
  });

  it('renders "Needs Approval" label for breakpoint_awaiting status', () => {
    render(<StatusBadge status="breakpoint_awaiting" />);
    expect(screen.getByText('Needs Approval')).toBeInTheDocument();
  });

  it('renders "Running" label for requested status', () => {
    render(<StatusBadge status="requested" />);
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('renders "Pending" label for pending status', () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('falls back to pending config for unknown status', () => {
    render(<StatusBadge status="unknown_status" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<StatusBadge status="completed" className="my-custom" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('my-custom');
  });

  it('renders an icon alongside the label', () => {
    const { container } = render(<StatusBadge status="completed" />);
    // The Badge wrapper should contain both the SVG icon and the text
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders "Approval Needed" when status is waiting and waitingKind is breakpoint', () => {
    render(<StatusBadge status="waiting" waitingKind="breakpoint" />);
    expect(screen.getByText('Approval Needed')).toBeInTheDocument();
  });

  it('renders "Working" when status is waiting and waitingKind is task', () => {
    render(<StatusBadge status="waiting" waitingKind="task" />);
    expect(screen.getByText('Working')).toBeInTheDocument();
  });

  it('renders with stale styling when isStale is true', () => {
    const { container } = render(<StatusBadge status="waiting" isStale={true} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('opacity-60');
  });

  it('renders normal waiting when waitingKind not provided', () => {
    render(<StatusBadge status="waiting" />);
    expect(screen.getByText('Waiting')).toBeInTheDocument();
    expect(screen.queryByText('Approval Needed')).not.toBeInTheDocument();
    expect(screen.queryByText('Working')).not.toBeInTheDocument();
  });
});
