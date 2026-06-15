/**
 * Pure kradle-resource → Commander-view mapper tests (SPEC-KRADLE-MODEL §4,
 * AC2/AC4).
 *
 * Authored from the spec's §4 mapping tables. Every test cites the AC it pins:
 *   AC2  — empty/degraded snapshot → empty views (never throws); model.resources
 *          fallback by kind. (Faithful entity model — corrected kinds/phases.)
 *   AC4  — §4.1 Run→Attempt→Session hierarchy (attempt count, active-attempt
 *          sessions, `mapAttempts`); §4.2 the FULL phase→column table in BOTH
 *          casings; §4.3 SimCardView/SimRunView field maps; §4.4/§4.5 workspaces,
 *          memory, stacks. The invented roster is REMOVED (no `mapRosterAgents`).
 */
import { describe, expect, it } from 'vitest';

import type { GraphQueryResult } from '../../../contracts/kradle-memory';
import type { KradleControllerSnapshot, KradleResourceItem } from '../controllerClient';
import {
  LABEL_AGENT_ROLE,
  LABEL_CREATURE,
  LABEL_DEFAULT_FOR,
  LABEL_MERGED,
  LABEL_PARENT,
  LABEL_RELEASE_ID,
  LABEL_WORKER,
  LABEL_YOLO,
  mapAttempts,
  mapCards,
  mapMemoryIO,
  mapProcessTemplates,
  mapRunObservation,
  mapRuns,
  mapSessionDetail,
  mapSessions,
  mapSilos,
  mapStacks,
  mapToTickInput,
  mapWorkspaces,
  mapWorkspaceView,
  narrowTaskKind,
  runPhaseToColumn,
} from '../mappers';
import { PHASES_BY_KIND } from '../../mock/simulation';
import { TASK_KINDS } from '../../mock/scenario';

// ---------------------------------------------------------------------------
// Fixture builders (minimal CRD items in the wide snapshot shape).
// ---------------------------------------------------------------------------

function run(
  name: string,
  spec: Record<string, unknown>,
  phase: string | undefined,
  labels: Record<string, string> = {},
  extraStatus: Record<string, unknown> = {},
  creationTimestamp?: string,
): KradleResourceItem {
  return {
    apiVersion: 'kradle.a5c.ai/v1alpha1',
    kind: 'AgentDispatchRun',
    metadata: { name, labels, ...(creationTimestamp ? { creationTimestamp } : {}) },
    spec,
    status: { ...(phase !== undefined ? { phase } : {}), ...extraStatus },
  };
}

function approval(
  name: string,
  dispatchRun: string,
  actionType: string,
  phase: string | undefined,
  extraStatus: Record<string, unknown> = {},
): KradleResourceItem {
  return {
    kind: 'AgentApproval',
    metadata: { name },
    spec: { dispatchRun, action: { type: actionType, target: 't', summary: `gate ${actionType}` } },
    status: { ...(phase !== undefined ? { phase } : {}), ...extraStatus },
  };
}

function session(
  name: string,
  spec: Record<string, unknown>,
  phase: string,
  labels: Record<string, string> = {},
): KradleResourceItem {
  return { kind: 'AgentSession', metadata: { name, labels }, spec, status: { phase } };
}

/** An `AgentDispatchAttempt` fixture (lives in `resources[]` by kind). */
function attempt(
  name: string,
  agentDispatchRun: string,
  attemptReason: string,
  phase: string | undefined,
  creationTimestamp?: string,
): KradleResourceItem {
  return {
    kind: 'AgentDispatchAttempt',
    metadata: { name, ...(creationTimestamp ? { creationTimestamp } : {}) },
    spec: { agentDispatchRun, attemptReason },
    status: { ...(phase !== undefined ? { phase } : {}) },
  };
}

/** Wrap attempt items in the `resources[]` fallback the mappers read. */
function attemptsResource(items: KradleResourceItem[]): KradleControllerSnapshot['resources'] {
  return [{ kind: 'AgentDispatchAttempt', items }];
}

function snap(over: Partial<KradleControllerSnapshot['agents']> = {}): KradleControllerSnapshot {
  return {
    status: 'ready',
    agents: {
      stacks: { items: [] },
      runs: { items: [] },
      sessions: { items: [] },
      workspaces: { items: [] },
      approvals: { items: [], pending: [] },
      transcripts: { items: [] },
      memoryRepositories: { items: [] },
      memoryImports: { items: [] },
      ...over,
    },
  };
}

// ===========================================================================
// AC2 — empty / degraded snapshot → empty views; resources[] fallback
// ===========================================================================

