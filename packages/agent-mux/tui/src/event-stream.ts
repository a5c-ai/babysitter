import type { AgentEvent } from '@a5c-ai/agent-mux';

export type EventSubscriber = (event: AgentEvent) => void;
export type Unsubscribe = () => void;

export class EventStream {
  private subscribers: Set<EventSubscriber> = new Set();
  private resetSubs: Set<() => void> = new Set();
  private buffer: AgentEvent[] = [];
  private maxBuffer: number;

  onReset(fn: () => void): Unsubscribe {
    this.resetSubs.add(fn);
    return () => {
      this.resetSubs.delete(fn);
    };
  }

  reset(): void {
    this.buffer = [];
    for (const fn of this.resetSubs) {
      try {
        fn();
      } catch {
        // subscriber errors must not break the reset
      }
    }
  }

  constructor(maxBuffer = 1000) {
    this.maxBuffer = maxBuffer;
  }

  subscribe(fn: EventSubscriber): Unsubscribe {
    this.subscribers.add(fn);
    return () => {
      this.subscribers.delete(fn);
    };
  }

  push(event: AgentEvent): void {
    this.buffer.push(event);
    if (this.buffer.length > this.maxBuffer) this.buffer.shift();
    for (const fn of this.subscribers) {
      try {
        fn(event);
      } catch {
        // subscriber errors must not break the stream
      }
    }
  }

  snapshot(): readonly AgentEvent[] {
    return this.buffer.slice();
  }

  clear(): void {
    this.buffer = [];
  }
}
