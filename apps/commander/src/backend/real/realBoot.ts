/**
 * Real-mode boot binding (SPEC-LIVE-BACKEND §7.2 + SPEC-KRADLE-CONTROLPLANE §4/§5/§6).
 *
 * Two real-mode shapes, selected by config:
 *
 *  1. **Gateway-only** (`config.kradleApiUrl` unset, or no config): EXACTLY as
 *     before — the gateway streams `run.event`/`hook.request` frames, coalesced
 *     into one `commitTick` per microtask burst with empty board arrays, and the
 *     `SimViews` surface is `realViewsStub` (all empty/null). Byte-identical to
 *     the prior gateway-only boot (AC15/AC18).
 *
 *  2. **Kradle-active** (`config.kradleApiUrl` set): additionally constructs a
 *     `KradleControllerClient` (§1) and a snapshot cache. The cache drives the
 *     real `SimViews` (§2) and feeds the board halves of `commitTick` (§6.2) on
 *     a 5000ms poll AND on every non-heartbeat SSE frame (debounced ≤500ms,
 *     §6.3). It composes additively with the gateway frame binding — neither
 *     producer writes the other's `commitTick` slice (§6.1). When a gateway is
 *     also present the two `Orders` merge per §3.3 (lifecycle→kradle,
 *     runtime→gateway). When NO gateway is present, kradle-only real mode runs
 *     the lifecycle verbs and leaves the runtime verbs as documented no-ops.
 *
 * `bindBackendToStore` (the load-bearing mock binding) is untouched — mock mode
 * stays byte-identical (AC15).
 */

import type { ServerFrame } from '../../contracts/gateway-protocol';
import type { GraphQueryResult } from '../../contracts/kradle-memory';
import type { BackendConfig } from '../config';
import type { CommanderBackend } from '../types';
import type {
  SimFileTreeNode,
  SimGitCommitView,
  SimMemoryIOView,
  SimProcessTemplateView,
  SimRosterAgentView,
  SimRunObservationView,
  SimRunView,
  SimSessionDetailView,
  SimSessionView,
  SimStackView,
  SimWorkspaceSummaryView,
  SimWorkspaceView,
  SimCardView,
} from '../mock/simulation';
import type { SimViews } from '../../game/views';
import type { BackendBinding, CommanderStore, Orders } from '../../game/store';
import {
  createKradleControllerClient,
  type KradleControllerClient,
  type KradleControllerSnapshot,
} from '../kradle/controllerClient';
import {
  mapMemoryIO,
  mapProcessTemplates,
  mapRunObservation,
  mapRuns,
  mapSessionDetail,
  mapSessions,
  mapStacks,
  mapToTickInput,
  mapWorkspaceView,
  mapWorkspaces,
} from '../kradle/mappers';
import { makeKradleOrders } from '../kradle/kradleOrders';

/**
 * Real-mode `SimViews`: every read returns the empty/null equivalent (§6). Used
 * for gateway-only real mode AND as the kradle fallback before the first
 * snapshot arrives.
 */
export const realViewsStub: SimViews = {
  getWorkspaceView(): SimWorkspaceView | null {
    return null;
  },
  getRunObservation(): SimRunObservationView | null {
    return null;
  },
  listStacks(): SimStackView[] {
    return [];
  },
  listRosterAgents(): SimRosterAgentView[] {
    return [];
  },
  listRuns(): SimRunView[] {
    return [];
  },
  listProcessTemplates(): SimProcessTemplateView[] {
    return [];
  },
  getMemoryIO(): SimMemoryIOView {
    return { read: [], written: [] };
  },
  getWorkspaceTree(): SimFileTreeNode | null {
    return null;
  },
  getFileContent(): string | null {
    return null;
  },
  getGitLog(): SimGitCommitView[] {
    return [];
  },
  listSessions(): SimSessionView[] {
    return [];
  },
  getSession(): SimSessionDetailView | null {
    return null;
  },
  listCardViews(): SimCardView[] {
    return [];
  },
  listWorkspaces(): SimWorkspaceSummaryView[] {
    return [];
  },
};

/**
 * Real-mode `Orders` (gateway-only): frame-bearing verbs ride real `ClientFrame`s
 * through the gateway; board / sim-local / editor / roster verbs are documented
 * v1 no-ops (§6/AC7) — type-appropriate empties.
 */
