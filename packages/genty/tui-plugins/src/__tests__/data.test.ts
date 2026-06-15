/**
 * Tests for data access utilities.
 *
 * Tests the pure functions that extract structured data from journal events.
 */

import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, it, expect } from 'vitest';
import { extractEffects, extractGovernanceDecisions, resolveRunsDir } from '../data.js';

describe('extractEffects', () => {
  it('returns empty array for empty journal', () => {
    expect(extractEffects([])).toEqual([]);
  });

  it('extracts pending effect from EFFECT_REQUESTED', () => {
    const journal = [
      {
        type: 'EFFECT_REQUESTED',
        recordedAt: '2026-01-01T00:00:00Z',
        seq: 1,
        data: {
          effectId: 'eff-001',
          kind: 'node',
          title: 'Build project',
        },
      },
    ];
    const effects = extractEffects(journal);
    expect(effects).toHaveLength(1);
    expect(effects[0]).toEqual({
      effectId: 'eff-001',
      kind: 'node',
      status: 'pending',
      title: 'Build project',
      elapsedMs: undefined,
      error: undefined,
    });
  });

  it('marks effect as resolved when EFFECT_RESOLVED follows', () => {
    const journal = [
      {
        type: 'EFFECT_REQUESTED',
        recordedAt: '2026-01-01T00:00:00Z',
        seq: 1,
        data: {
          effectId: 'eff-002',
          kind: 'breakpoint',
          title: 'Approve deploy',
        },
      },
      {
        type: 'EFFECT_RESOLVED',
        recordedAt: '2026-01-01T00:01:00Z',
        seq: 2,
        data: {
          effectId: 'eff-002',
          status: 'ok',
          elapsedMs: 5000,
        },
      },
    ];
    const effects = extractEffects(journal);
    expect(effects).toHaveLength(1);
    expect(effects[0]!.status).toBe('resolved');
    expect(effects[0]!.elapsedMs).toBe(5000);
  });

  it('marks effect as failed when resolution has failed status', () => {
    const journal = [
      {
        type: 'EFFECT_REQUESTED',
        recordedAt: '2026-01-01T00:00:00Z',
        seq: 1,
        data: {
          effectId: 'eff-003',
          kind: 'node',
          title: 'Run tests',
        },
      },
      {
        type: 'EFFECT_RESOLVED',
        recordedAt: '2026-01-01T00:02:00Z',
        seq: 2,
        data: {
          effectId: 'eff-003',
          status: 'failed',
          error: 'Tests failed',
          elapsedMs: 12000,
        },
      },
    ];
    const effects = extractEffects(journal);
    expect(effects).toHaveLength(1);
    expect(effects[0]!.status).toBe('failed');
    expect(effects[0]!.error).toBe('Tests failed');
  });

  it('handles multiple effects', () => {
    const journal = [
      {
        type: 'EFFECT_REQUESTED',
        recordedAt: '2026-01-01T00:00:00Z',
        seq: 1,
        data: { effectId: 'a', kind: 'node' },
      },
      {
        type: 'EFFECT_REQUESTED',
        recordedAt: '2026-01-01T00:00:01Z',
        seq: 2,
        data: { effectId: 'b', kind: 'breakpoint' },
      },
      {
        type: 'EFFECT_RESOLVED',
        recordedAt: '2026-01-01T00:00:02Z',
        seq: 3,
        data: { effectId: 'a', status: 'ok' },
      },
    ];
    const effects = extractEffects(journal);
    expect(effects).toHaveLength(2);
    const effA = effects.find((e) => e.effectId === 'a');
    const effB = effects.find((e) => e.effectId === 'b');
    expect(effA!.status).toBe('resolved');
    expect(effB!.status).toBe('pending');
  });
});

