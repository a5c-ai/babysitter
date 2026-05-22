import * as fs from 'node:fs';
import * as path from 'node:path';
import { createRequire } from 'node:module';

import type { RunEntry } from './types.js';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: new (path: string) => any };

export interface IndexedRunEvent {
  seq: number;
  ts: number;
  source: string;
  eventType: string;
}

export interface RunSeqState {
  headSeq: number;
  tailSeq: number;
  eventCount: number;
}

function ensureParentDir(filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function eventTypeOf(event: Record<string, unknown>): string {
  return typeof event['type'] === 'string' ? event['type'] : 'unknown';
}

export class EventLogIndex {
  private readonly db: any;

  constructor(private readonly eventLogDir: string) {
    const dbPath = path.join(eventLogDir, 'index.db');
    ensureParentDir(dbPath);
    this.db = new DatabaseSync(dbPath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS runs (
        run_id TEXT PRIMARY KEY,
        agent TEXT NOT NULL,
        model TEXT,
        cwd TEXT,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        session_id TEXT,
        workspace_id TEXT,
        exit_reason TEXT,
        error_code TEXT,
        error_message TEXT,
        owner_token_id TEXT,
        owner_name TEXT,
        owner_remote_address TEXT,
        head_seq INTEGER NOT NULL DEFAULT 1,
        tail_seq INTEGER NOT NULL DEFAULT 0,
        event_count INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS run_events (
        run_id TEXT NOT NULL,
        seq INTEGER NOT NULL,
        ts INTEGER NOT NULL,
        source TEXT NOT NULL,
        event_type TEXT NOT NULL,
        PRIMARY KEY (run_id, seq)
      );
      CREATE INDEX IF NOT EXISTS idx_runs_updated_at ON runs (updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_runs_status ON runs (status);
    `);
    this.ensureRunsColumn('cwd', 'TEXT');
    this.ensureRunsColumn('workspace_id', 'TEXT');
  }

  upsertRun(entry: RunEntry): void {
    this.db.prepare(`
      INSERT INTO runs (
        run_id, agent, model, cwd, status, created_at, started_at, ended_at, session_id, workspace_id,
        exit_reason, error_code, error_message, owner_token_id, owner_name,
        owner_remote_address, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(run_id) DO UPDATE SET
        agent = excluded.agent,
        model = excluded.model,
        cwd = excluded.cwd,
        status = excluded.status,
        created_at = excluded.created_at,
        started_at = excluded.started_at,
        ended_at = excluded.ended_at,
        session_id = excluded.session_id,
        workspace_id = excluded.workspace_id,
        exit_reason = excluded.exit_reason,
        error_code = excluded.error_code,
        error_message = excluded.error_message,
        owner_token_id = excluded.owner_token_id,
        owner_name = excluded.owner_name,
        owner_remote_address = excluded.owner_remote_address,
        updated_at = excluded.updated_at
    `).run(
      entry.runId,
      entry.agent,
      entry.model ?? null,
      entry.cwd ?? null,
      entry.status,
      entry.createdAt,
      entry.startedAt,
      entry.endedAt,
      entry.sessionId ?? null,
      entry.workspaceId ?? null,
      entry.exitReason ?? null,
      entry.error?.code ?? null,
      entry.error?.message ?? null,
      entry.owner.tokenId,
      entry.owner.name,
      entry.owner.remoteAddress ?? null,
      Date.now(),
    );
  }

  appendEvent(runId: string, event: IndexedRunEvent): void {
    this.db.prepare(`
      INSERT INTO run_events (run_id, seq, ts, source, event_type)
      VALUES (?, ?, ?, ?, ?)
    `).run(runId, event.seq, event.ts, event.source, event.eventType);

    this.db.prepare(`
      UPDATE runs
      SET
        tail_seq = ?,
        head_seq = CASE
          WHEN event_count = 0 THEN ?
          ELSE head_seq
        END,
        event_count = event_count + 1,
        updated_at = ?
      WHERE run_id = ?
    `).run(event.seq, event.seq, Date.now(), runId);
  }

  removeEvents(runId: string, droppedSeqs: readonly number[]): void {
    if (droppedSeqs.length === 0) return;

    this.db.prepare(`
      DELETE FROM run_events
      WHERE run_id = ?
        AND seq IN (${droppedSeqs.map(() => '?').join(', ')})
    `).run(runId, ...droppedSeqs);

    const nextState = this.getSeqState(runId);
    this.db.prepare(`
      UPDATE runs
      SET
        head_seq = ?,
        tail_seq = ?,
        event_count = ?,
        updated_at = ?
      WHERE run_id = ?
    `).run(
      nextState.tailSeq === 0 ? 1 : Number(this.minSeq(runId) ?? nextState.tailSeq),
      nextState.tailSeq,
      nextState.eventCount,
      Date.now(),
      runId,
    );
  }

  getSeqState(runId: string): RunSeqState {
    const row = this.db.prepare(`
      SELECT head_seq, tail_seq, event_count
      FROM runs
      WHERE run_id = ?
    `).get(runId) as Record<string, unknown> | undefined;

    if (!row) {
      return { headSeq: 1, tailSeq: 0, eventCount: 0 };
    }

    return {
      headSeq: Number(row['head_seq'] ?? 1),
      tailSeq: Number(row['tail_seq'] ?? 0),
      eventCount: Number(row['event_count'] ?? 0),
    };
  }

  nextSeq(runId: string): number {
    return this.getSeqState(runId).tailSeq + 1;
  }

  getRun(runId: string): RunEntry | null {
    const row = this.db.prepare(`
      SELECT *
      FROM runs
      WHERE run_id = ?
    `).get(runId) as Record<string, unknown> | undefined;
    return row ? this.rowToRunEntry(row) : null;
  }

  listRuns(): RunEntry[] {
    const rows = this.db.prepare(`
      SELECT *
      FROM runs
      ORDER BY updated_at DESC, created_at DESC
    `).all() as Array<Record<string, unknown>>;
    return rows.map((row) => this.rowToRunEntry(row));
  }

  close(): void {
    this.db.close();
  }

  indexedEventFor(seq: number, ts: number, source: string, event: Record<string, unknown>): IndexedRunEvent {
    return {
      seq,
      ts,
      source,
      eventType: eventTypeOf(event),
    };
  }

  private minSeq(runId: string): number | null {
    const row = this.db.prepare(`
      SELECT MIN(seq) AS min_seq
      FROM run_events
      WHERE run_id = ?
    `).get(runId) as Record<string, unknown> | undefined;
    if (!row || row['min_seq'] == null) return null;
    return Number(row['min_seq']);
  }

  private rowToRunEntry(row: Record<string, unknown>): RunEntry {
    return {
      runId: String(row['run_id']),
      agent: String(row['agent']),
      model: row['model'] == null ? undefined : String(row['model']),
      cwd: row['cwd'] == null ? undefined : String(row['cwd']),
      status: String(row['status']) as RunEntry['status'],
      createdAt: Number(row['created_at']),
      startedAt: Number(row['started_at']),
      endedAt: row['ended_at'] == null ? null : Number(row['ended_at']),
      sessionId: row['session_id'] == null ? undefined : String(row['session_id']),
      workspaceId: row['workspace_id'] == null ? undefined : String(row['workspace_id']),
      exitReason: row['exit_reason'] == null ? undefined : String(row['exit_reason']) as RunEntry['exitReason'],
      error: row['error_code'] == null
        ? null
        : {
            code: String(row['error_code']),
            message: String(row['error_message'] ?? ''),
          },
      owner: {
        tokenId: row['owner_token_id'] == null ? null : String(row['owner_token_id']),
        name: row['owner_name'] == null ? null : String(row['owner_name']),
        remoteAddress: row['owner_remote_address'] == null ? null : String(row['owner_remote_address']),
      },
    };
  }

  private ensureRunsColumn(name: string, type: string): void {
    const columns = this.db.prepare(`PRAGMA table_info(runs)`).all() as Array<Record<string, unknown>>;
    if (columns.some((column) => String(column['name']) === name)) {
      return;
    }
    this.db.exec(`ALTER TABLE runs ADD COLUMN ${name} ${type}`);
  }
}
