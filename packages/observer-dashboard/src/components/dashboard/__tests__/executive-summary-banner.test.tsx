import { render, screen } from '@/test/test-utils';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { ExecutiveSummaryBanner, type ExecutiveSummaryMetrics } from '../executive-summary-banner';

function makeMetrics(overrides: Partial<ExecutiveSummaryMetrics> = {}): ExecutiveSummaryMetrics {
  return {
    totalProjects: 5,
    activeRuns: 0,
    failedRuns: 0,
    completedRuns: 10,
    staleRuns: 0,
    pendingBreakpoints: 0,
    ...overrides,
  };
}

describe('ExecutiveSummaryBanner', () => {
  it('renders with role="status" for accessibility', () => {
    render(<ExecutiveSummaryBanner metrics={makeMetrics()} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders data-testid for querying', () => {
    render(<ExecutiveSummaryBanner metrics={makeMetrics()} />);
    expect(screen.getByTestId('executive-summary-banner')).toBeInTheDocument();
  });

  // --- Healthy state ---
  it('shows all-healthy message when no issues exist', () => {
    render(<ExecutiveSummaryBanner metrics={makeMetrics()} />);
    expect(screen.getByText('All 5 projects healthy')).toBeInTheDocument();
  });

  it('includes active run count in healthy message when runs are active', () => {
    render(<ExecutiveSummaryBanner metrics={makeMetrics({ activeRuns: 3 })} />);
    expect(screen.getByText(/All 5 projects healthy/)).toBeInTheDocument();
    expect(screen.getByText(/3 runs in progress/)).toBeInTheDocument();
  });

  it('uses singular "project" for single project', () => {
    render(<ExecutiveSummaryBanner metrics={makeMetrics({ totalProjects: 1 })} />);
    expect(screen.getByText('All 1 project healthy')).toBeInTheDocument();
  });

  it('uses singular "run" for single active run', () => {
    render(<ExecutiveSummaryBanner metrics={makeMetrics({ activeRuns: 1 })} />);
    expect(screen.getByText(/1 run in progress/)).toBeInTheDocument();
  });

  // --- Failure state (red) ---
  it('shows failure message when runs are failing', () => {
    render(<ExecutiveSummaryBanner metrics={makeMetrics({ failedRuns: 2 })} />);
    expect(screen.getByText(/2 runs failing/)).toBeInTheDocument();
  });

  it('uses singular "run" for single failure', () => {
    render(<ExecutiveSummaryBanner metrics={makeMetrics({ failedRuns: 1 })} />);
    expect(screen.getByText(/1 run failing/)).toBeInTheDocument();
  });

  it('applies error styling for failures', () => {
    render(<ExecutiveSummaryBanner metrics={makeMetrics({ failedRuns: 1 })} />);
    const banner = screen.getByTestId('executive-summary-banner');
    expect(banner.className).toMatch(/border-error/);
  });

  // --- Amber state (pending approvals) ---
  it('shows pending approval message', () => {
    render(<ExecutiveSummaryBanner metrics={makeMetrics({ pendingBreakpoints: 2 })} />);
    expect(screen.getByText(/2 approvals need your attention/)).toBeInTheDocument();
  });

  it('uses singular for single approval', () => {
    render(<ExecutiveSummaryBanner metrics={makeMetrics({ pendingBreakpoints: 1 })} />);
    expect(screen.getByText(/1 approval needs your attention/)).toBeInTheDocument();
  });

  it('applies warning styling for pending approvals', () => {
    render(<ExecutiveSummaryBanner metrics={makeMetrics({ pendingBreakpoints: 1 })} />);
    const banner = screen.getByTestId('executive-summary-banner');
    expect(banner.className).toMatch(/border-warning/);
  });

  // --- Stale state (amber) ---
  it('shows stale run message', () => {
    render(<ExecutiveSummaryBanner metrics={makeMetrics({ staleRuns: 3 })} />);
    expect(screen.getByText(/3 stale runs/)).toBeInTheDocument();
  });

  // --- Combined states ---
  it('combines failures and approvals', () => {
    render(
      <ExecutiveSummaryBanner
        metrics={makeMetrics({ failedRuns: 1, pendingBreakpoints: 2 })}
      />
    );
    expect(screen.getByText(/1 run failing/)).toBeInTheDocument();
    expect(screen.getByText(/2 approvals need your attention/)).toBeInTheDocument();
  });

  it('applies error styling when both failures and approvals exist', () => {
    render(
      <ExecutiveSummaryBanner
        metrics={makeMetrics({ failedRuns: 1, pendingBreakpoints: 2 })}
      />
    );
    const banner = screen.getByTestId('executive-summary-banner');
    expect(banner.className).toMatch(/border-error/);
  });

  it('applies success styling when all healthy', () => {
    render(<ExecutiveSummaryBanner metrics={makeMetrics()} />);
    const banner = screen.getByTestId('executive-summary-banner');
    expect(banner.className).toMatch(/border-success/);
  });

  // --- §13.3 per-segment tones (one hue = one meaning; red = terminal failure ONLY) ---
  describe('per-segment issue coloring (§13.3)', () => {
    it('colors only the failed segment red; approvals and stale keep their own tones', () => {
      render(
        <ExecutiveSummaryBanner
          metrics={makeMetrics({ failedRuns: 1, pendingBreakpoints: 2, staleRuns: 3 })}
        />
      );

      const failedSegment = screen.getByTestId('summary-segment-failed');
      expect(failedSegment.className).toMatch(/text-status-failed/);
      expect(failedSegment).toHaveTextContent('1 run failing');

      const attentionSegment = screen.getByTestId('summary-segment-attention');
      expect(attentionSegment.className).toMatch(/text-status-attention/);
      expect(attentionSegment.className).not.toMatch(/text-status-failed|text-error/);
      expect(attentionSegment).toHaveTextContent('2 approvals need your attention');

      const stalledSegment = screen.getByTestId('summary-segment-stalled');
      expect(stalledSegment.className).toMatch(/text-status-stalled/);
      expect(stalledSegment.className).not.toMatch(/text-status-failed|text-error/);
      expect(stalledSegment).toHaveTextContent('3 stale runs');
    });

    it('does not paint the whole issue sentence in the error hue when a failure exists', () => {
      render(
        <ExecutiveSummaryBanner
          metrics={makeMetrics({ failedRuns: 1, pendingBreakpoints: 2 })}
        />
      );
      const sentence = screen.getByText(/1 run failing/).closest('p');
      expect(sentence).not.toBeNull();
      expect(sentence!.className).not.toMatch(/text-error/);
    });

    it('amber-only issues use their own semantic tones, not a blanket warning text', () => {
      render(
        <ExecutiveSummaryBanner
          metrics={makeMetrics({ pendingBreakpoints: 1, staleRuns: 1 })}
        />
      );
      expect(screen.getByTestId('summary-segment-attention').className).toMatch(
        /text-status-attention/
      );
      expect(screen.getByTestId('summary-segment-stalled').className).toMatch(
        /text-status-stalled/
      );
      expect(screen.queryByTestId('summary-segment-failed')).not.toBeInTheDocument();
    });

    it('healthy sentence keeps the single success tone (single meaning)', () => {
      render(<ExecutiveSummaryBanner metrics={makeMetrics()} />);
      const sentence = screen.getByText('All 5 projects healthy').closest('p');
      expect(sentence!.className).toMatch(/text-success/);
    });
  });

  // --- Dismissed state ---
  it('returns null when dismissed is true', () => {
    const { container } = render(
      <ExecutiveSummaryBanner metrics={makeMetrics({ failedRuns: 1 })} dismissed={true} />
    );
    expect(container.innerHTML).toBe('');
    expect(screen.queryByTestId('executive-summary-banner')).not.toBeInTheDocument();
  });

  it('renders normally when dismissed is false', () => {
    render(
      <ExecutiveSummaryBanner metrics={makeMetrics({ failedRuns: 1 })} dismissed={false} />
    );
    expect(screen.getByTestId('executive-summary-banner')).toBeInTheDocument();
  });

  // --- onDismiss callback ---
  it('fires onDismiss callback when X button is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <ExecutiveSummaryBanner
        metrics={makeMetrics({ failedRuns: 1 })}
        onDismiss={onDismiss}
      />
    );

    const dismissBtn = screen.getByTestId('executive-summary-dismiss');
    await user.click(dismissBtn);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not show dismiss button when onDismiss is not provided', () => {
    render(
      <ExecutiveSummaryBanner metrics={makeMetrics({ failedRuns: 1 })} />
    );
    expect(screen.queryByTestId('executive-summary-dismiss')).not.toBeInTheDocument();
  });

  it('does not show dismiss button in healthy state even if onDismiss is provided', () => {
    render(
      <ExecutiveSummaryBanner metrics={makeMetrics()} onDismiss={vi.fn()} />
    );
    expect(screen.queryByTestId('executive-summary-dismiss')).not.toBeInTheDocument();
  });
});
