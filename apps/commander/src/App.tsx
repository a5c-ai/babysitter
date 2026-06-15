/**
 * A5C Commander — root application shell.
 *
 * Boot path (SPEC §7/§9, sim-phase handoff conventions):
 *   1. `createMockBackendFromSearch(window.location.search)` — parses ?seed=
 *      (default 42).
 *   2. A single Zustand store is bound to the backend: frames + sim views
 *      flow into ONE store commit per tick batch.
 *   3. `window.__commander = { sim: { pause, resume, tick, seed }, store,
 *      version }` is exposed BEFORE `connect()` so the e2e pause-on-boot
 *      poller halts the sim before the first auto-tick (deterministic boots).
 *   4. `connect()` emits the hello frame and starts the 250ms auto-tick.
 *
 * Module-scope singleton: React StrictMode double-mounting must not spawn a
 * second backend/interval.
 */

import { WarRoom } from './components/WarRoom';
import { MockBackend } from './backend/mock/mockBackend';
import { createBackend } from './backend/factory';
import { resolveBackendConfig } from './backend/config';
import { bootReal } from './backend/real/realBoot';
import type {
  SimCardView,
  SimFileTreeNode,
  SimGitCommitView,
  SimMemoryIOView,
  SimProcessTemplateView,
  SimRunView,
  SimSessionDetailView,
  SimSessionView,
  SimStackView,
  SimWorkspaceSummaryView,
  UpdateTaskPatch,
} from './backend/mock/simulation';
import type { SimViews } from './game/views';
import type { KradleAgentStackInput } from './contracts/kradle-stack';
import type { TaskKind } from './backend/mock/scenario';
import {
  bindBackendToStore,
  COMMANDER_VERSION,
  createCommanderStore,
  type BackendBinding,
  type CommanderStore,
} from './game/store';

interface CommanderTestApi {
  sim: {
    pause(): void;
    resume(): void;
    tick(n: number): void;
    seed: number;
    /** SPEC-V4 §V4-4 pacing scalars (read-only mirrors of the sim). */
    readonly speed: number;
    readonly tickIntervalMs: number;
    /** SPEC-V3 §V3-7 board verbs on the test-hooks API (deterministic setup). */
    moveCard(taskId: string, column: string): void;
    setYolo(taskId: string, on: boolean): void;
    createTask(input: { taskKind: string; title?: string; parentId?: string }): string | null;
    answerInquiry(hookRequestId: string, optionId: string | null): void;
    /** SPEC-V4 §V4-1/§V4-4/§V4-5/§V4-6/§V4-11 verbs (deterministic, journaled). */
    revertCard(taskId: string): void;
    release(): string | null;
    rollbackCard(taskId: string): void;
    setSpeed(speed: number): boolean;
    updateTask(taskId: string, patch: UpdateTaskPatch): boolean;
    upsertStack(stack: KradleAgentStackInput): string | null;
    updateProcessTemplate(kind: string, phases: string[]): number | null;
    writeFile(taskId: string, path: string, content: string): boolean;
    /** SPEC-V4 §V4-5/§V4-6/§V4-8/§V4-9 read-only views. */
    listStacks(): SimStackView[];
    listProcessTemplates(): SimProcessTemplateView[];
    listRuns(): SimRunView[];
    getWorkspaceTree(taskId: string): SimFileTreeNode | null;
    getFileContent(taskId: string, path: string): string | null;
    getMemoryIO(ref: string): SimMemoryIOView;
    getGitLog(taskId: string): SimGitCommitView[];
    /** SPEC-V5 §V5-1 persistent-session views. */
    listSessions(taskId?: string): SimSessionView[];
    getSession(sessionId: string): SimSessionDetailView | null;
    /** Established card-view probe (frozen v5 helpers use it for staging). */
    listCardViews(): SimCardView[];
    /** SPEC-V5 §V5-3 Registry workspaces summary view. */
    listWorkspaces(): SimWorkspaceSummaryView[];
  };
  store: CommanderStore;
  version: string;
}

declare global {
  interface Window {
    __commander?: CommanderTestApi;
  }
}

// SPEC-LIVE-BACKEND §7.1: the sole runtime-construction edit. The mock branch
// returns today's `MockBackend`; the real branch returns `RealBackend`. Mock is
// the default (and the fail-safe for a misconfigured real config).
const config = resolveBackendConfig(import.meta.env, window.location.search);
const backend = createBackend(config);
const store = createCommanderStore();

// §7.2 boot gating: the full sim-coupled binding + `views={backend.sim}` path
// runs ONLY for the mock; real mode wires the frame-only binding (`bootReal`)
// and a `SimViews` stub. Mock mode is byte-identical to before.
let binding: BackendBinding;
let views: SimViews;

