import type { GatewayFrame } from '../protocol/v1.js';
import type { ClientConn } from './client-conn.js';
import type { LoggedRunEvent } from '../runs/event-log.js';

function asRunFrame(runId: string, event: LoggedRunEvent): GatewayFrame {
  return {
    type: 'run.event',
    runId,
    seq: event.seq,
    source: event.source,
    event: event.event,
  };
}

export class RunSubscriber {
  private readonly queuedLiveEvents: LoggedRunEvent[] = [];
  private catchUpTailSeq: number | null;

  constructor(
    readonly conn: ClientConn,
    readonly runId: string,
    catchUpTailSeq: number,
  ) {
    this.catchUpTailSeq = catchUpTailSeq;
  }

  replay(events: readonly LoggedRunEvent[]): void {
    for (const event of events) {
      this.conn.send(asRunFrame(this.runId, event));
    }
  }

  sendLive(event: LoggedRunEvent): void {
    if (this.catchUpTailSeq !== null && event.seq > this.catchUpTailSeq) {
      this.queuedLiveEvents.push(event);
      return;
    }
    this.conn.send(asRunFrame(this.runId, event));
  }

  finishCatchUp(): void {
    this.catchUpTailSeq = null;
    this.queuedLiveEvents.sort((left, right) => left.seq - right.seq);
    for (const event of this.queuedLiveEvents.splice(0, this.queuedLiveEvents.length)) {
      this.conn.send(asRunFrame(this.runId, event));
    }
  }
}