describe('AC2 — empty/degraded snapshot never throws, yields empty views', () => {
  it('AC2: an empty snapshot maps to empty card/run/session/workspace/attempt lists', () => {
    const s = snap();
    expect(mapCards(s)).toEqual([]);
    expect(mapRuns(s)).toEqual([]);
    expect(mapSessions(s)).toEqual([]);
    expect(mapWorkspaces(s)).toEqual([]);
    expect(mapAttempts(s)).toEqual([]);
    expect(mapSilos(s)).toEqual([]);
  });

  it('AC2: a totally bare snapshot ({}) does not throw', () => {
    const bare: KradleControllerSnapshot = {};
    expect(() => mapCards(bare)).not.toThrow();
    expect(mapCards(bare)).toEqual([]);
    expect(mapStacks(bare)).toEqual([]);
    expect(mapToTickInput(bare, 1000).cards).toEqual([]);
  });

  it('AC2: a degraded snapshot (status!=ready, empty items) yields empty views', () => {
    const degraded: KradleControllerSnapshot = {
      status: 'degraded',
      controller: { connection: { available: false, errors: ['no controller'] } },
      agents: { stacks: { items: [] }, runs: { items: [], active: [] } },
    };
    expect(mapStacks(degraded)).toEqual([]);
    expect(mapCards(degraded)).toEqual([]);
  });

  it('AC2: an AgentDefinition surfaced only in model.resources[] is picked up (fallback by kind)', () => {
    const s: KradleControllerSnapshot = {
      status: 'ready',
      agents: { stacks: { items: [] } },
      resources: [
        {
          kind: 'AgentDefinition',
          items: [
            {
              kind: 'AgentDefinition',
              metadata: { name: 'persona-a' },
              spec: { baseAgent: 'claude-code', adapter: 'claude-code' },
              status: { phase: 'Ready' },
            },
          ],
        },
      ],
    };
    const stacks = mapStacks(s);
    expect(stacks).toHaveLength(1);
    expect(stacks[0].stackRef).toBe('persona-a');
  });
});

// ===========================================================================
// AC4 — AgentStack / AgentDefinition → SimStackView (§4.5)
// ===========================================================================

describe('AC4 — stacks (roster REMOVED, AC3)', () => {
  it('AC4: maps each §4.5 stack field, defaulting model/prompt/approvalMode when absent', () => {
    const s = snap({
      stacks: {
        items: [
          {
            kind: 'AgentStack',
            metadata: { name: 'stk-9', labels: { 'kradle.a5c.ai/origin': 'foundry' } },
            spec: { baseAgent: 'codex', adapter: 'codex' },
            status: {},
          },
        ],
      },
    });
    const [view] = mapStacks(s);
    expect(view.stackRef).toBe('stk-9');
    expect(view.name).toBe('stk-9');
    expect(view.custom).toBe(true); // origin=foundry
    expect(view.stack.spec.baseAgent).toBe('codex');
    expect(view.stack.spec.adapter).toBe('codex');
    // model defaults to the adapter's first model (scenario MODELS_BY_ADAPTER).
    expect(view.stack.spec.model).toBe('gpt-5.2-codex');
    expect(view.stack.spec.prompt).toEqual({ system: '' });
    expect(view.stack.spec.approvalMode).toBe('prompt');
    expect(view.stack.status.phase).toBe('Ready'); // default
  });

  it('AC4: custom is false for an unlabeled stack; displayName overrides name', () => {
    const s = snap({
      stacks: {
        items: [
          {
            kind: 'AgentStack',
            metadata: { name: 'stk-seed' },
            spec: { baseAgent: 'pi', adapter: 'pi', displayName: 'Swift Scout', model: 'pi-2.5' },
            status: { phase: 'ready' },
          },
        ],
      },
    });
    const [view] = mapStacks(s);
    expect(view.custom).toBe(false);
    expect(view.name).toBe('Swift Scout');
    expect(view.stack.spec.model).toBe('pi-2.5');
  });

  it('AC4: AgentStack wins over an AgentDefinition of the same name (dedup)', () => {
    const s: KradleControllerSnapshot = {
      status: 'ready',
      agents: {
        stacks: {
          items: [
            {
              kind: 'AgentStack',
              metadata: { name: 'dup', labels: { 'kradle.a5c.ai/origin': 'foundry' } },
              spec: { baseAgent: 'claude-code', adapter: 'claude-code' },
              status: {},
            },
          ],
        },
      },
      resources: [
        {
          kind: 'AgentDefinition',
          items: [
            { kind: 'AgentDefinition', metadata: { name: 'dup' }, spec: { baseAgent: 'pi', adapter: 'pi' }, status: {} },
          ],
        },
      ],
    };
    const stacks = mapStacks(s);
    expect(stacks).toHaveLength(1);
    expect(stacks[0].stack.spec.adapter).toBe('claude-code'); // AgentStack won
    expect(stacks[0].custom).toBe(true);
  });

});

// ===========================================================================
// AC4 — §4.1 Run → Attempt → Session hierarchy (the headline fix)
// ===========================================================================

