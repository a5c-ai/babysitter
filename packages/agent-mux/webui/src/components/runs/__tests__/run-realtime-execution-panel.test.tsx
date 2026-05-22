/** @vitest-environment jsdom */

import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen, waitFor } from "@/test/test-utils";
import { RunRealtimeExecutionPanel } from "../run-realtime-execution-panel";

const subscribeRun = vi.fn();
const mockUseGateway = vi.fn();
const mockUseGatewayAuth = vi.fn();

vi.mock("zustand", () => ({
  useStore: <T,>(store: T, selector: (state: T) => unknown) => selector(store),
}));

vi.mock("@/components/agent-mux/gateway-provider", () => ({
  useGatewayAuth: () => mockUseGatewayAuth(),
}));

vi.mock("@/lib/agent-mux-ui", () => ({
  useGateway: () => mockUseGateway(),
}));

vi.mock("@/components/sessions/session-observability-panel", () => ({
  SessionObservabilityPanel: ({
    sessionId,
    runs,
    eventBuffers,
  }: {
    sessionId: string;
    runs: Array<Record<string, unknown>>;
    eventBuffers: Record<string, { events: Array<Record<string, unknown>> } | undefined>;
  }) => (
    <div data-testid="session-observability-panel">
      {sessionId}|{String(runs[0]?.agent ?? "")}|{eventBuffers[String(runs[0]?.runId ?? "")]?.events.length ?? 0}
    </div>
  ),
}));

const run = {
  runId: "run-1",
  processId: "kanban/process",
  status: "waiting" as const,
  createdAt: "2026-04-25T00:00:00.000Z",
  updatedAt: "2026-04-25T00:00:00.000Z",
  sessionId: "session-1",
  tasks: [],
  events: [],
  totalTasks: 0,
  completedTasks: 0,
  failedTasks: 0,
};

describe("RunRealtimeExecutionPanel", () => {
  beforeEach(() => {
    subscribeRun.mockReset();
    mockUseGateway.mockReset();
    mockUseGatewayAuth.mockReset();
  });

  it("shows a gateway-auth prompt when the realtime buffer is unavailable", () => {
    mockUseGatewayAuth.mockReturnValue({ isAuthenticated: false });

    render(<RunRealtimeExecutionPanel run={run} />);

    expect(screen.getByTestId("run-realtime-auth-required")).toHaveTextContent(
      "Connect agent-mux to load the reconstructed flow",
    );
  });

  it("subscribes to the run and reuses the shared session observability panel", async () => {
    mockUseGatewayAuth.mockReturnValue({ isAuthenticated: true });
    mockUseGateway.mockReturnValue({
      client: { subscribeRun },
      store: {
        events: {
          byRunId: {
            "run-1": {
              events: [{ type: "user_message", text: "Inspect this run" }],
            },
          },
        },
        runs: {
          byId: {
            "run-1": {
              runId: "run-1",
              agent: "codex",
            },
          },
        },
      },
    });
    subscribeRun.mockReturnValue(() => undefined);

    render(<RunRealtimeExecutionPanel run={run} />);

    await waitFor(() => expect(subscribeRun).toHaveBeenCalledWith("run-1"));
    expect(screen.getByTestId("session-observability-panel")).toHaveTextContent("session-1|codex|1");
  });
});