function makeRealOrders(backend: CommanderBackend, flush: () => void): Orders {
  return {
    abort(unitIds) {
      for (const unitId of unitIds) {
        backend.send({ type: 'session.message', sessionId: unitId, prompt: '/abort' });
      }
      flush();
    },
    steer(unitIds, prompt) {
      for (const unitId of unitIds) {
        backend.send({ type: 'session.message', sessionId: unitId, prompt });
      }
      flush();
    },
    decide(hookRequestId, decision) {
      backend.send({ type: 'hook.decision', hookRequestId, decision });
      flush();
    },
    answerInquiry(hookRequestId, optionId) {
      backend.send({
        type: 'hook.decision',
        hookRequestId,
        decision: 'allow',
        ...(optionId !== null ? { optionId } : {}),
      });
      flush();
    },
    // --- sim-local / board verbs: no v1 gateway frame (documented §6 gap) ----
    pauseUnits() {
      /* v1 gap: no gateway verb */
    },
    resumeUnits() {
      /* v1 gap: no gateway verb */
    },
    prioritize() {
      /* v1 gap: no gateway verb */
    },
    toggleSim() {
      /* v1 gap: no gateway verb */
    },
    moveCard() {
      /* v1 gap: no gateway verb */
    },
    setYolo() {
      /* v1 gap: no gateway verb */
    },
    createTask() {
      return null;
    },
    revertCard() {
      /* v1 gap: no gateway verb */
    },
    release() {
      return null;
    },
    rollbackCard() {
      /* v1 gap: no gateway verb */
    },
    setSpeed() {
      return false;
    },
    updateTask() {
      return false;
    },
    upsertStack() {
      return null;
    },
    updateProcessTemplate() {
      return null;
    },
    writeFile() {
      return false;
    },
    createRosterAgent() {
      return null;
    },
    deleteRosterAgent() {
      /* v1 gap: no gateway verb */
    },
    assignTaskAgent() {
      /* v1 gap: no gateway verb */
    },
    assignTaskHuman() {
      /* v1 gap: no gateway verb */
    },
    focusInquiryCard() {
      /* navigation is UI-local; no-op until real cards stream */
    },
  };
}

export interface RealBootBinding extends BackendBinding {
  /** The `SimViews` surface passed to `<WarRoom views=... />` in real mode. */
  views: SimViews;
}

// ---------------------------------------------------------------------------
// Kradle controller cache (§4.2): holds the latest snapshot and exposes the
// mapped `SimViews` (§2) computed live per read. Memory views are lazy: the
// first access fires a background query and returns empty until it lands; on
// arrival the cache triggers a refresh so the board re-renders (§2.6).
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 5000;
const REFRESH_DEBOUNCE_MS = 500;

interface KradleControllerCacheDeps {
  client: KradleControllerClient;
  /** Called after the snapshot swaps so the board re-renders (commitTick). */
  onSnapshot(snapshot: KradleControllerSnapshot): void;
  /** Wall clock (injectable for tests; production = `Date.now`). */
  now(): number;
  setTimer(fn: () => void, ms: number): ReturnType<typeof setTimeout>;
  clearTimer(handle: ReturnType<typeof setTimeout>): void;
}

class KradleControllerCache {
  private snapshot: KradleControllerSnapshot | null = null;
  private readonly deps: KradleControllerCacheDeps;
  private pollHandle: ReturnType<typeof setTimeout> | null = null;
  private debounceHandle: ReturnType<typeof setTimeout> | null = null;
  private streamUnsub: (() => void) | null = null;
  private disposed = false;
  private inFlight = false;
  /** Memory-query results cached per `ref` within the current snapshot gen (§2.6). */
  private readonly memoryIo = new Map<string, GraphQueryResult>();
  /** Refs whose memory query is already in flight (avoid duplicate fetches). */
  private readonly memoryInFlight = new Set<string>();

  constructor(deps: KradleControllerCacheDeps) {
    this.deps = deps;
  }

  getSnapshot(): KradleControllerSnapshot | null {
    return this.snapshot;
  }