describe('AC4 §4.1 — Run → Attempt → Session hierarchy', () => {
  it('AC4: SimCardView.attempt is the COUNT of AgentDispatchAttempt records for the run', () => {
    const s = snap({
      runs: { items: [run('adr-1', { repository: 'r', taskKind: 'fix' }, 'Running')] },
    });
    s.resources = attemptsResource([
      attempt('att-1', 'adr-1', 'initial', 'Failed', '2026-01-01T00:00:00Z'),
      attempt('att-2', 'adr-1', 'retry', 'Running', '2026-01-02T00:00:00Z'),
    ]);
    expect(mapCards(s)[0].attempt).toBe(2);
  });

  it('AC4: with NO attempt records the count defaults to 1', () => {
    const s = snap({ runs: { items: [run('adr-1', { repository: 'r', taskKind: 'fix' }, 'Running')] } });
    expect(mapCards(s)[0].attempt).toBe(1);
  });

  it('AC4: agentIds are the ACTIVE sessions of the ACTIVE attempt (not a prior attempt)', () => {
    const s = snap({
      runs: { items: [run('adr-1', { repository: 'r', taskKind: 'implement' }, 'Running')] },
      sessions: {
        items: [
          // Session of the OLD (terminal) attempt — must NOT surface.
          session('sess-old', { dispatchRun: 'adr-1', dispatchAttempt: 'att-1' }, 'Active'),
          // Active session of the ACTIVE attempt — surfaces.
          session('sess-new', { dispatchRun: 'adr-1', dispatchAttempt: 'att-2' }, 'Active'),
          // Completed session of the active attempt — excluded (not Active).
          session('sess-done', { dispatchRun: 'adr-1', dispatchAttempt: 'att-2' }, 'Completed'),
        ],
      },
    });
    s.resources = attemptsResource([
      attempt('att-1', 'adr-1', 'initial', 'Failed', '2026-01-01T00:00:00Z'),
      attempt('att-2', 'adr-1', 'retry', 'Running', '2026-01-02T00:00:00Z'),
    ]);
    expect(mapCards(s)[0].agentIds).toEqual(['sess-new']);
  });

  it('AC4: with no attempt records, agentIds fall back to the run\'s active sessions', () => {
    const s = snap({
      runs: { items: [run('adr-1', { repository: 'r', taskKind: 'implement' }, 'Running')] },
      sessions: {
        items: [
          session('sess-a', { dispatchRun: 'adr-1' }, 'Active'),
          session('sess-done', { dispatchRun: 'adr-1' }, 'Completed'),
        ],
      },
    });
    expect(mapCards(s)[0].agentIds).toEqual(['sess-a']);
  });

  it('AC4: mapAttempts projects attempts oldest→newest and flags the ACTIVE (newest non-terminal) one', () => {
    const s = snap({
      runs: { items: [run('adr-1', { repository: 'r', taskKind: 'fix' }, 'Running')] },
      sessions: { items: [session('sess-x', { dispatchRun: 'adr-1', dispatchAttempt: 'att-2' }, 'Active')] },
    });
    s.resources = attemptsResource([
      attempt('att-2', 'adr-1', 'retry', 'Running', '2026-01-02T00:00:00Z'),
      attempt('att-1', 'adr-1', 'initial', 'Failed', '2026-01-01T00:00:00Z'),
    ]);
    const attempts = mapAttempts(s, 'adr-1');
    expect(attempts.map((a) => a.attemptId)).toEqual(['att-1', 'att-2']); // oldest→newest
    expect(attempts[0].attemptReason).toBe('initial');
    expect(attempts[0].active).toBe(false);
    expect(attempts[1].attemptReason).toBe('retry');
    expect(attempts[1].active).toBe(true); // newest non-terminal
    expect(attempts[1].phase).toBe('running'); // normalized to lowercase
    expect(attempts[1].sessionIds).toEqual(['sess-x']);
  });

  it('AC4: when every attempt is terminal, the NEWEST is flagged active (fallback)', () => {
    const s = snap({ runs: { items: [run('adr-1', { repository: 'r', taskKind: 'fix' }, 'Succeeded')] } });
    s.resources = attemptsResource([
      attempt('att-1', 'adr-1', 'initial', 'Failed', '2026-01-01T00:00:00Z'),
      attempt('att-2', 'adr-1', 'retry', 'Succeeded', '2026-01-02T00:00:00Z'),
    ]);
    const attempts = mapAttempts(s, 'adr-1');
    expect(attempts.find((a) => a.active)!.attemptId).toBe('att-2');
  });
});

// ===========================================================================
// AC4 — the FULL §4.2 phase→column table (every phase + refinement, BOTH casings)
// ===========================================================================

