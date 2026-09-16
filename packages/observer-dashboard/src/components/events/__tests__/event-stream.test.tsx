import { render, screen, setupUser } from '@/test/test-utils';
import { EventStream } from '../event-stream';
import { createMockJournalEvent } from '@/test/fixtures';
import type { JournalEvent } from '@/types';

describe('EventStream', () => {
  function makeEvents(count: number, type: JournalEvent['type'] = 'EFFECT_REQUESTED'): JournalEvent[] {
    return Array.from({ length: count }, (_, i) =>
      createMockJournalEvent({
        seq: i,
        id: `evt-${i}`,
        ts: new Date(Date.now() - (count - i) * 1000).toISOString(),
        type,
        payload: { effectId: `eff-${i}`, label: `task-${i}`, kind: 'node' },
      }),
    );
  }

  // -----------------------------------------------------------------------
  // Empty state
  // -----------------------------------------------------------------------
  it('shows "No events yet" when the events array is empty', () => {
    render(<EventStream events={[]} />);

    expect(screen.getByText('No events yet')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Renders event list
  // -----------------------------------------------------------------------
  it('renders a list of events', () => {
    const events = [
      createMockJournalEvent({
        seq: 0,
        type: 'RUN_CREATED',
        payload: { processId: 'pipeline/ingest' },
      }),
      createMockJournalEvent({
        seq: 1,
        type: 'EFFECT_REQUESTED',
        payload: { label: 'task-alpha', kind: 'agent', effectId: 'e1' },
      }),
    ];

    render(<EventStream events={events} />);

    expect(screen.getByText('task-alpha')).toBeInTheDocument();
    expect(screen.getByText('pipeline/ingest')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Event count display
  // -----------------------------------------------------------------------
  it('shows the total event count', () => {
    const events = makeEvents(5);

    render(<EventStream events={events} />);

    expect(screen.getByText('5 events')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Filter buttons
  // -----------------------------------------------------------------------
  it('renders filter buttons: All, Tasks, Results, Errors', () => {
    render(<EventStream events={[]} />);

    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
    expect(screen.getByText('Errors')).toBeInTheDocument();
  });

  it('filters events by type when a filter button is clicked', async () => {
    const user = setupUser();
    const events = [
      createMockJournalEvent({
        seq: 0,
        type: 'EFFECT_REQUESTED',
        payload: { label: 'requested-task', kind: 'node', effectId: 'e1' },
      }),
      createMockJournalEvent({
        seq: 1,
        type: 'EFFECT_RESOLVED',
        payload: { label: 'resolved-task', effectId: 'e2', status: 'ok' },
      }),
    ];

    render(<EventStream events={events} />);

    // Both visible initially
    expect(screen.getByText('requested-task')).toBeInTheDocument();
    expect(screen.getByText('resolved-task')).toBeInTheDocument();

    // Click "Tasks" filter (EFFECT_REQUESTED only)
    await user.click(screen.getByText('Tasks'));

    expect(screen.getByText('requested-task')).toBeInTheDocument();
    expect(screen.queryByText('resolved-task')).not.toBeInTheDocument();

    // Click "Results" filter (EFFECT_RESOLVED only)
    await user.click(screen.getByText('Results'));

    expect(screen.queryByText('requested-task')).not.toBeInTheDocument();
    expect(screen.getByText('resolved-task')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Stats bar
  // -----------------------------------------------------------------------
  it('displays summary stats when events are present', () => {
    const events = [
      createMockJournalEvent({ seq: 0, type: 'EFFECT_REQUESTED', payload: { effectId: 'e1', label: 'l1', kind: 'node' } }),
      createMockJournalEvent({ seq: 1, type: 'EFFECT_RESOLVED', payload: { effectId: 'e2', status: 'ok' } }),
      createMockJournalEvent({ seq: 2, type: 'RUN_FAILED', payload: {} }),
    ];

    render(<EventStream events={events} />);

    // Check stats are rendered
    expect(screen.getByText('Tasks:')).toBeInTheDocument();
    expect(screen.getByText('Completed:')).toBeInTheDocument();
    expect(screen.getByText('Errors:')).toBeInTheDocument();
  });

  it('does not display summary stats bar when no events', () => {
    render(<EventStream events={[]} />);

    expect(screen.queryByText('Tasks:')).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Event click handler
  // -----------------------------------------------------------------------
  it('calls onEventClick when an event is clicked', async () => {
    const user = setupUser();
    const handleClick = vi.fn();
    const events = [
      createMockJournalEvent({
        seq: 0,
        type: 'RUN_COMPLETED',
        payload: {},
      }),
    ];

    render(<EventStream events={events} onEventClick={handleClick} />);

    await user.click(screen.getByText('Run finished successfully'));
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(events[0]);
  });

  // -----------------------------------------------------------------------
  // "Show more" pagination
  // -----------------------------------------------------------------------
  it('shows a "Show more" button when there are more than 20 events', () => {
    // Create 25 events (page size is 20)
    const events = makeEvents(25);

    render(<EventStream events={events} />);

    expect(screen.getByText(/Show .* more/)).toBeInTheDocument();
  });

  it('does not show "Show more" when there are 20 or fewer events', () => {
    const events = makeEvents(10);

    render(<EventStream events={events} />);

    expect(screen.queryByText(/Show .* more/)).not.toBeInTheDocument();
  });

  it('loads more events when "Show more" is clicked', async () => {
    const user = setupUser();
    const events = makeEvents(25);

    render(<EventStream events={events} />);

    const showMoreBtn = screen.getByText(/Show .* more/);
    await user.click(showMoreBtn);

    // After loading more, the "Show more" button should be gone (all 25 visible)
    expect(screen.queryByText(/Show .* more/)).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Event grouping (3+ consecutive same-type events are collapsed)
  // -----------------------------------------------------------------------
  it('groups 3+ consecutive same-type events into a collapsed row', () => {
    // 4 consecutive EFFECT_REQUESTED events
    const events = makeEvents(4, 'EFFECT_REQUESTED');

    render(<EventStream events={events} />);

    // The group summary should show "4x" and "Requested"
    expect(screen.getByText('4x')).toBeInTheDocument();
    expect(screen.getByText('Requested')).toBeInTheDocument();
  });

  it('expands a collapsed group when clicked', async () => {
    const user = setupUser();
    const events = makeEvents(4, 'EFFECT_REQUESTED');

    render(<EventStream events={events} />);

    // Initially, individual labels should not be visible (collapsed)
    expect(screen.queryByText('task-0')).not.toBeInTheDocument();

    // Click the group header to expand
    await user.click(screen.getByText('4x'));

    // After expansion, individual items should be visible
    expect(screen.getByText('task-0')).toBeInTheDocument();
    expect(screen.getByText('task-1')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // "Event Stream" heading
  // -----------------------------------------------------------------------
  it('renders the "Event Stream" heading', () => {
    render(<EventStream events={[]} />);

    expect(screen.getByText('Event Stream')).toBeInTheDocument();
  });
});
