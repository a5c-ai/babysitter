import { beforeEach, describe, expect, it, vi } from "vitest";

import { getWorkspaceOwnershipLabel, loadInventory, runWorkspaceAction } from "../workspaces-page";

describe("workspaces-page helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("describes session-backed ownership when the gateway is connected", () => {
    expect(
      getWorkspaceOwnershipLabel(true, [
        { sessionId: "session-1", agent: "codex", status: "active", cwd: "/repo/worktrees/task" },
      ]),
    ).toBe("1 agent-mux sessions enriching workspace ownership");
  });

  it("falls back to local inventory copy when the gateway is disconnected", () => {
    expect(getWorkspaceOwnershipLabel(false, [])).toBe(
      "Gateway disconnected: inventory falls back to local git worktrees and archived workspace metadata",
    );
  });

  it("loads workspace inventory through the workspace API", async () => {
    const payload = {
      summary: { total: 1, active: 1, idle: 0, archived: 0, missing: 0 },
      workspaces: [],
    };
    const runtime = {
      updatedAt: 1,
      workspacePath: "/repo/worktrees/task",
      preview: {
        status: "ready",
        primaryUrl: "http://127.0.0.1:3000",
        urls: ["http://127.0.0.1:3000"],
        deviceProfiles: [],
      },
      terminal: {
        status: "idle",
        commands: [],
      },
      devServer: {
        status: "running",
        primaryUrl: "http://127.0.0.1:3000",
        urls: ["http://127.0.0.1:3000"],
        logs: [],
      },
    };

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(
      loadInventory([
        { sessionId: "session-1", agent: "codex", status: "active", cwd: "/repo/worktrees/task", runtime },
      ]),
    ).resolves.toEqual(payload);

    expect(fetch).toHaveBeenCalledWith(
      "/api/workspaces",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          sessions: [{ sessionId: "session-1", agent: "codex", status: "active", cwd: "/repo/worktrees/task", runtime }],
        }),
      }),
    );
  });

  it("posts lifecycle actions back to the workspace API", async () => {
    const payload = {
      summary: { total: 1, active: 0, idle: 0, archived: 1, missing: 0 },
      workspaces: [],
      result: { ok: true },
    };

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(runWorkspaceAction("archive", "/repo/worktrees/task", [])).resolves.toEqual(payload);

    expect(fetch).toHaveBeenCalledWith(
      "/api/workspaces",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          action: "archive",
          workspacePath: "/repo/worktrees/task",
          sessions: [],
        }),
      }),
    );
  });
});
