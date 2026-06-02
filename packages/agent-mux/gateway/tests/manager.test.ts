import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { RunHandleImpl } from '@a5c-ai/agent-mux-comm';
import { afterEach, describe, expect, it } from 'vitest';
import { WorkspaceService, resolveWorkspaceDefaultCwd } from '@a5c-ai/agent-mux-comm';

import { RunManager, resolveGatewayConfig } from '../src/index.js';
import type { ClientConn } from '../src/fanout/client-conn.js';

interface FakeClientState {
  handle: RunHandleImpl;
  hooks?: Record<string, (...args: unknown[]) => Promise<unknown>>;
  options?: Record<string, unknown>;
}

interface FakeRunClient {
  latest: FakeClientState | null;
  run(options: Record<string, unknown>): RunHandleImpl;
}

interface StubConn {
  id: string;
  subscriptions: Set<string>;
  frames: Array<Record<string, unknown>>;
  send(frame: Record<string, unknown>): void;
}

function createFakeRunClient(): FakeRunClient {
  return {
    latest: null,
    run(options) {
      const handle = new RunHandleImpl({
        runId: typeof options['runId'] === 'string' ? options['runId'] : '01TESTRUN000000000000000001',
        agent: String(options['agent']),
      });
      this.latest = {
        handle,
        hooks: options['hooks'] as FakeClientState['hooks'],
        options,
      };
      return handle;
    },
  };
}

function createStubConn(id: string): StubConn {
  return {
    id,
    subscriptions: new Set<string>(),
    frames: [],
    send(frame) {
      this.frames.push(frame);
    },
  };
}

