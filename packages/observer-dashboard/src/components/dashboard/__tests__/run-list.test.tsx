import { render, screen, setupUser } from '@/test/test-utils';
import { vi } from 'vitest';
import { RunList } from '../run-list';
import { createMockRun, resetIdCounter } from '@/test/fixtures';
import type { LightRun, RunsListResponse } from '@/lib/services/run-query-service';

// Mock the polling hook so we can drive the component with static data.
const mockUseSmartPolling = vi.fn();
vi.mock('@/hooks/use-smart-polling', () => ({
  useSmartPolling: (...args: unknown[]) => mockUseSmartPolling(...args),
}));

// Mock next/link
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href} data-testid="next-link">
      {children}
    </a>
  ),
}));

beforeEach(() => {
  resetIdCounter();
  vi.clearAllMocks();
});

/** Build a LightRun from the shared Run fixture (events stripped). */
function lightRun(overrides: Parameters<typeof createMockRun>[0] = {}): LightRun {
  const run = createMockRun(overrides);
  return { ...run, events: [], totalEvents: 0 } as LightRun;
}

function setupPolling(
  data: RunsListResponse | null,
  { loading = false, error = null }: { loading?: boolean; error?: string | null } = {}
) {
  mockUseSmartPolling.mockReturnValue({ data, loading, error, refresh: vi.fn() });
}

