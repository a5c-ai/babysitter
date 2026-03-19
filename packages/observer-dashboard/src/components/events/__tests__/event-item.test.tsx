import { render, screen, setupUser } from '@/test/test-utils';
import { EventItem } from '../event-item';
import { createMockJournalEvent } from '@/test/fixtures';

describe('EventItem', () => {
  // -----------------------------------------------------------------------
  // RUN_CREATED
  // -----------------------------------------------------------------------
  describe('RUN_CREATED event', () => {
    it('renders the "Created" badge', () => {
      const event = createMockJournalEvent({
        type: 'RUN_CREATED',
        payload: { processId: 'data-pipeline/ingest' },
      });

      render(<EventItem event={event} />);

      expect(screen.getByText('Created')).toBeInTheDocument();
    });

    it('displays the processId from the payload', () => {
      const event = createMockJournalEvent({
        type: 'RUN_CREATED',
        payload: { processId: 'data-pipeline/ingest' },
      });

      render(<EventItem event={event} />);

      expect(screen.getByText('data-pipeline/ingest')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // EFFECT_REQUESTED
  // -----------------------------------------------------------------------
  describe('EFFECT_REQUESTED event', () => {
    it('renders the "Requested" badge', () => {
      const event = createMockJournalEvent({
        type: 'EFFECT_REQUESTED',
        payload: { label: 'run-task-abc', kind: 'agent', effectId: 'eff-1', stepId: 'step-1', taskId: 'task-1' },
      });

      render(<EventItem event={event} />);

      expect(screen.getByText('Requested')).toBeInTheDocument();
    });

    it('displays the label from the payload', () => {
      const event = createMockJournalEvent({
        type: 'EFFECT_REQUESTED',
        payload: { label: 'my-task-label', kind: 'shell', effectId: 'eff-1' },
      });

      render(<EventItem event={event} />);

      expect(screen.getByText('my-task-label')).toBeInTheDocument();
    });

    it('shows the kind badge when present', () => {
      const event = createMockJournalEvent({
        type: 'EFFECT_REQUESTED',
        payload: { label: 'my-task', kind: 'agent', effectId: 'eff-1' },
      });

      render(<EventItem event={event} />);

      expect(screen.getByText('agent')).toBeInTheDocument();
    });

    it('falls back to "Task" when label is empty', () => {
      const event = createMockJournalEvent({
        type: 'EFFECT_REQUESTED',
        payload: { label: '', kind: 'node', effectId: 'eff-1' },
      });

      render(<EventItem event={event} />);

      expect(screen.getByText('Task')).toBeInTheDocument();
    });

    it('renders step and task metadata when present', () => {
      const event = createMockJournalEvent({
        type: 'EFFECT_REQUESTED',
        payload: { label: 'x', kind: 'node', effectId: 'eff-1', stepId: 'step-42', taskId: 'task-99' },
      });

      render(<EventItem event={event} />);

      expect(screen.getByText(/step: step-42/)).toBeInTheDocument();
      expect(screen.getByText(/task: task-99/)).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // EFFECT_RESOLVED
  // -----------------------------------------------------------------------
  describe('EFFECT_RESOLVED event', () => {
    it('renders the "Resolved" badge', () => {
      const event = createMockJournalEvent({
        type: 'EFFECT_RESOLVED',
        payload: { effectId: 'eff-1', status: 'ok' },
      });

      render(<EventItem event={event} />);

      expect(screen.getByText('Resolved')).toBeInTheDocument();
    });

    it('displays label when available', () => {
      const event = createMockJournalEvent({
        type: 'EFFECT_RESOLVED',
        payload: { label: 'completed-task', effectId: 'eff-1', status: 'ok' },
      });

      render(<EventItem event={event} />);

      expect(screen.getByText('completed-task')).toBeInTheDocument();
    });

    it('displays duration when startedAt and finishedAt are present', () => {
      const start = '2025-01-01T00:00:00.000Z';
      const finish = '2025-01-01T00:00:03.000Z'; // 3 seconds later
      const event = createMockJournalEvent({
        type: 'EFFECT_RESOLVED',
        payload: { effectId: 'eff-1', status: 'ok', startedAt: start, finishedAt: finish },
      });

      render(<EventItem event={event} />);

      expect(screen.getByText('3s')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // RUN_COMPLETED
  // -----------------------------------------------------------------------
  describe('RUN_COMPLETED event', () => {
    it('renders the "Completed" badge and success message', () => {
      const event = createMockJournalEvent({
        type: 'RUN_COMPLETED',
        payload: {},
      });

      render(<EventItem event={event} />);

      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Run finished successfully')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // RUN_FAILED
  // -----------------------------------------------------------------------
  describe('RUN_FAILED event', () => {
    it('renders the "Failed" badge and failure message', () => {
      const event = createMockJournalEvent({
        type: 'RUN_FAILED',
        payload: {},
      });

      render(<EventItem event={event} />);

      expect(screen.getByText('Failed')).toBeInTheDocument();
      expect(screen.getByText('Run failed')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Timestamp display
  // -----------------------------------------------------------------------
  it('displays a relative timestamp', () => {
    // Create an event with a recent timestamp
    const event = createMockJournalEvent({
      ts: new Date(Date.now() - 30000).toISOString(), // 30 seconds ago
      type: 'RUN_CREATED',
      payload: { processId: 'p1' },
    });

    render(<EventItem event={event} />);

    // formatRelativeTime for 30s ago returns "30s ago"
    expect(screen.getByText('30s ago')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Click handler
  // -----------------------------------------------------------------------
  it('calls onClick when the item is clicked', async () => {
    const user = setupUser();
    const handleClick = vi.fn();
    const event = createMockJournalEvent({
      type: 'RUN_CREATED',
      payload: { processId: 'p1' },
    });

    render(<EventItem event={event} onClick={handleClick} />);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders without crashing when onClick is not provided', () => {
    const event = createMockJournalEvent({
      type: 'RUN_CREATED',
      payload: { processId: 'p1' },
    });

    const { container } = render(<EventItem event={event} />);
    expect(container.querySelector('button')).toBeInTheDocument();
  });
});