describe('AC4 §4.2 — runPhaseToColumn: the total phase→column table (both casings)', () => {
  const base = {
    taskKind: 'implement' as const,
    hasPendingReviewApproval: false,
    hasPendingWriteBackApproval: false,
    hasApprovedWriteBack: false,
    merged: false,
    released: false,
  };

  // --- capitalized terminals the live BFF emits ----------------------------
  it('AC4: Pending → backlog', () => {
    expect(runPhaseToColumn('Pending', base)).toBe('backlog');
  });
  it('AC4: Queued → backlog', () => {
    expect(runPhaseToColumn('Queued', base)).toBe('backlog');
  });
  it('AC4: Running → do', () => {
    expect(runPhaseToColumn('Running', base)).toBe('do');
  });
  it('AC4: Running + pending review approval → ai-review', () => {
    expect(runPhaseToColumn('Running', { ...base, hasPendingReviewApproval: true })).toBe('ai-review');
  });
  it('AC4: Running + taskKind=review → ai-review', () => {
    expect(runPhaseToColumn('Running', { ...base, taskKind: 'review' })).toBe('ai-review');
  });
  it('AC4: AwaitingApproval → human-review', () => {
    expect(runPhaseToColumn('AwaitingApproval', base)).toBe('human-review');
  });
  it('AC4: Succeeded + approved write-back (not merged) → approved', () => {
    expect(runPhaseToColumn('Succeeded', { ...base, hasApprovedWriteBack: true })).toBe('approved');
  });
  it('AC4: Completed (live terminal alias) maps like Succeeded → approved', () => {
    expect(runPhaseToColumn('Completed', base)).toBe('approved');
  });
  it('AC4: Succeeded + merged label → merged', () => {
    expect(runPhaseToColumn('Succeeded', { ...base, merged: true })).toBe('merged');
  });
  it('AC4: Succeeded + release-id → in-production', () => {
    expect(runPhaseToColumn('Succeeded', { ...base, released: true })).toBe('in-production');
  });
  it('AC4: Succeeded with no integration signal → approved (passed, awaiting integration)', () => {
    expect(runPhaseToColumn('Succeeded', base)).toBe('approved');
  });
  it('AC4: release-id wins over merged (in-production precedence)', () => {
    expect(runPhaseToColumn('Succeeded', { ...base, merged: true, released: true })).toBe('in-production');
  });
  it('AC4: Failed → backlog (returned for rework)', () => {
    expect(runPhaseToColumn('Failed', base)).toBe('backlog');
  });
  it('AC4: Cancelled → backlog', () => {
    expect(runPhaseToColumn('Cancelled', base)).toBe('backlog');
  });

  // --- the lowercase lifecycle union the generic CRD list surfaces ----------
  it('AC4: lowercase pending/queued → backlog', () => {
    expect(runPhaseToColumn('pending', base)).toBe('backlog');
    expect(runPhaseToColumn('queued', base)).toBe('backlog');
  });
  it('AC4: lowercase running → do (and → ai-review under a review gate)', () => {
    expect(runPhaseToColumn('running', base)).toBe('do');
    expect(runPhaseToColumn('running', { ...base, hasPendingReviewApproval: true })).toBe('ai-review');
  });
  it('AC4: lowercase waiting-for-approval → human-review', () => {
    expect(runPhaseToColumn('waiting-for-approval', base)).toBe('human-review');
  });
  it('AC4: lowercase succeeded → approved (merged/in-production via labels)', () => {
    expect(runPhaseToColumn('succeeded', base)).toBe('approved');
    expect(runPhaseToColumn('succeeded', { ...base, merged: true })).toBe('merged');
    expect(runPhaseToColumn('succeeded', { ...base, released: true })).toBe('in-production');
  });
  it('AC4: lowercase failed/cancelled → backlog', () => {
    expect(runPhaseToColumn('failed', base)).toBe('backlog');
    expect(runPhaseToColumn('cancelled', base)).toBe('backlog');
  });

  it('AC4: an unknown/forward-compat phase → backlog (total map)', () => {
    expect(runPhaseToColumn('SomethingNew', base)).toBe('backlog');
    expect(runPhaseToColumn(undefined, base)).toBe('backlog');
  });
});

// ===========================================================================
// AC12 — mapCards / mapRuns field maps + column integration via the snapshot
// ===========================================================================

