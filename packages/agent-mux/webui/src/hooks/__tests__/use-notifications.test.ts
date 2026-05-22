import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '../use-notifications';

describe('useNotifications', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock Notification API
    Object.defineProperty(window, 'Notification', {
      writable: true,
      value: class MockNotification {
        static permission: NotificationPermission = 'default';
        static requestPermission = vi.fn().mockResolvedValue('granted');
        constructor(public title: string, public options?: NotificationOptions) {}
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('starts with empty notification list', () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.notifications).toEqual([]);
  });

  it('adds a notification via notify', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.notify('Test Title', 'Test body', 'info');
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].title).toBe('Test Title');
    expect(result.current.notifications[0].body).toBe('Test body');
    expect(result.current.notifications[0].type).toBe('info');
  });

  it('defaults type to info when not specified', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.notify('Title', 'Body');
    });

    expect(result.current.notifications[0].type).toBe('info');
  });

  it('supports all notification types', () => {
    const { result } = renderHook(() => useNotifications());

    const types = ['success', 'error', 'warning', 'info'] as const;
    for (const type of types) {
      act(() => {
        result.current.notify(`${type} title`, `${type} body`, type);
      });
    }

    expect(result.current.notifications).toHaveLength(4);
    types.forEach((type, index) => {
      expect(result.current.notifications[index].type).toBe(type);
    });
  });

  it('includes href when provided', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.notify('Title', 'Body', 'info', { href: '/some/link' });
    });

    expect(result.current.notifications[0].href).toBe('/some/link');
  });

  it('assigns unique ids to notifications', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.notify('First', 'Body 1');
      result.current.notify('Second', 'Body 2');
    });

    const ids = result.current.notifications.map((n) => n.id);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it('includes a timestamp on each notification', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.notify('Title', 'Body');
    });

    expect(result.current.notifications[0].timestamp).toBe(now);
  });

  it('dismisses a notification by id', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.notify('First', 'Body 1');
      result.current.notify('Second', 'Body 2');
    });

    expect(result.current.notifications).toHaveLength(2);
    const idToRemove = result.current.notifications[0].id;

    act(() => {
      result.current.dismiss(idToRemove);
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].title).toBe('Second');
  });

  it('auto-dismisses non-persistent notification after 5 seconds', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.notify('Auto dismiss', 'Should disappear');
    });

    expect(result.current.notifications).toHaveLength(1);

    // Advance just under 5s
    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(result.current.notifications).toHaveLength(1);

    // Advance past 5s
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.notifications).toHaveLength(0);
  });

  it('does NOT auto-dismiss persistent notifications', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.notify('Breakpoint', 'Needs approval', 'warning', { href: '/runs/abc', persistent: true });
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].persistent).toBe(true);

    // Advance well past the normal auto-dismiss timeout
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    // Persistent notification should still be present
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].title).toBe('Breakpoint');
  });

  it('persistent notifications can still be manually dismissed', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.notify('Breakpoint', 'Needs approval', 'warning', { href: '/runs/abc', persistent: true });
    });

    expect(result.current.notifications).toHaveLength(1);
    const id = result.current.notifications[0].id;

    act(() => {
      result.current.dismiss(id);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('handles multiple auto-dismissals independently', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.notify('First', 'Body 1');
    });

    // Advance 3 seconds, then add another
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    act(() => {
      result.current.notify('Second', 'Body 2');
    });

    expect(result.current.notifications).toHaveLength(2);

    // First should auto-dismiss at 5s (2 more seconds)
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].title).toBe('Second');

    // Second should auto-dismiss at 8s total (3 more seconds)
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.notifications).toHaveLength(0);
  });

  it('reads initial notification permission', () => {
    (window.Notification as unknown as { permission: string }).permission = 'granted';

    const { result } = renderHook(() => useNotifications());
    // Permission is set from useEffect, but the initial state is 'default'.
    // After mount effect runs:
    expect(result.current.permission).toBe('granted');
  });

  it('requestPermission calls Notification.requestPermission', async () => {
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(Notification.requestPermission).toHaveBeenCalled();
  });
});
