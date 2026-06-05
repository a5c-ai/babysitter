export type SteeringMessageType = 'steer' | 'followup';

export interface SteeringMessage {
  type: SteeringMessageType;
  content: string;
  timestamp: string;
  authorId?: string;
}

export class SteeringQueue {
  private queue: SteeringMessage[] = [];
  private listeners: Array<(msg: SteeringMessage) => void> = [];

  submit(content: string, type: SteeringMessageType = 'steer', authorId?: string): void {
    const msg: SteeringMessage = {
      type,
      content,
      timestamp: new Date().toISOString(),
      authorId,
    };
    this.queue.push(msg);
    for (const listener of this.listeners) listener(msg);
  }

  drain(type?: SteeringMessageType): SteeringMessage[] {
    if (type) {
      const matching = this.queue.filter(m => m.type === type);
      this.queue = this.queue.filter(m => m.type !== type);
      return matching;
    }
    const all = [...this.queue];
    this.queue = [];
    return all;
  }

  peek(): SteeringMessage[] {
    return [...this.queue];
  }

  get pending(): number {
    return this.queue.length;
  }

  onMessage(listener: (msg: SteeringMessage) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}