describe('AC12 — SimCardView / SimRunView field maps (§2.3.2/§2.3.3)', () => {
  it('AC12: a Running run with a pending write-back approval lands in human-review with hasPendingInquiry', () => {
    const s = snap({
      runs: { items: [run('adr-1', { repository: 'a5c/x', taskKind: 'fix', workspaceRef: 'ws-1' }, 'AwaitingApproval')] },
      approvals: {
        items: [approval('appr-1', 'adr-1', 'write-back', 'Pending')],
        pending: [approval('appr-1', 'adr-1', 'write-back', 'Pending')],
      },
    });
    const [card] = mapCards(s);
    expect(card.column).toBe('human-review');
    expect(card.hasPendingInquiry).toBe(true);
    expect(card.taskId).toBe('adr-1');
    expect(card.repository).toBe('a5c/x');
    expect(card.workspaceId).toBe('ws-1');
    expect(card.taskKind).toBe('fix');
  });

  it('AC12: title prefers sourceRefs.pullRequest, else repository:taskKind, else taskId', () => {
    const withPr = snap({
      runs: { items: [run('adr-pr', { repository: 'r', taskKind: 'fix', sourceRefs: { pullRequest: 'PR #42' } }, 'Running')] },
    });
    expect(mapCards(withPr)[0].title).toBe('PR #42');

    const withRepo = snap({ runs: { items: [run('adr-r', { repository: 'a5c/relay', taskKind: 'docs' }, 'Running')] } });
    expect(mapCards(withRepo)[0].title).toBe('a5c/relay:docs');

    const bare = snap({ runs: { items: [run('adr-bare', { repository: '', taskKind: 'fix' }, 'Running')] } });
    expect(mapCards(bare)[0].title).toBe('adr-bare');
  });

  it('AC12: yolo / merged / releaseId / worker / reviewer / human labels map onto the card', () => {
    const s = snap({
      runs: {
        items: [
          run(
            'adr-1',
            { repository: 'r', taskKind: 'implement' },
            'Succeeded',
            {
              [LABEL_YOLO]: 'true',
              [LABEL_MERGED]: 'true',
              [LABEL_RELEASE_ID]: 'rel-7',
              [LABEL_WORKER]: 'ra-w',
              'commander.a5c.ai/reviewer': 'ra-r',
              'commander.a5c.ai/human': 'user',
            },
          ),
        ],
      },
    });
    const [card] = mapCards(s);
    expect(card.yolo).toBe(true);
    expect(card.releaseId).toBe('rel-7');
    expect(card.column).toBe('in-production'); // release-id present
    expect(card.merged).toBe(true); // derived from column
    expect(card.workerAgentId).toBe('ra-w');
    expect(card.reviewerAgentId).toBe('ra-r');
    expect(card.humanAssigneeId).toBe('user');
  });

  it('AC12: progress is the deterministic step function (Pending 0, Running 0.5, Succeeded 1)', () => {
    const pending = snap({ runs: { items: [run('p', { repository: 'r', taskKind: 'fix' }, 'Pending')] } });
    const running = snap({ runs: { items: [run('r', { repository: 'r', taskKind: 'fix' }, 'Running')] } });
    const done = snap({ runs: { items: [run('d', { repository: 'r', taskKind: 'fix' }, 'Succeeded')] } });
    expect(mapCards(pending)[0].progress).toBe(0);
    expect(mapCards(running)[0].progress).toBe(0.5);
    expect(mapCards(done)[0].progress).toBe(1);
  });

  it('AC12: parent/child links derive from the commander.a5c.ai/parent label', () => {
    const s = snap({
      runs: {
        items: [
          run('parent', { repository: 'r', taskKind: 'implement' }, 'Running'),
          run('child', { repository: 'r', taskKind: 'fix' }, 'Pending', { [LABEL_PARENT]: 'parent' }),
        ],
      },
    });
    const cards = mapCards(s);
    const parent = cards.find((c) => c.taskId === 'parent')!;
    const child = cards.find((c) => c.taskId === 'child')!;
    expect(child.parentId).toBe('parent');
    expect(parent.childIds).toContain('child');
  });

  it('AC12: per-column order is a stable sort by creationTimestamp', () => {
    const s = snap({
      runs: {
        items: [
          run('late', { repository: 'r', taskKind: 'fix' }, 'Pending', {}, {}, '2026-01-02T00:00:00Z'),
          run('early', { repository: 'r', taskKind: 'fix' }, 'Pending', {}, {}, '2026-01-01T00:00:00Z'),
        ],
      },
    });
    const cards = mapCards(s);
    const early = cards.find((c) => c.taskId === 'early')!;
    const late = cards.find((c) => c.taskId === 'late')!;
    expect(early.order).toBe(0);
    expect(late.order).toBe(1);
  });

  it('AC12: agentIds are the active sessions attached to the run', () => {
    const s = snap({
      runs: { items: [run('adr-1', { repository: 'r', taskKind: 'implement' }, 'Running')] },
      sessions: {
        items: [
          session('sess-a', { dispatchRun: 'adr-1' }, 'Active'),
          session('sess-done', { dispatchRun: 'adr-1' }, 'Completed'),
        ],
      },
    });
    const [card] = mapCards(s);
    expect(card.agentIds).toEqual(['sess-a']);
  });

  it('AC12: dirtyFileCount comes from the run workspace uncommittedCount', () => {
    const s = snap({
      runs: { items: [run('adr-1', { repository: 'r', taskKind: 'fix', workspaceRef: 'ws-1' }, 'Running')] },
      workspaces: {
        items: [
          {
            kind: 'KradleWorkspace',
            metadata: { name: 'ws-1' },
            spec: { repository: 'r' },
            status: { phase: 'InUse', gitStatus: { branch: 'main', headSha: 'abc', dirty: true, uncommittedCount: 5 } },
          },
        ],
      },
    });
    expect(mapCards(s)[0].dirtyFileCount).toBe(5);
  });

  it('AC12: mapRuns synthesizes processId/processRevision and maps observedState + newest-first', () => {
    const s = snap({
      runs: {
        items: [
          run('old', { repository: 'r', taskKind: 'fix' }, 'Succeeded', {}, { queuedAt: '2026-01-01T00:00:00Z', completedAt: '2026-01-01T01:00:00Z' }),
          run('new', { repository: 'r', taskKind: 'docs' }, 'Running', {}, { queuedAt: '2026-02-01T00:00:00Z' }),
        ],
      },
    });
    const runs = mapRuns(s);
    expect(runs[0].runId).toBe('new'); // newest-first by startedAt
    expect(runs[0].processId).toBe('commander/docs@v1');
    expect(runs[0].processRevision).toBe(1);
    expect(runs[0].observedState).toBe('waiting'); // Running → waiting (journal model)
    expect(runs[0].endedAt).toBeNull();
    const old = runs.find((r) => r.runId === 'old')!;
    expect(old.observedState).toBe('completed'); // Succeeded → completed
    expect(old.endedAt).not.toBeNull();
  });

  it('AC12: mapRunObservation has phases zipped with progress and an empty journal', () => {
    const s = snap({ runs: { items: [run('adr-1', { repository: 'r', taskKind: 'implement' }, 'Running')] } });
    const obs = mapRunObservation(s, 'adr-1')!;
    expect(obs.journal).toEqual([]);
    expect(obs.phases.length).toBe(PHASES_BY_KIND.implement.length);
    expect(obs.phases.some((p) => p.status === 'current')).toBe(true);
  });

  it('AC12: mapRunObservation returns null for an unknown task', () => {
    expect(mapRunObservation(snap(), 'nope')).toBeNull();
  });

  it('AC12: pendingEffectsByKind reflects pending approvals as { breakpoint: n }', () => {
    const s = snap({
      runs: { items: [run('adr-1', { repository: 'r', taskKind: 'fix' }, 'AwaitingApproval')] },
      approvals: {
        items: [approval('a1', 'adr-1', 'write-back', 'Pending'), approval('a2', 'adr-1', 'tool-use', 'Pending')],
        pending: [approval('a1', 'adr-1', 'write-back', 'Pending'), approval('a2', 'adr-1', 'tool-use', 'Pending')],
      },
    });
    expect(mapRunObservation(s, 'adr-1')!.pendingEffectsByKind).toEqual({ breakpoint: 2 });
  });
});

