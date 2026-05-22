import { render, screen, setupUser } from '@/test/test-utils';
import { NotificationPanel } from '../notification-panel';
import type { AppNotification } from '@/hooks/use-notifications';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('react-router-dom-v6', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom-v6')>('react-router-dom-v6');
  return {
    ...actual,
    useNavigate: () => mockPush,
  };
});

function makeNotification(overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: overrides.id ?? 'notif-1',
    title: overrides.title ?? 'Test Title',
    body: overrides.body ?? 'Test body message',
    type: overrides.type ?? 'info',
    timestamp: overrides.timestamp ?? Date.now(),
    href: overrides.href,
    persistent: overrides.persistent,
  };
}

describe('NotificationPanel', () => {
  const defaultProps = {
    open: true,
    notifications: [] as AppNotification[],
    onDismiss: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // Empty state
  // -----------------------------------------------------------------------
  it('shows "No notifications" when list is empty', () => {
    render(<NotificationPanel {...defaultProps} />);

    expect(screen.getByText('No notifications')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Renders notifications
  // -----------------------------------------------------------------------
  it('renders a list of notifications', () => {
    const notifications = [
      makeNotification({ id: 'n1', title: 'Run Started', body: 'Run abc started', type: 'info' }),
      makeNotification({ id: 'n2', title: 'Run Failed', body: 'Run xyz failed', type: 'error' }),
    ];

    render(<NotificationPanel {...defaultProps} notifications={notifications} />);

    expect(screen.getByText('Run Started')).toBeInTheDocument();
    expect(screen.getByText('Run abc started')).toBeInTheDocument();
    expect(screen.getByText('Run Failed')).toBeInTheDocument();
    expect(screen.getByText('Run xyz failed')).toBeInTheDocument();
  });

  it('displays the notification count', () => {
    const notifications = [
      makeNotification({ id: 'n1' }),
      makeNotification({ id: 'n2' }),
    ];

    render(<NotificationPanel {...defaultProps} notifications={notifications} />);

    expect(screen.getByText('(2)')).toBeInTheDocument();
  });

  it('does not display a count badge when there are no notifications', () => {
    render(<NotificationPanel {...defaultProps} />);

    expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Heading
  // -----------------------------------------------------------------------
  it('renders the "Notifications" heading', () => {
    render(<NotificationPanel {...defaultProps} />);

    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Dismiss button
  // -----------------------------------------------------------------------
  it('calls onDismiss with the notification id when dismiss button is clicked', async () => {
    const user = setupUser();
    const onDismiss = vi.fn();
    const notifications = [
      makeNotification({ id: 'notif-42', title: 'My Alert' }),
    ];

    render(
      <NotificationPanel
        open={true}
        notifications={notifications}
        onDismiss={onDismiss}
        onClose={vi.fn()}
      />,
    );

    // The dismiss button is inside the notification card (the X icon within the panel content)
    const xIcons = screen.getAllByTestId('icon-X');
    // Find the dismiss button within the notification panel content area
    const dismissButton = xIcons[xIcons.length - 1].closest('button')!;
    await user.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledWith('notif-42');
  });

  // -----------------------------------------------------------------------
  // Close button
  // -----------------------------------------------------------------------
  it('calls onClose when the panel close button is clicked', async () => {
    const user = setupUser();
    const onClose = vi.fn();

    render(
      <NotificationPanel
        open={true}
        notifications={[]}
        onDismiss={vi.fn()}
        onClose={onClose}
      />,
    );

    // The Drawer close button
    const closeButton = screen.getByLabelText(/close/i);
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // -----------------------------------------------------------------------
  // Clicking notification with href navigates
  // -----------------------------------------------------------------------
  it('navigates and dismisses when a notification with href is clicked', async () => {
    const user = setupUser();
    const onDismiss = vi.fn();
    const onClose = vi.fn();
    const notifications = [
      makeNotification({ id: 'n1', title: 'Go Here', href: '/dispatches/abc' }),
    ];

    render(
      <NotificationPanel
        open={true}
        notifications={notifications}
        onDismiss={onDismiss}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByText('Go Here'));

    expect(mockPush).toHaveBeenCalledWith('/dispatches/abc');
    expect(onDismiss).toHaveBeenCalledWith('n1');
    expect(onClose).toHaveBeenCalled();
  });

  it('does not navigate when a notification without href is clicked', async () => {
    const user = setupUser();
    const onDismiss = vi.fn();
    const notifications = [
      makeNotification({ id: 'n1', title: 'No Link' }),
    ];

    render(
      <NotificationPanel
        open={true}
        notifications={notifications}
        onDismiss={onDismiss}
        onClose={vi.fn()}
      />,
    );

    await user.click(screen.getByText('No Link'));

    expect(mockPush).not.toHaveBeenCalled();
    expect(onDismiss).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Timestamp display
  // -----------------------------------------------------------------------
  it('displays "just now" for very recent notifications', () => {
    const notifications = [
      makeNotification({ id: 'n1', timestamp: Date.now() - 5000 }),
    ];

    render(<NotificationPanel {...defaultProps} notifications={notifications} />);

    expect(screen.getByText('just now')).toBeInTheDocument();
  });

  it('displays minutes ago for older notifications', () => {
    const notifications = [
      makeNotification({ id: 'n1', timestamp: Date.now() - 5 * 60 * 1000 }),
    ];

    render(<NotificationPanel {...defaultProps} notifications={notifications} />);

    expect(screen.getByText('5m ago')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Persistent (pinned) notification
  // -----------------------------------------------------------------------
  it('shows pin icon for persistent notifications', () => {
    const persistentNotif = makeNotification({ id: 'n-pin', persistent: true });
    render(<NotificationPanel {...defaultProps} notifications={[persistentNotif]} />);
    expect(screen.getByTitle('Pinned — won\'t auto-dismiss')).toBeInTheDocument();
    expect(screen.getByText('· Pinned')).toBeInTheDocument();
  });

  it('does not show pin icon for non-persistent notifications', () => {
    const notif = makeNotification({ id: 'n-nopin' });
    render(<NotificationPanel {...defaultProps} notifications={[notif]} />);
    expect(screen.queryByTitle('Pinned — won\'t auto-dismiss')).not.toBeInTheDocument();
    expect(screen.queryByText('· Pinned')).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // All notification types render icons
  // -----------------------------------------------------------------------
  it('renders icons for all notification types', () => {
    const notifications = [
      makeNotification({ id: 'n1', type: 'success' }),
      makeNotification({ id: 'n2', type: 'error' }),
      makeNotification({ id: 'n3', type: 'warning' }),
      makeNotification({ id: 'n4', type: 'info' }),
    ];

    render(<NotificationPanel {...defaultProps} notifications={notifications} />);

    expect(screen.getByTestId('icon-CheckCircle2')).toBeInTheDocument();
    expect(screen.getByTestId('icon-XCircle')).toBeInTheDocument();
    expect(screen.getByTestId('icon-AlertTriangle')).toBeInTheDocument();
    expect(screen.getByTestId('icon-Info')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Persistent notification shows Pin icon
  // -----------------------------------------------------------------------
  it('shows a Pin icon for persistent notifications', () => {
    const notifications = [
      makeNotification({ id: 'n1', title: 'Breakpoint', persistent: true }),
    ];

    render(<NotificationPanel {...defaultProps} notifications={notifications} />);

    expect(screen.getByTestId('icon-Pin')).toBeInTheDocument();
    expect(screen.getByTitle('Pinned — won\'t auto-dismiss')).toBeInTheDocument();
  });

  it('does not show a Pin icon for non-persistent notifications', () => {
    const notifications = [
      makeNotification({ id: 'n1', title: 'Normal' }),
    ];

    render(<NotificationPanel {...defaultProps} notifications={notifications} />);

    expect(screen.queryByTestId('icon-Pin')).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Does not render when closed
  // -----------------------------------------------------------------------
  it('does not render content when open is false', () => {
    render(<NotificationPanel {...defaultProps} open={false} />);

    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
  });
});