if (backend instanceof MockBackend) {
  const mockBackend = backend;
  const mockBinding = bindBackendToStore(store, mockBackend);
  binding = mockBinding;
  views = mockBackend.sim;

  // SPEC §9 test hooks API — exposed before connect() so pause-on-boot wins the
  // race against the first 250ms auto-tick.
  window.__commander = {
    sim: {
      pause: () => {
        mockBackend.sim.pause();
        store.getState().setPaused(true);
      },
      resume: () => {
        mockBackend.sim.resume();
        store.getState().setPaused(false);
      },
      tick: (n: number) => {
        mockBackend.sim.tick(n);
        mockBinding.flush();
      },
      seed: mockBackend.sim.seed,
      // §V4-4 pacing scalars — live getters over the sim (frozen-suite probes).
      get speed(): number {
        return mockBackend.sim.speed;
      },
      get tickIntervalMs(): number {
        return mockBackend.sim.tickIntervalMs;
      },
      moveCard: (taskId: string, column: string) => {
        mockBinding.orders.moveCard(
          taskId,
          column as Parameters<typeof mockBinding.orders.moveCard>[1],
        );
      },
      setYolo: (taskId: string, on: boolean) => {
        mockBinding.orders.setYolo(taskId, on);
      },
      createTask: (input: { taskKind: string; title?: string; parentId?: string }) =>
        mockBinding.orders.createTask(
          input as Parameters<typeof mockBinding.orders.createTask>[0],
        ),
      answerInquiry: (hookRequestId: string, optionId: string | null) => {
        mockBinding.orders.answerInquiry(hookRequestId, optionId);
      },
      // --- SPEC-V4 verbs (route through Orders so the store flushes/mirrors) ---
      revertCard: (taskId: string) => {
        mockBinding.orders.revertCard(taskId);
      },
      release: () => mockBinding.orders.release(),
      rollbackCard: (taskId: string) => {
        mockBinding.orders.rollbackCard(taskId);
      },
      setSpeed: (speed: number) => mockBinding.orders.setSpeed(speed),
      updateTask: (taskId: string, patch: UpdateTaskPatch) =>
        mockBinding.orders.updateTask(taskId, patch),
      upsertStack: (stack: KradleAgentStackInput) => mockBinding.orders.upsertStack(stack),
      updateProcessTemplate: (kind: string, phases: string[]) => {
        const revision = mockBackend.sim.updateProcessTemplate(kind as TaskKind, phases);
        mockBinding.flush();
        return revision;
      },
      writeFile: (taskId: string, path: string, content: string) => {
        const ok = mockBackend.sim.writeFile(taskId, path, content);
        mockBinding.flush();
        return ok;
      },
      // --- SPEC-V4 read-only views ---------------------------------------------
      listStacks: () => mockBackend.sim.listStacks(),
      listProcessTemplates: () => mockBackend.sim.listProcessTemplates(),
      listRuns: () => mockBackend.sim.listRuns(),
      getWorkspaceTree: (taskId: string) => mockBackend.sim.getWorkspaceTree(taskId),
      getFileContent: (taskId: string, path: string) =>
        mockBackend.sim.getFileContent(taskId, path),
      getMemoryIO: (ref: string) => mockBackend.sim.getMemoryIO(ref),
      getGitLog: (taskId: string) => mockBackend.sim.getGitLog(taskId),
      // --- SPEC-V5 §V5-1 persistent-session views --------------------------------
      listSessions: (taskId?: string) => mockBackend.sim.listSessions(taskId),
      getSession: (sessionId: string) => mockBackend.sim.getSession(sessionId),
      listCardViews: () => mockBackend.sim.listCardViews(),
      listWorkspaces: () => mockBackend.sim.listWorkspaces(),
    },
    store,
    version: COMMANDER_VERSION,
  };
} else {
  // Real mode (§7.2 + SPEC-KRADLE-CONTROLPLANE §4.3): the resolved config is
  // passed so `bootReal` can see `kradleApiUrl` and construct the kradle snapshot
  // cache (board/stack/run/session/workspace/memory reads + lifecycle Orders)
  // when set; absent it, this is the unchanged gateway-only frame binding.
  const realBinding = bootReal(store, backend, config);
  binding = realBinding;
  views = realBinding.views;
}

backend.connect().catch((error: unknown) => {
  // eslint-disable-next-line no-console -- boot failure is terminal
  console.error('A5C Commander: backend failed to connect', error);
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    binding.dispose();
    backend.disconnect();
    delete window.__commander;
  });
}

export default function App(): React.JSX.Element {
  return <WarRoom store={store} orders={binding.orders} views={views} />;
}