// ===========================================================================
// AC12 — kradle→taskKind fallback table (§2.3.2)
// ===========================================================================

describe('AC12 — narrowTaskKind fallback table', () => {
  it('AC12: a known kind passes through', () => {
    expect(narrowTaskKind('fix')).toBe('fix');
    expect(narrowTaskKind('implement')).toBe('implement');
  });
  it('AC12: ci-repair and diagnostic map to fix', () => {
    expect(narrowTaskKind('ci-repair')).toBe('fix');
    expect(narrowTaskKind('diagnostic')).toBe('fix');
  });
  it('AC12: an unknown kind falls back to implement', () => {
    expect(narrowTaskKind('something-else')).toBe('implement');
    expect(narrowTaskKind(undefined)).toBe('implement');
  });
});

// ===========================================================================
// AC11 — AgentSession → SimSessionView / SimSessionDetailView
// ===========================================================================

describe('AC11 — sessions and transcripts', () => {
  it('AC11: maps the §2.2 session fields and status mapping', () => {
    const s = snap({
      runs: { items: [run('adr-1', { repository: 'r', taskKind: 'implement', agentStack: 'stk-1' }, 'Running')] },
      sessions: {
        items: [
          session(
            'sess-1',
            { dispatchRun: 'adr-1', adapter: 'codex', model: 'gpt-5.2-codex', attempt: 2, title: 'Cog the Worker' },
            'Active',
            { [LABEL_CREATURE]: 'Cogsworth', [LABEL_AGENT_ROLE]: 'reviewer' },
          ),
        ],
      },
    });
    const [view] = mapSessions(s);
    expect(view.sessionId).toBe('sess-1');
    expect(view.title).toBe('Cog the Worker');
    expect(view.creatureName).toBe('Cogsworth');
    expect(view.agent).toBe('codex');
    expect(view.model).toBe('gpt-5.2-codex');
    expect(view.role).toBe('reviewer');
    expect(view.status).toBe('active');
    expect(view.taskId).toBe('adr-1');
    expect(view.runId).toBe('adr-1');
    expect(view.attempt).toBe(2);
    expect(view.stackRef).toBe('stk-1'); // resolved from the parent run
    expect(view.startedTick).toBe(0);
    expect(view.endedTick).toBeNull(); // active
  });

  it('AC11: terminal session phases map to completed/aborted with a non-null endedTick', () => {
    const s = snap({
      sessions: {
        items: [
          session('done', { dispatchRun: 'adr-1', adapter: 'pi' }, 'Completed'),
          session('failed', { dispatchRun: 'adr-1', adapter: 'pi' }, 'Failed'),
          session('cancelled', { dispatchRun: 'adr-1', adapter: 'pi' }, 'Cancelled'),
        ],
      },
    });
    const byId = new Map(mapSessions(s).map((v) => [v.sessionId, v]));
    expect(byId.get('done')!.status).toBe('completed');
    expect(byId.get('failed')!.status).toBe('aborted');
    expect(byId.get('cancelled')!.status).toBe('aborted');
    expect(byId.get('done')!.endedTick).toBe(0); // non-null when terminal
  });

  it('AC11: title defaults to "<creature> — <role>" when spec.title is absent', () => {
    const s = snap({
      sessions: { items: [session('sess-x', { dispatchRun: 'adr-1', adapter: 'pi' }, 'Active', { [LABEL_CREATURE]: 'Pinion' })] },
    });
    expect(mapSessions(s)[0].title).toBe('Pinion — worker');
  });

  it('AC11: listSessions(taskId) filters by spec.dispatchRun', () => {
    const s = snap({
      sessions: {
        items: [
          session('a', { dispatchRun: 'adr-1', adapter: 'pi' }, 'Active'),
          session('b', { dispatchRun: 'adr-2', adapter: 'pi' }, 'Active'),
        ],
      },
    });
    expect(mapSessions(s, 'adr-2').map((v) => v.sessionId)).toEqual(['b']);
  });

  it('AC11: getSession maps the transcript messages → SimSessionTranscriptEntry (role→kind)', () => {
    const s = snap({
      sessions: { items: [session('sess-1', { dispatchRun: 'adr-1', adapter: 'pi' }, 'Active')] },
      transcripts: {
        items: [
          {
            kind: 'AgentSessionTranscript',
            metadata: { name: 't-1' },
            spec: {
              sessionRef: 'sess-1',
              cost: { inputTokens: 100, outputTokens: 40, totalUsd: 0.5 },
              messages: [
                { role: 'user', content: 'do the thing', timestamp: '2026-01-01T00:00:00Z' },
                { role: 'assistant', content: 'working on it' },
                { role: 'tool', content: 'ran tests', toolName: 'Bash' },
                { role: 'system', content: 'note' },
              ],
            },
            status: {},
          },
        ],
      },
    });
    const detail = mapSessionDetail(s, 'sess-1')!;
    expect(detail.record.messageCount).toBe(4);
    expect(detail.record.tokenUsage.inputTokens).toBe(100);
    expect(detail.record.cost.totalUsd).toBe(0.5);
    expect(detail.transcript.map((t) => t.kind)).toEqual(['user', 'message', 'tool_call', 'event']);
    expect(detail.transcript[0].seq).toBe(0);
    expect(detail.transcript[2].toolName).toBe('Bash');
  });

  it('AC11: getSession returns null for an unknown session', () => {
    expect(mapSessionDetail(snap(), 'nope')).toBeNull();
  });
});

