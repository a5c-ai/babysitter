"use client";
import { useState, useEffect, useRef } from "react";

export interface StreamEvent {
  type: string;
  runId?: string;
  /** Batched runIds from leading-edge debounce (SSE broadcast level). */
  runIds?: string[];
  status?: string;
  timestamp?: number;
}

type EventCallback = (event: StreamEvent) => void;

// Module-level state for shared EventSource connection
let sharedEventSource: EventSource | null = null;
let subscriberCount = 0;
let reconnectAttempts = 0;
let reconnectTimeout: NodeJS.Timeout | null = null;
const subscribers: Set<EventCallback> = new Set();

function getReconnectDelay(): number {
  const delays = [1000, 2000, 4000, 8000, 30000];
  return delays[Math.min(reconnectAttempts, delays.length - 1)];
}

function createEventSource() {
  if (typeof EventSource === "undefined") {
    // eslint-disable-next-line no-console
    console.warn("EventSource not supported in this environment");
    return null;
  }

  const source = new EventSource("/api/stream");

  source.onopen = () => {
    // eslint-disable-next-line no-console
    console.log("SSE connected");
    reconnectAttempts = 0;
  };

  source.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      subscribers.forEach((callback) => callback(data));
    } catch (err) {
      console.error("Failed to parse SSE message:", err);
    }
  };

  source.onerror = () => {
    console.error("SSE connection error");
    source.close();
    sharedEventSource = null;

    // Notify subscribers of disconnect so they can fall back to polling
    subscribers.forEach((callback) => callback({ type: "disconnect" }));

    // Auto-reconnect with exponential backoff
    if (subscriberCount > 0) {
      reconnectAttempts++;
      const delay = getReconnectDelay();
      // eslint-disable-next-line no-console
      console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
      reconnectTimeout = setTimeout(() => {
        if (subscriberCount > 0) {
          sharedEventSource = createEventSource();
        }
      }, delay);
    }
  };

  return source;
}

export function subscribe(callback: EventCallback): () => void {
  subscribers.add(callback);
  subscriberCount++;

  // Open connection on first subscriber
  if (subscriberCount === 1 && !sharedEventSource) {
    sharedEventSource = createEventSource();
  }

  // Return unsubscribe function
  return () => {
    subscribers.delete(callback);
    subscriberCount--;

    // Close connection on last unsubscribe
    if (subscriberCount === 0) {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      if (sharedEventSource) {
        sharedEventSource.close();
        sharedEventSource = null;
      }
      reconnectAttempts = 0;
    }
  };
}

export function useEventStream() {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<StreamEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (typeof EventSource === "undefined") {
      setError("EventSource not supported");
      setConnected(false);
      return;
    }

    const handleEvent = (event: StreamEvent) => {
      if (mountedRef.current) {
        setLastEvent(event);
        // Only mark as connected for real data events, not disconnect/error
        if (event.type !== "disconnect" && event.type !== "error") {
          setConnected(true);
          setError(null);
        }
      }
    };

    const unsubscribe = subscribe(handleEvent);

    // Check connection status
    const checkConnection = setInterval(() => {
      if (mountedRef.current) {
        setConnected(
          sharedEventSource !== null && sharedEventSource.readyState === EventSource.OPEN
        );
      }
    }, 1000);

    return () => {
      mountedRef.current = false;
      unsubscribe();
      clearInterval(checkConnection);
    };
  }, []);

  return { connected, lastEvent, error };
}