  /** The live `SimViews` over the current snapshot (empty until first arrives). */
  views(): SimViews {
    return {
      getWorkspaceView: (taskId) =>
        this.snapshot ? mapWorkspaceView(this.snapshot, taskId) : null,
      getRunObservation: (taskId) =>
        this.snapshot ? mapRunObservation(this.snapshot, taskId) : null,
      listStacks: () => (this.snapshot ? mapStacks(this.snapshot) : []),
      // Roster removed from the model (SPEC §2.4/§5.2); the SimViews method is
      // kept returning empty until the UI phase drops it from the interface.
      listRosterAgents: () => [],
      listRuns: () => (this.snapshot ? mapRuns(this.snapshot) : []),
      listProcessTemplates: () => mapProcessTemplates(),
      getMemoryIO: (ref) => {
        if (!this.snapshot) return { read: [], written: [] };
        const cached = this.memoryIo.get(ref);
        if (cached === undefined) this.fetchMemory(ref);
        return mapMemoryIO(this.snapshot, ref, cached);
      },
      getWorkspaceTree: () => null,
      getFileContent: () => null,
      getGitLog: () => [],
      listSessions: (taskId) => (this.snapshot ? mapSessions(this.snapshot, taskId) : []),
      getSession: (sessionId) =>
        this.snapshot ? mapSessionDetail(this.snapshot, sessionId) : null,
      listCardViews: () => (this.snapshot ? mapToTickInput(this.snapshot, this.deps.now()).cards : []),
      listWorkspaces: () => (this.snapshot ? mapWorkspaces(this.snapshot) : []),
    };
  }

  start(): void {
    // Immediate boot fetch (§6.3).
    this.refresh();
    // Interval poll — the floor of liveness (§6.3 / AC17).
    this.pollHandle = this.deps.setTimer(() => this.tickPoll(), POLL_INTERVAL_MS);
    // SSE: every non-heartbeat frame schedules a debounced refresh (§6.3).
    this.streamUnsub = this.deps.client.openEventStream(() => this.scheduleRefresh());
  }

  /** Public: schedule a debounced refresh (used by the Orders write path, §6.3). */
  scheduleRefresh(): void {
    if (this.disposed) return;
    if (this.debounceHandle !== null) return;
    this.debounceHandle = this.deps.setTimer(() => {
      this.debounceHandle = null;
      this.refresh();
    }, REFRESH_DEBOUNCE_MS);
  }

  private tickPoll(): void {
    if (this.disposed) return;
    this.refresh();
    this.pollHandle = this.deps.setTimer(() => this.tickPoll(), POLL_INTERVAL_MS);
  }

  private refresh(): void {
    if (this.disposed || this.inFlight) return;
    this.inFlight = true;
    this.deps.client.snapshot().then(
      (snapshot) => {
        this.inFlight = false;
        if (this.disposed) return;
        this.snapshot = snapshot;
        // A new snapshot generation invalidates the lazy memory cache (§2.6).
        this.memoryIo.clear();
        this.memoryInFlight.clear();
        this.deps.onSnapshot(snapshot);
      },
      (error: unknown) => {
        this.inFlight = false;
        // Snapshot-poll failure: keep the last good snapshot, retry next interval
        // (AC9). Surfaced once via console; never throws.
        // eslint-disable-next-line no-console -- non-fatal poll failure (stale-OK)
        console.warn('KradleControllerCache: snapshot refresh failed', error);
      },
    );
  }

  private fetchMemory(ref: string): void {
    if (this.disposed || this.memoryInFlight.has(ref)) return;
    this.memoryInFlight.add(ref);
    this.deps.client
      .queryMemory({
        snapshotRef: ref,
        requester: { kind: 'commander', name: 'board' },
        query: { text: '', modes: ['graph-only'] },
      })
      .then(
        (result) => {
          this.memoryInFlight.delete(ref);
          if (this.disposed) return;
          this.memoryIo.set(ref, result);
          // Re-render so the freshly-loaded memory I/O shows (§2.6).
          if (this.snapshot) this.deps.onSnapshot(this.snapshot);
        },
        () => {
          this.memoryInFlight.delete(ref);
          // Memory endpoint unavailable → stays empty, never throws (AC13).
        },
      );
  }

  dispose(): void {
    this.disposed = true;
    if (this.pollHandle !== null) this.deps.clearTimer(this.pollHandle);
    if (this.debounceHandle !== null) this.deps.clearTimer(this.debounceHandle);
    if (this.streamUnsub !== null) this.streamUnsub();
    this.pollHandle = null;
    this.debounceHandle = null;
    this.streamUnsub = null;
  }
}

// ---------------------------------------------------------------------------
// Injectable boot deps (test seam — mirrors `RealBackendDeps`). Production
// defaults are the ambient browser timers + `Date.now`.
// ---------------------------------------------------------------------------