// ===========================================================================
// AC13 — workspaces, memory, process templates
// ===========================================================================

describe('AC13 — workspaces, memory I/O, silos, process templates', () => {
  function wsItem(name: string, phase: string, git?: Record<string, unknown>): KradleResourceItem {
    return {
      kind: 'KradleWorkspace',
      metadata: { name },
      spec: { repository: 'a5c/relay' },
      status: { phase, ...(git ? { gitStatus: git } : {}) },
    };
  }

  it('AC13: workspace phase mapping (Pending/Provisioning→created, Ready/InUse/Released→ready, Archived→archived, Terminating→missing)', () => {
    const s = snap({
      runs: { items: [run('adr-1', { repository: 'r', taskKind: 'fix', workspaceRef: 'ws-prov' }, 'Running')] },
      workspaces: { items: [wsItem('ws-prov', 'Provisioning')] },
    });
    expect(mapWorkspaceView(s, 'adr-1')!.phase).toBe('created');

    const ready = snap({
      runs: { items: [run('adr-1', { repository: 'r', taskKind: 'fix', workspaceRef: 'ws-r' }, 'Running')] },
      workspaces: { items: [wsItem('ws-r', 'InUse')] },
    });
    expect(mapWorkspaceView(ready, 'adr-1')!.phase).toBe('ready');

    const arch = snap({
      runs: { items: [run('adr-1', { repository: 'r', taskKind: 'fix', workspaceRef: 'ws-a' }, 'Running')] },
      workspaces: { items: [wsItem('ws-a', 'Archived')] },
    });
    expect(mapWorkspaceView(arch, 'adr-1')!.phase).toBe('archived');

    const term = snap({
      runs: { items: [run('adr-1', { repository: 'r', taskKind: 'fix', workspaceRef: 'ws-t' }, 'Running')] },
      workspaces: { items: [wsItem('ws-t', 'Terminating')] },
    });
    expect(mapWorkspaceView(term, 'adr-1')!.phase).toBe('missing');
  });

  it('AC13: getWorkspaceView documents-empty files/testEvidence and defaults gitStatus when no workspace', () => {
    const s = snap({ runs: { items: [run('adr-1', { repository: 'r', taskKind: 'fix' }, 'Running')] } });
    const view = mapWorkspaceView(s, 'adr-1')!;
    expect(view.phase).toBe('missing');
    expect(view.files).toEqual([]);
    expect(view.testEvidence).toEqual({ status: 'unknown' });
    expect(view.gitStatus).toEqual({ branch: 'main', headSha: '', dirty: false });
  });

  it('AC13: getWorkspaceView reviewerNotes come from denied approvals feedback', () => {
    const s = snap({
      runs: { items: [run('adr-1', { repository: 'r', taskKind: 'fix', workspaceRef: 'ws-1' }, 'Running')] },
      workspaces: { items: [wsItem('ws-1', 'InUse')] },
      approvals: { items: [approval('a1', 'adr-1', 'write-back', 'Denied', { feedback: 'fix the tests' })] },
    });
    expect(mapWorkspaceView(s, 'adr-1')!.reviewerNotes).toEqual(['fix the tests']);
  });

  it('AC13: listWorkspaces builds one row per workspace with card git lines + active sessions', () => {
    const s = snap({
      runs: { items: [run('adr-1', { repository: 'a5c/relay', taskKind: 'fix', workspaceRef: 'ws-1' }, 'Running')] },
      sessions: { items: [session('sess-a', { dispatchRun: 'adr-1' }, 'Active')] },
      workspaces: { items: [wsItem('ws-1', 'InUse', { branch: 'feat', headSha: 'deadbeef', dirty: true, uncommittedCount: 3 })] },
    });
    const [row] = mapWorkspaces(s);
    expect(row.workspaceId).toBe('ws-1');
    expect(row.repository).toBe('a5c/relay');
    expect(row.phase).toBe('ready');
    expect(row.dirty).toBe(true);
    expect(row.cardIds).toEqual(['adr-1']);
    expect(row.cards[0].branch).toBe('feat');
    expect(row.cards[0].dirtyFileCount).toBe(3);
    expect(row.activeSessionIds).toEqual(['sess-a']);
  });

  it('AC13: getMemoryIO maps GraphQueryResult.matches → read[] and imports → written[]', () => {
    const s = snap({
      memoryImports: {
        items: [
          {
            kind: 'AgentRunMemoryImport',
            metadata: { name: 'imp-1' },
            spec: {
              sourceRun: 'adr-1',
              memoryRepository: 'brain-relay',
              changes: [{ path: 'graph/x.yaml', action: 'add', reason: 'new decision' }],
            },
            status: { phase: 'Pending' },
          },
        ],
      },
    });
    const memory: GraphQueryResult = {
      totalMatches: 1,
      matches: [
        {
          record: { id: 'repository:relay', nodeKind: 'Repository', attributes: { title: 'relay', status: 'approved', owners: [], updatedAt: '2026-01-01T00:00:00Z' } },
          score: 1,
          edges: [],
        },
      ],
    };
    const io = mapMemoryIO(s, 'adr-1', memory);
    expect(io.read).toHaveLength(1);
    expect(io.read[0].recordId).toBe('repository:relay');
    expect(io.read[0].kind).toBe('Repository');
    expect(io.read[0].silo).toBe('repository'); // prefix of the id
    expect(io.written).toHaveLength(1);
    expect(io.written[0].updateId).toBe('imp-1');
    expect(io.written[0].silo).toBe('brain-relay');
    expect(io.written[0].changes[0].path).toBe('graph/x.yaml');
  });

  it('AC13: getMemoryIO returns empty when the memory result is undefined (endpoint unavailable)', () => {
    const io = mapMemoryIO(snap(), 'adr-1', undefined);
    expect(io).toEqual({ read: [], written: [] });
  });

  it('AC13: mapSilos maps memoryRepositories → SimMemorySiloView', () => {
    const s = snap({
      memoryRepositories: {
        items: [
          {
            kind: 'AgentMemoryRepository',
            metadata: { name: 'brain-relay' },
            spec: { repositoryRef: 'a5c/relay-brain' },
            status: { phase: 'Ready', currentCommit: 'abc123' },
          },
        ],
      },
    });
    const [silo] = mapSilos(s);
    expect(silo.name).toBe('brain-relay');
    expect(silo.phase).toBe('Ready');
    expect(silo.currentCommit).toBe('abc123');
    expect(silo.owner).toBe('a5c/relay-brain');
    expect(silo.recordCount).toBe(0);
  });

  it('AC13: listProcessTemplates synthesizes one template per TaskKind from PHASES_BY_KIND', () => {
    const templates = mapProcessTemplates();
    expect(templates).toHaveLength(TASK_KINDS.length);
    const fix = templates.find((t) => t.kind === 'fix')!;
    expect(fix.processId).toBe('commander/fix@v1');
    expect(fix.revision).toBe(1);
    expect(fix.phases).toEqual([...PHASES_BY_KIND.fix]);
  });
});

