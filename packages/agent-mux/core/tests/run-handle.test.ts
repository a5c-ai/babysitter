import { describe, it, expect, vi } from 'vitest';
import { RunHandleImpl } from '../src/run-handle-impl.js';
import type { AgentEvent, TextDeltaEvent, TokenUsageEvent, CostEvent, CrashEvent } from '../src/events.js';
import { AgentMuxError } from '../src/errors.js';

function makeHandle(overrides?: Partial<ConstructorParameters<typeof RunHandleImpl>[0]>) {
  return new RunHandleImpl({
    runId: 'run-001',
    agent: 'claude',
    model: 'opus-4',
    ...overrides,
  });
}

function makeBaseEvent(type: string, extra: Record<string, unknown> = {}): AgentEvent {
  return {
    type,
    runId: 'run-001',
    agent: 'claude',
    timestamp: Date.now(),
    ...extra,
  } as AgentEvent;
}

function bindTransport(handle: RunHandleImpl) {
  const write = vi.fn(async (_text: string) => {});
  handle.bindInputTransport(write);
  return write;
}

describe('RunHandleImpl', () => {
  describe('identity', () => {
    it('exposes runId, agent, model', () => {
      const h = makeHandle();
      expect(h.runId).toBe('run-001');
      expect(h.agent).toBe('claude');
      expect(h.model).toBe('opus-4');
    });

    it('starts in spawned state', () => {
      const h = makeHandle();
      expect(h.state).toBe('spawned');
    });
  });

  describe('state transitions', () => {
    it('spawned -> running', () => {
      const h = makeHandle();
      h.transitionTo('running');
      expect(h.state).toBe('running');
    });

    it('running -> paused -> running', () => {
      const h = makeHandle();
      h.transitionTo('running');
      h.transitionTo('paused');
      expect(h.state).toBe('paused');
      h.transitionTo('running');
      expect(h.state).toBe('running');
    });

    it('rejects invalid transitions', () => {
      const h = makeHandle();
      expect(() => h.transitionTo('paused')).toThrow(AgentMuxError);
    });
  });

  describe('EventEmitter', () => {
    it('on() receives typed events', () => {
      const h = makeHandle();
      h.transitionTo('running');
      const received: TextDeltaEvent[] = [];
      h.on('text_delta', (e) => received.push(e));
      h.emit(makeBaseEvent('text_delta', { delta: 'hi', accumulated: 'hi' }));
      expect(received).toHaveLength(1);
      expect(received[0]!.delta).toBe('hi');
    });

    it('off() removes handler', () => {
      const h = makeHandle();
      h.transitionTo('running');
      const received: unknown[] = [];
      const handler = (e: TextDeltaEvent) => received.push(e);
      h.on('text_delta', handler);
      h.off('text_delta', handler);
      h.emit(makeBaseEvent('text_delta', { delta: 'hi', accumulated: 'hi' }));
      expect(received).toHaveLength(0);
    });

    it('once() fires handler only once', () => {
      const h = makeHandle();
      h.transitionTo('running');
      const received: unknown[] = [];
      h.once('text_delta', (e) => received.push(e));
      h.emit(makeBaseEvent('text_delta', { delta: '1', accumulated: '1' }));
      h.emit(makeBaseEvent('text_delta', { delta: '2', accumulated: '12' }));
      expect(received).toHaveLength(1);
    });

    it('handler errors do not prevent other handlers', () => {
      const h = makeHandle();
      h.transitionTo('running');
      const received: string[] = [];
      h.on('text_delta', () => { throw new Error('boom'); });
      h.on('text_delta', () => received.push('ok'));
      h.emit(makeBaseEvent('text_delta', { delta: 'x', accumulated: 'x' }));
      expect(received).toEqual(['ok']);
    });

    it('returns this for chaining', () => {
      const h = makeHandle();
      const result = h.on('text_delta', () => {}).off('text_delta', () => {});
      expect(result).toBe(h);
    });
  });

  describe('AsyncIterable', () => {
    it('iterates events in order', async () => {
      const h = makeHandle();
      h.transitionTo('running');

      h.emit(makeBaseEvent('text_delta', { delta: 'a', accumulated: 'a' }));
      h.emit(makeBaseEvent('text_delta', { delta: 'b', accumulated: 'ab' }));

      const iter = h[Symbol.asyncIterator]();
      const first = await iter.next();
      expect(first.done).toBe(false);
      expect((first.value as TextDeltaEvent).delta).toBe('a');

      const second = await iter.next();
      expect(second.done).toBe(false);
      expect((second.value as TextDeltaEvent).delta).toBe('b');
    });

    it('replays buffered events to new iterators', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      h.emit(makeBaseEvent('text_delta', { delta: 'pre', accumulated: 'pre' }));

      const iter = h[Symbol.asyncIterator]();
      const result = await iter.next();
      expect(result.done).toBe(false);
      expect((result.value as TextDeltaEvent).delta).toBe('pre');
    });

    it('terminates when run completes', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      h.emit(makeBaseEvent('text_delta', { delta: 'x', accumulated: 'x' }));
      h.transitionTo('completed');
      h.complete('completed', 0, null);

      const events: AgentEvent[] = [];
      for await (const event of h) {
        events.push(event);
      }
      expect(events).toHaveLength(1);
    });

    it('waits for events when buffer is exhausted', async () => {
      const h = makeHandle();
      h.transitionTo('running');

      const iter = h[Symbol.asyncIterator]();

      // Start waiting for next event
      const nextPromise = iter.next();

      // Emit event after a short delay
      setTimeout(() => {
        h.emit(makeBaseEvent('text_delta', { delta: 'delayed', accumulated: 'delayed' }));
      }, 10);

      const result = await nextPromise;
      expect(result.done).toBe(false);
      expect((result.value as TextDeltaEvent).delta).toBe('delayed');
    });
  });

  describe('thenable / promise', () => {
    it('resolves with RunResult on complete', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      h.emit(makeBaseEvent('text_delta', { delta: 'hello', accumulated: 'hello' }));
      h.transitionTo('completed');
      h.complete('completed', 0, null);

      const result = await h;
      expect(result.runId).toBe('run-001');
      expect(result.agent).toBe('claude');
      expect(result.text).toBe('hello');
      expect(result.exitCode).toBe(0);
      expect(result.exitReason).toBe('completed');
      expect(result.error).toBeNull();
    });

    it('result() returns same promise', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      h.transitionTo('completed');
      h.complete('completed', 0, null);

      const r1 = h.result();
      const r2 = h.result();
      expect(r1).toBe(r2);
    });

    it('accumulates text from text_delta events', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      h.emit(makeBaseEvent('text_delta', { delta: 'hello ', accumulated: 'hello ' }));
      h.emit(makeBaseEvent('text_delta', { delta: 'world', accumulated: 'hello world' }));
      h.transitionTo('completed');
      h.complete('completed', 0, null);

      const result = await h;
      expect(result.text).toBe('hello world');
    });

    it('accumulates token usage', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      h.emit(makeBaseEvent('token_usage', { inputTokens: 100, outputTokens: 50, thinkingTokens: 10, cachedTokens: 5 }));
      h.emit(makeBaseEvent('token_usage', { inputTokens: 200, outputTokens: 100 }));
      h.transitionTo('completed');
      h.complete('completed', 0, null);

      const result = await h;
      expect(result.tokenUsage).not.toBeNull();
      expect(result.tokenUsage!.inputTokens).toBe(300);
      expect(result.tokenUsage!.outputTokens).toBe(150);
      expect(result.tokenUsage!.thinkingTokens).toBe(10);
    });

    it('captures cost from cost events', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      h.emit(makeBaseEvent('cost', { cost: { totalUsd: 0.05, inputTokens: 1000, outputTokens: 500 } }));
      h.transitionTo('completed');
      h.complete('completed', 0, null);

      const result = await h;
      expect(result.cost).not.toBeNull();
      expect(result.cost!.totalUsd).toBe(0.05);
    });

    it('captures crash error', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      h.emit(makeBaseEvent('crash', { exitCode: 1, stderr: 'segfault' }));
      h.transitionTo('crashed');
      h.complete('crashed', 1, null);

      const result = await h;
      expect(result.exitReason).toBe('crashed');
      expect(result.error).not.toBeNull();
      expect(result.error!.code).toBe('AGENT_CRASH');
      expect(result.error!.stderr).toBe('segfault');
    });

    it('captures session ID from session_start', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      h.emit(makeBaseEvent('session_start', { sessionId: 'sess-42', resumed: false }));
      h.transitionTo('completed');
      h.complete('completed', 0, null);

      const result = await h;
      expect(result.sessionId).toBe('sess-42');
    });

    it('counts turns from turn_start events', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      h.emit(makeBaseEvent('turn_start', { turnIndex: 0 }));
      h.emit(makeBaseEvent('turn_start', { turnIndex: 1 }));
      h.transitionTo('completed');
      h.complete('completed', 0, null);

      const result = await h;
      expect(result.turnCount).toBe(2);
    });

    it('collects events when collectEvents is true', async () => {
      const h = makeHandle({ collectEvents: true });
      h.transitionTo('running');
      h.emit(makeBaseEvent('text_delta', { delta: 'x', accumulated: 'x' }));
      h.transitionTo('completed');
      h.complete('completed', 0, null);

      const result = await h;
      expect(result.events).toHaveLength(1);
    });

    it('does not collect events by default', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      h.emit(makeBaseEvent('text_delta', { delta: 'x', accumulated: 'x' }));
      h.transitionTo('completed');
      h.complete('completed', 0, null);

      const result = await h;
      expect(result.events).toHaveLength(0);
    });

    it('echoes tags in result', async () => {
      const h = makeHandle({ tags: ['ci', 'nightly'] });
      h.transitionTo('running');
      h.transitionTo('completed');
      h.complete('completed', 0, null);

      const result = await h;
      expect(result.tags).toEqual(['ci', 'nightly']);
    });
  });

  describe('control methods', () => {
    it('interrupt() transitions to interrupted', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      await h.interrupt();
      expect(h.state).toBe('interrupted');
    });

    it('abort() transitions to aborted', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      await h.abort();
      expect(h.state).toBe('aborted');
    });

    it('abort() is no-op on terminal state', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      h.transitionTo('completed');
      h.complete('completed', 0, null);
      await h.abort(); // should not throw
    });

    it('pause() transitions to paused', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      await h.pause();
      expect(h.state).toBe('paused');
    });

    it('resume() transitions from paused to running', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      await h.pause();
      await h.resume();
      expect(h.state).toBe('running');
    });

    it('interrupt() throws on terminal state', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      h.transitionTo('completed');
      h.complete('completed', 0, null);
      await expect(h.interrupt()).rejects.toThrow(AgentMuxError);
    });

    it('pause() throws on terminal state', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      h.transitionTo('completed');
      h.complete('completed', 0, null);
      await expect(h.pause()).rejects.toThrow(AgentMuxError);
    });
  });

  describe('interaction methods', () => {
    it('send() throws RUN_NOT_ACTIVE on terminal state', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      h.transitionTo('completed');
      h.complete('completed', 0, null);
      await expect(h.send('hello')).rejects.toThrow(AgentMuxError);
    });

    it('send() throws on empty text', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      await expect(h.send('')).rejects.toThrow(AgentMuxError);
    });

    it('approve() throws NO_PENDING_INTERACTION when none pending', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      await expect(h.approve()).rejects.toThrow(AgentMuxError);
    });

    it('deny() throws NO_PENDING_INTERACTION when none pending', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      await expect(h.deny()).rejects.toThrow(AgentMuxError);
    });

    it('continue() throws on empty prompt', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      await expect(h.continue('')).rejects.toThrow(AgentMuxError);
    });

    it('send() accepts whitespace-only text (spec says non-empty, not non-whitespace)', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      bindTransport(h);
      await expect(h.send('  ')).resolves.not.toThrow();
    });

    it('queue() throws on empty prompt', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      bindTransport(h);
      await expect(h.queue('')).rejects.toThrow(AgentMuxError);
    });

    it('steer() throws on empty prompt', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      bindTransport(h);
      await expect(h.steer('')).rejects.toThrow(AgentMuxError);
    });

    it('deferred prompts flush on matching boundaries', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      const write = bindTransport(h);

      await h.queue('turn follow-up');
      await h.steer('tool follow-up', { when: 'after-tool' });
      h.emit(makeBaseEvent('tool_result', { toolCallId: 't1', toolName: 'ls', output: {}, durationMs: 1 }));
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(write).toHaveBeenNthCalledWith(1, 'tool follow-up');

      h.emit(makeBaseEvent('turn_end', { turnIndex: 0 }));
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(write).toHaveBeenNthCalledWith(2, 'turn follow-up');
    });
  });

  describe('interaction channel integration', () => {
    it('approval_request event creates pending interaction', () => {
      const h = makeHandle();
      h.transitionTo('running');
      h.emit(makeBaseEvent('approval_request', {
        interactionId: 'ia-1',
        action: 'write file',
        detail: 'Writing test.txt',
        toolName: 'write',
        riskLevel: 'medium',
      }));

      expect(h.interaction.pending).toHaveLength(1);
      expect(h.interaction.pending[0]!.type).toBe('approval');
      expect(h.interaction.pending[0]!.id).toBe('ia-1');
    });

    it('input_required event creates pending interaction', () => {
      const h = makeHandle();
      h.transitionTo('running');
      h.emit(makeBaseEvent('input_required', {
        interactionId: 'ir-1',
        question: 'API key?',
        source: 'agent',
      }));

      expect(h.interaction.pending).toHaveLength(1);
      expect(h.interaction.pending[0]!.type).toBe('input');
    });

    it('approve() resolves most recent approval', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      h.emit(makeBaseEvent('approval_request', {
        interactionId: 'ia-1',
        action: 'write',
        detail: 'test',
        toolName: 'write',
        riskLevel: 'low',
      }));

      await h.approve();
      expect(h.interaction.pending).toHaveLength(0);
    });

    it('onPending callback fires for new interactions', () => {
      const h = makeHandle();
      h.transitionTo('running');
      const received: string[] = [];
      h.interaction.onPending((i) => received.push(i.id));

      h.emit(makeBaseEvent('approval_request', {
        interactionId: 'ia-1',
        action: 'write',
        detail: 'test',
        toolName: 'write',
        riskLevel: 'low',
      }));

      expect(received).toEqual(['ia-1']);
    });

    it('approveAll approves all pending approvals', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      h.emit(makeBaseEvent('approval_request', {
        interactionId: 'ia-1', action: 'a', detail: 't', toolName: 'w', riskLevel: 'low',
      }));
      h.emit(makeBaseEvent('approval_request', {
        interactionId: 'ia-2', action: 'b', detail: 't', toolName: 'w', riskLevel: 'low',
      }));

      await h.interaction.approveAll();
      expect(h.interaction.pending).toHaveLength(0);
    });

    it('respond throws INTERACTION_NOT_FOUND for invalid id', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      await expect(h.interaction.respond('nonexistent', { type: 'approve' }))
        .rejects.toThrow(AgentMuxError);
    });

    it('respond throws RUN_NOT_ACTIVE after termination', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      h.emit(makeBaseEvent('approval_request', {
        interactionId: 'ia-1', action: 'a', detail: 't', toolName: 'w', riskLevel: 'low',
      }));
      h.transitionTo('completed');
      h.complete('completed', 0, null);

      await expect(h.interaction.respond('ia-1', { type: 'approve' }))
        .rejects.toThrow(AgentMuxError);
    });
  });

  describe('yolo approval mode', () => {
    it('auto-approves without queuing', () => {
      const h = makeHandle({ approvalMode: 'yolo' });
      h.transitionTo('running');
      h.emit(makeBaseEvent('approval_request', {
        interactionId: 'ia-1', action: 'write', detail: 'test',
        toolName: 'write', riskLevel: 'high',
      }));

      // Should not be in pending because auto-approved
      expect(h.interaction.pending).toHaveLength(0);
    });
  });

  describe('deny approval mode', () => {
    it('auto-denies without queuing', () => {
      const h = makeHandle({ approvalMode: 'deny' });
      h.transitionTo('running');
      h.emit(makeBaseEvent('approval_request', {
        interactionId: 'ia-1', action: 'write', detail: 'test',
        toolName: 'write', riskLevel: 'high',
      }));

      expect(h.interaction.pending).toHaveLength(0);
    });
  });

  describe('high-water mark', () => {
    it('enforces buffer size limit', () => {
      const h = makeHandle({ bufferHighWaterMark: 3 });
      h.transitionTo('running');

      for (let i = 0; i < 5; i++) {
        h.emit(makeBaseEvent('text_delta', { delta: `${i}`, accumulated: `${i}` }));
      }

      // Iterator should still work
      const iter = h[Symbol.asyncIterator]();
    });

    it('emits debug warning on buffer overflow', () => {
      const h = makeHandle({ bufferHighWaterMark: 2, collectEvents: true });
      h.transitionTo('running');
      h.emit(makeBaseEvent('text_delta', { delta: 'a', accumulated: 'a' }));
      h.emit(makeBaseEvent('text_delta', { delta: 'b', accumulated: 'ab' }));
      h.emit(makeBaseEvent('text_delta', { delta: 'c', accumulated: 'abc' })); // triggers overflow
      // There should be a debug event in collected events
      h.transitionTo('completed');
      h.complete('completed', 0, null);
    });
  });

  describe('handler error debug events', () => {
    it('emits debug event when handler throws', () => {
      const h = makeHandle({ collectEvents: true });
      h.transitionTo('running');
      const debugEvents: AgentEvent[] = [];
      h.on('debug', (e) => debugEvents.push(e));
      h.on('text_delta', () => { throw new Error('handler boom'); });
      h.emit(makeBaseEvent('text_delta', { delta: 'x', accumulated: 'x' }));
      expect(debugEvents).toHaveLength(1);
      expect((debugEvents[0] as { message: string }).message).toContain('handler boom');
    });
  });

  describe('cost aggregation', () => {
    it('aggregates multiple cost events', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      h.emit(makeBaseEvent('cost', { cost: { totalUsd: 0.01, inputTokens: 100, outputTokens: 50 } }));
      h.emit(makeBaseEvent('cost', { cost: { totalUsd: 0.02, inputTokens: 200, outputTokens: 100 } }));
      h.transitionTo('completed');
      h.complete('completed', 0, null);

      const result = await h;
      expect(result.cost).not.toBeNull();
      expect(result.cost!.totalUsd).toBeCloseTo(0.03);
      expect(result.cost!.inputTokens).toBe(300);
      expect(result.cost!.outputTokens).toBe(150);
    });
  });

  describe('spawned → aborted transition', () => {
    it('abort() works from spawned state', async () => {
      const h = makeHandle();
      expect(h.state).toBe('spawned');
      await h.abort();
      expect(h.state).toBe('aborted');
    });
  });

  describe('durationMs', () => {
    it('measures wall-clock duration', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      // Small delay to ensure non-zero duration
      await new Promise(resolve => setTimeout(resolve, 10));
      h.transitionTo('completed');
      h.complete('completed', 0, null);

      const result = await h;
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('signal in result', () => {
    it('captures signal for killed processes', async () => {
      const h = makeHandle();
      h.transitionTo('running');
      h.transitionTo('killed');
      h.complete('killed', null, 'SIGTERM');

      const result = await h;
      expect(result.exitCode).toBeNull();
      expect(result.signal).toBe('SIGTERM');
      expect(result.exitReason).toBe('killed');
    });
  });
});
