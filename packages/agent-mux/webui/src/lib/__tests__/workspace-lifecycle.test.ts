import path from "node:path";
import os from "node:os";

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
      [`${taskPath}::status --porcelain`]: { stdout: " M packages/agent-mux/webui/src/pages/KanbanLayout.tsx\n", stderr: "" },
      [`${mainPath}::branch --show-current`]: { stdout: "main\n", stderr: "" },
      [`${taskPath}::branch --show-current`]: { stdout: "vk/task\n", stderr: "" },
      [`${mainPath}::rev-parse HEAD`]: { stdout: "abc123\n", stderr: "" },
      [`${taskPath}::rev-parse HEAD`]: { stdout: "def456\n", stderr: "" },
      [`${taskPath}::rev-parse --abbrev-ref --symbolic-full-name @{upstream}`]: { stdout: "origin/vk/task\n", stderr: "" },
      [`${taskPath}::rev-list --left-right --count HEAD...@{upstream}`]: { stdout: "2 1\n", stderr: "" },
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
    workspaceService: {
      listWorkspaces: vi.fn(async () => ({ workspaces: [] })),
      createWorkspace: vi.fn(async () => {
        throw new Error("shared workspace service unavailable");
      }),
      archiveWorkspace: vi.fn(async () => {
        throw new Error("shared workspace service unavailable");
      }),
      cleanupWorkspace: vi.fn(async () => {
        throw new Error("shared workspace service unavailable");
      }),
      recoverWorkspace: vi.fn(async () => {
        throw new Error("shared workspace service unavailable");
      }),
      resolveWorkspace: vi.fn(async () => {
        throw new Error("shared workspace service unavailable");
      }),
    },
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
        runtime: {
          updatedAt: Date.parse("2026-04-24T02:00:00.000Z"),
          workspacePath: repoPath("repo", "worktrees", "task"),
          preview: { status: "unavailable", urls: [], deviceProfiles: [] },
          terminal: { status: "idle", commands: [] },
          devServer: { status: "idle", urls: [], logs: [] },
          rebase: {
            status: "rebase-needed",
            attemptCount: 0,
            unresolvedFiles: ["packages/agent-mux/webui/src/lib/workspace-lifecycle.ts"],
            resolvedFiles: [],
            followUpInstructions: ["Retry the rebase before merge readiness."],
            manualResolutionSuggested: false,
            readyFor: "merge",
            persistedAt: Date.parse("2026-04-24T02:00:00.000Z"),
          },
        },
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
    expect(result.workspaces[0]?.git.trackingBranch).toBe("origin/vk/task");
    expect(result.workspaces[0]?.git.ahead).toBe(2);
    expect(result.workspaces[0]?.git.behind).toBe(1);
    expect(result.workspaces[0]?.git.uncommittedCount).toBe(1);
    expect(result.workspaces[0]?.rebase?.status).toBe("rebase-needed");
    expect(result.workspaces[0]?.actions.canRebaseStart).toBe(true);
  }, 30000);

  it("limits focused workspace inventory to the selected worktree", async () => {
    const service = new WorkspaceLifecycleService(createDeps());

    const result = await service.listWorkspaces({
      focusWorkspacePath: repoPath("repo", "worktrees", "task"),
    });

    expect(result.summary.total).toBe(1);
    expect(result.workspaces).toHaveLength(1);
    expect(result.workspaces[0]?.path).toBe(repoPath("repo", "worktrees", "task"));
    expect(result.workspaces[0]?.git.branch).toBe("vk/task");
  });

  it("persists pin and unpin actions in the workspace registry", async () => {
    let registry = JSON.stringify({
      version: 1,
      workspaces: {
        [repoPath("repo", "worktrees", "task")]: {
          path: repoPath("repo", "worktrees", "task"),
          gitRoot: repoPath("repo", "main"),
          commonDir: repoPath("repo", "common", ".git"),
          branch: "vk/task",
        },
      },
    });

    const deps = createDeps({
      readFile: vi.fn(async () => registry),
      writeFile: vi.fn(async (_path, contents) => {
        registry = String(contents);
      }),
    });

    const service = new WorkspaceLifecycleService(deps);

    await service.applyAction({
      action: "pin",
      workspacePath: repoPath("repo", "worktrees", "task"),
      sessions: [],
    });

    let inventory = await service.listWorkspaces();
    expect(inventory.workspaces[0]?.pinnedAt).toBe("2026-04-24T12:00:00.000Z");
    expect(inventory.workspaces[0]?.actions.canPin).toBe(false);
    expect(inventory.workspaces[0]?.actions.canUnpin).toBe(true);

    await service.applyAction({
      action: "unpin",
      workspacePath: repoPath("repo", "worktrees", "task"),
      sessions: [],
    });

    inventory = await service.listWorkspaces();
    expect(inventory.workspaces[0]?.pinnedAt).toBeNull();
    expect(inventory.workspaces[0]?.actions.canPin).toBe(true);
    expect(inventory.workspaces[0]?.actions.canUnpin).toBe(false);
  });

  it("attaches linked issue associations to workspace inventory entries", async () => {
    const service = new WorkspaceLifecycleService(createDeps());
    const result = await service.listWorkspaces({
      linkedIssuesByWorkspacePath: new Map([
        [
          repoPath("repo", "worktrees", "task"),
          [
            {
              issueId: "KANBAN-GAP-008",
              issueKey: "KANBAN-GAP-008",
              issueTitle: "Add parent-child issue panel",
              projectId: "kanban-app",
              projectKey: "KANBAN",
              projectName: "Kanban App",
              linkedAt: "2026-04-24T12:00:00.000Z",
              source: "linked-existing-workspace",
            },
            {
              issueId: "KANBAN-GAP-007",
              issueKey: "KANBAN-GAP-007",
              issueTitle: "Add team and collaboration primitives",
              projectId: "kanban-app",
              projectKey: "KANBAN",
              projectName: "Kanban App",
              linkedAt: "2026-04-24T11:00:00.000Z",
              source: "created-from-issue",
            },
          ],
        ],
      ]),
    });

    expect(result.workspaces[0]?.issues).toEqual([
      expect.objectContaining({
        issueId: "KANBAN-GAP-007",
        issueKey: "KANBAN-GAP-007",
      }),
      expect.objectContaining({
        issueId: "KANBAN-GAP-008",
        issueKey: "KANBAN-GAP-008",
      }),
    ]);
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

  it("persists partial auto-resolve, abort, and repeated rebase attempts across reload", async () => {
    let registry = JSON.stringify({
      version: 1,
      workspaces: {
        [repoPath("repo", "worktrees", "task")]: {
          path: repoPath("repo", "worktrees", "task"),
          gitRoot: repoPath("repo", "main"),
          commonDir: repoPath("repo", "common", ".git"),
          branch: "vk/task",
          rebase: {
            status: "rebase-needed",
            attemptCount: 0,
            unresolvedFiles: [
              "packages/agent-mux/webui/src/components/workspaces/workspaces-page.tsx",
              "packages/agent-mux/webui/src/lib/workspace-lifecycle.ts",
            ],
            resolvedFiles: [],
            followUpInstructions: [],
            manualResolutionSuggested: false,
            readyFor: "merge",
          },
        },
      },
    });

    const deps = createDeps({
      readFile: vi.fn(async () => registry),
      writeFile: vi.fn(async (_path, contents) => {
        registry = String(contents);
      }),
    });

    const service = new WorkspaceLifecycleService(deps);

    await service.applyAction({
      action: "rebase-start",
      workspacePath: repoPath("repo", "worktrees", "task"),
      sessions: [],
    });

    let inventory = await service.listWorkspaces();
    expect(inventory.workspaces[0]?.rebase?.status).toBe("rebase-conflicts");
    expect(inventory.workspaces[0]?.rebase?.attemptCount).toBe(1);

    await service.applyAction({
      action: "rebase-auto-resolve",
      workspacePath: repoPath("repo", "worktrees", "task"),
      sessions: [],
    });

    inventory = await service.listWorkspaces();
    expect(inventory.workspaces[0]?.rebase?.status).toBe("rebase-conflicts");
    expect(inventory.workspaces[0]?.rebase?.unresolvedFiles).toHaveLength(1);
    expect(inventory.workspaces[0]?.rebase?.resolvedFiles).toHaveLength(1);

    await service.applyAction({
      action: "rebase-abort",
      workspacePath: repoPath("repo", "worktrees", "task"),
      sessions: [],
    });

    inventory = await service.listWorkspaces();
    expect(inventory.workspaces[0]?.rebase?.status).toBe("rebase-needed");
    expect(inventory.workspaces[0]?.rebase?.attemptCount).toBe(1);
    expect(inventory.workspaces[0]?.actions.canRebaseStart).toBe(true);
    expect(inventory.workspaces[0]?.actions.canRebaseAbort).toBe(false);

    await service.applyAction({
      action: "rebase-start",
      workspacePath: repoPath("repo", "worktrees", "task"),
      sessions: [],
    });

    inventory = await service.listWorkspaces();
    expect(inventory.workspaces[0]?.rebase?.status).toBe("rebase-conflicts");
    expect(inventory.workspaces[0]?.rebase?.attemptCount).toBe(2);
  });

  it("returns manually resolved conflicts back to review readiness", async () => {
    let registry = JSON.stringify({
      version: 1,
      workspaces: {
        [repoPath("repo", "worktrees", "task")]: {
          path: repoPath("repo", "worktrees", "task"),
          gitRoot: repoPath("repo", "main"),
          commonDir: repoPath("repo", "common", ".git"),
          branch: "vk/task",
          rebase: {
            status: "rebase-conflicts",
            attemptCount: 1,
            unresolvedFiles: ["packages/agent-mux/webui/src/lib/workspace-lifecycle.ts"],
            resolvedFiles: [],
            followUpInstructions: [],
            manualResolutionSuggested: true,
            readyFor: "review",
          },
        },
      },
    });

    const deps = createDeps({
      readFile: vi.fn(async () => registry),
      writeFile: vi.fn(async (_path, contents) => {
        registry = String(contents);
      }),
    });

    const service = new WorkspaceLifecycleService(deps);

    await service.applyAction({
      action: "rebase-open-in-editor",
      workspacePath: repoPath("repo", "worktrees", "task"),
      sessions: [],
    });
    await service.applyAction({
      action: "rebase-mark-resolved",
      workspacePath: repoPath("repo", "worktrees", "task"),
      sessions: [],
    });

    const inventory = await service.listWorkspaces();
    expect(inventory.workspaces[0]?.rebase?.status).toBe("ready-for-review");
    expect(inventory.workspaces[0]?.rebase?.lastAction).toBe("manual-resolve");
    expect(inventory.workspaces[0]?.rebase?.followUpInstructions[0]).toContain("review");
  });

  it("surfaces missing repo metadata and persists workspace notes", async () => {
    const orphanPath = repoPath("repo", "scratch", "orphan");
    let registry = JSON.stringify({
      version: 1,
      workspaces: {
        [orphanPath]: {
          path: orphanPath,
          name: "orphan",
          notes: "Reconnect the runtime before retrying.",
          notesUpdatedAt: "2026-04-24T10:00:00.000Z",
        },
      },
    });

    const baseDeps = createDeps();
    const deps = createDeps({
      readFile: vi.fn(async () => registry),
      writeFile: vi.fn(async (_path, contents) => {
        registry = String(contents);
      }),
      stat: vi.fn(async (targetPath: string) => {
        if (
          targetPath === orphanPath ||
          targetPath === repoPath("repo", "packages", "kanban") ||
          targetPath === repoPath("repo", "main") ||
          targetPath === repoPath("repo", "worktrees", "task")
        ) {
          return {} as never;
        }
        throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      }),
      execGit: vi.fn(async (args, cwd) => {
        if (cwd === orphanPath) {
          throw new Error("not a git repository");
        }
        return baseDeps.execGit(args, cwd);
      }),
      discoverAllRunDirs: async () => [],
    });

    const service = new WorkspaceLifecycleService(deps);
    const inventory = await service.listWorkspaces();
    const orphan = inventory.workspaces.find((workspace) => workspace.path === orphanPath);

    expect(orphan?.git.root).toBeNull();
    expect(orphan?.git.branch).toBeNull();
    expect(orphan?.notes.value).toBe("Reconnect the runtime before retrying.");
    expect(orphan?.links.editorHref).toBe(`vscode://file${orphanPath}`);

    await service.applyAction({
      action: "notes-save",
      workspacePath: orphanPath,
      note: "Runtime reconnected. Retry rebase after sync.",
      sessions: [],
    });

    const refreshed = await service.listWorkspaces();
    const updated = refreshed.workspaces.find((workspace) => workspace.path === orphanPath);
    expect(updated?.notes.value).toBe("Runtime reconnected. Retry rebase after sync.");
    expect(updated?.notes.updatedAt).toBe("2026-04-24T12:00:00.000Z");
  });

  it("provisions deterministic issue workspaces and suffixes duplicate path or branch names", async () => {
    const kanbanPath = repoPath("repo", "packages", "kanban");
    const mainPath = repoPath("repo", "main");
    const commonDirPath = repoPath("repo", "common", ".git");
    const existingWorkspacePath = path.join(os.homedir(), ".a5c", "workspaces", "kanban-gap-007");
    const provisionedWorkspacePath = path.join(os.homedir(), ".a5c", "workspaces", "kanban-gap-007-2");
    let registry = JSON.stringify({
      version: 1,
      workspaces: {
        [existingWorkspacePath]: {
          path: existingWorkspacePath,
          name: "KANBAN-GAP-007",
          gitRoot: mainPath,
          commonDir: commonDirPath,
          branch: "vk/kanban-gap-007",
        },
      },
    });

    const deps = createDeps({
      readFile: vi.fn(async () => registry),
      writeFile: vi.fn(async (_targetPath, contents) => {
        registry = String(contents);
      }),
      execGit: vi.fn(async (args, cwd) => {
        const key = `${cwd}::${args.join(" ")}`;
        const map: Record<string, { stdout: string; stderr: string }> = {
          [`${kanbanPath}::rev-parse --show-toplevel`]: { stdout: `${mainPath}\n`, stderr: "" },
          [`${kanbanPath}::rev-parse --path-format=absolute --git-common-dir`]: {
            stdout: `${commonDirPath}\n`,
            stderr: "",
          },
          [`${kanbanPath}::worktree list --porcelain`]: {
            stdout: [
              `worktree ${mainPath}`,
              "HEAD abc123",
              "branch refs/heads/main",
              "",
              `worktree ${existingWorkspacePath}`,
              "HEAD def456",
              "branch refs/heads/vk/kanban-gap-007",
              "",
            ].join("\n"),
            stderr: "",
          },
          [`${mainPath}::worktree add -b vk/kanban-gap-007-2 ${provisionedWorkspacePath}`]: {
            stdout: "prepared\n",
            stderr: "",
          },
        };

        const value = map[key];
        if (!value) {
          throw new Error(`Unexpected git call: ${key}`);
        }
        return value;
      }),
    });

    const service = new WorkspaceLifecycleService(deps);
    const result = await service.provisionWorkspaceForIssue({
      issueKey: "KANBAN-GAP-007",
      issueTitle: "Add issue to workspace linking parity",
      ownership: {
        source: "created-from-issue",
        project: {
          projectId: "kanban-app",
          projectKey: "KANBAN",
          projectName: "Kanban App",
        },
        issue: {
          issueId: "KANBAN-GAP-007",
          issueKey: "KANBAN-GAP-007",
          issueTitle: "Add issue to workspace linking parity",
        },
      },
    });

    expect(result).toEqual({
      workspacePath: provisionedWorkspacePath,
      workspaceName: "KANBAN-GAP-007",
      branchName: "vk/kanban-gap-007-2",
    });
    expect(deps.execGit).toHaveBeenCalledWith(
      ["worktree", "add", "-b", "vk/kanban-gap-007-2", provisionedWorkspacePath],
      mainPath,
    );
    expect(JSON.parse(registry)).toMatchObject({
      workspaces: {
        [provisionedWorkspacePath]: expect.objectContaining({
          path: provisionedWorkspacePath,
          branch: "vk/kanban-gap-007-2",
          gitRoot: mainPath,
          ownership: expect.objectContaining({
            source: "created-from-issue",
            project: expect.objectContaining({
              projectId: "kanban-app",
            }),
            issue: expect.objectContaining({
              issueId: "KANBAN-GAP-007",
            }),
          }),
        }),
      },
    });
  });
});
