import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { CrossRunMailbox, type CrossRunMessage } from '../crossRunComm';

describe('CrossRunMailbox', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'cross-run-comm-'));
  });
  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  function makeMsg(overrides: Partial<CrossRunMessage> = {}): CrossRunMessage {
    return {
      fromRunId: 'run-a',
      toRunId: 'run-b',
      type: 'data',
      payload: { value: 42 },
      timestamp: Date.now(),
      ...overrides,
    };
  }

  it('sends and peeks at messages without consuming', () => {
    const mailbox = new CrossRunMailbox(tempDir);
    const msg = makeMsg();
    mailbox.send(msg);

    const peeked = mailbox.peek('run-b');
    expect(peeked).toHaveLength(1);
    expect(peeked[0].payload).toEqual({ value: 42 });

    // peek should not consume
    const peekedAgain = mailbox.peek('run-b');
    expect(peekedAgain).toHaveLength(1);
  });

  it('receives and consumes messages', () => {
    const mailbox = new CrossRunMailbox(tempDir);
    mailbox.send(makeMsg());
    mailbox.send(makeMsg({ toRunId: 'run-c' }));

    const received = mailbox.receive('run-b');
    expect(received).toHaveLength(1);
    expect(received[0].fromRunId).toBe('run-a');

    // consumed: should be gone
    const afterReceive = mailbox.peek('run-b');
    expect(afterReceive).toHaveLength(0);

    // other run's message should still be there
    const otherPeek = mailbox.peek('run-c');
    expect(otherPeek).toHaveLength(1);
  });

  it('filters receive by message type', () => {
    const mailbox = new CrossRunMailbox(tempDir);
    mailbox.send(makeMsg({ type: 'data' }));
    mailbox.send(makeMsg({ type: 'signal' }));
    mailbox.send(makeMsg({ type: 'query' }));

    const signals = mailbox.receive('run-b', 'signal');
    expect(signals).toHaveLength(1);
    expect(signals[0].type).toBe('signal');

    // data and query should remain
    const remaining = mailbox.peek('run-b');
    expect(remaining).toHaveLength(2);
  });

  it('clears all messages for a run', () => {
    const mailbox = new CrossRunMailbox(tempDir);
    mailbox.send(makeMsg());
    mailbox.send(makeMsg());
    mailbox.send(makeMsg({ toRunId: 'run-c' }));

    mailbox.clear('run-b');

    expect(mailbox.peek('run-b')).toHaveLength(0);
    expect(mailbox.peek('run-c')).toHaveLength(1);
  });

  it('returns empty arrays for unknown run ids', () => {
    const mailbox = new CrossRunMailbox(tempDir);
    expect(mailbox.peek('nonexistent')).toEqual([]);
    expect(mailbox.receive('nonexistent')).toEqual([]);
  });

  it('persists across mailbox instances', () => {
    const mailbox1 = new CrossRunMailbox(tempDir);
    mailbox1.send(makeMsg({ payload: 'persistent' }));

    const mailbox2 = new CrossRunMailbox(tempDir);
    const peeked = mailbox2.peek('run-b');
    expect(peeked).toHaveLength(1);
    expect(peeked[0].payload).toBe('persistent');
  });

  it('creates stateDir if it does not exist', () => {
    const nestedDir = join(tempDir, 'nested', 'deep');
    const mailbox = new CrossRunMailbox(nestedDir);
    mailbox.send(makeMsg());

    expect(mailbox.peek('run-b')).toHaveLength(1);
  });
});
