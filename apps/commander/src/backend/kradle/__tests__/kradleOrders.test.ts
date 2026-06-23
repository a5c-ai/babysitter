/**
 * Real-mode kradle `Orders` tests (SPEC-KRADLE-MODEL §3/§4, AC4).
 *
 * Driven by a fake `KradleControllerClient` (records calls, resolves
 * immediately) + a fake gateway `Orders`. Each test cites AC4 and the §3 row.
 *   §3.4 — createTask → dispatch body BY STACK (agentStack/stackRef/repository/
 *          ref/taskKind/actor) — Commander has no persona system.
 *   §3.3 — decide / answerInquiry plane routing (approval vs gateway).
 *   §3   — abort card→cancelRun vs agent→gateway; upsertStack → applyResource
 *          (the AgentStack via the generic CRD gateway);
 *          roster verbs are documented no-ops (roster REMOVED, AC3);
 *          documented-no-op verbs warn-once + never throw.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Orders } from '../../../game/store';
import type {
  ApprovalDecision,
  CancelRunResult,
  DecideResult,
  DefinitionPatchBody,
  DefinitionResourceResult,
  DefinitionWriteBody,
  DispatchInput,
  DispatchResult,
  KradleControllerClient,
  KradleControllerSnapshot,
  KradleResourceItem,
  ResourceApplyBody,
  ResourceApplyResult,
  ResourceListResult,
  RunActionInput,
} from '../controllerClient';
import { KradleProposedRouteError } from '../controllerClient';
import {
  applyDefinition,
  applyProcessTemplate,
  makeKradleOrders,
  processTemplateResourceName,
  resolveDispatchDefinition,
  resolveDispatchStack,
} from '../kradleOrders';
import { LABEL_DEFAULT_FOR } from '../mappers';

// ---------------------------------------------------------------------------
// Fake client — records every mutating call; reads resolve immediately.
// ---------------------------------------------------------------------------

interface RecordedCall {
  method: string;
  arg: unknown;
  arg2?: unknown;
}

function makeFakeClient(): { client: KradleControllerClient; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const client: KradleControllerClient = {
    org: 'acme',
    snapshot: () => Promise.resolve({}),
    listResources: (kind: string): Promise<ResourceListResult> => {
      calls.push({ method: 'listResources', arg: kind });
      return Promise.resolve({ items: [] });
    },
    applyResource: (body: ResourceApplyBody): Promise<ResourceApplyResult> => {
      calls.push({ method: 'applyResource', arg: body });
      return Promise.resolve({ resource: { metadata: { name: body.metadata.name } } });
    },
    getResource: (kind: string, name: string): Promise<ResourceApplyResult> => {
      calls.push({ method: 'getResource', arg: kind, arg2: name });
      return Promise.resolve({ resource: { metadata: { name } } });
    },
    deleteResource: (kind: string, name: string): Promise<unknown> => {
      calls.push({ method: 'deleteResource', arg: kind, arg2: name });
      return Promise.resolve({});
    },
    listDefinitions: () => Promise.resolve({ items: [] }),
    createDefinition: (body: DefinitionWriteBody): Promise<DefinitionResourceResult> => {
      calls.push({ method: 'createDefinition', arg: body });
      return Promise.resolve({ resource: { metadata: { name: body.metadata.name } } });
    },
    getDefinition: () => Promise.resolve({}),
    patchDefinition: (name: string, body: DefinitionPatchBody): Promise<DefinitionResourceResult> => {
      calls.push({ method: 'patchDefinition', arg: name, arg2: body });
      return Promise.resolve({ resource: { metadata: { name } } });
    },
    deleteDefinition: (name: string): Promise<unknown> => {
      calls.push({ method: 'deleteDefinition', arg: name });
      return Promise.resolve({});
    },
    dispatch: (input: DispatchInput): Promise<DispatchResult> => {
      calls.push({ method: 'dispatch', arg: input });
      return Promise.resolve({ run: { metadata: { name: 'run-new' } } });
    },
    cancelRun: (name: string): Promise<CancelRunResult> => {
      calls.push({ method: 'cancelRun', arg: name });
      return Promise.resolve({ error: false, run: { metadata: { name } } });
    },
    retryRun: (input: DispatchInput): Promise<DispatchResult> => {
      calls.push({ method: 'retryRun', arg: input });
      return Promise.resolve({ run: { metadata: { name: 'run-retry' } } });
    },
    queryMemory: () => Promise.resolve({ matches: [], totalMatches: 0 }),
    decideApproval: (name: string, decision: ApprovalDecision): Promise<DecideResult> => {
      calls.push({ method: 'decideApproval', arg: name, arg2: decision });
      return Promise.resolve({ resource: { metadata: { name } } });
    },
    resumeRun: (name: string, input?: RunActionInput): Promise<DispatchResult> => {
      calls.push({ method: 'resumeRun', arg: name, arg2: input });
      return Promise.reject(new KradleProposedRouteError('runs/<run>/resume'));
    },
    forkRun: (name: string): Promise<DispatchResult> => {
      calls.push({ method: 'forkRun', arg: name });
      return Promise.reject(new KradleProposedRouteError('runs/<run>/fork'));
    },
    continueRun: (name: string): Promise<DispatchResult> => {
      calls.push({ method: 'continueRun', arg: name });
      return Promise.reject(new KradleProposedRouteError('runs/<run>/continue'));
    },
    openEventStream: () => () => {},
    openResourceWatch: () => () => {},
  };
  return { client, calls };
}

function makeFakeGateway(): { orders: Orders; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const orders = {
    abort: (ids: readonly string[]) => calls.push({ method: 'abort', arg: [...ids] }),
    steer: (ids: readonly string[], prompt: string) => calls.push({ method: 'steer', arg: [...ids], arg2: prompt }),
    decide: (id: string, decision: 'allow' | 'deny') => calls.push({ method: 'decide', arg: id, arg2: decision }),
    answerInquiry: (id: string, optionId: string | null) =>
      calls.push({ method: 'answerInquiry', arg: id, arg2: optionId }),
    pauseUnits: () => {},
    resumeUnits: () => {},
    prioritize: () => {},
    toggleSim: () => {},
    moveCard: () => {},
    setYolo: () => {},
    createTask: () => null,
    revertCard: () => {},
    release: () => null,
    rollbackCard: () => {},
    setSpeed: () => false,
    updateTask: () => false,
    upsertStack: () => null,
    upsertDefinition: () => null,
    createAgentIdentity: () => null,
    updateProcessTemplate: () => null,
    writeFile: () => false,
    createRosterAgent: () => null,
    deleteRosterAgent: () => {},
    assignTaskAgent: () => {},
    assignTaskHuman: () => {},
    focusInquiryCard: () => {},
  } satisfies Orders;
  return { orders, calls };
}

function runItem(name: string, taskKind: string, labels: Record<string, string> = {}): KradleResourceItem {
  return {
    kind: 'AgentDispatchRun',
    metadata: { name, labels },
    spec: { repository: 'r', taskKind },
    status: { phase: 'Running' },
  };
}

function approvalItem(name: string, dispatchRun: string): KradleResourceItem {
  return {
    kind: 'AgentApproval',
    metadata: { name },
    spec: { dispatchRun, action: { type: 'write-back', target: 't', summary: 's' } },
    status: { phase: 'Pending' },
  };
}

function stackItem(name: string, adapter: string, labels: Record<string, string> = {}): KradleResourceItem {
  return { kind: 'AgentStack', metadata: { name, labels }, spec: { baseAgent: adapter, adapter }, status: {} };
}

function snapshotWith(over: Partial<KradleControllerSnapshot['agents']>): KradleControllerSnapshot {
  return { status: 'ready', agents: { ...over } };
}

const noopOptions = (snapshot: KradleControllerSnapshot | null) => ({
  repo: 'default',
  getSnapshot: () => snapshot,
  scheduleRefresh: () => {},
});

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ===========================================================================
// AC14 §3.1 — createTask → dispatch
// ===========================================================================

describe('AC4 §3.4 — createTask → dispatch body (by stack)', () => {
  it('AC4: createTask resolves the stack and sends the by-stack dispatch body', async () => {
    const snapshot = snapshotWith({ stacks: { items: [stackItem('stk-cc', 'claude-code')] } });
    const { client, calls } = makeFakeClient();
    const orders = makeKradleOrders(client, noopOptions(snapshot));
    orders.createTask({ taskKind: 'implement' });
    await Promise.resolve();
    expect(calls).toHaveLength(1);
    const body = calls[0].arg as DispatchInput;
    // §3.4: Commander dispatches BY STACK, not by AgentDefinition.
    expect(body.agentStack).toBe('stk-cc');
    expect(body.stackRef).toBe('stk-cc');
    expect(body.agentDefinition).toBeUndefined();
    expect(body.repository).toBe('default');
    expect(body.ref).toBe('main');
    expect(body.taskKind).toBe('implement');
    expect(body.actor).toBe('owner');
  });

  it('AC14: createTask returns null and does NOT dispatch when no stack can be resolved', () => {
    // DEFAULT_STACK_BY_KIND maps every real TaskKind, so the seeded fallback
    // always resolves a stack for a valid kind. The genuine "no stack" path needs
    // a kind absent from both the live snapshot AND the seeded map — an unknown
    // kind. Then resolveDispatchStack/Definition both return null and createTask
    // returns null without dispatching.
    const { client, calls } = makeFakeClient();
    const orders = makeKradleOrders(client, noopOptions(snapshotWith({ stacks: { items: [] } })));
    // Deliberately out-of-domain kind (not a real TaskKind) to exercise the
    // genuine no-stack path; cast through the binding's param type.
    const result = orders.createTask(
      { taskKind: 'unknown-kind-with-no-seed' } as unknown as Parameters<typeof orders.createTask>[0],
    );
    expect(result).toBeNull(); // synchronous contract returns null (card on refresh)
    expect(calls.find((c) => c.method === 'dispatch')).toBeUndefined();
  });

  it('AC4b: createTask forwards the card title as the dispatch task (AGENT_TASK source)', async () => {
    const snapshot = snapshotWith({ stacks: { items: [stackItem('stk-cc', 'claude-code')] } });
    const { client, calls } = makeFakeClient();
    const orders = makeKradleOrders(client, noopOptions(snapshot));
    orders.createTask({ taskKind: 'implement', title: 'Forge the new mechanism' });
    await Promise.resolve();
    const body = calls.find((c) => c.method === 'dispatch')!.arg as DispatchInput;
    expect(body.task).toBe('Forge the new mechanism');
  });

  it('AC14 §3.1: resolveDispatchStack prefers default-for label, then adapter family, then first', () => {
    const labelled = snapshotWith({
      stacks: {
        items: [
          stackItem('stk-a', 'pi'),
          stackItem('stk-default', 'codex', { [LABEL_DEFAULT_FOR]: 'implement' }),
        ],
      },
    });
    expect(resolveDispatchStack(labelled, 'implement')).toBe('stk-default');

    const family = snapshotWith({ stacks: { items: [stackItem('stk-pi', 'pi'), stackItem('stk-cc', 'claude-code')] } });
    // implement → WORKER_ADAPTER_BY_KIND = claude-code
    expect(resolveDispatchStack(family, 'implement')).toBe('stk-cc');

    const firstOnly = snapshotWith({ stacks: { items: [stackItem('stk-only', 'gemini-cli')] } });
    expect(resolveDispatchStack(firstOnly, 'implement')).toBe('stk-only');
  });
});

// ===========================================================================
// Dispatch BY DEFINITION (the persona-identity path) + applyDefinition
// ===========================================================================

function definitionItem(
  name: string,
  spec: Record<string, unknown>,
  labels: Record<string, string> = {},
): KradleResourceItem {
  return { kind: 'AgentDefinition', metadata: { name, labels }, spec, status: {} };
}

describe('dispatch by AgentDefinition (persona-identity path)', () => {
  it('createTask sends {agentDefinition} when a default-for definition exists (no agentStack)', async () => {
    const snapshot = snapshotWith({
      stacks: { items: [stackItem('stk-cc', 'claude-code')] },
      definitions: {
        items: [
          definitionItem(
            'reviewer-on-main',
            { organizationRef: 'acme', personaRef: 'atlas-reviewer', stackRef: 'stk-cc' },
            { [LABEL_DEFAULT_FOR]: 'review' },
          ),
        ],
      },
    });
    const { client, calls } = makeFakeClient();
    const orders = makeKradleOrders(client, noopOptions(snapshot));
    orders.createTask({ taskKind: 'review' });
    await Promise.resolve();
    const dispatch = calls.find((c) => c.method === 'dispatch');
    expect(dispatch).toBeDefined();
    const body = dispatch!.arg as DispatchInput;
    expect(body.agentDefinition).toBe('reviewer-on-main');
    expect(body.agentStack).toBeUndefined();
    expect(body.taskKind).toBe('review');
  });

  it('falls back to dispatch BY STACK when no matching definition exists', async () => {
    const snapshot = snapshotWith({
      stacks: { items: [stackItem('stk-cc', 'claude-code')] },
      definitions: { items: [] },
    });
    const { client, calls } = makeFakeClient();
    const orders = makeKradleOrders(client, noopOptions(snapshot));
    orders.createTask({ taskKind: 'implement' });
    await Promise.resolve();
    const body = calls.find((c) => c.method === 'dispatch')!.arg as DispatchInput;
    expect(body.agentStack).toBe('stk-cc');
    expect(body.agentDefinition).toBeUndefined();
  });

  it('resolveDispatchDefinition prefers an explicit ref, then a default-for label, else null', () => {
    const snap = snapshotWith({
      definitions: {
        items: [
          definitionItem('def-a', { personaRef: 'p', stackRef: 's' }),
          definitionItem('def-default', { personaRef: 'p', stackRef: 's' }, { [LABEL_DEFAULT_FOR]: 'fix' }),
        ],
      },
    });
    expect(resolveDispatchDefinition(snap, 'fix', 'def-a')).toBe('def-a');
    expect(resolveDispatchDefinition(snap, 'fix')).toBe('def-default');
    expect(resolveDispatchDefinition(snap, 'implement')).toBeNull();
  });

  it('applyDefinition POSTs an AgentDefinition body (org-stamped) via the CRD gateway', async () => {
    const { client, calls } = makeFakeClient();
    const name = await applyDefinition(client, {
      name: 'reviewer-on-main',
      spec: { personaRef: 'atlas-reviewer', stackRef: 'stk-cc', roleContext: 'Reviews PRs' },
    });
    expect(name).toBe('reviewer-on-main');
    const apply = calls.find((c) => c.method === 'applyResource')!.arg as ResourceApplyBody;
    expect(apply.kind).toBe('AgentDefinition');
    expect(apply.spec.organizationRef).toBe('acme');
    expect(apply.spec.personaRef).toBe('atlas-reviewer');
    expect(apply.spec.stackRef).toBe('stk-cc');
    expect(apply.spec.roleContext).toBe('Reviews PRs');
  });
});

// ===========================================================================
// AgentProcessTemplate — the REAL per-taskKind process phase pipeline persist
// ===========================================================================

describe('updateProcessTemplate → applyResource(AgentProcessTemplate)', () => {
  it('applyProcessTemplate POSTs an org-stamped AgentProcessTemplate body via the CRD gateway', async () => {
    const { client, calls } = makeFakeClient();
    const name = await applyProcessTemplate(client, {
      taskKind: 'diagnostic',
      phases: ['triage', 'investigate', 'fix', 'verify'],
      displayName: 'Diagnostic Flow',
    });
    expect(name).toBe('process-diagnostic');
    expect(name).toBe(processTemplateResourceName('diagnostic'));
    const apply = calls.find((c) => c.method === 'applyResource')!.arg as ResourceApplyBody;
    expect(apply.kind).toBe('AgentProcessTemplate');
    expect(apply.metadata.name).toBe('process-diagnostic');
    expect(apply.spec.organizationRef).toBe('acme');
    expect(apply.spec.taskKind).toBe('diagnostic');
    expect(apply.spec.phases).toEqual(['triage', 'investigate', 'fix', 'verify']);
    expect(apply.spec.displayName).toBe('Diagnostic Flow');
  });

  it('updateProcessTemplate verb applies the right body (org, taskKind, trimmed phases) and returns non-null', async () => {
    const { client, calls } = makeFakeClient();
    const orders = makeKradleOrders(client, noopOptions(null));
    const revision = orders.updateProcessTemplate('fix', ['reproduce', '  mend  ', 'verify']);
    expect(revision).not.toBeNull();
    await Promise.resolve();
    const apply = calls.find((c) => c.method === 'applyResource')!.arg as ResourceApplyBody;
    expect(apply.kind).toBe('AgentProcessTemplate');
    expect(apply.metadata.name).toBe('process-fix');
    expect(apply.spec.organizationRef).toBe('acme');
    expect(apply.spec.taskKind).toBe('fix');
    // Phases are trimmed and empties dropped before persisting.
    expect(apply.spec.phases).toEqual(['reproduce', 'mend', 'verify']);
  });

  it('updateProcessTemplate returns null and writes nothing when all phases are empty', () => {
    const { client, calls } = makeFakeClient();
    const orders = makeKradleOrders(client, noopOptions(null));
    expect(orders.updateProcessTemplate('fix', ['   ', ''])).toBeNull();
    expect(calls).toHaveLength(0);
  });
});

// ===========================================================================
// AC14 §3.3 — decide / answerInquiry plane routing
// ===========================================================================

describe('AC14 §3.3 — decide routing (approval vs gateway)', () => {
  it('AC14: decide on a pending AgentApproval → decideApproval (allow→approve)', async () => {
    const snapshot = snapshotWith({ approvals: { items: [approvalItem('appr-1', 'adr-1')], pending: [approvalItem('appr-1', 'adr-1')] } });
    const { client, calls } = makeFakeClient();
    const { orders: gateway, calls: gwCalls } = makeFakeGateway();
    const orders = makeKradleOrders(client, { ...noopOptions(snapshot), gatewayOrders: gateway });
    orders.decide('appr-1', 'allow');
    await Promise.resolve();
    expect(calls).toEqual([{ method: 'decideApproval', arg: 'appr-1', arg2: 'approve' }]);
    expect(gwCalls).toHaveLength(0); // did NOT fall through to the gateway
  });

  it('AC14: decide deny → decideApproval(deny)', async () => {
    const snapshot = snapshotWith({ approvals: { pending: [approvalItem('appr-1', 'adr-1')] } });
    const { client, calls } = makeFakeClient();
    const orders = makeKradleOrders(client, noopOptions(snapshot));
    orders.decide('appr-1', 'deny');
    await Promise.resolve();
    expect(calls[0].arg2).toBe('deny');
  });

  it('AC14: decide on an id NOT in pending approvals falls through to the gateway hook.decision', () => {
    const snapshot = snapshotWith({ approvals: { pending: [] } });
    const { client, calls } = makeFakeClient();
    const { orders: gateway, calls: gwCalls } = makeFakeGateway();
    const orders = makeKradleOrders(client, { ...noopOptions(snapshot), gatewayOrders: gateway });
    orders.decide('gw-hook-9', 'allow');
    expect(calls).toHaveLength(0); // no kradle call
    expect(gwCalls).toEqual([{ method: 'decide', arg: 'gw-hook-9', arg2: 'allow' }]);
  });

  it('AC14: decide with no gateway + unknown id warns once and does not throw', () => {
    const { client, calls } = makeFakeClient();
    const orders = makeKradleOrders(client, noopOptions(snapshotWith({ approvals: { pending: [] } })));
    expect(() => orders.decide('stale', 'deny')).not.toThrow();
    expect(calls).toHaveLength(0);
  });

  it('AC14: answerInquiry routes to the gateway (carrying optionId) when present + not an approval', () => {
    const snapshot = snapshotWith({ approvals: { pending: [] } });
    const { client } = makeFakeClient();
    const { orders: gateway, calls: gwCalls } = makeFakeGateway();
    const orders = makeKradleOrders(client, { ...noopOptions(snapshot), gatewayOrders: gateway });
    orders.answerInquiry('gw-hook', 'incremental');
    expect(gwCalls).toEqual([{ method: 'answerInquiry', arg: 'gw-hook', arg2: 'incremental' }]);
  });

  it('AC14: answerInquiry on a kradle approval maps the option heuristically (proceed→approve)', async () => {
    const snapshot = snapshotWith({ approvals: { pending: [approvalItem('appr-1', 'adr-1')] } });
    const { client, calls } = makeFakeClient();
    const orders = makeKradleOrders(client, noopOptions(snapshot));
    orders.answerInquiry('appr-1', 'proceed');
    await Promise.resolve();
    expect(calls).toEqual([{ method: 'decideApproval', arg: 'appr-1', arg2: 'approve' }]);
  });

  it('AC14: answerInquiry on a kradle approval with a non-proceed option → deny', async () => {
    const snapshot = snapshotWith({ approvals: { pending: [approvalItem('appr-1', 'adr-1')] } });
    const { client, calls } = makeFakeClient();
    const orders = makeKradleOrders(client, noopOptions(snapshot));
    orders.answerInquiry('appr-1', 'stand-down');
    await Promise.resolve();
    expect(calls[0].arg2).toBe('deny');
  });
});

// ===========================================================================
// AC14 §3 — abort (card vs agent)
// ===========================================================================

describe('AC14 §3 — abort routing (card→cancelRun, agent→gateway)', () => {
  it('AC14: abort on a known run/card → cancelRun', async () => {
    const snapshot = snapshotWith({ runs: { items: [runItem('adr-1', 'fix')] } });
    const { client, calls } = makeFakeClient();
    const orders = makeKradleOrders(client, noopOptions(snapshot));
    orders.abort(['adr-1']);
    await Promise.resolve();
    expect(calls).toEqual([{ method: 'cancelRun', arg: 'adr-1' }]);
  });

  it('AC14: abort on a non-run id (active agent) → gateway /abort when present', () => {
    const snapshot = snapshotWith({ runs: { items: [] } });
    const { client, calls } = makeFakeClient();
    const { orders: gateway, calls: gwCalls } = makeFakeGateway();
    const orders = makeKradleOrders(client, { ...noopOptions(snapshot), gatewayOrders: gateway });
    orders.abort(['sess-active']);
    expect(calls).toHaveLength(0);
    expect(gwCalls).toEqual([{ method: 'abort', arg: ['sess-active'] }]);
  });

  it('AC14: abort on a non-run id with no gateway warns once and does not throw', () => {
    const { client, calls } = makeFakeClient();
    const orders = makeKradleOrders(client, noopOptions(snapshotWith({ runs: { items: [] } })));
    expect(() => orders.abort(['sess-active'])).not.toThrow();
    expect(calls).toHaveLength(0);
  });
});

// ===========================================================================
// AC4 §3 — upsertStack (AgentStack via generic CRD gateway); roster REMOVED
// ===========================================================================

describe('AC4 §3 — upsertStack → applyResource; roster verbs are no-ops (AC3)', () => {
  function stackInput(name: string, stackRef?: string) {
    return {
      ...(stackRef !== undefined ? { stackRef } : {}),
      metadata: { name },
      spec: {
        baseAgent: 'claude-code',
        adapter: 'claude-code',
        model: 'claude-sonnet-4-5',
        prompt: { system: 'hi' },
        approvalMode: 'prompt',
      },
      status: { phase: 'ready' },
    };
  }

  it('AC4: upsertStack with no stackRef → applyResource(AgentStack), returns metadata.name', async () => {
    const { client, calls } = makeFakeClient();
    const orders = makeKradleOrders(client, noopOptions(null));
    const result = orders.upsertStack(stackInput('stk-new'));
    await Promise.resolve();
    expect(result).toBe('stk-new');
    expect(calls[0].method).toBe('applyResource');
    const body = calls[0].arg as ResourceApplyBody;
    expect(body.kind).toBe('AgentStack');
    expect(body.metadata.name).toBe('stk-new');
    expect(body.spec.adapter).toBe('claude-code');
  });

  it('AC4: upsertStack with a stackRef → applyResource named by the ref, returns the ref', async () => {
    const { client, calls } = makeFakeClient();
    const orders = makeKradleOrders(client, noopOptions(null));
    const result = orders.upsertStack(stackInput('stk-x', 'stk-existing'));
    await Promise.resolve();
    expect(result).toBe('stk-existing');
    expect(calls[0].method).toBe('applyResource');
    const body = calls[0].arg as ResourceApplyBody;
    expect(body.kind).toBe('AgentStack');
    expect(body.metadata.name).toBe('stk-existing'); // the ref names the resource
  });

  it('AC4/AC3: createRosterAgent is a no-op (returns null, no client call) — roster removed', () => {
    const { client, calls } = makeFakeClient();
    const orders = makeKradleOrders(client, noopOptions(null));
    expect(orders.createRosterAgent({ stackRef: 'stk-1', role: 'reviewer', name: 'Pendula' })).toBeNull();
    expect(calls).toHaveLength(0);
  });

  it('AC4/AC3: deleteRosterAgent is a no-op (no client call) — roster removed', () => {
    const { client, calls } = makeFakeClient();
    const orders = makeKradleOrders(client, noopOptions(null));
    expect(() => orders.deleteRosterAgent('ra-1')).not.toThrow();
    expect(calls).toHaveLength(0);
  });
});

// ===========================================================================
// createAgentIdentity → the full identity model (persona + soul + appearance +
// voice), mirroring kradle's agent-create wizard.
// ===========================================================================

describe('createAgentIdentity → applyResource(persona+soul+appearance+voice)', () => {
  it('applies the four linked identity CRDs with org-stamped specs and back-references', async () => {
    const { client, calls } = makeFakeClient();
    const orders = makeKradleOrders(client, noopOptions(null));
    const result = orders.createAgentIdentity({
      name: 'ada',
      displayName: 'Ada the Reviewer',
      roleTitle: 'Senior Reviewer',
      emoji: '🔍',
      soul: '# Ada\nMeticulous.',
      skillRefs: ['code-review'],
    });
    // applyAgentIdentity awaits four sequential applyResource calls — flush
    // enough microtasks for the whole chain to settle.
    for (let i = 0; i < 8; i += 1) await Promise.resolve();
    expect(result).toBe('ada');
    const applies = calls.filter((c) => c.method === 'applyResource').map((c) => c.arg as ResourceApplyBody);
    expect(applies.map((b) => b.kind)).toEqual([
      'AgentPersona',
      'AgentSoul',
      'AgentAppearance',
      'AgentVoiceProfile',
    ]);
    const persona = applies[0];
    expect(persona.metadata.name).toBe('ada');
    expect((persona.spec as Record<string, unknown>).organizationRef).toBe('acme');
    expect((persona.spec as Record<string, unknown>).displayName).toBe('Ada the Reviewer');
    expect((persona.spec as { soul: { ref: string } }).soul.ref).toBe('ada-soul');
    // soul/appearance/voice carry personaRef back to the persona name.
    expect((applies[1].spec as { personaRef: string }).personaRef).toBe('ada');
    expect((applies[2].spec as Record<string, unknown>).emoji).toBe('🔍');
    expect((applies[3].spec as { ttsProvider: string }).ttsProvider).toBe('openai');
  });
});

// ===========================================================================
// AC14 — documented no-op verbs: warn-once, type-appropriate empty, never throw
// ===========================================================================

describe('AC14 — documented-gap verbs are warn-once no-ops, never throw', () => {
  it('AC14: moveCard/setYolo/release/revertCard/rollbackCard/etc. return empties and do not call the client', () => {
    const { client, calls } = makeFakeClient();
    const orders = makeKradleOrders(client, noopOptions(null));
    expect(() => orders.moveCard('t', 'do')).not.toThrow();
    expect(() => orders.setYolo('t', true)).not.toThrow();
    expect(orders.release()).toBeNull();
    expect(() => orders.revertCard('t')).not.toThrow();
    expect(() => orders.rollbackCard('t')).not.toThrow();
    expect(orders.setSpeed(2)).toBe(false);
    expect(orders.updateTask('t', {})).toBe(false);
    expect(orders.updateProcessTemplate('fix', [])).toBeNull();
    expect(orders.writeFile('t', 'p', 'c')).toBe(false);
    expect(() => orders.assignTaskAgent('t', 'worker', null)).not.toThrow();
    expect(() => orders.assignTaskHuman('t', true)).not.toThrow();
    expect(() => orders.pauseUnits(['u'])).not.toThrow();
    expect(() => orders.resumeUnits(['u'])).not.toThrow();
    expect(() => orders.prioritize('t')).not.toThrow();
    expect(() => orders.toggleSim()).not.toThrow();
    expect(() => orders.focusInquiryCard('t')).not.toThrow();
    // None of these touched the kradle client.
    expect(calls).toHaveLength(0);
  });

  it('AC14: a no-op verb warns only ONCE across repeated calls', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { client } = makeFakeClient();
    const orders = makeKradleOrders(client, noopOptions(null));
    orders.moveCard('t', 'do');
    orders.moveCard('t', 'do');
    orders.moveCard('t', 'do');
    const moveWarnings = warn.mock.calls.filter((c) => String(c[0]).includes("'moveCard'"));
    expect(moveWarnings).toHaveLength(1);
  });
});
