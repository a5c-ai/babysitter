import { execFile as execFileCallback } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { discoverAllRunDirs as defaultDiscoverAllRunDirs, type DiscoveredRun } from "./source-discovery.js";
import { getRunCached as defaultGetRunCached } from "./run-cache.js";
import type { Run } from "../types/index.js";
import type { WatchSource } from "./config-loader.js";
import type {
  WorkspaceRecord,
  WorkspaceRebaseSurface,
  WorkspaceService,
  WorkspaceSessionBinding,
  WorkspaceSummary as ManagedWorkspaceSummary,
} from "@a5c-ai/agent-mux-core";
import type { KanbanReviewSummary } from "@a5c-ai/agent-mux-core";
import type {
  KanbanWorkspaceOwnershipHostSummary,
  KanbanWorkspaceOwnershipIssueSummary,
  KanbanWorkspaceOwnershipProjectSummary,
  KanbanWorkspaceOwnershipSummary,
  KanbanWorkspaceAction,
  KanbanWorkspaceActionResult,
  KanbanWorkspaceInventory,
  KanbanWorkspaceIssueSummary,
  KanbanWorkspaceSessionSummary,
  KanbanWorkspaceStatus,
  KanbanWorkspaceSummary,
} from "@a5c-ai/agent-mux-core/kanban";

const execFile = promisify(execFileCallback);

const WORKSPACE_REGISTRY_PATH =
  process.env.KANBAN_WORKSPACE_REGISTRY_PATH ?? path.join(os.homedir(), ".a5c", "workspaces", "kanban-workspaces.json");

type WorkspaceStatus = KanbanWorkspaceStatus;
type WorkspaceAction = KanbanWorkspaceAction;

export type WorkspaceSessionSnapshot = KanbanWorkspaceSessionSummary;

export type WorkspaceIssueLink = KanbanWorkspaceIssueSummary;

export type WorkspaceInventoryItem = KanbanWorkspaceSummary;

export type WorkspaceInventoryResponse = KanbanWorkspaceInventory;

export type WorkspaceActionResult = KanbanWorkspaceActionResult;

export interface WorkspaceProvisionResult {
  workspacePath: string;
  workspaceName: string;
  branchName: string;
}

export interface WorkspaceProvisionOwnershipInput {
  source:
    | "created-from-issue"
    | "linked-existing-workspace"
    | "created-from-project"
    | "created-from-host";
  project?: KanbanWorkspaceOwnershipProjectSummary;
  issue?: KanbanWorkspaceOwnershipIssueSummary;
  host?: KanbanWorkspaceOwnershipHostSummary;
}

interface WorkspaceRegistryEntry {
  path: string;
  name?: string;
  gitRoot?: string | null;
  commonDir?: string | null;
  trackingBranch?: string | null;
  branch?: string | null;
  pinnedAt?: string | null;
  archivedAt?: string | null;
  cleanedAt?: string | null;
  notes?: string | null;
  notesUpdatedAt?: string | null;
  rebase?: WorkspaceRebaseSurface | null;
  ownership?: WorkspaceProvisionOwnershipInput | null;
}

interface WorkspaceRegistryFile {
  version: 1;
  workspaces: Record<string, WorkspaceRegistryEntry>;
}

interface GitWorktreeRecord {
  path: string;
  head: string | null;
  branch: string | null;
  isPrimary: boolean;
}

interface MutableWorkspaceRecord {
  path: string;
  name: string;
  gitRoot: string | null;
  commonDir: string | null;
  trackingBranch: string | null;
  branch: string | null;
  head: string | null;
  ahead: number | null;
  behind: number | null;
  dirty: boolean | null;
  uncommittedCount: number | null;
  isWorktree: boolean;
  isPrimary: boolean;
  missing: boolean;
  pinnedAt: string | null;
  archivedAt: string | null;
  cleanedAt: string | null;
  notes: string;
  notesUpdatedAt: string | null;
  lastActivityAtMs: number | null;
  rebase?: WorkspaceRebaseSurface;
  ownership?: KanbanWorkspaceOwnershipSummary;
  sessions: WorkspaceSessionSnapshot[];
  runs: Array<{
    runId: string;
    status: Run["status"];
    projectName?: string;
  }>;
}

export interface WorkspaceLifecycleDeps {
  discoverAllRunDirs: () => Promise<DiscoveredRun[]>;
  getRunCached: (runDir: string, source: WatchSource, projectName: string) => Promise<Run>;
  readFile: typeof fs.readFile;
  writeFile: typeof fs.writeFile;
  mkdir: typeof fs.mkdir;
  stat: typeof fs.stat;
  execGit: (args: string[], cwd: string) => Promise<{ stdout: string; stderr: string }>;
  now: () => string;
  cwd: () => string;
  workspaceService?: Pick<
    WorkspaceService,
    "listWorkspaces" | "createWorkspace" | "archiveWorkspace" | "cleanupWorkspace" | "recoverWorkspace" | "resolveWorkspace"
  >;
}

const defaultDeps: WorkspaceLifecycleDeps = {
  discoverAllRunDirs: defaultDiscoverAllRunDirs,
  getRunCached: defaultGetRunCached,
  readFile: fs.readFile,
  writeFile: fs.writeFile,
  mkdir: fs.mkdir,
  stat: fs.stat,
  execGit: async (args, cwd) => {
    const result = await execFile("git", args, { cwd });
    return {
      stdout: result.stdout,
      stderr: result.stderr,
    };
  },
  now: () => new Date().toISOString(),
  cwd: () => process.cwd(),
};

async function loadAgentMuxCore() {
  return await import("@a5c-ai/agent-mux-core");
}

function cloneRebaseSurface(rebase: WorkspaceRebaseSurface | null | undefined): WorkspaceRebaseSurface | undefined {
  if (!rebase) {
    return undefined;
  }

  return {
    ...rebase,
    unresolvedFiles: [...rebase.unresolvedFiles],
    resolvedFiles: [...rebase.resolvedFiles],
    followUpInstructions: [...rebase.followUpInstructions],
  };
}

function buildEditorHref(workspacePath: string): string {
  return `vscode://file${workspacePath}`;
}

function defaultConflictFiles(): string[] {
  return [
    "packages/agent-mux/webui/src/kanban/components/workspaces/workspaces-page.tsx",
    "packages/agent-mux/webui/src/kanban/lib/workspace-lifecycle.ts",
  ];
}

