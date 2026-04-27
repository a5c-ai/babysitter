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
