import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { EventLogIndex, type RunSeqState } from './event-log-index.js';

export interface LoggedRunEvent {
  seq: number;
  ts: number;
  source: string;
  event: Record<string, unknown>;
}

export interface ReadRunEventsResult {
  events: LoggedRunEvent[];
  state: RunSeqState;
}

function eventLogPath(eventLogDir: string, runId: string): string {
  return path.join(eventLogDir, `${runId}.ndjson`);
}

async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export class EventLog {
  readonly index: EventLogIndex;
  private readonly appendChains = new Map<string, Promise<LoggedRunEvent[]>>();

  constructor(
    private readonly eventLogDir: string,
    private readonly maxEventsPerRun: number,
  ) {
    this.index = new EventLogIndex(eventLogDir);
  }

  async append(runId: string, source: string, event: Record<string, unknown>): Promise<LoggedRunEvent[]> {
    const previous = this.appendChains.get(runId) ?? Promise.resolve<LoggedRunEvent[]>([]);
    const next = previous.catch(() => []).then(async () => {
      await ensureDir(this.eventLogDir);
      const logged = await this.appendSingle(runId, source, event);
      const state = this.index.getSeqState(runId);
      if (state.eventCount <= this.maxEventsPerRun) {
        return [logged];
      }

      const dropCount = Math.max(1, Math.ceil(this.maxEventsPerRun * 0.1));
      const filePath = eventLogPath(this.eventLogDir, runId);
      const allEvents = await this.readAll(runId);
      const dropped = allEvents.slice(0, dropCount);
      const kept = allEvents.slice(dropCount);
      await fs.writeFile(
        filePath,
        kept.map((entry) => JSON.stringify(entry)).join('\n') + (kept.length > 0 ? '\n' : ''),
        'utf8',
      );
      this.index.removeEvents(runId, dropped.map((entry) => entry.seq));

      const stateAfterDrop = this.index.getSeqState(runId);
      const notification = await this.appendSingle(runId, 'gateway', {
        type: 'gateway.notification',
        code: 'events_truncated',
        droppedCount: dropped.length,
        headSeq: stateAfterDrop.headSeq,
        tailSeq: stateAfterDrop.tailSeq,
      });
      return [logged, notification];
    });

    this.appendChains.set(runId, next);
    try {
      return await next;
    } finally {
      if (this.appendChains.get(runId) === next) {
        this.appendChains.delete(runId);
      }
    }
  }

  async readSince(runId: string, sinceSeq: number, tailLimit?: number): Promise<ReadRunEventsResult> {
    const state = this.index.getSeqState(runId);
    const events = await this.readAll(runId);
    return {
      events: events.filter((entry) => entry.seq > sinceSeq && (tailLimit == null || entry.seq <= tailLimit)),
      state,
    };
  }

  getSeqState(runId: string): RunSeqState {
    return this.index.getSeqState(runId);
  }

  async flush(): Promise<void> {
    await Promise.allSettled(Array.from(this.appendChains.values()));
  }

  async close(): Promise<void> {
    await this.flush();
    this.index.close();
  }

  private async appendSingle(runId: string, source: string, event: Record<string, unknown>): Promise<LoggedRunEvent> {
    const ts = Date.now();
    const seq = this.index.nextSeq(runId);
    const logged: LoggedRunEvent = {
      seq,
      ts,
      source,
      event,
    };
    await fs.appendFile(eventLogPath(this.eventLogDir, runId), `${JSON.stringify(logged)}\n`, 'utf8');
    this.index.appendEvent(runId, this.index.indexedEventFor(seq, ts, source, event));
    return logged;
  }

  private async readAll(runId: string): Promise<LoggedRunEvent[]> {
    try {
      const raw = await fs.readFile(eventLogPath(this.eventLogDir, runId), 'utf8');
      return raw
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .map((line) => JSON.parse(line) as LoggedRunEvent)
        .sort((left, right) => left.seq - right.seq);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }
}