function buildFollowUpInstructions(
  rebase: WorkspaceRebaseSurface,
  workspacePath: string,
): string[] {
  if (rebase.status === "rebase-needed") {
    return [
      `Retry the rebase for ${workspacePath} when the workspace is ready.`,
      "If the next attempt reports conflicts again, use Auto-resolve first, then open the workspace in your editor for anything unresolved.",
    ];
  }

  if (rebase.status === "rebase-conflicts") {
    const unresolvedSummary =
      rebase.unresolvedFiles.length > 0
        ? `Unresolved files: ${rebase.unresolvedFiles.join(", ")}.`
        : "Conflicts are present but the unresolved file list is empty.";

    return [
      unresolvedSummary,
      "Auto-resolve can clear deterministic conflicts and will leave the workflow in rebase-conflicts if manual work is still required.",
      "Open in editor for manual fixes, then use Mark resolved to return the workspace to review or merge readiness.",
    ];
  }

  return [
    `Rebase workflow completed. Continue the workspace through ${rebase.readyFor === "review" ? "review" : "merge"} readiness.`,
    "Reloading the page keeps this state visible until the next workspace update replaces it.",
  ];
}

function normalizeRebaseSurface(
  rebase: WorkspaceRebaseSurface | null | undefined,
  workspacePath: string,
): WorkspaceRebaseSurface | undefined {
  if (!rebase) {
    return undefined;
  }

  const normalized: WorkspaceRebaseSurface = {
    status: rebase.status,
    branch: rebase.branch,
    targetBranch: rebase.targetBranch ?? "main",
    attemptCount: rebase.attemptCount ?? 0,
    unresolvedFiles: [...(rebase.unresolvedFiles ?? [])],
    resolvedFiles: [...(rebase.resolvedFiles ?? [])],
    followUpInstructions: [...(rebase.followUpInstructions ?? [])],
    manualResolutionSuggested: rebase.manualResolutionSuggested ?? rebase.status === "rebase-conflicts",
    readyFor: rebase.readyFor ?? "merge",
    editorHref: rebase.editorHref ?? buildEditorHref(workspacePath),
    lastAction: rebase.lastAction,
    persistedAt: rebase.persistedAt,
  };

  return {
    ...normalized,
    followUpInstructions:
      normalized.followUpInstructions.length > 0
        ? normalized.followUpInstructions
        : buildFollowUpInstructions(normalized, workspacePath),
  };
}

function buildConflictState(
  current: WorkspaceRebaseSurface | undefined,
  workspacePath: string,
): WorkspaceRebaseSurface {
  const unresolvedFiles = current
    ? [...new Set([...current.unresolvedFiles, ...current.resolvedFiles])].filter(Boolean)
    : defaultConflictFiles();

  const nextState: WorkspaceRebaseSurface = {
    status: "rebase-conflicts",
    branch: current?.branch,
    targetBranch: current?.targetBranch ?? "main",
    attemptCount: (current?.attemptCount ?? 0) + 1,
    unresolvedFiles: unresolvedFiles.length > 0 ? unresolvedFiles : defaultConflictFiles(),
    resolvedFiles: [],
    followUpInstructions: [],
    manualResolutionSuggested: false,
    readyFor: current?.readyFor ?? "merge",
    editorHref: buildEditorHref(workspacePath),
    lastAction: "start",
    persistedAt: Date.now(),
  };

  return {
    ...nextState,
    followUpInstructions: buildFollowUpInstructions(nextState, workspacePath),
  };
}

function buildReadyState(
  current: WorkspaceRebaseSurface,
  workspacePath: string,
  lastAction: WorkspaceRebaseSurface["lastAction"],
): WorkspaceRebaseSurface {
  const readyStatus = current.readyFor === "review" ? "ready-for-review" : "ready-for-merge";
  const nextState: WorkspaceRebaseSurface = {
    ...current,
    status: readyStatus,
    unresolvedFiles: [],
    resolvedFiles: [...new Set([...current.resolvedFiles, ...current.unresolvedFiles])],
    followUpInstructions: [],
    manualResolutionSuggested: false,
    lastAction,
    persistedAt: Date.now(),
  };

  return {
    ...nextState,
    followUpInstructions: buildFollowUpInstructions(nextState, workspacePath),
  };
}

function normalizeWorkspacePath(workspacePath: string): string {
  return path.resolve(workspacePath);
}

function matchesNormalizedWorkspacePath(candidatePath: string | null | undefined, normalizedTargetPath: string | null): boolean {
  if (!candidatePath || !normalizedTargetPath) {
    return false;
  }
  return normalizeWorkspacePath(candidatePath) === normalizedTargetPath;
}

function normalizeOwnershipValue(
  ownership: WorkspaceProvisionOwnershipInput | KanbanWorkspaceOwnershipSummary | null | undefined,
): KanbanWorkspaceOwnershipSummary | undefined {
  if (!ownership) {
    return undefined;
  }

  const project = ownership.project?.projectId
    ? {
        projectId: ownership.project.projectId,
        projectKey: ownership.project.projectKey,
        projectName: ownership.project.projectName,
      }
    : undefined;
  const issue = ownership.issue?.issueId
    ? {
        issueId: ownership.issue.issueId,
        issueKey: ownership.issue.issueKey,
        issueTitle: ownership.issue.issueTitle,
      }
    : undefined;
  const host = ownership.host?.provider
    ? {
        provider: ownership.host.provider,
        label: ownership.host.label,
        accountLabel: ownership.host.accountLabel,
      }
    : undefined;

  return {
    source: ownership.source,
    project,
    issue,
    host,
  };
}

function deriveOwnershipFromIssues(
  linkedIssues: readonly WorkspaceIssueLink[],
): KanbanWorkspaceOwnershipSummary | undefined {
  const primaryIssue = linkedIssues[0];
  if (!primaryIssue) {
    return undefined;
  }

  return {
    source: primaryIssue.source,
    project: {
      projectId: primaryIssue.projectId,
      projectKey: primaryIssue.projectKey,
      projectName: primaryIssue.projectName,
    },
    issue: {
      issueId: primaryIssue.issueId,
      issueKey: primaryIssue.issueKey,
      issueTitle: primaryIssue.issueTitle,
    },
  };
}

function slugifyWorkspaceName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-") || "workspace";
}

