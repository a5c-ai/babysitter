import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { EventLog } from '../src/runs/event-log.js';

describe('gateway event log', () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.map((dir) => fs.rm(dir, { recursive: true, force: true })));
  });

  it('serializes concurrent appends for the same run', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gateway-event-log-'));
    tempDirs.push(tempDir);

    const eventLog = new EventLog(tempDir, 100);
    eventLog.index.upsertRun({
      runId: '01TESTRUN000000000000000010',
      agent: 'claude',
      model: null,
      status: 'running',
      createdAt: Date.now(),
      startedAt: Date.now(),
      endedAt: null,
      owner: { tokenId: 'tok-1', name: 'browser' },
      error: null,
    });

    const results = await Promise.all([
      eventLog.append('01TESTRUN000000000000000010', 'gateway', { type: 'hook_decision', decision: 'allow' }),
      eventLog.append('01TESTRUN000000000000000010', 'agent', { type: 'tool_result', toolName: 'Read' }),
      eventLog.append('01TESTRUN000000000000000010', 'gateway', { type: 'run.finalized', exitReason: 'completed' }),
    ]);

    const flattened = results.flat().map((entry) => entry.seq);
    expect(flattened).toEqual([1, 2, 3]);

    const replay = await eventLog.readSince('01TESTRUN000000000000000010', 0);
    expect(replay.events.map((entry) => entry.seq)).toEqual([1, 2, 3]);

    eventLog.close();
  });
});
