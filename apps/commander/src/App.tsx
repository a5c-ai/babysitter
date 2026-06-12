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
import { createMockBackendFromSearch } from './backend/mock/mockBackend';
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
import type { KradleAgentStackInput } from './contracts/kradle-stack';
import type { TaskKind } from './backend/mock/scenario';
import {
  bindBackendToStore,
  COMMANDER_VERSION,
  createCommanderStore,
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

const backend = createMockBackendFromSearch(window.location.search);
const store = createCommanderStore();
const binding = bindBackendToStore(store, backend);

// SPEC §9 test hooks API — exposed before connect() so pause-on-boot wins the
// race against the first 250ms auto-tick.
window.__commander = {
  sim: {
    pause: () => {
      backend.sim.pause();
      store.getState().setPaused(true);
    },
    resume: () => {
      backend.sim.resume();
      store.getState().setPaused(false);
    },
    tick: (n: number) => {
      backend.sim.tick(n);
      binding.flush();
    },
    seed: backend.sim.seed,
    // §V4-4 pacing scalars — live getters over the sim (frozen-suite probes).
    get speed(): number {
      return backend.sim.speed;
    },
    get tickIntervalMs(): number {
      return backend.sim.tickIntervalMs;
    },
    moveCard: (taskId: string, column: string) => {
      binding.orders.moveCard(taskId, column as Parameters<typeof binding.orders.moveCard>[1]);
    },
    setYolo: (taskId: string, on: boolean) => {
      binding.orders.setYolo(taskId, on);
    },
    createTask: (input: { taskKind: string; title?: string; parentId?: string }) =>
      binding.orders.createTask(input as Parameters<typeof binding.orders.createTask>[0]),
    answerInquiry: (hookRequestId: string, optionId: string | null) => {
      binding.orders.answerInquiry(hookRequestId, optionId);
    },
    // --- SPEC-V4 verbs (route through Orders so the store flushes/mirrors) ---
    revertCard: (taskId: string) => {
      binding.orders.revertCard(taskId);
    },
    release: () => binding.orders.release(),
    rollbackCard: (taskId: string) => {
      binding.orders.rollbackCard(taskId);
    },
    setSpeed: (speed: number) => binding.orders.setSpeed(speed),
    updateTask: (taskId: string, patch: UpdateTaskPatch) =>
      binding.orders.updateTask(taskId, patch),
    upsertStack: (stack: KradleAgentStackInput) => binding.orders.upsertStack(stack),
    updateProcessTemplate: (kind: string, phases: string[]) => {
      const revision = backend.sim.updateProcessTemplate(kind as TaskKind, phases);
      binding.flush();
      return revision;
    },
    writeFile: (taskId: string, path: string, content: string) => {
      const ok = backend.sim.writeFile(taskId, path, content);
      binding.flush();
      return ok;
    },
    // --- SPEC-V4 read-only views ---------------------------------------------
    listStacks: () => backend.sim.listStacks(),
    listProcessTemplates: () => backend.sim.listProcessTemplates(),
    listRuns: () => backend.sim.listRuns(),
    getWorkspaceTree: (taskId: string) => backend.sim.getWorkspaceTree(taskId),
    getFileContent: (taskId: string, path: string) => backend.sim.getFileContent(taskId, path),
    getMemoryIO: (ref: string) => backend.sim.getMemoryIO(ref),
    getGitLog: (taskId: string) => backend.sim.getGitLog(taskId),
    // --- SPEC-V5 §V5-1 persistent-session views --------------------------------
    listSessions: (taskId?: string) => backend.sim.listSessions(taskId),
    getSession: (sessionId: string) => backend.sim.getSession(sessionId),
    listCardViews: () => backend.sim.listCardViews(),
    listWorkspaces: () => backend.sim.listWorkspaces(),
  },
  store,
  version: COMMANDER_VERSION,
};

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
  return <WarRoom store={store} orders={binding.orders} views={backend.sim} />;
}
