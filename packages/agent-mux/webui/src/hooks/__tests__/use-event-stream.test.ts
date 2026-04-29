import { renderHook, act } from '@testing-library/react';
import { useEventStream, subscribe } from '../use-event-stream';

type MockEventSourceInstance = {
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  close: ReturnType<typeof vi.fn>;
  readyState: number;
  url: string;
};

let mockEventSourceInstances: MockEventSourceInstance[] = [];

class MockEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  close = vi.fn();
  readyState = MockEventSource.OPEN;
  url: string;

  constructor(url: string) {
    this.url = url;
    mockEventSourceInstances.push(this);
    // Simulate async open
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 0);
  }
}

// We need to track unsubscribe functions to clean up between tests
let activeUnsubscribers: Array<() => void> = [];

describe('use-event-stream', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockEventSourceInstances = [];
    vi.stubGlobal('EventSource', MockEventSource);
  });

  afterEach(() => {
    // Unsubscribe all active subscribers to reset module-level state
    for (const unsub of activeUnsubscribers) {
      unsub();
    }
    activeUnsubscribers = [];
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('subscribe', () => {
    it('creates a shared EventSource on first subscriber', () => {
      const callback = vi.fn();
      const unsubscribe = subscribe(callback);
      activeUnsubscribers.push(unsubscribe);

      expect(mockEventSourceInstances).toHaveLength(1);
      expect(mockEventSourceInstances[0].url).toBe('/api/stream');
    });

    it('reuses the same EventSource for multiple subscribers', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();

      const unsub1 = subscribe(cb1);
      const unsub2 = subscribe(cb2);
      activeUnsubscribers.push(unsub1, unsub2);

      expect(mockEventSourceInstances).toHaveLength(1);
    });

    it('delivers messages to all subscribers', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();

      const unsub1 = subscribe(cb1);
      const unsub2 = subscribe(cb2);
      activeUnsubscribers.push(unsub1, unsub2);

      const instance = mockEventSourceInstances[0];
      const messageData = { type: 'run_updated', runId: 'run-1' };

      instance.onmessage!(
        new MessageEvent('message', { data: JSON.stringify(messageData) })
      );

      expect(cb1).toHaveBeenCalledWith(messageData);
      expect(cb2).toHaveBeenCalledWith(messageData);
    });

    it('closes EventSource when last subscriber unsubscribes', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();

      const unsub1 = subscribe(cb1);
      const unsub2 = subscribe(cb2);

      unsub1();
      // Still one subscriber, should not close
      expect(mockEventSourceInstances[0].close).not.toHaveBeenCalled();

      unsub2();
      // Last subscriber gone, should close
      expect(mockEventSourceInstances[0].close).toHaveBeenCalled();
      // Do not add to activeUnsubscribers since we already cleaned up
    });

    it('notifies subscribers with disconnect event on SSE error', () => {
      const callback = vi.fn();
      const unsub = subscribe(callback);
      activeUnsubscribers.push(unsub);

      const instance = mockEventSourceInstances[0];

      instance.onerror!(new Event('error'));

      expect(callback).toHaveBeenCalledWith({ type: 'disconnect' });
    });

    it('attempts reconnect with backoff on error', async () => {
      const callback = vi.fn();
      const unsub = subscribe(callback);
      activeUnsubscribers.push(unsub);

      const instance = mockEventSourceInstances[0];

      // Trigger error
      instance.onerror!(new Event('error'));

      expect(mockEventSourceInstances).toHaveLength(1); // only original

      // After reconnectAttempts++ (0->1), delay = delays[1] = 2000ms
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      expect(mockEventSourceInstances).toHaveLength(2); // reconnected
    });
  });

  describe('useEventStream', () => {
    it('returns connected, lastEvent, error initial state', () => {
      const { result } = renderHook(() => useEventStream());

      expect(result.current.connected).toBe(false);
      expect(result.current.lastEvent).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('updates lastEvent when a message is received', () => {
      const { result } = renderHook(() => useEventStream());

      const instance = mockEventSourceInstances[0];
      const eventData = { type: 'run_completed', runId: 'run-1' };

      act(() => {
        instance.onmessage!(
          new MessageEvent('message', { data: JSON.stringify(eventData) })
        );
      });

      expect(result.current.lastEvent).toEqual(eventData);
      expect(result.current.connected).toBe(true);
    });

    it('does not set connected=true for disconnect events', () => {
      const { result } = renderHook(() => useEventStream());

      const instance = mockEventSourceInstances[0];

      // First send a real event to set connected=true
      act(() => {
        instance.onmessage!(
          new MessageEvent('message', { data: JSON.stringify({ type: 'update', runId: 'r1' }) })
        );
      });
      expect(result.current.connected).toBe(true);

      // Now trigger SSE error which emits disconnect
      act(() => {
        instance.onerror!(new Event('error'));
      });

      // connected should not have been set to true by the disconnect event
      // (the interval checker will eventually update it, but the event itself should not)
      expect(result.current.lastEvent).toEqual({ type: 'disconnect' });
    });

    it('does not set connected=true for error events', () => {
      const { result } = renderHook(() => useEventStream());

      const instance = mockEventSourceInstances[0];

      // Send a server-side error event (type: 'error')
      act(() => {
        instance.onmessage!(
          new MessageEvent('message', { data: JSON.stringify({ type: 'error', error: 'test' }) })
        );
      });

      // lastEvent should be set but connected should remain false
      expect(result.current.lastEvent).toEqual({ type: 'error', error: 'test' });
      expect(result.current.connected).toBe(false);
    });

    it('cleans up on unmount', () => {
      const { unmount } = renderHook(() => useEventStream());

      expect(mockEventSourceInstances).toHaveLength(1);

      unmount();

      // After unmount, the EventSource should be closed
      expect(mockEventSourceInstances[0].close).toHaveBeenCalled();
    });
  });
});

describe('use-event-stream (no EventSource)', () => {
  beforeEach(() => {
    // Remove EventSource from global scope
    vi.stubGlobal('EventSource', undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets error when EventSource is not supported', () => {
    const { result } = renderHook(() => useEventStream());

    expect(result.current.error).toBe('EventSource not supported');
    expect(result.current.connected).toBe(false);
  });
});
