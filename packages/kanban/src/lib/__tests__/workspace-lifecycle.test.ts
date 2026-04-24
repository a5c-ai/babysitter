import path from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorkspaceLifecycleService, type WorkspaceLifecycleDeps, type WorkspaceSessionSnapshot } from "../workspace-lifecycle";
import type { Run } from "@/types";

function repoPath(...segments: string[]): string {
  return path.resolve(path.sep, ...segments);
}

function createRun(overrides: Partial<Run> = {}): Run {
  return {
    runId: overrides.runId ?? "run-1",
    processId: overrides.processId ?? "process",
    status: overrides.status ?? "waiting",
    createdAt: overrides.createdAt ?? "2026-04-24T00:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-04-24T01:00:00.000Z",
    sessionId: overrides.sessionId ?? "session-1",
    tasks: overrides.tasks ?? [],
    events: overrides.events ?? [],
    totalTasks: overrides.totalTasks ?? 0,
    completedTasks: overrides.completedTasks ?? 0,
    failedTasks: overrides.failedTasks ?? 0,
  };
}

function createDeps(overrides: Partial<WorkspaceLifecycleDeps> = {}): WorkspaceLifecycleDeps {
  const kanbanPath = repoPath("repo", "packages", "kanban");
  const mainPath = repoPath("repo", "main");
  const taskPath = repoPath("repo", "worktrees", "task");
  const commonDirPath = repoPath("repo", "common", ".git");
  const existingPaths = new Set<string>([
    kanbanPath,
    mainPath,
    taskPath,
  ]);

  const registryWrites: string[] = [];
  const execGit = vi.fn<WorkspaceLifecycleDeps["execGit"]>(async (args, cwd) => {
    const key = `${cwd}::${args.join(" ")}`;

    const map: Record<string, { stdout: string; stderr: string }> = {
      [`${kanbanPath}::rev-parse --show-toplevel`]: { stdout: `${mainPath}\n`, stderr: "" },
      [`${kanbanPath}::rev-parse --path-format=absolute --git-common-dir`]: { stdout: `${commonDirPath}\n`, stderr: "" },
      [`${kanbanPath}::worktree list --porcelain`]: {
        stdout: [
          `worktree ${mainPath}`,
          "HEAD abc123",
          "branch refs/heads/main",
          "",
          `worktree ${taskPath}`,
          "HEAD def456",
          "branch refs/heads/vk/task",
          "",
        ].join("\n"),
        stderr: "",
      },
      [`${mainPath}::status --porcelain`]: { stdout: "", stderr: "" },
      [`${taskPath}::status --porcelain`]: { stdout: " M packages/kanban/src/app/page.tsx\n", stderr: "" },
      [`${mainPath}::branch --show-current`]: { stdout: "main\n", stderr: "" },
      [`${taskPath}::branch --show-current`]: { stdout: "vk/task\n", stderr: "" },
      [`${mainPath}::rev-parse HEAD`]: { stdout: "abc123\n", stderr: "" },
      [`${taskPath}::rev-parse HEAD`]: { stdout: "def456\n", stderr: "" },
      [`${mainPath}::worktree add ${taskPath} vk/task`]: { stdout: "prepared\n", stderr: "" },
      [`${mainPath}::worktree remove --force ${taskPath}`]: { stdout: "removed\n", stderr: "" },
      [`${mainPath}::worktree prune`]: { stdout: "pruned\n", stderr: "" },
    };

    const value = map[key];
    if (!value) {
      throw new Error(`Unexpected git call: ${key}`);
    }
    return value;
  });

  return {
    discoverAllRunDirs: async () => [
      {
        runDir: path.join(taskPath, ".a5c", "runs", "run-1"),
        source: { path: taskPath, depth: 1 },
        projectName: "task",
      },
    ],
    getRunCached: async () => createRun(),
    readFile: vi.fn(async () => {
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    }),
    writeFile: vi.fn(async (_path, contents) => {
      registryWrites.push(String(contents));
    }),
    mkdir: vi.fn(async () => undefined),
    stat: vi.fn(async (targetPath: string) => {
      if (!existingPaths.has(targetPath)) {
        throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      }
      return {} as never;
    }),
    execGit,
    now: () => "2026-04-24T12:00:00.000Z",
    cwd: () => kanbanPath,
    ...overrides,
  };
}

describe("WorkspaceLifecycleService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("lists workspaces from git worktrees, agent-mux sessions, and Babysitter runs", async () => {
    const service = new WorkspaceLifecycleService(createDeps());
    const sessions: WorkspaceSessionSnapshot[] = [
      {
        sessionId: "session-1",
        agent: "codex",
        status: "active",
        cwd: repoPath("repo", "worktrees", "task"),
        title: "KANBAN-GAP-003",
        updatedAt: Date.parse("2026-04-24T02:00:00.000Z"),
      },
    ];

    const result = await service.listWorkspaces({ sessions });

    expect(result.summary.total).toBe(2);
    expect(result.summary.active).toBe(1);
    expect(result.workspaces[0]?.path).toBe(repoPath("repo", "worktrees", "task"));
    expect(result.workspaces[0]?.runs.active).toBe(1);
    expect(result.workspaces[0]?.sessions.active).toBe(1);
    expect(result.workspaces[0]?.git.branch).toBe("vk/task");
    expect(result.workspaces[0]?.git.dirty).toBe(true);
  });

  it("refuses cleanup for workspaces that are not archived and inactive", async () => {
    const service = new WorkspaceLifecycleService(createDeps());

    await expect(
      service.applyAction({
        action: "cleanup",
        workspacePath: repoPath("repo", "worktrees", "task"),
        sessions: [],
      }),
    ).rejects.toThrow("not eligible for cleanup");
  });

  it("recreates a cleaned workspace during recovery when the path is missing", async () => {
    const deps = createDeps({
      readFile: vi.fn(async () =>
        JSON.stringify({
          version: 1,
          workspaces: {
            [repoPath("repo", "worktrees", "task")]: {
              path: repoPath("repo", "worktrees", "task"),
              gitRoot: repoPath("repo", "main"),
              commonDir: repoPath("repo", "common", ".git"),
              branch: "vk/task",
              archivedAt: "2026-04-23T12:00:00.000Z",
              cleanedAt: "2026-04-23T13:00:00.000Z",
            },
          },
        }),
      ),
      stat: vi.fn(async (targetPath: string) => {
        if (targetPath === repoPath("repo", "worktrees", "task")) {
          throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
        }
        return {} as never;
      }),
    });

    const service = new WorkspaceLifecycleService(deps);
    const result = await service.applyAction({
      action: "recover",
      workspacePath: repoPath("repo", "worktrees", "task"),
      sessions: [],
    });

    expect(result.ok).toBe(true);
    expect(deps.execGit).toHaveBeenCalledWith(
      ["worktree", "add", repoPath("repo", "worktrees", "task"), "vk/task"],
      repoPath("repo", "main"),
    );
  });
});
