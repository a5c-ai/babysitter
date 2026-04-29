import { render, screen } from '@/test/test-utils';
import { vi } from 'vitest';
import { KpiGrid } from '../kpi-grid';
import userEvent from '@testing-library/user-event';
import type { DashboardMetrics } from '@/hooks/use-run-dashboard';

const baseMetrics: DashboardMetrics = {
  totalRuns: 20,
  activeRuns: 5,
  completedRuns: 12,
  failedRuns: 3,
  staleRuns: 0,
  totalTasks: 100,
  completedTasks: 80,
};

describe('KpiGrid', () => {
  it('renders all four metric tiles without stale', () => {
    render(
      <KpiGrid
        metrics={baseMetrics}
        statusFilter="all"
        hasStaleRuns={false}
        onToggleFilter={vi.fn()}
      />
    );
    expect(screen.getByTestId('metric-tile-total-runs')).toBeInTheDocument();
    expect(screen.getByTestId('metric-tile-active')).toBeInTheDocument();
    expect(screen.getByTestId('metric-tile-completed')).toBeInTheDocument();
    expect(screen.getByTestId('metric-tile-failed')).toBeInTheDocument();
    expect(screen.queryByTestId('metric-tile-stale')).not.toBeInTheDocument();
  });

  it('renders stale tile when hasStaleRuns is true', () => {
    render(
      <KpiGrid
        metrics={{ ...baseMetrics, staleRuns: 2 }}
        statusFilter="all"
        hasStaleRuns={true}
        onToggleFilter={vi.fn()}
      />
    );
    expect(screen.getByTestId('metric-tile-stale')).toBeInTheDocument();
  });

  it('displays correct metric values', () => {
    render(
      <KpiGrid
        metrics={baseMetrics}
        statusFilter="all"
        hasStaleRuns={false}
        onToggleFilter={vi.fn()}
      />
    );
    expect(screen.getByTestId('metric-tile-total-runs')).toHaveTextContent('20');
    expect(screen.getByTestId('metric-tile-active')).toHaveTextContent('5');
    expect(screen.getByTestId('metric-tile-completed')).toHaveTextContent('12');
    expect(screen.getByTestId('metric-tile-failed')).toHaveTextContent('3');
  });

  it('calls onToggleFilter when a tile is clicked', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(
      <KpiGrid
        metrics={baseMetrics}
        statusFilter="all"
        hasStaleRuns={false}
        onToggleFilter={onToggle}
      />
    );

    await user.click(screen.getByTestId('metric-tile-failed'));
    expect(onToggle).toHaveBeenCalledWith('failed');
  });

  it('marks active tile with aria-pressed true', () => {
    render(
      <KpiGrid
        metrics={baseMetrics}
        statusFilter="waiting"
        hasStaleRuns={false}
        onToggleFilter={vi.fn()}
      />
    );
    expect(screen.getByTestId('metric-tile-active')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('metric-tile-total-runs')).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders the kpi-grid container with aria-label', () => {
    render(
      <KpiGrid
        metrics={baseMetrics}
        statusFilter="all"
        hasStaleRuns={false}
        onToggleFilter={vi.fn()}
      />
    );
    expect(screen.getByTestId('kpi-grid')).toHaveAttribute('aria-label', 'Key metrics');
  });
});
