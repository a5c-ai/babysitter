import { execFile as execFileCallback } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { discoverAllRunDirs as defaultDiscoverAllRunDirs, type DiscoveredRun } from "@/lib/source-discovery";
import { getRunCached as defaultGetRunCached } from "@/lib/run-cache";
import type { Run } from "@/types";
import type { WatchSource } from "@/lib/config-loader";
import type { WorkspaceRuntimeSurface } from "@a5c-ai/agent-mux-core";
import type { KanbanReviewSummary } from "../../../agent-mux/core/src/kanban.js";

const execFile = promisify(execFileCallback);

const WORKSPACE_REGISTRY_PATH =
  process.env.KANBAN_WORKSPACE_REGISTRY_PATH ?? path.join(os.homedir(), ".a5c", "kanban-workspaces.json");

type WorkspaceStatus = "active" | "idle" | "archived" | "missing";
type WorkspaceAction = "archive" | "cleanup" | "recover";

export interface WorkspaceSessionSnapshot {
  sessionId: string;
  agent: string;
  status: "active" | "inactive";
  cwd?: string;
  title?: string;
  updatedAt?: number;
  activeRunId?: string | null;
  latestRunId?: string | null;
  runtime?: WorkspaceRuntimeSurface;
}

export interface WorkspaceInventoryItem {
  path: string;
  name: string;
  status: WorkspaceStatus;
  missing: boolean;
  archivedAt: string | null;
  cleanedAt: string | null;
  lastActivityAt: string | null;
  git: {
    root: string | null;
    commonDir: string | null;
    branch: string | null;
    head: string | null;
    dirty: boolean | null;
    isWorktree: boolean;
    isPrimary: boolean;
  };
  sessions: {
    total: number;
    active: number;
    items: WorkspaceSessionSnapshot[];
  };
  runs: {
    total: number;
    active: number;
    items: Array<{
      runId: string;
      status: Run["status"];
      projectName?: string;
    }>;
  };
  actions: {
    canArchive: boolean;
    canCleanup: boolean;
    canRecover: boolean;
  };
  review?: KanbanReviewSummary;
}

export interface WorkspaceInventoryResponse {
  workspaces: WorkspaceInventoryItem[];
  summary: {
    total: number;
    active: number;
    idle: number;
    archived: number;
    missing: number;
  };
}

export interface WorkspaceActionResult {
  ok: boolean;
  workspacePath: string;
  action: WorkspaceAction;
  message: string;
}

interface WorkspaceRegistryEntry {
  path: string;
  name?: string;
  gitRoot?: string | null;
  commonDir?: string | null;
  branch?: string | null;
  archivedAt?: string | null;
  cleanedAt?: string | null;
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
  branch: string | null;
  head: string | null;
  dirty: boolean | null;
  isWorktree: boolean;
  isPrimary: boolean;
  missing: boolean;
  archivedAt: string | null;
  cleanedAt: string | null;
  lastActivityAtMs: number | null;
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

function normalizeWorkspacePath(workspacePath: string): string {
  return path.resolve(workspacePath);
}

function stripRefPrefix(branch: string | null): string | null {
  if (!branch) {
    return null;
  }
  return branch.replace(/^refs\/heads\//, "");
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
    branch: null,
    head: null,
    dirty: null,
    isWorktree: false,
    isPrimary: false,
    missing: false,
    archivedAt: null,
    cleanedAt: null,
    lastActivityAtMs: null,
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

export class WorkspaceLifecycleService {
  private deps: WorkspaceLifecycleDeps;

  constructor(deps?: Partial<WorkspaceLifecycleDeps>) {
    this.deps = { ...defaultDeps, ...deps };
  }

  async listWorkspaces(input: {
    sessions?: WorkspaceSessionSnapshot[];
    reviewByWorkspacePath?: ReadonlyMap<string, KanbanReviewSummary>;
  } = {}): Promise<WorkspaceInventoryResponse> {
    const sessions = input.sessions ?? [];
    const reviewByWorkspacePath = input.reviewByWorkspacePath ?? new Map<string, KanbanReviewSummary>();
    const registry = await readRegistry(this.deps);
    const records = new Map<string, MutableWorkspaceRecord>();

    const seedPaths = new Set<string>([
      normalizeWorkspacePath(this.deps.cwd()),
      ...Object.keys(registry.workspaces).map(normalizeWorkspacePath),
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
      const record = ensureWorkspaceRecord(records, entry.path);
      record.name = entry.name ?? record.name;
      record.gitRoot = entry.gitRoot ?? record.gitRoot;
      record.commonDir = entry.commonDir ?? record.commonDir;
      record.branch = entry.branch ?? record.branch;
      record.archivedAt = entry.archivedAt ?? null;
      record.cleanedAt = entry.cleanedAt ?? null;
    }

    for (const session of sessions) {
      if (!session.cwd) {
        continue;
      }
      const workspacePath = normalizeWorkspacePath(session.cwd);
      const record = ensureWorkspaceRecord(records, workspacePath);
      record.sessions.push({
        ...session,
        cwd: workspacePath,
      });
      record.name = session.title?.trim() ? session.title : record.name;
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

      const gitStatus = await tryGit(this.deps, record.path, ["status", "--porcelain"]);
      record.dirty = gitStatus == null ? null : gitStatus.length > 0;
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

        return {
          path: record.path,
          name: record.name,
          status,
          missing: record.missing,
          archivedAt: record.archivedAt,
          cleanedAt: record.cleanedAt,
          lastActivityAt: record.lastActivityAtMs ? new Date(record.lastActivityAtMs).toISOString() : null,
          git: {
            root: record.gitRoot,
            commonDir: record.commonDir,
            branch: record.branch,
            head: record.head,
            dirty: record.dirty,
            isWorktree: record.isWorktree,
            isPrimary: record.isPrimary,
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
          actions: {
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
          },
          review: reviewByWorkspacePath.get(record.path),
        };
      })
      .sort((left, right) => {
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

  async applyAction(
    input: {
      action: WorkspaceAction;
      workspacePath: string;
      sessions?: WorkspaceSessionSnapshot[];
    },
  ): Promise<WorkspaceActionResult> {
    const workspacePath = normalizeWorkspacePath(input.workspacePath);
    const registry = await readRegistry(this.deps);
    const inventory = await this.listWorkspaces({ sessions: input.sessions });
    const workspace = inventory.workspaces.find((item) => item.path === workspacePath);
    const entry = registry.workspaces[workspacePath] ?? {
      path: workspacePath,
      name: workspace?.name ?? path.basename(workspacePath),
      gitRoot: workspace?.git.root ?? null,
      commonDir: workspace?.git.commonDir ?? null,
      branch: workspace?.git.branch ?? null,
      archivedAt: workspace?.archivedAt ?? null,
      cleanedAt: workspace?.cleanedAt ?? null,
    };

    if (!workspace) {
      throw new Error(`Workspace not found: ${workspacePath}`);
    }

    const now = this.deps.now();

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