export interface BootRealDeps {
  /** Override the kradle client construction (tests inject a fake). */
  createClient?(config: BackendConfig): KradleControllerClient;
  now?(): number;
  setTimer?(fn: () => void, ms: number): ReturnType<typeof setTimeout>;
  clearTimer?(handle: ReturnType<typeof setTimeout>): void;
}

/**
 * Bind a live `CommanderBackend` to the store (§7.2 + §4.2). The gateway frame
 * half is preserved verbatim; when `config.kradleApiUrl` is set, the kradle
 * snapshot cache is additionally constructed and composed (§5/§6).
 */
export function bootReal(
  store: CommanderStore,
  backend: CommanderBackend,
  config?: BackendConfig,
  deps: BootRealDeps = {},
): RealBootBinding {
  let pending: ServerFrame[] = [];
  let scheduled = false;
  let disposed = false;
  let tickIndex = 0;

  const now = deps.now ?? (() => Date.now());
  const setTimer = deps.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const clearTimer = deps.clearTimer ?? ((handle) => clearTimeout(handle));

  // --- gateway frame half (owns `frames`; board arrays empty, §6.1) ----------
  const flush = (): void => {
    if (disposed) return;
    if (pending.length === 0) return;
    const frames = pending;
    pending = [];
    tickIndex += 1;
    store.getState().commitTick({
      frames,
      units: [],
      tasks: [],
      hooks: [],
      cards: [],
      agents: [],
      inquiries: [],
      runStages: {},
      rosterAgents: [],
      nowMs: now(),
      tickIndex,
      paused: false,
    });
  };

  const unsubscribe = backend.onFrame((frame) => {
    pending.push(frame);
    if (!scheduled) {
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        flush();
      });
    }
  });

  const gatewayOrders = makeRealOrders(backend, flush);

  // --- kradle half (only when configured, §4.2/AC18) -------------------------
  const kradleEnabled = config?.kradleApiUrl !== undefined && config.kradleApiUrl !== '';
  if (!kradleEnabled) {
    // Gateway-only real mode: unchanged behavior (AC15/AC18).
    return {
      flush,
      orders: gatewayOrders,
      views: realViewsStub,
      dispose() {
        disposed = true;
        unsubscribe();
      },
    };
  }

  const client =
    deps.createClient !== undefined
      ? deps.createClient(config!)
      : createKradleControllerClient({
          kradleApiUrl: config!.kradleApiUrl!,
          ...(config!.kradleToken !== undefined ? { kradleToken: config!.kradleToken } : {}),
          ...(config!.kradleOrg !== undefined ? { kradleOrg: config!.kradleOrg } : {}),
          ...(config!.kradleRepo !== undefined ? { kradleRepo: config!.kradleRepo } : {}),
        });

  // The kradle producer feeds the board halves of `commitTick` (frames empty).
  const commitKradleTick = (snapshot: KradleControllerSnapshot): void => {
    if (disposed) return;
    const nowMs = now();
    const tickInput = mapToTickInput(snapshot, nowMs);
    tickIndex += 1;
    store.getState().commitTick({
      frames: [],
      units: tickInput.units,
      tasks: tickInput.tasks,
      hooks: tickInput.hooks,
      cards: tickInput.cards,
      agents: tickInput.agents,
      inquiries: tickInput.inquiries,
      runStages: tickInput.runStages,
      // Roster removed (SPEC §2.4/§5.2); kradle never writes a roster slice.
      rosterAgents: [],
      nowMs,
      tickIndex,
      paused: false,
    });
  };

  const cache = new KradleControllerCache({
    client,
    onSnapshot: commitKradleTick,
    now,
    setTimer,
    clearTimer,
  });

  // Compose Orders: lifecycle verbs → kradle; runtime verbs → gateway (§3.3).
  // A gateway backend is present iff the live config carries a gateway URL.
  const hasGateway = config!.gatewayUrl !== undefined && config!.gatewayUrl !== '';
  const orders = makeKradleOrders(client, {
    repo: config!.kradleRepo ?? 'default',
    getSnapshot: () => cache.getSnapshot(),
    scheduleRefresh: () => cache.scheduleRefresh(),
    ...(hasGateway ? { gatewayOrders } : {}),
  });

  cache.start();

  return {
    flush,
    orders,
    views: cache.views(),
    dispose() {
      disposed = true;
      unsubscribe();
      cache.dispose();
    },
  };
}
