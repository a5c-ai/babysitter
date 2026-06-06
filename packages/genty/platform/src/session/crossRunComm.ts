/**
 * Cross-Run Communication (GAP-AGENT-005).
 *
 * Provides a file-backed mailbox for sending messages between concurrent
 * or sequential babysitter runs. Messages are persisted as append-only
 * JSONL in a configurable state directory.
 */

import { existsSync, mkdirSync, readFileSync, appendFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CrossRunMessageType = 'data' | 'signal' | 'query' | 'response';

export interface CrossRunMessage {
  fromRunId: string;
  toRunId: string;
  type: CrossRunMessageType;
  payload: unknown;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// CrossRunMailbox
// ---------------------------------------------------------------------------

const MESSAGES_FILENAME = 'messages.jsonl';

export class CrossRunMailbox {
  private readonly filePath: string;

  constructor(private readonly stateDir: string) {
    this.filePath = join(stateDir, MESSAGES_FILENAME);
  }

  /**
   * Send a message to another run's mailbox.
   */
  send(msg: CrossRunMessage): void {
    if (!existsSync(this.stateDir)) {
      mkdirSync(this.stateDir, { recursive: true });
    }
    appendFileSync(this.filePath, JSON.stringify(msg) + '\n', 'utf8');
  }

  /**
   * Receive and consume all messages addressed to `runId`, optionally
   * filtered by message type. Consumed messages are removed from the file.
   */
  receive(runId: string, type?: CrossRunMessageType): CrossRunMessage[] {
    const all = this.loadAll();
    const matched: CrossRunMessage[] = [];
    const remaining: CrossRunMessage[] = [];

    for (const msg of all) {
      if (msg.toRunId === runId && (type == null || msg.type === type)) {
        matched.push(msg);
      } else {
        remaining.push(msg);
      }
    }

    this.writeAll(remaining);
    return matched;
  }

  /**
   * Peek at messages for `runId` without consuming them.
   */
  peek(runId: string): CrossRunMessage[] {
    return this.loadAll().filter((msg) => msg.toRunId === runId);
  }

  /**
   * Clear all messages addressed to `runId`.
   */
  clear(runId: string): void {
    const remaining = this.loadAll().filter((msg) => msg.toRunId !== runId);
    this.writeAll(remaining);
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  private loadAll(): CrossRunMessage[] {
    if (!existsSync(this.filePath)) return [];
    const raw = readFileSync(this.filePath, 'utf8').trim();
    if (!raw) return [];
    return raw.split('\n').map((line) => JSON.parse(line) as CrossRunMessage);
  }

  private writeAll(messages: CrossRunMessage[]): void {
    if (!existsSync(this.stateDir)) {
      mkdirSync(this.stateDir, { recursive: true });
    }
    const content = messages.length > 0
      ? messages.map((m) => JSON.stringify(m)).join('\n') + '\n'
      : '';
    writeFileSync(this.filePath, content, 'utf8');
  }
}
