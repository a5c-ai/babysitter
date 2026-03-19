import { render, screen, act } from '@/test/test-utils';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { BreakpointRunInfo } from '@/types';
import { BreakpointBanner } from '../breakpoint-banner';

// Mock next/link to render a plain anchor (same pattern as run-card.test.tsx)
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className} data-testid="next-link">
      {children}
    </a>
  ),
}));

function makeBp(overrides: Partial<BreakpointRunInfo> = {}): BreakpointRunInfo {
  return {
    runId: 'run-001',
    projectName: 'my-project',
    processId: 'data-pipeline',
    breakpointQuestion: 'Approve deployment?',
    ...overrides,
  };
}

describe('BreakpointBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --- Returns null when empty ---
  it('returns null when no breakpoint runs and no resolved entries', () => {
    const { container } = render(<BreakpointBanner breakpointRuns={[]} />);
    expect(container.innerHTML).toBe('');
    expect(screen.queryByTestId('breakpoint-banner')).not.toBeInTheDocument();
  });

  // --- Renders breakpoint entries ---
  it('renders breakpoint entries with correct content', () => {
    const bps = [
      makeBp({ runId: 'run-001', projectName: 'proj-a', breakpointQuestion: 'Deploy to prod?' }),
      makeBp({ runId: 'run-002', projectName: 'proj-b', breakpointQuestion: 'Run migrations?' }),
    ];

    render(<BreakpointBanner breakpointRuns={bps} />);

    expect(screen.getByTestId('breakpoint-banner')).toBeInTheDocument();
    expect(screen.getByText('Deploy to prod?')).toBeInTheDocument();
    expect(screen.getByText('Run migrations?')).toBeInTheDocument();
    expect(screen.getByText('proj-a')).toBeInTheDocument();
    expect(screen.getByText('proj-b')).toBeInTheDocument();
  });

  it('renders "Approval Needed" label for each breakpoint', () => {
    render(<BreakpointBanner breakpointRuns={[makeBp()]} />);
    expect(screen.getByText('Approval Needed')).toBeInTheDocument();
  });

  it('renders truncated run ID', () => {
    render(<BreakpointBanner breakpointRuns={[makeBp({ runId: 'run-abcdef-12345678' })]} />);
    // runId.slice(0, 8) = "run-abcd"
    expect(screen.getByText('run-abcd')).toBeInTheDocument();
  });

  it('shows summary count when multiple breakpoints are pending', () => {
    const bps = [
      makeBp({ runId: 'run-001' }),
      makeBp({ runId: 'run-002' }),
      makeBp({ runId: 'run-003' }),
    ];
    render(<BreakpointBanner breakpointRuns={bps} />);
    expect(screen.getByText('3 approvals pending')).toBeInTheDocument();
  });

  it('does not show summary count for a single breakpoint', () => {
    render(<BreakpointBanner breakpointRuns={[makeBp()]} />);
    expect(screen.queryByText(/approvals pending/)).not.toBeInTheDocument();
  });

  // --- Staleness indicator ---
  it('shows staleness indicator after STALENESS_THRESHOLD_MS (2 minutes)', () => {
    const bp = makeBp({ runId: 'stale-run' });

    const { rerender } = render(<BreakpointBanner breakpointRuns={[bp]} />);

    // Initially no staleness indicator
    expect(screen.queryByTestId('staleness-indicator')).not.toBeInTheDocument();

    // Advance past the staleness threshold (120s) + a tick interval (10s)
    act(() => {
      vi.advanceTimersByTime(130000);
    });

    // Re-render with the same props to keep the breakpoint active
    // (the staleness tick interval triggers state update internally)
    rerender(<BreakpointBanner breakpointRuns={[bp]} />);

    expect(screen.getByTestId('staleness-indicator')).toBeInTheDocument();
    expect(screen.getByText('(checking...)')).toBeInTheDocument();
  });

  it('does not show staleness indicator before threshold', () => {
    const bp = makeBp({ runId: 'fresh-run' });

    const { rerender } = render(<BreakpointBanner breakpointRuns={[bp]} />);

    // Advance only 60s (below 120s threshold)
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    rerender(<BreakpointBanner breakpointRuns={[bp]} />);

    expect(screen.queryByTestId('staleness-indicator')).not.toBeInTheDocument();
  });

  // --- Resolved entry detection ---
  it('shows resolved entry when a breakpoint disappears from the list', () => {
    const bp = makeBp({ runId: 'resolved-run', breakpointQuestion: 'Deploy?' });

    // First render with the breakpoint active
    const { rerender } = render(<BreakpointBanner breakpointRuns={[bp]} />);

    expect(screen.getByText('Deploy?')).toBeInTheDocument();

    // Re-render without the breakpoint (it was resolved)
    act(() => {
      rerender(<BreakpointBanner breakpointRuns={[]} />);
    });

    // Should show "Approved" label for the resolved entry
    expect(screen.getByText('Approved')).toBeInTheDocument();
    // The resolved entry should still display the breakpoint question
    expect(screen.getByText('Deploy?')).toBeInTheDocument();
  });

  it('auto-removes resolved entries after RESOLVED_DISPLAY_MS (20s)', () => {
    const bp = makeBp({ runId: 'auto-clear-run', breakpointQuestion: 'Deploy now?' });

    const { rerender } = render(<BreakpointBanner breakpointRuns={[bp]} />);

    // Remove the breakpoint to trigger resolved state
    act(() => {
      rerender(<BreakpointBanner breakpointRuns={[]} />);
    });

    expect(screen.getByText('Approved')).toBeInTheDocument();

    // Advance past the RESOLVED_DISPLAY_MS (20s) + cleanup interval (1s)
    act(() => {
      vi.advanceTimersByTime(22000);
    });

    // The banner should now return null (no waiting and no resolved)
    expect(screen.queryByText('Approved')).not.toBeInTheDocument();
    expect(screen.queryByTestId('breakpoint-banner')).not.toBeInTheDocument();
  });

  // --- Accessibility ---
  it('has role="alert" and aria-live="assertive"', () => {
    render(<BreakpointBanner breakpointRuns={[makeBp()]} />);
    const banner = screen.getByTestId('breakpoint-banner');
    expect(banner).toHaveAttribute('role', 'alert');
    expect(banner).toHaveAttribute('aria-live', 'assertive');
  });

  // --- Links ---
  it('renders links to run detail pages', () => {
    render(<BreakpointBanner breakpointRuns={[makeBp({ runId: 'link-run' })]} />);
    const links = screen.getAllByTestId('next-link');
    expect(links[0]).toHaveAttribute('href', '/runs/link-run');
  });
});
