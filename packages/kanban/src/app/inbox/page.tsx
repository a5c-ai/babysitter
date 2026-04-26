"use client";

import { useMemo } from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { WorkspaceRuntimeSurface } from "@a5c-ai/agent-mux-core";

import { RequireGatewayAuth } from "@/components/agent-mux/require-gateway-auth";
import { WorkspacesPageContent } from "@/components/workspaces/workspaces-page";
import { useGateway } from "@/lib/agent-mux-ui";

function readRuntime(value: unknown): WorkspaceRuntimeSurface | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  return value as WorkspaceRuntimeSurface;
}

export default function InboxPage() {
  return (
    <RequireGatewayAuth>
      <InboxContent />
    </RequireGatewayAuth>
  );
}

function InboxContent() {
  const { store } = useGateway();
  const sessions = useStore(store, useShallow((state) => Object.values(state.sessions.byId)));

  const workspaceSessions = useMemo(
    () =>
      sessions.flatMap((session) => {
        const sessionId = typeof session.sessionId === "string" ? session.sessionId : "";
        const agent = typeof session.agent === "string" ? session.agent : "";
        const status = session.status === "active" ? "active" : "inactive";
        if (!sessionId || !agent) {
          return [];
        }

        return [
          {
            sessionId,
            agent,
            status,
            cwd: typeof session.cwd === "string" ? session.cwd : undefined,
            title: typeof session.title === "string" ? session.title : undefined,
            updatedAt: typeof session.updatedAt === "number" ? session.updatedAt : undefined,
            activeRunId: typeof session.activeRunId === "string" ? session.activeRunId : null,
            latestRunId: typeof session.latestRunId === "string" ? session.latestRunId : null,
            runtime: readRuntime(session.runtime),
          },
        ];
      }),
    [sessions],
  );

  return <WorkspacesPageContent isAuthenticated sessions={workspaceSessions} mode="attention" />;
}