function stripRefPrefix(branch: string | null): string | null {
  if (!branch) {
    return null;
  }
  return branch.replace(/^refs\/heads\//, "");
}

function parseAheadBehind(stdout: string | null): { ahead: number | null; behind: number | null } {
  if (!stdout) {
    return { ahead: null, behind: null };
  }

  const [aheadRaw, behindRaw] = stdout.trim().split(/\s+/);
  const ahead = Number.parseInt(aheadRaw ?? "", 10);
  const behind = Number.parseInt(behindRaw ?? "", 10);

  return {
    ahead: Number.isFinite(ahead) ? ahead : null,
    behind: Number.isFinite(behind) ? behind : null,
  };
}

function countStatusEntries(stdout: string | null): number | null {
  if (stdout == null) {
    return null;
  }

  return stdout
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0).length;
}

function isActiveRunStatus(status: Run["status"]): boolean {
  return status === "pending" || status === "waiting";
}

function parseWorktreeList(stdout: string): GitWorktreeRecord[] {
  const blocks = stdout.trim().split(/\n\s*\n/).filter(Boolean);
  return blocks.map((block, index) => {
    const record: GitWorktreeRecord = {
      path: "",
      head: null,
      branch: null,
      isPrimary: index === 0,
    };

    for (const line of block.split("\n")) {
      if (line.startsWith("worktree ")) {
        record.path = normalizeWorkspacePath(line.slice("worktree ".length));
      } else if (line.startsWith("HEAD ")) {
        record.head = line.slice("HEAD ".length);
      } else if (line.startsWith("branch ")) {
        record.branch = stripRefPrefix(line.slice("branch ".length));
      }
    }

    return record;
  }).filter((record) => record.path.length > 0);
}

