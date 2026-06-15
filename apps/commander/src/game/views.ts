/**
 * Read-only sim view access for the panel surfaces (SPEC-V2 §V2-5/§V2-7,
 * SPEC-V3 §V3-4, SPEC-V4 §V4-6/§V4-9, SPEC-V5 §V5-1): the Inspector Process/
 * Workspace/Memory/Sessions tabs, the Human Review panel, the Runs overlay
 * and the Registry read workspace + run-observation + runs-registry +
 * memory-I/O + session views straight from the sim on every render;
 * re-renders are driven by the per-tick store commit (`meta.tickIndex`), so
 * reads stay deterministic per seed + verb sequence.
 */

import type {
  SimCardView,
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
} from '../backend/mock/simulation';

export interface SimViews {
  getWorkspaceView(taskId: string): SimWorkspaceView | null;
  getRunObservation(taskId: string): SimRunObservationView | null;
  /** §V4-5 agent-stack roster (4 seeded + custom foundry-forged stacks). */
  listStacks(): SimStackView[];
  /** Operator roster agents (named workers/reviewers assignable to tasks). */
  listRosterAgents(): SimRosterAgentView[];
  /** §V4-6 runs registry: every card attempt, newest first. */
  listRuns(): SimRunView[];
  /** §V4-6 per-taskKind phase pipeline templates (`commander/<kind>@vN`). */
  listProcessTemplates(): SimProcessTemplateView[];
  /** §V4-9 read/written memory ledgers for an agent unitId OR card taskId. */
  getMemoryIO(ref: string): SimMemoryIOView;
  /** §V4-8 deterministic nested workspace file tree (terminal `ls` + IDE). */
  getWorkspaceTree(taskId: string): SimFileTreeNode | null;
  /** §V4-8 deterministic file content (diff hunks applied; writeFile wins). */
  getFileContent(taskId: string, path: string): string | null;
  /** §V4-7 journal-derived commit ledger (terminal `git log`). */
  getGitLog(taskId: string): SimGitCommitView[];
  /** §V5-1 persistent sessions: all (or one card's), newest first. */
  listSessions(taskId?: string): SimSessionView[];
  /** §V5-1 one persisted session: record + transcript (survives despawn). */
  getSession(sessionId: string): SimSessionDetailView | null;
  /** §V5-3 Registry tasks tab: every card (board view, all columns). */
  listCardViews(): SimCardView[];
  /** §V5-3 Registry workspaces tab: per-workspace git/card/session summary. */
  listWorkspaces(): SimWorkspaceSummaryView[];
}