// ===========================================================================
// AC12 — §6.2 mapToTickInput (board halves; frames-empty invariant lives in boot)
// ===========================================================================

describe('AC12 — mapToTickInput board halves (§6.2)', () => {
  it('AC12: produces cards/agents/units/tasks/hooks/inquiries/runStages/rosterAgents from one snapshot', () => {
    const s = snap({
      runs: { items: [run('adr-1', { repository: 'r', taskKind: 'implement' }, 'Running')] },
      sessions: { items: [session('sess-a', { dispatchRun: 'adr-1', adapter: 'claude-code' }, 'Active')] },
      approvals: {
        items: [approval('appr-1', 'adr-1', 'tool-use', 'Pending')],
        pending: [approval('appr-1', 'adr-1', 'tool-use', 'Pending')],
      },
    });
    const tick = mapToTickInput(s, 5000);
    expect(tick.cards).toHaveLength(1);
    expect(tick.agents).toHaveLength(1);
    expect(tick.agents[0].unitId).toBe('sess-a');
    expect(tick.units).toHaveLength(1);
    expect(tick.tasks).toHaveLength(1);
    expect(tick.hooks).toHaveLength(1);
    expect(tick.hooks[0].hookRequestId).toBe('appr-1');
    expect(tick.inquiries).toHaveLength(1);
    expect(tick.inquiries[0].hookRequestId).toBe('appr-1');
    // Roster is REMOVED from the tick input (AC3): no `rosterAgents` key.
    expect('rosterAgents' in tick).toBe(false);
    // runStages: the active card surfaces its current phase label.
    expect(Object.keys(tick.runStages)).toContain('adr-1');
  });

  it('AC12: a hook deadlineTs is derived from the injected nowMs (not Date.now)', () => {
    const s = snap({
      runs: { items: [run('adr-1', { repository: 'r', taskKind: 'fix' }, 'AwaitingApproval')] },
      approvals: {
        items: [approval('appr-1', 'adr-1', 'write-back', 'Pending')],
        pending: [approval('appr-1', 'adr-1', 'write-back', 'Pending')],
      },
    });
    const tick = mapToTickInput(s, 1_000_000);
    expect(tick.hooks[0].deadlineTs).toBe(1_000_000 + 15_000);
  });
});

// ===========================================================================
// AC4 — the LABEL_DEFAULT_FOR export exists (used by §3 dispatch resolution)
// ===========================================================================

describe('label conventions', () => {
  it('exports the documented Commander label key used by dispatch resolution', () => {
    expect(LABEL_DEFAULT_FOR).toBe('commander.a5c.ai/default-for');
  });
});
