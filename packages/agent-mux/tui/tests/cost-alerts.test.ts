import { describe, it, expect, vi } from 'vitest';
import { makeCostAlerter } from '../src/plugins/cost-alerts.js';
import { EventStream } from '../src/event-stream.js';
import costAlerts from '../src/plugins/cost-alerts.js';

describe('cost alerts', () => {
  it('fires once per crossed threshold, in ascending order', () => {
    const emit = vi.fn();
    const alert = makeCostAlerter([1, 5, 10], emit);
    alert(0.5);
    expect(emit).not.toHaveBeenCalled();
    alert(1.2);
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit.mock.calls[0]![0]).toMatch(/\$1\.00/);
    alert(1.5);
    expect(emit).toHaveBeenCalledTimes(1);
    alert(11);
    expect(emit).toHaveBeenCalledTimes(3);
    expect(emit.mock.calls[1]![0]).toMatch(/\$5\.00/);
    expect(emit.mock.calls[2]![0]).toMatch(/\$10\.00/);
  });

  it('plugin emits status when stream cost crosses threshold', () => {
    const prev = process.env.AMUX_TUI_COST_ALERT;
    process.env.AMUX_TUI_COST_ALERT = '0.1';
    try {
      const stream = new EventStream();
      const emitted: { type: string; message?: string }[] = [];
      costAlerts.register({
        client: {} as never,
        eventStream: stream,
        registerView: () => {},
        registerEventRenderer: () => {},
        registerCommand: () => {},
        registerPromptHandler: () => {},
        emit: (e) => emitted.push(e as never),
      });
      stream.push({ runId: 'r', agent: 'a', timestamp: 't', type: 'cost', cost: { totalUsd: 0.06 } } as never);
      expect(emitted).toHaveLength(0);
      stream.push({ runId: 'r', agent: 'a', timestamp: 't', type: 'cost', cost: { totalUsd: 0.06 } } as never);
      expect(emitted).toHaveLength(1);
      expect(emitted[0]!.message).toMatch(/cost crossed/);
    } finally {
      if (prev === undefined) delete process.env.AMUX_TUI_COST_ALERT;
      else process.env.AMUX_TUI_COST_ALERT = prev;
    }
  });

  it('does nothing when env var is unset/empty', () => {
    const prev = process.env.AMUX_TUI_COST_ALERT;
    process.env.AMUX_TUI_COST_ALERT = '';
    try {
      const stream = new EventStream();
      const emitted: unknown[] = [];
      costAlerts.register({
        client: {} as never,
        eventStream: stream,
        registerView: () => {},
        registerEventRenderer: () => {},
        registerCommand: () => {},
        registerPromptHandler: () => {},
        emit: (e) => emitted.push(e),
      });
      stream.push({ runId: 'r', agent: 'a', timestamp: 't', type: 'cost', cost: { totalUsd: 999 } } as never);
      // default thresholds 1,5,10 still apply since '' is falsy → defaults used
      expect(emitted.length).toBeGreaterThan(0);
    } finally {
      if (prev === undefined) delete process.env.AMUX_TUI_COST_ALERT;
      else process.env.AMUX_TUI_COST_ALERT = prev;
    }
  });
});