async function waitUntil(predicate: () => boolean, timeoutMs: number = 2_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline) {
      throw new Error('Timed out waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

describe('gateway run manager', () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    // Small delay to let Windows release SQLite file handles
    await new Promise((r) => setTimeout(r, 50));
    const dirs = tempDirs.splice(0);
    await Promise.allSettled(dirs.map((dir) => fs.rm(dir, { recursive: true, force: true })));
  });

  it('replays sinceSeq without gaps and transitions to live delivery', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gateway-manager-'));
    tempDirs.push(tempDir);
    const fakeClient = createFakeRunClient();
    const manager = new RunManager(
      resolveGatewayConfig({
        eventLogDir: tempDir,
        client: fakeClient,
      }),
      { debug() {}, info() {}, warn() {}, error() {} },
    );

    const run = await manager.start(
      {
        runId: '01TESTRUN000000000000000001',
        agent: 'claude',
        prompt: 'hello',
      },
      { tokenId: 'tok-1', name: 'browser' },
    );

    fakeClient.latest!.handle.emit({
      type: 'text_delta',
      runId: run.runId,
      agent: 'claude',
      timestamp: Date.now(),
      delta: 'a',
      accumulated: 'a',
    });
    fakeClient.latest!.handle.emit({
      type: 'text_delta',
      runId: run.runId,
      agent: 'claude',
      timestamp: Date.now(),
      delta: 'b',
      accumulated: 'ab',
    });
    await waitUntil(() => (manager as any).eventLog.getSeqState(run.runId).tailSeq >= 3);

    const conn = createStubConn('left');
    await manager.subscribe(conn as unknown as ClientConn, run.runId, 1);

    fakeClient.latest!.handle.emit({
      type: 'message_stop',
      runId: run.runId,
      agent: 'claude',
      timestamp: Date.now(),
      text: 'done',
    });
    await waitUntil(() => conn.frames.filter((frame) => frame['type'] === 'run.event').length >= 3);

    const runEvents = conn.frames.filter((frame) => frame['type'] === 'run.event');
    expect(runEvents.map((frame) => frame['seq'])).toEqual([2, 3, 4]);

    fakeClient.latest!.handle.complete('completed', 0, null);
    await manager.shutdown();
  });

  it('returns seq_gone for stale subscribers after truncation', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gateway-truncate-'));
    tempDirs.push(tempDir);
    const fakeClient = createFakeRunClient();
    const manager = new RunManager(
      resolveGatewayConfig({
        eventLogDir: tempDir,
        maxEventsPerRun: 5,
        client: fakeClient,
      }),
      { debug() {}, info() {}, warn() {}, error() {} },
    );

    const run = await manager.start(
      {
        runId: '01TESTRUN000000000000000002',
        agent: 'claude',
        prompt: 'hello',
      },
      { tokenId: 'tok-1', name: 'browser' },
    );

    for (let index = 0; index < 8; index += 1) {
      fakeClient.latest!.handle.emit({
        type: 'text_delta',
        runId: run.runId,
        agent: 'claude',
        timestamp: Date.now(),
        delta: String(index),
        accumulated: String(index),
      });
    }
    await waitUntil(() => (manager as any).eventLog.getSeqState(run.runId).headSeq > 1);

    const conn = createStubConn('stale');
    await manager.subscribe(conn as unknown as ClientConn, run.runId, 0);
    expect(conn.frames.find((frame) => frame['type'] === 'error')).toMatchObject({
      type: 'error',
      code: 'seq_gone',
      runId: run.runId,
    });

    fakeClient.latest!.handle.complete('completed', 0, null);
    await manager.shutdown();
  });

  it('delivers hook requests, resolves first valid response, and notifies losers', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gateway-hooks-'));
    tempDirs.push(tempDir);
    const fakeClient = createFakeRunClient();
    const manager = new RunManager(
      resolveGatewayConfig({
        eventLogDir: tempDir,
        client: fakeClient,
      }),
      { debug() {}, info() {}, warn() {}, error() {} },
    );

    const run = await manager.start(
      {
        runId: '01TESTRUN000000000000000003',
        agent: 'claude',
        prompt: 'hello',
      },
      { tokenId: 'tok-1', name: 'browser' },
    );

    const left = createStubConn('left');
    const right = createStubConn('right');
    await manager.subscribe(left as unknown as ClientConn, run.runId, 0);
    await manager.subscribe(right as unknown as ClientConn, run.runId, 0);

    const decisionPromise = fakeClient.latest!.hooks!.preToolUse(
      { toolName: 'bash', input: 'rm -rf tmp' },
      { signal: AbortSignal.timeout(1000), emit: () => undefined },
    ) as Promise<unknown>;
    await new Promise((resolve) => setTimeout(resolve, 25));
    const request = left.frames.find((frame) => frame['type'] === 'hook.request')!;
    await waitUntil(() =>
      left.frames.some(
        (frame) =>
          frame['type'] === 'run.event' &&
          (frame['event'] as Record<string, unknown> | undefined)?.['type'] === 'hook_requested',
      ),
    );
    manager.submitHookDecision(left as unknown as ClientConn, {
      type: 'hook.decision',
      hookRequestId: String(request['hookRequestId']),
      decision: 'deny',
      reason: 'no',
    });

    await expect(decisionPromise).resolves.toEqual({ decision: 'deny', reason: 'no' });
    expect(right.frames.some((frame) => frame['type'] === 'hook.resolved')).toBe(true);

    fakeClient.latest!.handle.complete('completed', 0, null);
    await manager.shutdown();
  });

  it('preserves wrapped workspace/worktree context when a session is resumed through gateway messaging', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gateway-session-workspace-'));
    const tempHome = await fs.mkdtemp(path.join(os.tmpdir(), 'gateway-session-home-'));
    const repoDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gateway-session-repo-'));
    tempDirs.push(tempDir, tempHome, repoDir);
    const previousHome = process.env.HOME;
    process.env.HOME = tempHome;

    try {
      const workspaceService = new WorkspaceService();
      const workspace = await workspaceService.createWorkspace({
        name: 'Wrapped Workspace',
        repos: [{ path: repoDir }],
        mode: 'symlink',
      });
      const workspaceCwd = resolveWorkspaceDefaultCwd(workspace);

      const fakeClient = createFakeRunClient();
      const manager = new RunManager(
        resolveGatewayConfig({
          eventLogDir: tempDir,
          client: fakeClient,
        }),
        { debug() {}, info() {}, warn() {}, error() {} },
      );

      const initialRun = await manager.start(
        {
          runId: '01TESTRUN000000000000000004',
          agent: 'codex',
          prompt: 'hello',
          sessionId: 'session-1',
          workspaceId: workspace.id,
          cwd: workspaceCwd,
        },
        { tokenId: 'tok-1', name: 'browser' },
      );

      fakeClient.latest!.handle.complete('completed', 0, null);
      await waitUntil(() => manager.get(initialRun.runId)?.status === 'completed');

      const resumedRun = await manager.sendSessionInput(
        'session-1',
        'follow up',
        { tokenId: 'tok-1', name: 'browser' },
      );

      expect(resumedRun).not.toBeNull();
      expect(fakeClient.latest?.options?.workspaceId).toBe(workspace.id);
      expect(fakeClient.latest?.options?.cwd).toBe(workspaceCwd);
      expect(fakeClient.latest?.options?.sessionId).toBe('session-1');
      expect((await manager.getSession('session-1'))?.workspaceId).toBe(workspace.id);
      expect((await manager.getSession('session-1'))?.workspace).toMatchObject({
        workspaceId: workspace.id,
        workspaceDefaultCwd: workspaceCwd,
      });

      fakeClient.latest!.handle.complete('completed', 0, null);
      await manager.shutdown();
    } finally {
      if (previousHome == null) {
        delete process.env.HOME;
      } else {
        process.env.HOME = previousHome;
      }
    }
  });

  it('keeps the original session binding when a resumed dispatch emits a different session_start id', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gateway-session-resume-'));
    tempDirs.push(tempDir);
    const fakeClient = createFakeRunClient();
    const manager = new RunManager(
      resolveGatewayConfig({
        eventLogDir: tempDir,
        client: fakeClient,
      }),
      { debug() {}, info() {}, warn() {}, error() {} },
    );
    const conn = createStubConn('resume-listener');

    const run = await manager.start(
      {
        runId: '01TESTRUN000000000000000005',
        agent: 'codex',
        prompt: 'follow up',
        sessionId: 'session-existing',
      },
      { tokenId: 'tok-1', name: 'browser' },
    );
    await manager.subscribe(conn as unknown as ClientConn, run.runId, 0);

    fakeClient.latest!.handle.emit({
      type: 'session_start',
      runId: run.runId,
      agent: 'codex',
      timestamp: Date.now(),
      sessionId: 'session-unexpected-new-id',
      resumed: true,
    });

    await waitUntil(() => manager.get(run.runId)?.sessionId === 'session-existing');

    expect(manager.get(run.runId)?.sessionId).toBe('session-existing');
    expect((await manager.getSession('session-existing'))?.latestRunId).toBe(run.runId);
    expect(await manager.getSession('session-unexpected-new-id')).toBeNull();
    await waitUntil(() =>
      conn.frames.some(
        (frame) =>
          frame['type'] === 'run.event' &&
          typeof frame['event'] === 'object' &&
          frame['event'] != null &&
          (frame['event'] as Record<string, unknown>)['type'] === 'session_start',
      ),
    );
    const normalizedFrame = conn.frames.find(
      (frame) =>
        frame['type'] === 'run.event' &&
        typeof frame['event'] === 'object' &&
        frame['event'] != null &&
        (frame['event'] as Record<string, unknown>)['type'] === 'session_start',
    );
    expect((normalizedFrame?.['event'] as Record<string, unknown>)?.['sessionId']).toBe('session-existing');

    fakeClient.latest!.handle.complete('completed', 0, null);
    await manager.shutdown();
  });
});