describe('RunList (flat filtered list)', () => {
  it('renders an empty state when there are no runs', () => {
    setupPolling({ runs: [], totalCount: 0 });
    render(<RunList status="waiting" />);
    expect(screen.getByText('No runs found')).toBeInTheDocument();
  });

  it('renders one row per run with process label and short id', () => {
    const runs = [
      lightRun({ runId: 'aaaaaaaa-1', processId: 'process-alpha' }),
      lightRun({ runId: 'bbbbbbbb-2', processId: 'process-beta' }),
    ];
    setupPolling({ runs, totalCount: 2 });
    render(<RunList status="waiting" />);

    expect(screen.getAllByTestId('next-link')).toHaveLength(2);
    expect(screen.getByText('Process Alpha')).toBeInTheDocument();
    expect(screen.getByText('Process Beta')).toBeInTheDocument();
    expect(screen.getByText('aaaaaaaa')).toBeInTheDocument();
  });

  it('shows the resume hint for an orphaned breakpoint run', () => {
    const runs = [
      lightRun({
        runId: 'orphan-1',
        status: 'waiting',
        waitingKind: 'breakpoint',
        driver: 'orphaned',
      }),
    ];
    setupPolling({ runs, totalCount: 1 });
    render(<RunList status="orphaned" />);

    expect(screen.getByText('No live driver. Resume to answer')).toBeInTheDocument();
  });

  it('shows no orphaned chip or resume hint for a terminal run', () => {
    // A completed run reports no attached orchestrator (driver: 'orphaned'),
    // but liveness is meaningless for terminal runs — no alarm should show.
    const runs = [
      lightRun({
        runId: 'done-1',
        status: 'completed',
        driver: 'orphaned',
      }),
    ];
    setupPolling({ runs, totalCount: 1 });
    render(<RunList status="completed" />);

    expect(screen.queryByText('orphaned')).not.toBeInTheDocument();
    expect(
      screen.queryByText('No live driver. Resume to answer')
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('run-action-hint')).not.toBeInTheDocument();
    // A neutral, status-appropriate label is shown instead.
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  it('shows the orphaned chip and resume hint for a waiting orphaned run', () => {
    const runs = [
      lightRun({
        runId: 'orphan-2',
        status: 'waiting',
        waitingKind: 'breakpoint',
        driver: 'orphaned',
      }),
    ];
    setupPolling({ runs, totalCount: 1 });
    render(<RunList status="orphaned" />);

    expect(screen.getByText('orphaned')).toBeInTheDocument();
    expect(
      screen.getByText('No live driver. Resume to answer')
    ).toBeInTheDocument();
  });

  it('unit-runlist-none-driver-branch-untested: treats a driverless ("none") waiting run as orphaned (DC-3)', () => {
    // DC-3: driver 'none' (no run.lock at all) is orphaned when non-terminal —
    // the same predicate used by filterByStatus/badge/rank. It must show the
    // orphaned chip and the resume hint, just like a dead-lock ('orphaned') run.
    const runs = [
      lightRun({
        runId: 'nolock-1',
        status: 'waiting',
        waitingKind: 'task',
        driver: 'none',
      }),
    ];
    setupPolling({ runs, totalCount: 1 });
    render(<RunList status="orphaned" />);

    expect(screen.getByText('orphaned')).toBeInTheDocument();
    expect(
      screen.getByText('No live driver. Resume to answer')
    ).toBeInTheDocument();
    expect(screen.getByTestId('run-action-hint')).toBeInTheDocument();
  });

  it('unit-runlist-none-driver-branch-untested: a terminal driverless ("none") run is NOT orphaned', () => {
    // Most completed runs report driver 'none'; liveness is meaningless for
    // terminal runs, so no orphaned chip/hint should appear (DC-3 non-terminal guard).
    const runs = [
      lightRun({
        runId: 'done-none',
        status: 'completed',
        driver: 'none',
      }),
    ];
    setupPolling({ runs, totalCount: 1 });
    render(<RunList status="completed" />);

    expect(screen.queryByText('orphaned')).not.toBeInTheDocument();
    expect(
      screen.queryByText('No live driver. Resume to answer')
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('run-action-hint')).not.toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  it('action-hint-gated-to-breakpoints: shows the resume affordance for an orphaned non-terminal task-wait row', () => {
    // Orphaned + waiting but NOT at a breakpoint (waitingKind: 'task'). This row
    // still has no live driver, so it must surface the resume hint and copy-id.
    const runs = [
      lightRun({
        runId: 'orphan-task-1',
        status: 'waiting',
        waitingKind: 'task',
        driver: 'orphaned',
      }),
    ];
    setupPolling({ runs, totalCount: 1 });
    render(<RunList status="orphaned" />);

    expect(screen.getByTestId('run-action-hint')).toBeInTheDocument();
    expect(
      screen.getByText('No live driver. Resume to answer')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /copy run id/i })
    ).toBeInTheDocument();
  });

  it('sort-stale-tier-unreachable: a stale run ranks in the stale tier, below active waiting runs', () => {
    // Both are waiting with a live driver; only ranking differs. The stale run
    // must sink below the non-stale waiting run (tier 3 vs tier 2). Input order
    // is deliberately stale-first so the assertion proves the sort reorders.
    const runs = [
      lightRun({
        runId: 'stale-run',
        status: 'waiting',
        driver: 'live',
        isStale: true,
      }),
      lightRun({
        runId: 'waiting-run',
        status: 'waiting',
        driver: 'live',
        isStale: false,
      }),
    ];
    setupPolling({ runs, totalCount: 2 });
    render(<RunList status="waiting" />);

    const hrefs = screen
      .getAllByTestId('next-link')
      .map((el) => el.getAttribute('href'));
    expect(hrefs).toEqual(['/runs/waiting-run', '/runs/stale-run']);
  });

  it('shows the terminal hint for a live breakpoint run', () => {
    const runs = [
      lightRun({
        runId: 'live-1',
        status: 'waiting',
        waitingKind: 'breakpoint',
        driver: 'live',
      }),
    ];
    setupPolling({ runs, totalCount: 1 });
    render(<RunList status="needsyou" />);

    expect(screen.getByText('Answer in terminal')).toBeInTheDocument();
  });

  it('shows "Load more" when fetched runs are fewer than totalCount', () => {
    const runs = [lightRun({ runId: 'r-1' }), lightRun({ runId: 'r-2' })];
    setupPolling({ runs, totalCount: 10 });
    render(<RunList status="completed" />);

    expect(screen.getByText(/Load more \(8 remaining\)/)).toBeInTheDocument();
  });

  it('does not show "Load more" when all runs are loaded', () => {
    const runs = [lightRun({ runId: 'r-1' }), lightRun({ runId: 'r-2' })];
    setupPolling({ runs, totalCount: 2 });
    render(<RunList status="completed" />);

    expect(screen.queryByText(/Load more/)).not.toBeInTheDocument();
  });

  it('renders an error state when the fetch fails', () => {
    setupPolling(null, { error: 'boom' });
    render(<RunList status="failed" />);
    expect(screen.getByTestId('run-list-error')).toBeInTheDocument();
  });
});

describe('RunList accessibility', () => {
  it('a11y-no-list-semantics: exposes list + listitem roles', () => {
    const runs = [
      lightRun({ runId: 'aaaaaaaa-1', processId: 'process-alpha' }),
      lightRun({ runId: 'bbbbbbbb-2', processId: 'process-beta' }),
    ];
    setupPolling({ runs, totalCount: 2 });
    render(<RunList status="waiting" />);

    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('a11y-nested-interactive-copy-btn: copy button is not nested inside the row anchor', () => {
    const runs = [
      lightRun({
        runId: 'orphan-1',
        status: 'waiting',
        waitingKind: 'breakpoint',
        driver: 'orphaned',
      }),
    ];
    setupPolling({ runs, totalCount: 1 });
    render(<RunList status="orphaned" />);

    const anchor = screen.getByTestId('next-link');
    const copyBtn = screen.getByRole('button', { name: /copy run id/i });
    expect(anchor.contains(copyBtn)).toBe(false);
  });

  it('a11y-loading-not-announced: loading skeleton is announced with aria-busy', () => {
    setupPolling(null, { loading: true });
    render(<RunList status="waiting" />);

    const skeleton = screen.getByTestId('run-list-loading');
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Loading runs')).toBeInTheDocument();
  });

  it('a11y-status-chip-title-only: liveness chip exposes its meaning via sr-only text', () => {
    const runs = [
      lightRun({
        runId: 'orphan-3',
        status: 'waiting',
        waitingKind: 'breakpoint',
        driver: 'orphaned',
      }),
    ];
    setupPolling({ runs, totalCount: 1 });
    render(<RunList status="orphaned" />);

    // owner 2026-07-08: de-AI copy (no em-dashes) + answer-flow clarity
    expect(
      screen.getByText(/no live orchestrator is attached\. Resume the run to continue it/i)
    ).toBeInTheDocument();
  });

  it('a11y-copy-no-live-announcement: announces "Run id copied" after copying', async () => {
    const user = setupUser();
    const runs = [
      lightRun({
        runId: 'orphan-4',
        status: 'waiting',
        waitingKind: 'breakpoint',
        driver: 'orphaned',
      }),
    ];
    setupPolling({ runs, totalCount: 1 });
    render(<RunList status="orphaned" />);

    expect(screen.queryByText('Run id copied')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /copy run id/i }));
    expect(screen.getByText('Run id copied')).toBeInTheDocument();
  });
});