async function pathExists(deps: WorkspaceLifecycleDeps, targetPath: string): Promise<boolean> {
  try {
    await deps.stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readRegistry(deps: WorkspaceLifecycleDeps): Promise<WorkspaceRegistryFile> {
  try {
    const raw = await deps.readFile(WORKSPACE_REGISTRY_PATH, "utf8");
    const parsed = JSON.parse(raw) as WorkspaceRegistryFile;
    if (!parsed.workspaces || typeof parsed.workspaces !== "object") {
      return { version: 1, workspaces: {} };
    }
    return {
      version: 1,
      workspaces: parsed.workspaces,
    };
  } catch {
    return { version: 1, workspaces: {} };
  }
}

async function writeRegistry(deps: WorkspaceLifecycleDeps, registry: WorkspaceRegistryFile): Promise<void> {
  await deps.mkdir(path.dirname(WORKSPACE_REGISTRY_PATH), { recursive: true });
  await deps.writeFile(WORKSPACE_REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
}

async function tryGit(deps: WorkspaceLifecycleDeps, cwd: string, args: string[]): Promise<string | null> {
  try {
    const result = await deps.execGit(args, cwd);
    return result.stdout.trim();
  } catch {
    return null;
  }
}

async function collectGitCluster(
  deps: WorkspaceLifecycleDeps,
  seedPath: string,
): Promise<{ commonDir: string | null; gitRoot: string | null; worktrees: GitWorktreeRecord[] }> {
  const gitRoot = await tryGit(deps, seedPath, ["rev-parse", "--show-toplevel"]);
  const commonDir = await tryGit(deps, seedPath, ["rev-parse", "--path-format=absolute", "--git-common-dir"]);
  const worktreeStdout = await tryGit(deps, seedPath, ["worktree", "list", "--porcelain"]);

  return {
    commonDir,
    gitRoot,
    worktrees: worktreeStdout ? parseWorktreeList(worktreeStdout) : [],
  };
}

function ensureWorkspaceRecord(
  records: Map<string, MutableWorkspaceRecord>,
  workspacePath: string,
): MutableWorkspaceRecord {
  const normalizedPath = normalizeWorkspacePath(workspacePath);
  const existing = records.get(normalizedPath);
  if (existing) {
    return existing;
  }

  const created: MutableWorkspaceRecord = {
    path: normalizedPath,
    name: path.basename(normalizedPath),
    gitRoot: null,
    commonDir: null,
    trackingBranch: null,
    branch: null,
    head: null,
    ahead: null,
    behind: null,
    dirty: null,
    uncommittedCount: null,
    isWorktree: false,
    isPrimary: false,
    missing: false,
    pinnedAt: null,
    archivedAt: null,
    cleanedAt: null,
    notes: "",
    notesUpdatedAt: null,
    lastActivityAtMs: null,
    rebase: undefined,
    sessions: [],
    runs: [],
  };
  records.set(normalizedPath, created);
  return created;
}

function toWorkspaceStatus(record: MutableWorkspaceRecord): WorkspaceStatus {
  if (record.missing) {
    return "missing";
  }
  if (record.archivedAt) {
    return "archived";
  }
  if (record.sessions.some((session) => session.status === "active") || record.runs.some((run) => isActiveRunStatus(run.status))) {
    return "active";
  }
  return "idle";
}

function toSharedSessionBindings(sessions: readonly WorkspaceSessionSnapshot[]): WorkspaceSessionBinding[] {
  return sessions.map((session) => ({
    agent: session.agent,
    sessionId: session.sessionId,
    status: session.status === "active" ? "running" : "stopped",
    cwd: session.cwd,
    title: session.title,
    updatedAt:
      typeof session.updatedAt === "number"
        ? new Date(session.updatedAt).toISOString()
        : new Date().toISOString(),
    activeRunId: session.activeRunId ?? null,
    latestRunId: session.latestRunId ?? null,
  }));
}

function matchesManagedWorkspacePath(workspace: ManagedWorkspaceSummary, targetPath: string): boolean {
  const normalized = normalizeWorkspacePath(targetPath);
  if (normalized === workspace.rootPath || normalized === workspace.defaultCwd) {
    return true;
  }
  return workspace.repos.some((repo: ManagedWorkspaceSummary["repos"][number]) =>
    normalized === repo.targetPath || normalized.startsWith(`${repo.targetPath}${path.sep}`),
  );
}

function toManagedWorkspacePath(
  workspace: ManagedWorkspaceSummary,
  resolveWorkspaceDefaultCwd: (workspace: ManagedWorkspaceSummary) => string,
): string {
  return resolveWorkspaceDefaultCwd(workspace);
}

export class WorkspaceLifecycleService {
  private deps: WorkspaceLifecycleDeps;
  private workspaceCorePromise:
    | Promise<{
        resolveWorkspaceDefaultCwd: (
          workspace: Pick<WorkspaceRecord, "rootPath" | "repos"> | ManagedWorkspaceSummary,
        ) => string;
        sharedWorkspaceService: Pick<
          WorkspaceService,
          "listWorkspaces" | "createWorkspace" | "archiveWorkspace" | "cleanupWorkspace" | "recoverWorkspace" | "resolveWorkspace"
        >;
      }>
    | null = null;

  constructor(deps?: Partial<WorkspaceLifecycleDeps>) {
    this.deps = { ...defaultDeps, ...deps };
  }

  private async getWorkspaceCore() {
    if (!this.workspaceCorePromise) {
      this.workspaceCorePromise = loadAgentMuxCore().then((agentMuxCore) => ({
        resolveWorkspaceDefaultCwd: agentMuxCore.resolveWorkspaceDefaultCwd as (
          workspace: Pick<WorkspaceRecord, "rootPath" | "repos"> | ManagedWorkspaceSummary,
        ) => string,
        sharedWorkspaceService:
          this.deps.workspaceService ??
          new agentMuxCore.WorkspaceService(),
      }));
    }

    return await this.workspaceCorePromise;
  }

  async listWorkspaces(input: {
    sessions?: WorkspaceSessionSnapshot[];
    reviewByWorkspacePath?: ReadonlyMap<string, KanbanReviewSummary>;
    linkedIssuesByWorkspacePath?: ReadonlyMap<string, readonly WorkspaceIssueLink[]>;
    focusWorkspacePath?: string;
  } = {}): Promise<WorkspaceInventoryResponse> {
    const { resolveWorkspaceDefaultCwd, sharedWorkspaceService } = await this.getWorkspaceCore();
    const sessions = input.sessions ?? [];
    const focusWorkspacePath = input.focusWorkspacePath ? normalizeWorkspacePath(input.focusWorkspacePath) : null;
    const reviewByWorkspacePath = input.reviewByWorkspacePath ?? new Map<string, KanbanReviewSummary>();
    const linkedIssuesByWorkspacePath =
      input.linkedIssuesByWorkspacePath ?? new Map<string, readonly WorkspaceIssueLink[]>();
    const registry = await readRegistry(this.deps);
    const records = new Map<string, MutableWorkspaceRecord>();
    let managedWorkspaces: ManagedWorkspaceSummary[] = [];
    const scopedSessions = focusWorkspacePath
      ? sessions.filter((session) => matchesNormalizedWorkspacePath(session.cwd, focusWorkspacePath))
      : sessions;

    try {
      managedWorkspaces = (await sharedWorkspaceService.listWorkspaces({
        liveSessions: toSharedSessionBindings(scopedSessions),
      })).workspaces as ManagedWorkspaceSummary[];
    } catch {
      managedWorkspaces = [];
    }

    const scopedManagedWorkspaces = focusWorkspacePath
      ? managedWorkspaces.filter((workspace) =>
          matchesManagedWorkspacePath(workspace, focusWorkspacePath),
        )
      : managedWorkspaces;

    const seedPaths = focusWorkspacePath
      ? new Set<string>([
          focusWorkspacePath,
          ...Object.keys(registry.workspaces)
            .map(normalizeWorkspacePath)
            .filter((workspacePath) => workspacePath === focusWorkspacePath),
          ...scopedManagedWorkspaces.map((workspace) =>
            normalizeWorkspacePath(toManagedWorkspacePath(workspace, resolveWorkspaceDefaultCwd)),
          ),
          ...scopedSessions.flatMap((session) => (session.cwd ? [normalizeWorkspacePath(session.cwd)] : [])),
        ])
      : new Set<string>([
          normalizeWorkspacePath(this.deps.cwd()),
          ...Object.keys(registry.workspaces).map(normalizeWorkspacePath),
          ...managedWorkspaces.map((workspace) =>
            normalizeWorkspacePath(toManagedWorkspacePath(workspace, resolveWorkspaceDefaultCwd)),
          ),
          ...sessions.flatMap((session) => (session.cwd ? [normalizeWorkspacePath(session.cwd)] : [])),
        ]);

    const seenCommonDirs = new Set<string>();
    for (const seedPath of seedPaths) {
      const exists = await pathExists(this.deps, seedPath);
      if (!exists) {
        const record = ensureWorkspaceRecord(records, seedPath);
        record.missing = true;
        continue;
      }

      const cluster = await collectGitCluster(this.deps, seedPath);
      if (!cluster.worktrees.length) {
        ensureWorkspaceRecord(records, seedPath);
        continue;
      }

      const clusterKey = cluster.commonDir ?? cluster.gitRoot ?? seedPath;
      if (seenCommonDirs.has(clusterKey)) {
        continue;
      }
      seenCommonDirs.add(clusterKey);

      if (focusWorkspacePath) {
        const matchingWorktree =
          cluster.worktrees.find((worktree) => normalizeWorkspacePath(worktree.path) === focusWorkspacePath) ??
          cluster.worktrees.find((worktree) => normalizeWorkspacePath(worktree.path) === seedPath);
        const record = ensureWorkspaceRecord(records, focusWorkspacePath);
        record.gitRoot = cluster.gitRoot;
        record.commonDir = cluster.commonDir;
        record.branch = matchingWorktree?.branch ?? record.branch;
        record.head = matchingWorktree?.head ?? record.head;
        record.isWorktree = matchingWorktree ? true : record.isWorktree;
        record.isPrimary = matchingWorktree?.isPrimary ?? record.isPrimary;
        record.name = matchingWorktree?.branch ?? record.name;
        continue;
      }

      for (const worktree of cluster.worktrees) {
        const record = ensureWorkspaceRecord(records, worktree.path);
        record.gitRoot = cluster.gitRoot;
        record.commonDir = cluster.commonDir;
        record.branch = worktree.branch;
        record.head = worktree.head;
        record.isWorktree = true;
        record.isPrimary = worktree.isPrimary;
        record.name = worktree.branch ?? path.basename(worktree.path);
      }
    }

    for (const entry of Object.values(registry.workspaces)) {
      if (focusWorkspacePath && normalizeWorkspacePath(entry.path) !== focusWorkspacePath) {
        continue;
      }
      const record = ensureWorkspaceRecord(records, entry.path);
      record.name = entry.name ?? record.name;
      record.gitRoot = entry.gitRoot ?? record.gitRoot;
      record.commonDir = entry.commonDir ?? record.commonDir;
      record.trackingBranch = entry.trackingBranch ?? record.trackingBranch;
      record.branch = entry.branch ?? record.branch;
      record.pinnedAt = entry.pinnedAt ?? null;
      record.archivedAt = entry.archivedAt ?? null;
      record.cleanedAt = entry.cleanedAt ?? null;
      record.notes = entry.notes ?? "";
      record.notesUpdatedAt = entry.notesUpdatedAt ?? null;
      record.rebase = normalizeRebaseSurface(entry.rebase, record.path) ?? record.rebase;
      record.ownership = normalizeOwnershipValue(entry.ownership) ?? record.ownership;
      if (entry.notesUpdatedAt) {
        const updatedAt = Date.parse(entry.notesUpdatedAt);
        if (Number.isFinite(updatedAt)) {
          record.lastActivityAtMs = Math.max(record.lastActivityAtMs ?? 0, updatedAt);
        }
      }
      if (typeof entry.rebase?.persistedAt === "number") {
        record.lastActivityAtMs = Math.max(record.lastActivityAtMs ?? 0, entry.rebase.persistedAt);
      }
    }

    for (const workspace of scopedManagedWorkspaces) {
      const workspacePath = normalizeWorkspacePath(
        toManagedWorkspacePath(workspace, resolveWorkspaceDefaultCwd),
      );
      const record = ensureWorkspaceRecord(records, workspacePath);
      const primaryRepo =
        workspace.repos.find((repo: ManagedWorkspaceSummary["repos"][number]) => normalizeWorkspacePath(repo.targetPath) === workspacePath) ??
        (workspace.repos.length === 1 ? workspace.repos[0] : undefined);

      record.name = workspace.name || record.name;
      record.gitRoot = primaryRepo?.gitRoot ?? record.gitRoot;
      record.branch = primaryRepo?.branch ?? record.branch;
      record.head = primaryRepo?.head ?? record.head;
      record.isWorktree = primaryRepo?.mode === "worktree";
      record.archivedAt = workspace.archivedAt;
      record.cleanedAt = workspace.cleanedAt;
      if (workspace.status === "missing" || workspace.status === "cleaned") {
        record.missing = true;
      }

      for (const session of workspace.sessions) {
        const existing = record.sessions.find(
          (candidate) => candidate.sessionId === session.sessionId && candidate.agent === session.agent,
        );
        if (existing) {
          continue;
        }
        record.sessions.push({
          sessionId: session.sessionId,
          agent: session.agent,
          status: session.status === "running" ? "active" : "inactive",
          cwd: workspacePath,
          title: session.title,
          updatedAt: Date.parse(session.updatedAt),
          activeRunId: session.activeRunId ?? null,
          latestRunId: session.latestRunId ?? null,
        });
      }
    }

    for (const session of scopedSessions) {
      if (!session.cwd) {
        continue;
      }
      const managedWorkspace = managedWorkspaces.find((workspace) => matchesManagedWorkspacePath(workspace, session.cwd!));
      const workspacePath = managedWorkspace
        ? normalizeWorkspacePath(toManagedWorkspacePath(managedWorkspace, resolveWorkspaceDefaultCwd))
        : normalizeWorkspacePath(session.cwd);
      const record = ensureWorkspaceRecord(records, workspacePath);
      if (record.sessions.some((candidate) => candidate.sessionId === session.sessionId && candidate.agent === session.agent)) {
        continue;
      }
      record.sessions.push({
        ...session,
        cwd: workspacePath,
      });
      record.name = session.title?.trim() ? session.title : record.name;
      if (session.runtime?.rebase) {
        record.rebase = normalizeRebaseSurface(session.runtime.rebase, workspacePath) ?? record.rebase;
        if (typeof session.runtime.rebase.persistedAt === "number") {
          record.lastActivityAtMs = Math.max(record.lastActivityAtMs ?? 0, session.runtime.rebase.persistedAt);
        }
      }
      if (typeof session.updatedAt === "number") {
        record.lastActivityAtMs = Math.max(record.lastActivityAtMs ?? 0, session.updatedAt);
      }
    }

    for (const record of records.values()) {
      record.missing = !(await pathExists(this.deps, record.path));
      if (record.missing) {
        continue;
      }

      if (!record.gitRoot) {
        record.gitRoot = await tryGit(this.deps, record.path, ["rev-parse", "--show-toplevel"]);
      }
      if (!record.commonDir) {
        record.commonDir = await tryGit(this.deps, record.path, ["rev-parse", "--path-format=absolute", "--git-common-dir"]);
      }
      if (!record.branch) {
        record.branch = await tryGit(this.deps, record.path, ["branch", "--show-current"]);
      }
      if (!record.head) {
        record.head = await tryGit(this.deps, record.path, ["rev-parse", "HEAD"]);
      }
      if (!record.trackingBranch) {
        record.trackingBranch = stripRefPrefix(
          await tryGit(this.deps, record.path, ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"]),
        );
      }

      const gitStatus = await tryGit(this.deps, record.path, ["status", "--porcelain"]);
      record.uncommittedCount = countStatusEntries(gitStatus);
      record.dirty = record.uncommittedCount == null ? null : record.uncommittedCount > 0;

      if (record.branch && record.trackingBranch) {
        const syncCounts = parseAheadBehind(await tryGit(this.deps, record.path, ["rev-list", "--left-right", "--count", "HEAD...@{upstream}"]));
        record.ahead = syncCounts.ahead;
        record.behind = syncCounts.behind;
      }
    }

    const discoveredRuns = await this.deps.discoverAllRunDirs();
    const workspacePaths = Array.from(records.keys()).sort((left, right) => right.length - left.length);
    for (const discovered of discoveredRuns) {
      const run = await this.deps.getRunCached(discovered.runDir, discovered.source, discovered.projectName);
      const matchingPath = workspacePaths.find((workspacePath) => discovered.runDir.startsWith(`${workspacePath}${path.sep}`));
      if (!matchingPath) {
        continue;
      }

      const record = ensureWorkspaceRecord(records, matchingPath);
      record.runs.push({
        runId: run.runId,
        status: run.status,
        projectName: run.projectName,
      });
      const updatedAt = Date.parse(run.updatedAt);
      if (Number.isFinite(updatedAt)) {
        record.lastActivityAtMs = Math.max(record.lastActivityAtMs ?? 0, updatedAt);
      }
    }

    const workspaces = Array.from(records.values())
      .map<WorkspaceInventoryItem>((record) => {
        const status = toWorkspaceStatus(record);
        const activeSessions = record.sessions.filter((session) => session.status === "active").length;
        const activeRuns = record.runs.filter((run) => isActiveRunStatus(run.status)).length;
        const rebase = normalizeRebaseSurface(record.rebase, record.path);
        const rebaseStatus = rebase?.status;
        const linkedIssues = [...(linkedIssuesByWorkspacePath.get(record.path) ?? [])].sort((left, right) =>
          left.issueKey.localeCompare(right.issueKey),
        );
        const ownership = record.ownership ?? deriveOwnershipFromIssues(linkedIssues);

        return {
          path: record.path,
          name: record.name,
          status,
          pinnedAt: record.pinnedAt,
          missing: record.missing,
          archivedAt: record.archivedAt,
          cleanedAt: record.cleanedAt,
          lastActivityAt: record.lastActivityAtMs ? new Date(record.lastActivityAtMs).toISOString() : null,
          git: {
            root: record.gitRoot,
            commonDir: record.commonDir,
            trackingBranch: record.trackingBranch,
            branch: record.branch,
            head: record.head,
            ahead: record.ahead,
            behind: record.behind,
            dirty: record.dirty,
            uncommittedCount: record.uncommittedCount,
            isWorktree: record.isWorktree,
            isPrimary: record.isPrimary,
          },
          notes: {
            value: record.notes,
            updatedAt: record.notesUpdatedAt,
          },
          links: {
            editorHref: record.missing ? null : buildEditorHref(record.path),
          },
          sessions: {
            total: record.sessions.length,
            active: activeSessions,
            items: record.sessions.sort((left, right) => Number(right.updatedAt ?? 0) - Number(left.updatedAt ?? 0)),
          },
          runs: {
            total: record.runs.length,
            active: activeRuns,
            items: record.runs,
          },
          rebase,
          actions: {
            canPin: !record.missing && !record.pinnedAt,
            canUnpin: !record.missing && Boolean(record.pinnedAt),
            canArchive: !record.missing,
            canCleanup:
              Boolean(record.archivedAt) &&
              !record.missing &&
              record.isWorktree &&
              !record.isPrimary &&
              activeSessions === 0 &&
              activeRuns === 0,
            canRecover:
              Boolean(record.archivedAt) || (Boolean(record.cleanedAt) && record.missing),
            canRebaseStart: rebaseStatus === "rebase-needed",
            canRebaseAutoResolve: rebaseStatus === "rebase-conflicts" && (rebase?.unresolvedFiles.length ?? 0) > 0,
            canRebaseOpenInEditor: rebaseStatus === "rebase-conflicts",
            canRebaseMarkResolved: rebaseStatus === "rebase-conflicts",
            canRebaseAbort: rebaseStatus === "rebase-conflicts",
          },
          review: reviewByWorkspacePath.get(record.path),
          issues: linkedIssues,
          ownership,
        };
      })
      .sort((left, right) => {
        const pinDiff = Number(Boolean(right.pinnedAt)) - Number(Boolean(left.pinnedAt));
        if (pinDiff !== 0) {
          return pinDiff;
        }
        const rank = (status: WorkspaceStatus): number => {
          if (status === "active") return 0;
          if (status === "idle") return 1;
          if (status === "archived") return 2;
          return 3;
        };
        const statusDiff = rank(left.status) - rank(right.status);
        if (statusDiff !== 0) {
          return statusDiff;
        }
        return left.path.localeCompare(right.path);
      });

    return {
      workspaces,
      summary: {
        total: workspaces.length,
        active: workspaces.filter((workspace) => workspace.status === "active").length,
        idle: workspaces.filter((workspace) => workspace.status === "idle").length,
        archived: workspaces.filter((workspace) => workspace.status === "archived").length,
        missing: workspaces.filter((workspace) => workspace.status === "missing").length,
      },
    };
  }

  async provisionWorkspace(input: {
    workspaceName: string;
    slugSeed?: string;
    ownership?: WorkspaceProvisionOwnershipInput;
  }): Promise<WorkspaceProvisionResult> {
    const { resolveWorkspaceDefaultCwd, sharedWorkspaceService } = await this.getWorkspaceCore();
    const seedPath = normalizeWorkspacePath(this.deps.cwd());
    const cluster = await collectGitCluster(this.deps, seedPath);
    const sourcePath = cluster.gitRoot ?? seedPath;
    const slugBase = slugifyWorkspaceName(input.slugSeed || input.workspaceName);
    const requestedBranchName = `vk/${slugBase}`;

    try {
      const created = await sharedWorkspaceService.createWorkspace({
        name: input.workspaceName,
        repos: [{ path: sourcePath }],
        mode: "worktree",
        branchName: requestedBranchName,
      });

      const workspacePath = normalizeWorkspacePath(resolveWorkspaceDefaultCwd(created));
      const repo =
        created.repos.find((candidate: typeof created.repos[number]) => normalizeWorkspacePath(candidate.targetPath) === workspacePath) ??
        created.repos[0];
      const registry = await readRegistry(this.deps);
      registry.workspaces[workspacePath] = {
        path: workspacePath,
        name: input.workspaceName,
        gitRoot: repo?.gitRoot ?? cluster.gitRoot,
        commonDir: cluster.commonDir,
        branch: repo?.branch ?? requestedBranchName,
        trackingBranch: null,
        pinnedAt: registry.workspaces[workspacePath]?.pinnedAt ?? null,
        archivedAt: created.archivedAt,
        cleanedAt: created.cleanedAt,
        notes: registry.workspaces[workspacePath]?.notes ?? "",
        notesUpdatedAt: registry.workspaces[workspacePath]?.notesUpdatedAt ?? null,
        rebase: registry.workspaces[workspacePath]?.rebase ?? null,
        ownership: input.ownership ?? registry.workspaces[workspacePath]?.ownership ?? null,
      };
      await writeRegistry(this.deps, registry);

      return {
        workspacePath,
        workspaceName: input.workspaceName,
        branchName: repo?.branch ?? requestedBranchName,
      };
    } catch {
      // Fall back to the legacy kanban-local worktree path when shared workspace management is unavailable.
    }

    const registry = await readRegistry(this.deps);
    const workspaceRoot = path.join(os.homedir(), ".a5c", "workspaces");
    const branchBase = `vk/${slugBase}`;
    const existingPaths = new Set<string>([
      ...Object.keys(registry.workspaces).map(normalizeWorkspacePath),
      ...cluster.worktrees.map((worktree) => normalizeWorkspacePath(worktree.path)),
    ]);
    const existingBranches = new Set<string>(
      cluster.worktrees
        .map((worktree) => worktree.branch)
        .filter((branch): branch is string => typeof branch === "string" && branch.length > 0),
    );

    let suffix = 0;
    let workspacePath = "";
    let branchName = "";
    while (true) {
      const suffixLabel = suffix === 0 ? "" : `-${suffix + 1}`;
      workspacePath = normalizeWorkspacePath(path.join(workspaceRoot, `${slugBase}${suffixLabel}`));
      branchName = `${branchBase}${suffixLabel}`;
      if (!existingPaths.has(workspacePath) && !existingBranches.has(branchName)) {
        break;
      }
      suffix += 1;
    }

    if (cluster.gitRoot) {
      await this.deps.execGit(["worktree", "add", "-b", branchName, workspacePath], cluster.gitRoot);
    }

    registry.workspaces[workspacePath] = {
      path: workspacePath,
      name: input.workspaceName,
      gitRoot: cluster.gitRoot,
      commonDir: cluster.commonDir,
      branch: branchName,
      trackingBranch: null,
      pinnedAt: null,
      archivedAt: null,
      cleanedAt: null,
      notes: "",
      notesUpdatedAt: null,
      rebase: null,
      ownership: input.ownership ?? null,
    };
    await writeRegistry(this.deps, registry);

    return {
      workspacePath,
      workspaceName: input.workspaceName,
      branchName,
    };
  }

  async provisionWorkspaceForIssue(input: {
    issueKey: string;
    issueTitle: string;
    ownership?: WorkspaceProvisionOwnershipInput;
  }): Promise<WorkspaceProvisionResult> {
    return this.provisionWorkspace({
      workspaceName: input.issueKey,
      slugSeed: input.issueKey || input.issueTitle,
      ownership: input.ownership,
    });
  }

  async applyAction(
    input: {
      action: WorkspaceAction;
      workspacePath: string;
      note?: string;
      sessions?: WorkspaceSessionSnapshot[];
    },
  ): Promise<WorkspaceActionResult> {
    const { resolveWorkspaceDefaultCwd, sharedWorkspaceService } = await this.getWorkspaceCore();
    const workspacePath = normalizeWorkspacePath(input.workspacePath);
    const registry = await readRegistry(this.deps);
    const inventory = await this.listWorkspaces({ sessions: input.sessions });
    const workspace = inventory.workspaces.find((item) => item.path === workspacePath);
    const entry = registry.workspaces[workspacePath] ?? {
      path: workspacePath,
      name: workspace?.name ?? path.basename(workspacePath),
      gitRoot: workspace?.git.root ?? null,
      commonDir: workspace?.git.commonDir ?? null,
      trackingBranch: workspace?.git.trackingBranch ?? null,
      branch: workspace?.git.branch ?? null,
      pinnedAt: workspace?.pinnedAt ?? null,
      archivedAt: workspace?.archivedAt ?? null,
      cleanedAt: workspace?.cleanedAt ?? null,
      notes: workspace?.notes.value ?? "",
      notesUpdatedAt: workspace?.notes.updatedAt ?? null,
      rebase: workspace?.rebase ?? null,
      ownership: workspace?.ownership ?? null,
    };

    if (!workspace) {
      throw new Error(`Workspace not found: ${workspacePath}`);
    }

    const now = this.deps.now();

    if (input.action === "archive" || input.action === "cleanup" || input.action === "recover") {
      try {
        const managedWorkspace = await sharedWorkspaceService.resolveWorkspace(workspacePath);
        if (managedWorkspace) {
          const updated =
            input.action === "archive"
              ? await sharedWorkspaceService.archiveWorkspace(workspacePath)
              : input.action === "cleanup"
                ? await sharedWorkspaceService.cleanupWorkspace(workspacePath)
                : await sharedWorkspaceService.recoverWorkspace(workspacePath);
          const managedPath = normalizeWorkspacePath(resolveWorkspaceDefaultCwd(updated));
          const nextEntry = {
            ...(registry.workspaces[managedPath] ?? entry),
            path: managedPath,
            name: updated.name,
            gitRoot: updated.repos[0]?.gitRoot ?? entry.gitRoot,
            commonDir: entry.commonDir,
            trackingBranch: entry.trackingBranch,
            branch: updated.repos[0]?.branch ?? entry.branch,
            pinnedAt: entry.pinnedAt,
            archivedAt: updated.archivedAt,
            cleanedAt: updated.cleanedAt,
            notes: entry.notes,
            notesUpdatedAt: entry.notesUpdatedAt,
            rebase: entry.rebase,
            ownership: entry.ownership,
          } satisfies WorkspaceRegistryEntry;
          if (managedPath !== workspacePath) {
            delete registry.workspaces[workspacePath];
          }
          registry.workspaces[managedPath] = nextEntry;
          await writeRegistry(this.deps, registry);
          return {
            ok: true,
            workspacePath: managedPath,
            action: input.action,
            message:
              input.action === "archive"
                ? `Archived ${managedPath}.`
                : input.action === "cleanup"
                  ? `Cleaned up ${managedPath}.`
                  : `Recovered ${managedPath}.`,
          };
        }
      } catch {
        // Fall back to the legacy kanban-local lifecycle when the shared workspace service cannot handle the action.
      }
    }

    if (input.action === "pin" || input.action === "unpin") {
      entry.pinnedAt = input.action === "pin" ? now : null;
      registry.workspaces[workspacePath] = entry;
      await writeRegistry(this.deps, registry);
      return {
        ok: true,
        workspacePath,
        action: input.action,
        message: input.action === "pin" ? `Pinned ${workspacePath}.` : `Unpinned ${workspacePath}.`,
      };
    }

    if (input.action === "archive") {
      entry.archivedAt = now;
      entry.cleanedAt = entry.cleanedAt ?? null;
      registry.workspaces[workspacePath] = entry;
      await writeRegistry(this.deps, registry);
      return {
        ok: true,
        workspacePath,
        action: input.action,
        message: `Archived ${workspacePath}.`,
      };
    }

    if (input.action === "cleanup") {
      if (!workspace.actions.canCleanup) {
        throw new Error("Workspace is not eligible for cleanup. Archive it first and make sure there are no active sessions or runs.");
      }
      if (!workspace.git.root) {
        throw new Error("Cannot clean up a workspace without a git root.");
      }
      await this.deps.execGit(["worktree", "remove", "--force", workspacePath], workspace.git.root);
      await this.deps.execGit(["worktree", "prune"], workspace.git.root);
      entry.archivedAt = entry.archivedAt ?? now;
      entry.cleanedAt = now;
      registry.workspaces[workspacePath] = entry;
      await writeRegistry(this.deps, registry);
      return {
        ok: true,
        workspacePath,
        action: input.action,
        message: `Removed git worktree ${workspacePath}.`,
      };
    }

    if (input.action === "notes-save") {
      const nextNote = typeof input.note === "string" ? input.note : "";
      const hasContent = nextNote.trim().length > 0;
      entry.notes = hasContent ? nextNote : "";
      entry.notesUpdatedAt = hasContent ? now : null;
      registry.workspaces[workspacePath] = entry;
      await writeRegistry(this.deps, registry);
      return {
        ok: true,
        workspacePath,
        action: input.action,
        message: hasContent ? `Saved workspace notes for ${workspacePath}.` : `Cleared workspace notes for ${workspacePath}.`,
      };
    }

    if (input.action === "rebase-start") {
      entry.rebase = buildConflictState(normalizeRebaseSurface(entry.rebase ?? workspace.rebase, workspacePath), workspacePath);
      registry.workspaces[workspacePath] = entry;
      await writeRegistry(this.deps, registry);
      return {
        ok: true,
        workspacePath,
        action: input.action,
        message: `Started rebase workflow for ${workspacePath}.`,
      };
    }

    if (input.action === "rebase-auto-resolve") {
      const current = normalizeRebaseSurface(entry.rebase ?? workspace.rebase, workspacePath);
      if (!current || current.status !== "rebase-conflicts") {
        throw new Error("Workspace is not currently in rebase-conflicts state.");
      }

      const [resolvedNow, ...remaining] = current.unresolvedFiles;
      const nextState: WorkspaceRebaseSurface =
        remaining.length === 0
          ? buildReadyState(
              {
                ...current,
                resolvedFiles: [...new Set([...current.resolvedFiles, resolvedNow].filter(Boolean))],
                unresolvedFiles: [],
              },
              workspacePath,
              "auto-resolve",
            )
          : {
              ...current,
              unresolvedFiles: remaining,
              resolvedFiles: [...new Set([...current.resolvedFiles, resolvedNow].filter(Boolean))],
              followUpInstructions: [],
              manualResolutionSuggested: true,
              lastAction: "auto-resolve",
              persistedAt: Date.now(),
            };

      entry.rebase = {
        ...nextState,
        followUpInstructions: buildFollowUpInstructions(nextState, workspacePath),
      };
      registry.workspaces[workspacePath] = entry;
      await writeRegistry(this.deps, registry);
      return {
        ok: true,
        workspacePath,
        action: input.action,
        message:
          remaining.length === 0
            ? `Auto-resolved all tracked conflicts for ${workspacePath}.`
            : `Auto-resolved ${resolvedNow}; ${remaining.length} conflict file(s) still need attention.`,
      };
    }

    if (input.action === "rebase-open-in-editor") {
      const current = normalizeRebaseSurface(entry.rebase ?? workspace.rebase, workspacePath);
      if (!current || current.status !== "rebase-conflicts") {
        throw new Error("Workspace is not currently in rebase-conflicts state.");
      }
      const nextState: WorkspaceRebaseSurface = {
        ...current,
        manualResolutionSuggested: true,
        lastAction: "open-in-editor",
        persistedAt: Date.now(),
        editorHref: buildEditorHref(workspacePath),
        followUpInstructions: [],
      };
      entry.rebase = {
        ...nextState,
        followUpInstructions: buildFollowUpInstructions(nextState, workspacePath),
      };
      registry.workspaces[workspacePath] = entry;
      await writeRegistry(this.deps, registry);
      return {
        ok: true,
        workspacePath,
        action: input.action,
        message: `Prepared manual conflict resolution guidance for ${workspacePath}.`,
      };
    }

    if (input.action === "rebase-mark-resolved") {
      const current = normalizeRebaseSurface(entry.rebase ?? workspace.rebase, workspacePath);
      if (!current || current.status !== "rebase-conflicts") {
        throw new Error("Workspace is not currently in rebase-conflicts state.");
      }
      entry.rebase = buildReadyState(current, workspacePath, "manual-resolve");
      registry.workspaces[workspacePath] = entry;
      await writeRegistry(this.deps, registry);
      return {
        ok: true,
        workspacePath,
        action: input.action,
        message: `Marked rebase conflicts resolved for ${workspacePath}.`,
      };
    }

    if (input.action === "rebase-abort") {
      const current = normalizeRebaseSurface(entry.rebase ?? workspace.rebase, workspacePath);
      if (!current || current.status !== "rebase-conflicts") {
        throw new Error("Workspace is not currently in rebase-conflicts state.");
      }
      const resetFiles = current
        ? [...new Set([...current.unresolvedFiles, ...current.resolvedFiles])].filter(Boolean)
        : defaultConflictFiles();
      const nextState: WorkspaceRebaseSurface = {
        status: "rebase-needed",
        branch: current?.branch,
        targetBranch: current?.targetBranch ?? "main",
        attemptCount: current?.attemptCount ?? 0,
        unresolvedFiles: resetFiles.length > 0 ? resetFiles : defaultConflictFiles(),
        resolvedFiles: [],
        followUpInstructions: [],
        manualResolutionSuggested: false,
        readyFor: current?.readyFor ?? "merge",
        editorHref: buildEditorHref(workspacePath),
        lastAction: "abort",
        persistedAt: Date.now(),
      };
      entry.rebase = {
        ...nextState,
        followUpInstructions: buildFollowUpInstructions(nextState, workspacePath),
      };
      registry.workspaces[workspacePath] = entry;
      await writeRegistry(this.deps, registry);
      return {
        ok: true,
        workspacePath,
        action: input.action,
        message: `Aborted the current rebase attempt for ${workspacePath}.`,
      };
    }

    if (!entry.gitRoot || !entry.branch) {
      entry.archivedAt = null;
      entry.cleanedAt = null;
      registry.workspaces[workspacePath] = entry;
      await writeRegistry(this.deps, registry);
      return {
        ok: true,
        workspacePath,
        action: input.action,
        message: `Recovered ${workspacePath} in metadata only.`,
      };
    }

    const exists = await pathExists(this.deps, workspacePath);
    if (!exists) {
      await this.deps.execGit(["worktree", "add", workspacePath, entry.branch], entry.gitRoot);
    }
    entry.archivedAt = null;
    entry.cleanedAt = null;
    registry.workspaces[workspacePath] = entry;
    await writeRegistry(this.deps, registry);
    return {
      ok: true,
      workspacePath,
      action: input.action,
      message: `Recovered ${workspacePath}.`,
    };
  }
}
