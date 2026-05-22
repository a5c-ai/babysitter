import { describe, expect, it } from 'vitest';

import type { GatewayStoreState } from '@a5c-ai/agent-mux-ui';

import { projectWearState } from '../src/projection/wearState.js';

describe('wear state projection', () => {
  it('keeps diffs bounded for a compact wear payload', () => {
    const state = {
      runs: {
        byId: {
          'run-1': {
            runId: 'run-1',
            agent: 'codex',
            status: 'running',
          },
        },
      },
      hooks: {
        byRunId: {
          'run-1': [
            {
              hookRequestId: 'hook-1',
              runId: 'run-1',
              hookKind: 'preToolUse',
              payload: {},
              deadlineTs: Date.now() + 30000,
            },
          ],
        },
      },
    } as GatewayStoreState;

    const envelope = projectWearState(state);
    expect(envelope.byteLength).toBeLessThanOrEqual(4096);
    expect(envelope.diff.runs?.[0]?.runId).toContain('run-1');
  });
});
