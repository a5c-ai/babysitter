import { describe, expect, it } from "vitest";
import { render, screen, setupUser } from "@/test/test-utils";

import { WorkspaceRuntimePanel } from "../workspace-runtime-panel";

function buildRuntime(overrides: Partial<Parameters<typeof WorkspaceRuntimePanel>[0]["runtime"]> = {}) {
  return {
    updatedAt: 1713960000000,
    workspacePath: "/repo/worktrees/task",
    preview: {
      status: "ready" as const,
      primaryUrl: "http://127.0.0.1:3000",
      urls: ["http://127.0.0.1:3000"],
      deviceProfiles: [],
    },
    terminal: {
      status: "active" as const,
      commands: [
        {
          id: "cmd-dev",
          runId: "run-1",
          source: "shell" as const,
          command: "pnpm dev --port 3000",
          status: "running" as const,
          startedAt: 1713960000000,
          logs: [
            { timestamp: 1713960000001, stream: "stdout" as const, text: "ready in 850ms" },
            { timestamp: 1713960000002, stream: "stdout" as const, text: "Local: http://127.0.0.1:3000" },
          ],
        },
        {
          id: "cmd-test",
          runId: "run-2",
          source: "tool" as const,
          toolName: "exec_command",
          command: "pnpm vitest run workspace-runtime-panel.test.tsx",
          status: "failed" as const,
          startedAt: 1713960000100,
          endedAt: 1713960000200,
          exitCode: 1,
          logs: [
            { timestamp: 1713960000101, stream: "stdout" as const, text: "filter: runtime logs" },
            { timestamp: 1713960000102, stream: "stderr" as const, text: "Expected logs tab to exist" },
          ],
        },
      ],
    },
    devServer: {
      status: "running" as const,
      command: "pnpm dev --port 3000",
      primaryUrl: "http://127.0.0.1:3000",
      urls: ["http://127.0.0.1:3000"],
      port: 3000,
      detectedAt: 1713960000002,
      logs: [
        { timestamp: 1713960000001, stream: "system" as const, text: "pnpm dev --port 3000" },
        { timestamp: 1713960000002, stream: "stdout" as const, text: "ready in 850ms" },
      ],
    },
    ...overrides,
  };
}

describe("WorkspaceRuntimePanel", () => {
  it("treats logs as a first-class process view with search and process-tab switching", async () => {
    const user = setupUser();

    render(
      <WorkspaceRuntimePanel
        runtime={buildRuntime()}
        sessionId="session-1"
      />,
    );

    await user.click(screen.getByRole("tab", { name: "Logs" }));
    await user.click(screen.getByRole("button", { name: "pnpm vitest run workspace-runtime-panel.test.tsx" }));

    const search = screen.getByPlaceholderText("Search logs");
    await user.type(search, "Expected logs");

    expect(screen.getByDisplayValue("Expected logs")).toBeInTheDocument();
    expect(screen.getByText("Expected logs tab to exist")).toBeInTheDocument();
    expect(screen.queryByText("ready in 850ms")).not.toBeInTheDocument();
  });

  it("preserves the selected process tab and search query when logs stream in", async () => {
    const user = setupUser();
    const runtime = buildRuntime();
    const view = render(
      <WorkspaceRuntimePanel
        runtime={runtime}
        sessionId="session-1"
      />,
    );

    await user.click(screen.getByRole("tab", { name: "Logs" }));
    const processTab = screen.getByRole("button", { name: "pnpm vitest run workspace-runtime-panel.test.tsx" });
    await user.click(processTab);

    const search = screen.getByPlaceholderText("Search logs");
    await user.type(search, "Expected logs");

    view.rerender(
      <WorkspaceRuntimePanel
        runtime={buildRuntime({
          terminal: {
            status: "active",
            commands: [
              buildRuntime().terminal.commands[0]!,
              {
                ...buildRuntime().terminal.commands[1]!,
                logs: [
                  ...buildRuntime().terminal.commands[1]!.logs,
                  { timestamp: 1713960000300, stream: "stderr", text: "Expected logs tab to exist again" },
                ],
              },
            ],
          },
        })}
        sessionId="session-1"
      />,
    );

    expect(screen.getByDisplayValue("Expected logs")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "pnpm vitest run workspace-runtime-panel.test.tsx" })).toHaveClass(
      "border-primary/30",
      "bg-primary/8",
    );
    expect(screen.getByText("Expected logs tab to exist again")).toBeInTheDocument();
  });

  it("searches long process logs without collapsing to a stale tail buffer", async () => {
    const user = setupUser();

    render(
      <WorkspaceRuntimePanel
        runtime={buildRuntime({
          terminal: {
            status: "active",
            commands: [
              {
                ...buildRuntime().terminal.commands[1]!,
                logs: Array.from({ length: 40 }, (_, index) => ({
                  timestamp: 1713960001000 + index,
                  stream: "stdout" as const,
                  text: index === 37 ? "needle in retained line 38" : `line ${index + 1}`,
                })),
              },
            ],
          },
          devServer: {
            status: "idle",
            urls: [],
            logs: [],
          },
        })}
        sessionId="session-1"
      />,
    );

    await user.click(screen.getByRole("tab", { name: "Logs" }));

    const search = screen.getByPlaceholderText("Search logs");
    await user.type(search, "retained line 38");

    expect(screen.getByText("needle in retained line 38")).toBeInTheDocument();
    expect(screen.queryByText("line 1")).not.toBeInTheDocument();
  });

  it("renders explicit empty, disconnected, failed, and missing-metadata log states", async () => {
    const user = setupUser();

    const { rerender } = render(
      <WorkspaceRuntimePanel
        runtime={buildRuntime({
          terminal: { status: "idle", commands: [] },
          devServer: {
            status: "idle",
            urls: [],
            logs: [],
          },
        })}
        sessionId="session-1"
      />,
    );

    await user.click(screen.getByRole("tab", { name: "Logs" }));
    expect(screen.getByText("No active processes are publishing logs yet.")).toBeInTheDocument();

    rerender(
      <WorkspaceRuntimePanel
        runtime={buildRuntime({
          terminal: { status: "idle", commands: [] },
          devServer: {
            status: "idle",
            urls: [],
            logs: [],
          },
        })}
        sessionId="session-1"
        sessionStatus="inactive"
      />,
    );

    await user.click(screen.getByRole("tab", { name: "Logs" }));
    expect(screen.getByText("Logs disconnected. The selected session is not publishing runtime output right now.")).toBeInTheDocument();

    rerender(
      <WorkspaceRuntimePanel
        runtime={buildRuntime({
          terminal: {
            status: "active",
            commands: [
              {
                id: "cmd-fallback",
                runId: "run-3",
                source: "tool",
                command: "",
                status: "failed",
                startedAt: 1713960000400,
                endedAt: 1713960000500,
                exitCode: 1,
                logs: [],
              },
            ],
          },
          devServer: {
            status: "idle",
            urls: [],
            logs: [],
          },
        })}
        sessionId="session-1"
      />,
    );

    await user.click(screen.getByRole("tab", { name: "Logs" }));
    await user.click(screen.getByRole("button", { name: "Process 1" }));

    expect(screen.getByText("Process exited with code 1 before emitting logs.")).toBeInTheDocument();
  });
});
