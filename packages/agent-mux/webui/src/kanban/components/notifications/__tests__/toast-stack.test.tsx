import { render, screen, setupUser } from '@/test/test-utils';
import { ToastStack } from '../toast-stack';
import type { AppNotification } from '@/hooks/use-notifications';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

function makeNotification(overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: overrides.id ?? 'toast-1',
    title: overrides.title ?? 'Toast Title',
    body: overrides.body ?? 'Toast body text',
    type: overrides.type ?? 'info',
    timestamp: overrides.timestamp ?? Date.now(),
    href: overrides.href,
    persistent: overrides.persistent,
  };
}

describe('ToastStack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // Empty state
  // -----------------------------------------------------------------------
  it('renders nothing when notifications array is empty', () => {
    const { container } = render(
      <ToastStack notifications={[]} onDismiss={vi.fn()} />,
    );

    // The container div is rendered but no toast items inside
    const toastItems = container.querySelectorAll('[class*="animate-slide-in-right"]');
    expect(toastItems).toHaveLength(0);
  });

  // -----------------------------------------------------------------------
  // Renders toasts
  // -----------------------------------------------------------------------
  it('renders toast for each notification', () => {
    const notifications = [
      makeNotification({ id: 't1', title: 'First Toast', body: 'Body 1' }),
      makeNotification({ id: 't2', title: 'Second Toast', body: 'Body 2' }),
    ];

    render(<ToastStack notifications={notifications} onDismiss={vi.fn()} />);

    expect(screen.getByText('First Toast')).toBeInTheDocument();
    expect(screen.getByText('Body 1')).toBeInTheDocument();
    expect(screen.getByText('Second Toast')).toBeInTheDocument();
    expect(screen.getByText('Body 2')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Stacking -- multiple toasts rendered in order
  // -----------------------------------------------------------------------
  it('stacks multiple toasts', () => {
    const notifications = [
      makeNotification({ id: 't1', title: 'Alpha' }),
      makeNotification({ id: 't2', title: 'Beta' }),
      makeNotification({ id: 't3', title: 'Gamma' }),
    ];

    render(<ToastStack notifications={notifications} onDismiss={vi.fn()} />);

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Dismiss button
  // -----------------------------------------------------------------------
  it('calls onDismiss with the toast id when dismiss button is clicked', async () => {
    const user = setupUser();
    const onDismiss = vi.fn();
    const notifications = [
      makeNotification({ id: 'toast-42', title: 'Dismissable' }),
    ];

    render(<ToastStack notifications={notifications} onDismiss={onDismiss} />);

    // The X button inside the toast
    const xIcon = screen.getByTestId('icon-X');
    const dismissButton = xIcon.closest('button')!;
    await user.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledWith('toast-42');
  });

  it('dismiss does not trigger navigation', async () => {
    const user = setupUser();
    const onDismiss = vi.fn();
    const notifications = [
      makeNotification({ id: 't1', title: 'Has Link', href: '/runs/abc' }),
    ];

    render(<ToastStack notifications={notifications} onDismiss={onDismiss} />);

    // Click the dismiss button (not the toast body)
    const xIcon = screen.getByTestId('icon-X');
    const dismissButton = xIcon.closest('button')!;
    await user.click(dismissButton);

    // Dismiss was called but navigation should NOT happen (stopPropagation)
    expect(onDismiss).toHaveBeenCalledWith('t1');
    expect(mockPush).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Clicking toast with href navigates
  // -----------------------------------------------------------------------
  it('navigates and dismisses when a toast with href is clicked', async () => {
    const user = setupUser();
    const onDismiss = vi.fn();
    const notifications = [
      makeNotification({ id: 't1', title: 'Clickable', href: '/runs/xyz' }),
    ];

    render(<ToastStack notifications={notifications} onDismiss={onDismiss} />);

    await user.click(screen.getByText('Clickable'));

    expect(mockPush).toHaveBeenCalledWith('/runs/xyz');
    expect(onDismiss).toHaveBeenCalledWith('t1');
  });

  it('does not navigate when a toast without href is clicked', async () => {
    const user = setupUser();
    const onDismiss = vi.fn();
    const notifications = [
      makeNotification({ id: 't1', title: 'No Link' }),
    ];

    render(<ToastStack notifications={notifications} onDismiss={onDismiss} />);

    await user.click(screen.getByText('No Link'));

    expect(mockPush).not.toHaveBeenCalled();
    expect(onDismiss).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Notification type icons
  // -----------------------------------------------------------------------
  it('renders the correct icon for success type', () => {
    const notifications = [makeNotification({ id: 't1', type: 'success' })];

    render(<ToastStack notifications={notifications} onDismiss={vi.fn()} />);

    expect(screen.getByTestId('icon-CheckCircle2')).toBeInTheDocument();
  });

  it('renders the correct icon for error type', () => {
    const notifications = [makeNotification({ id: 't1', type: 'error' })];

    render(<ToastStack notifications={notifications} onDismiss={vi.fn()} />);

    expect(screen.getByTestId('icon-XCircle')).toBeInTheDocument();
  });

  it('renders the correct icon for warning type', () => {
    const notifications = [makeNotification({ id: 't1', type: 'warning' })];

    render(<ToastStack notifications={notifications} onDismiss={vi.fn()} />);

    expect(screen.getByTestId('icon-AlertTriangle')).toBeInTheDocument();
  });

  it('renders the correct icon for info type', () => {
    const notifications = [makeNotification({ id: 't1', type: 'info' })];

    render(<ToastStack notifications={notifications} onDismiss={vi.fn()} />);

    expect(screen.getByTestId('icon-Info')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Persistent (pinned) notification
  // -----------------------------------------------------------------------
  it('shows pin icon for persistent notifications', () => {
    const persistentNotif = makeNotification({ id: 't-pin', persistent: true });
    render(<ToastStack notifications={[persistentNotif]} onDismiss={vi.fn()} />);
    expect(screen.getByTitle('Pinned — won\'t auto-dismiss')).toBeInTheDocument();
  });

  it('does not show pin icon for non-persistent notifications', () => {
    const notif = makeNotification({ id: 't-nopin' });
    render(<ToastStack notifications={[notif]} onDismiss={vi.fn()} />);
    expect(screen.queryByTitle('Pinned — won\'t auto-dismiss')).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Slide-in animation class
  // -----------------------------------------------------------------------
  it('applies the slide-in animation class to toasts', () => {
    const notifications = [makeNotification({ id: 't1' })];

    const { container } = render(
      <ToastStack notifications={notifications} onDismiss={vi.fn()} />,
    );

    const toastEl = container.querySelector('[class*="animate-slide-in-right"]');
    expect(toastEl).toBeInTheDocument();
  });
});