describe('extractGovernanceDecisions', () => {
  it('returns empty array for empty journal', () => {
    expect(extractGovernanceDecisions([])).toEqual([]);
  });

  it('returns empty array when no breakpoints exist', () => {
    const journal = [
      {
        type: 'EFFECT_REQUESTED',
        recordedAt: '2026-01-01T00:00:00Z',
        seq: 1,
        data: { effectId: 'eff-001', kind: 'node' },
      },
    ];
    expect(extractGovernanceDecisions(journal)).toEqual([]);
  });

  it('extracts pending breakpoint decision', () => {
    const journal = [
      {
        type: 'EFFECT_REQUESTED',
        recordedAt: '2026-01-01T00:00:00Z',
        seq: 1,
        data: {
          effectId: 'bp-001',
          kind: 'breakpoint',
          title: 'Confirm deployment',
          breakpointId: 'confirm.deploy',
          expert: 'devops',
          tags: ['deploy', 'production'],
          autoApproval: { recommended: false, reason: 'production deployment' },
        },
      },
    ];
    const decisions = extractGovernanceDecisions(journal);
    expect(decisions).toHaveLength(1);
    expect(decisions[0]).toEqual({
      breakpointId: 'confirm.deploy',
      title: 'Confirm deployment',
      approved: null,
      response: undefined,
      feedback: undefined,
      expert: 'devops',
      tags: ['deploy', 'production'],
      autoApproval: { recommended: false, reason: 'production deployment' },
      timestamp: '2026-01-01T00:00:00Z',
    });
  });

  it('extracts approved breakpoint decision', () => {
    const journal = [
      {
        type: 'EFFECT_REQUESTED',
        recordedAt: '2026-01-01T00:00:00Z',
        seq: 1,
        data: {
          effectId: 'bp-002',
          kind: 'breakpoint',
          title: 'Approve PR merge',
          breakpointId: 'confirm.merge',
        },
      },
      {
        type: 'EFFECT_RESOLVED',
        recordedAt: '2026-01-01T00:05:00Z',
        seq: 2,
        data: {
          effectId: 'bp-002',
          value: {
            approved: true,
            response: 'Looks good to me',
          },
        },
      },
    ];
    const decisions = extractGovernanceDecisions(journal);
    expect(decisions).toHaveLength(1);
    expect(decisions[0]!.approved).toBe(true);
    expect(decisions[0]!.response).toBe('Looks good to me');
  });
});

describe('resolveRunsDir', () => {
  const originalGlobalStateDir = process.env.BABYSITTER_GLOBAL_STATE_DIR;
  const originalRunsDir = process.env.BABYSITTER_RUNS_DIR;
  const originalRunsScope = process.env.BABYSITTER_RUNS_SCOPE;

  afterEach(() => {
    if (originalGlobalStateDir === undefined) {
      delete process.env.BABYSITTER_GLOBAL_STATE_DIR;
    } else {
      process.env.BABYSITTER_GLOBAL_STATE_DIR = originalGlobalStateDir;
    }
    if (originalRunsDir === undefined) {
      delete process.env.BABYSITTER_RUNS_DIR;
    } else {
      process.env.BABYSITTER_RUNS_DIR = originalRunsDir;
    }
    if (originalRunsScope === undefined) {
      delete process.env.BABYSITTER_RUNS_SCOPE;
    } else {
      process.env.BABYSITTER_RUNS_SCOPE = originalRunsScope;
    }
  });

  it('defaults to the global runs root', () => {
    process.env.BABYSITTER_GLOBAL_STATE_DIR = path.join(os.tmpdir(), 'babysitter-tui-global');
    delete process.env.BABYSITTER_RUNS_DIR;
    delete process.env.BABYSITTER_RUNS_SCOPE;
    const result = resolveRunsDir();
    expect(result).toBe(path.join(process.env.BABYSITTER_GLOBAL_STATE_DIR, 'runs'));
  });

  it('uses repo scope when requested', () => {
    delete process.env.BABYSITTER_RUNS_DIR;
    process.env.BABYSITTER_RUNS_SCOPE = 'repo';
    const result = resolveRunsDir('/some/workspace');
    expect(result).toBe(path.resolve('/some/workspace', '.a5c', 'runs'));
  });
});
